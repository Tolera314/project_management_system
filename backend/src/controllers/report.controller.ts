import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export const getProjectReport = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).userId;

        // Verify Access
        const project = await prisma.project.findFirst({
            where: {
                id,
                organization: {
                    members: { some: { userId } }
                }
            },
            include: {
                organization: { select: { name: true } },
                members: {
                    include: {
                        organizationMember: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }

        const now = new Date();

        // 1. Task Statistics
        const tasks = await prisma.task.findMany({
            where: { projectId: id },
            include: {
                assignees: {
                    include: {
                        projectMember: {
                            include: {
                                organizationMember: {
                                    include: { user: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const totalTasks = tasks.length;
        const completedTasksCount = tasks.filter((t: any) => t.status === 'DONE').length;
        const inProgressTasksCount = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;

        const blockedTasksList = tasks.filter((t: any) => t.status === 'BLOCKED');
        const blockedTasksCount = blockedTasksList.length;

        const overdueTasks = tasks.filter((t: any) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now);

        // 2. Risks (Delayed/Blocked)
        const risks = [
            ...blockedTasksList.map((t: any) => ({ id: t.id, title: t.title, type: 'BLOCKED', severity: 'HIGH' })),
            ...overdueTasks.map((t: any) => ({ id: t.id, title: t.title, type: 'OVERDUE', severity: 'MEDIUM' }))
        ];

        // 3. Weekly Velocity (Approximation)
        const startOfCurrentWeek = startOfWeek(now);
        const doneThisWeek = tasks.filter((t: any) => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= startOfCurrentWeek).length;

        // 4. Team Workload (Simple)
        const memberWorkload = (project as any).members.map((m: any) => {
            const assigned = tasks.filter((t: any) => t.assignees.some((a: any) => a.projectMemberId === m.id));
            const completed = assigned.filter((t: any) => t.status === 'DONE').length;
            return {
                name: m.organizationMember?.user ? `${m.organizationMember.user.firstName} ${m.organizationMember.user.lastName}` : 'Unknown',
                total: assigned.length,
                completed: completed,
                pending: assigned.length - completed
            };
        });

        const report = {
            project: {
                name: project.name,
                organization: project.organization.name,
                manager: (project as any).members.find((m: any) => m.roleId === 'some-pm-role-id')?.organizationMember?.user?.firstName || 'N/A',
                generatedAt: now
            },
            status: {
                overall: project.status,
                progress: totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0,
                health: risks.length > 5 ? 'AT_RISK' : (risks.length > 0 ? 'NEEDS_ATTENTION' : 'ON_TRACK')
            },
            metrics: {
                totalTasks,
                completedTasks: completedTasksCount,
                inProgressTasks: inProgressTasksCount,
                blockedTasks: blockedTasksCount,
                overdueCount: overdueTasks.length,
                velocity: doneThisWeek
            },
            risks,
            teamLoad: memberWorkload,
            tasks: tasks.map((t: any) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate,
                assignees: t.assignees.map((a: any) => {
                    const user = (a.projectMember as any).organizationMember?.user;
                    return user ? user.firstName : 'Unknown';
                })
            }))
        };

        if (req.query.format === 'csv') {
            const csvRows = [
                ['Project Report', project.name],
                ['Generated At', now.toISOString()],
                ['Manager', report.project.manager],
                ['Status', report.status.overall],
                ['Health', report.status.health],
                [],
                ['Task ID', 'Title', 'Status', 'Priority', 'Due Date', 'Assignees'],
                ...report.tasks.map((t: any) => [
                    t.id,
                    `"${t.title.replace(/"/g, '""')}"`, // Escape quotes
                    t.status,
                    t.priority,
                    t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
                    `"${t.assignees.join(', ')}"`
                ]),
                [],
                ['Risks'],
                ['Type', 'Title'],
                ...risks.map(r => [r.type, `"${r.title.replace(/"/g, '""')}"`])
            ];

            const csvContent = csvRows.map(row => row.join(',')).join('\n');

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${project.name}_report_${now.toISOString().split('T')[0]}.csv"`);
            res.send(csvContent);
            return;
        }

        res.json(report);

    } catch (error) {
        console.error('Get project report error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getUserAnalytics = async (req: Request, res: Response) => {
    try {
        const { id: targetUserId } = req.params;
        const userId = (req as any).userId;

        // Ensure user is checking their own or is an admin (optional security check)
        // For now, allow viewing if they share an organization
        const sharedOrg = await prisma.organization.findFirst({
            where: {
                members: { some: { userId } },
                AND: { members: { some: { userId: targetUserId } } }
            }
        });

        if (!sharedOrg) {
            res.status(403).json({ error: 'Access denied' });
            return;
        }

        const stats = await prisma.$transaction([
            prisma.task.count({ where: { assignees: { some: { projectMember: { organizationMember: { userId: targetUserId } } } }, status: 'DONE' } }),
            prisma.task.count({ where: { assignees: { some: { projectMember: { organizationMember: { userId: targetUserId } } } }, status: { not: 'DONE' } } }),
            prisma.task.count({ where: { assignees: { some: { projectMember: { organizationMember: { userId: targetUserId } } } }, status: { not: 'DONE' }, dueDate: { lt: new Date() } } }),
            prisma.activityLog.count({ where: { userId: targetUserId } })
        ]);

        res.json({
            completedTasks: stats[0],
            pendingTasks: stats[1],
            overdueTasks: stats[2],
            activityCount: stats[3]
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
