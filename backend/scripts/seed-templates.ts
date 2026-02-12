import prisma from '../src/lib/prisma';

async function main() {
    console.log('🌱 Seeding project templates...');

    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('❌ No users found. Please create a user first.');
        return;
    }

    const orgMember = await prisma.organizationMember.findFirst({
        where: { userId: user.id }
    });

    if (!orgMember) {
        console.error('❌ No organization membership found.');
        return;
    }

    console.log(`✅ Using User: ${user.email}`);
    console.log(`✅ Using Organization: ${orgMember.organizationId}`);

    // Helper to create a task
    const createTask = async (projectId: string, listId: string, title: string, priority: any = 'MEDIUM', position: number, parentId: string | null = null) => {
        return await prisma.task.create({
            data: {
                title,
                priority,
                status: 'TODO',
                position,
                projectId,
                listId,
                parentId,
                createdById: user.id,
                updatedById: user.id
            }
        });
    };

    // 1. Software Development Template
    console.log('\n📦 Creating Software Development Template...');
    const softwareTemplate = await prisma.project.create({
        data: {
            name: 'Software Development Template',
            description: 'Standard agile software development workflow.',
            organizationId: orgMember.organizationId,
            createdById: user.id,
            updatedById: user.id,
            status: 'NOT_STARTED',
            priority: 'MEDIUM',
            isTemplate: true,
            category: 'Software Development',
            isPublic: true,
            color: '#4F46E5'
        }
    });

    const planning = await prisma.list.create({ data: { name: 'Backlog', projectId: softwareTemplate.id, position: 0 } });
    const progress = await prisma.list.create({ data: { name: 'In Progress', projectId: softwareTemplate.id, position: 1 } });
    const review = await prisma.list.create({ data: { name: 'Code Review', projectId: softwareTemplate.id, position: 2 } });
    const done = await prisma.list.create({ data: { name: 'Done', projectId: softwareTemplate.id, position: 3 } });

    const t1 = await createTask(softwareTemplate.id, planning.id, 'Project setup', 'HIGH', 0);
    await createTask(softwareTemplate.id, planning.id, 'Setup infrastructure', 'MEDIUM', 0, t1.id);
    await createTask(softwareTemplate.id, planning.id, 'Configure CI/CD', 'LOW', 1, t1.id);

    await createTask(softwareTemplate.id, planning.id, 'API Design', 'MEDIUM', 1);
    await createTask(softwareTemplate.id, progress.id, 'Database schema', 'HIGH', 0);

    await prisma.milestone.create({
        data: {
            name: 'MVP Released',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            projectId: softwareTemplate.id,
            createdById: user.id
        }
    });

    // 2. Marketing Template
    console.log('📦 Creating Marketing Campaign Template...');
    const marketingTemplate = await prisma.project.create({
        data: {
            name: 'Marketing Campaign',
            description: 'Plan and execute successful marketing campaigns.',
            organizationId: orgMember.organizationId,
            createdById: user.id,
            updatedById: user.id,
            status: 'NOT_STARTED',
            priority: 'MEDIUM',
            isTemplate: true,
            category: 'Marketing',
            isPublic: true,
            color: '#EC4899'
        }
    });

    const ideas = await prisma.list.create({ data: { name: 'Campaign Ideas', projectId: marketingTemplate.id, position: 0 } });
    const execution = await prisma.list.create({ data: { name: 'Execution', projectId: marketingTemplate.id, position: 1 } });

    await createTask(marketingTemplate.id, ideas.id, 'Brainstorm slogans', 'LOW', 0);
    await createTask(marketingTemplate.id, ideas.id, 'Budget planning', 'HIGH', 1);
    await createTask(marketingTemplate.id, execution.id, 'Social media launch', 'URGENT', 0);

    // 3. Product Template
    console.log('📦 Creating Product Roadmap Template...');
    const productTemplate = await prisma.project.create({
        data: {
            name: 'Product Roadmap',
            description: 'Track long-term product vision and feature releases.',
            organizationId: orgMember.organizationId,
            createdById: user.id,
            updatedById: user.id,
            status: 'NOT_STARTED',
            priority: 'MEDIUM',
            isTemplate: true,
            category: 'Product',
            isPublic: true,
            color: '#10B981'
        }
    });

    const q1 = await prisma.list.create({ data: { name: 'Q1 2026', projectId: productTemplate.id, position: 0 } });
    const q2 = await prisma.list.create({ data: { name: 'Q2 2026', projectId: productTemplate.id, position: 1 } });

    await createTask(productTemplate.id, q1.id, 'New user onboarding', 'HIGH', 0);
    await createTask(productTemplate.id, q2.id, 'Mobile app expansion', 'MEDIUM', 0);

    console.log('\n✨ All templates seeded successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
