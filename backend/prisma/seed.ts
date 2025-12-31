import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : false
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const permissions = [
    // Project Permissions
    { name: 'view_project', category: 'Project', description: 'View project details' },
    { name: 'edit_project', category: 'Project', description: 'Edit project details' },
    { name: 'delete_project', category: 'Project', description: 'Delete project' },
    { name: 'manage_project_members', category: 'Project', description: 'Add/remove members' },
    { name: 'manage_project_settings', category: 'Project', description: 'Manage settings' },

    // Task Permissions
    { name: 'create_task', category: 'Task', description: 'Create new tasks' },
    { name: 'edit_task', category: 'Task', description: 'Edit task details' },
    { name: 'delete_task', category: 'Task', description: 'Delete tasks' },
    { name: 'assign_task', category: 'Task', description: 'Assign users to tasks' },
    { name: 'change_status', category: 'Task', description: 'Change task status' },
    { name: 'comment_task', category: 'Task', description: 'Comment on tasks' },
    { name: 'upload_task_file', category: 'Task', description: 'Upload files to tasks' },
    { name: 'log_time', category: 'Task', description: 'Log time on tasks' },

    // Planning Permissions
    { name: 'manage_lists', category: 'Planning', description: 'Create/Edit/Delete lists' },
    { name: 'manage_milestones', category: 'Planning', description: 'Create/Edit/Delete milestones' },
    { name: 'manage_dependencies', category: 'Planning', description: 'Manage dependencies' },
    { name: 'edit_timeline', category: 'Planning', description: 'Edit timeline view' },

    // File Permissions
    { name: 'upload_file', category: 'Files', description: 'Upload files' },
    { name: 'download_file', category: 'Files', description: 'Download files' },
    { name: 'delete_file', category: 'Files', description: 'Delete files' },
    { name: 'view_file_versions', category: 'Files', description: 'View file history' },

    // Reporting Permissions
    { name: 'view_reports', category: 'Reports', description: 'View analytics' },
    { name: 'export_reports', category: 'Reports', description: 'Export data' },
];

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Upsert Permissions
    for (const p of permissions) {
        await prisma.permission.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        });
    }
    console.log('✅ Permissions seeded');

    console.log('🌱 Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
