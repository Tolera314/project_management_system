// @ts-nocheck
import prisma from '../src/lib/prisma';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

async function main() {
    const email = `testuser_${Date.now()}@example.com`;

    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
        console.log('Creating test user...');
        user = await prisma.user.create({
            data: {
                email,
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                organizations: {
                    create: {
                        organization: {
                            create: {
                                name: 'Test Org'
                            }
                        },
                        role: {
                            create: {
                                name: 'Admin',
                                organizationId: 'temp',
                            }
                        }
                    }
                }
            },
            include: {
                organizations: true
            }
        });
    }

    const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: user.id }
    });

    if (!orgMember) {
        console.error('No org member found');
        return;
    }

    try {
        // Login
        const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        console.log('Logged in, creating Template...');

        // 1. Create Template
        const templateRes = await fetch(`${BACKEND_URL}/projects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: 'Software Template ' + Date.now(),
                organizationId: orgMember.organizationId,
                isTemplate: true,
                status: 'NOT_STARTED',
                priority: 'MEDIUM',
                description: 'A test template'
            })
        });

        const templateData = await templateRes.json();
        const templateId = templateData.project?.id;

        if (!templateId) {
            console.error('Template creation failed:', templateData);
            return;
        }

        console.log('Template Created:', templateId);

        // 2. Add Structure
        const list1 = await prisma.list.create({
            data: {
                name: 'Phase 1',
                projectId: templateId,
                position: 0
            }
        });

        await prisma.task.create({
            data: {
                title: 'Template Task 1',
                projectId: templateId,
                listId: list1.id,
                createdById: user.id
            }
        });
        await prisma.task.create({
            data: {
                title: 'Template Task 2',
                projectId: templateId,
                listId: list1.id,
                createdById: user.id
            }
        });

        console.log('Template structure populated.');

        // 3. Create Project from Template
        console.log('Creating Project from Template...');
        const projectRes = await fetch(`${BACKEND_URL}/projects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: ' Derived Project ' + Date.now(),
                organizationId: orgMember.organizationId,
                templateId: templateId,
                priority: 'HIGH'
            })
        });

        const projectData = await projectRes.json();
        const newProjectId = projectData.project?.id;

        if (!newProjectId) {
            console.error('Failed to create project:', projectData);
            return;
        }

        console.log('New Project Created:', newProjectId);

        // 4. Verify Content
        const newProjectLists = await prisma.list.findMany({
            where: { projectId: newProjectId },
            include: { tasks: true }
        });

        console.log('New Project Lists:', JSON.stringify(newProjectLists, null, 2));

        if (newProjectLists.length === 1 && newProjectLists[0].tasks.length === 2) {
            console.log('SUCCESS: Project Structure Cloned correctly.');
        } else {
            console.error('FAILURE: Structure mismatch.');
        }

    } catch (e: any) {
        console.error('Error:', e);
    }
}

main();
