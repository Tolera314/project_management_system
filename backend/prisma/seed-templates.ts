
import { PrismaClient, SystemRole, TemplateVisibility } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Seeding 5 Production-Grade Templates...");

    // 1. Get Admin & Org
    const admin = await prisma.user.findFirst({
        where: { systemRole: "ADMIN" }
    });

    const org = await prisma.organization.findFirst({
        where: { id: "default-org-id" }
    });

    if (!admin || !org) {
        console.error("❌ Required Admin user or Default Org not found. Run standard seed first.");
        return;
    }

    const templates = [
        {
            name: "Agile Software Development",
            description: "Complete sprint-based workflow for modern engineering teams. Includes subtasks for PR reviews and testing.",
            color: "#0EA5E9",
            category: "Engineering",
            lists: [
                { name: "Sprint Backlog", tasks: [{ title: "User Auth Refactor", priority: "HIGH" }, { title: "API Documentation", priority: "MEDIUM" }] },
                { name: "In Progress", tasks: [{ title: "Dashboard Responsive Fix", priority: "URGENT", subtasks: ["Fix Mobile Menu", "Optimize Charts", "Cross-browser Test"] }] },
                { name: "Review / QA", tasks: [{ title: "Payment Gateway Integration", priority: "HIGH" }] },
                { name: "Done", tasks: [{ title: "Initial Repo Setup", priority: "LOW" }] }
            ]
        },
        {
            name: "Marketing Campaign Launch",
            description: "End-to-end plan for multi-channel marketing campaigns. Covers research to analytics.",
            color: "#EC4899",
            category: "Marketing",
            lists: [
                { name: "Research & Strategy", tasks: [{ title: "Competitor Analysis", priority: "MEDIUM" }, { title: "Target Audience Definition", priority: "HIGH" }] },
                { name: "Creative Production", tasks: [{ title: "Ad Copywriting", priority: "HIGH", subtasks: ["Facebook Headlines", "Google Ad Extensions", "Email Subject Lines"] }, { title: "Visual Assets Design", priority: "URGENT" }] },
                { name: "Execution", tasks: [{ title: "Schedule Social Posts", priority: "MEDIUM" }] },
                { name: "Reporting", tasks: [{ title: "Weekly KPI Review", priority: "LOW" }] }
            ]
        },
        {
            name: "HR Employee Onboarding",
            description: "Structured checklist for welcoming new hires and ensuring compliance.",
            color: "#10B981",
            category: "HR",
            lists: [
                { name: "Pre-boarding", tasks: [{ title: "Hardware Procurement", priority: "HIGH" }, { title: "Access Credentials Setup", priority: "URGENT" }] },
                { name: "First Day", tasks: [{ title: "Office Tour", priority: "LOW" }, { title: "Team Lunch", priority: "MEDIUM" }] },
                { name: "Week 1 Training", tasks: [{ title: "Product Training", priority: "MEDIUM", subtasks: ["Platform Overview", "Admin Panel Demo"] }, { title: "Security Protocols", priority: "HIGH" }] }
            ]
        },
        {
            name: "Sales Pipeline (Enterprise)",
            description: "Standard CRM-style workflow for managing high-value enterprise deals.",
            color: "#F59E0B",
            category: "Sales",
            lists: [
                { name: "Discovery", tasks: [{ title: "Initial Outreach - Acme Corp", priority: "HIGH" }] },
                { name: "Qualification", tasks: [{ title: "BANT Qualification", priority: "MEDIUM" }] },
                { name: "Proposal", tasks: [{ title: "Custom Solution Architecture", priority: "URGENT", subtasks: ["Draft Quote", "Compliance Review"] }] },
                { name: "Negotiation", tasks: [] },
                { name: "Closed / Won", tasks: [] }
            ]
        },
        {
            name: "UI/UX Design Workflow",
            description: "From wireframes to high-fidelity prototypes. Iterative design process.",
            color: "#8B5CF6",
            category: "Design",
            lists: [
                { name: "Discovery & Moodboards", tasks: [{ title: "User Persona Research", priority: "MEDIUM" }] },
                { name: "Wireframing", tasks: [{ title: "Low-fi Checkout Flow", priority: "HIGH" }] },
                { name: "Visual Design", tasks: [{ title: "High-fi Branding Assets", priority: "URGENT", subtasks: ["Logo Variants", "Color Palette", "Typography"] }] },
                { name: "Handoff", tasks: [{ title: "Zeplin Export", priority: "MEDIUM" }] }
            ]
        }
    ];

    for (const t of templates) {
        const project = await prisma.project.create({
            data: {
                name: t.name,
                description: t.description,
                color: t.color,
                category: t.category,
                isTemplate: true,
                templateVisibility: TemplateVisibility.SYSTEM,
                organization: { connect: { id: org.id } },
                createdBy: { connect: { id: admin.id } },
                updatedBy: { connect: { id: admin.id } },
                status: "NOT_STARTED"
            }
        });

        for (const [lIdx, listData] of t.lists.entries()) {
            const list = await prisma.list.create({
                data: {
                    name: listData.name,
                    position: lIdx,
                    projectId: project.id
                }
            });

            for (const [tIdx, taskData] of listData.tasks.entries()) {
                const newTask = await prisma.task.create({
                    data: {
                        title: taskData.title,
                        priority: (taskData.priority as any) || "MEDIUM",
                        position: tIdx,
                        projectId: project.id,
                        listId: list.id,
                        createdById: admin.id,
                        updatedById: admin.id,
                        status: "TODO"
                    }
                });

                if (taskData.subtasks && taskData.subtasks.length > 0) {
                    for (const [sIdx, sTitle] of taskData.subtasks.entries()) {
                        await prisma.task.create({
                            data: {
                                title: sTitle,
                                priority: (taskData.priority as any) || "MEDIUM",
                                position: sIdx,
                                projectId: project.id,
                                listId: list.id,
                                parentId: newTask.id,
                                createdById: admin.id,
                                updatedById: admin.id,
                                status: "TODO"
                            }
                        });
                    }
                }
            }
        }
        console.log(`✅ Template Created: ${t.name}`);
    }

    console.log("🚀 Finished seeding 5 high-quality templates.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
