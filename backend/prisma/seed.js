"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config({ path: ".env" }); // force load
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
console.log('DEBUG: DATABASE_URL exists?', !!process.env.DATABASE_URL);
const prisma = new client_1.PrismaClient();
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
    console.log("DB URL in seed:", process.env.DATABASE_URL);
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
    // 2. Create System Admin
    const adminEmail = 'admin@projectos.com';
    const hashedPassword = await bcrypt_1.default.hash('AdminPassword123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            systemRole: 'SYSTEM_ADMIN',
        },
        create: {
            email: adminEmail,
            firstName: 'System',
            lastName: 'Admin',
            password: hashedPassword,
            systemRole: 'SYSTEM_ADMIN',
        },
    });
    console.log('✅ System Admin created:', adminEmail);
    // 3. Initial Organization
    // Check if an organization already exists or use a unique name
    const org = await prisma.organization.upsert({
        where: { id: 'default-org-id' }, // use a stable ID for seeding or findFirst
        update: {},
        create: {
            id: 'default-org-id',
            name: 'ProjectOS HQ',
            color: '#4F46E5',
        },
    });
    console.log('✅ Initial Organization created:', org.id);
    // 4. Default Roles for Organization
    const roles = [
        { name: 'Owner', description: 'Full organization access', isSystem: true },
        { name: 'Admin', description: 'Organization administrator', isSystem: true },
        { name: 'Member', description: 'Regular workspace member', isSystem: true },
        { name: 'Viewer', description: 'Read-only access', isSystem: true },
    ];
    for (const roleData of roles) {
        await prisma.role.upsert({
            where: {
                organizationId_name: {
                    organizationId: org.id,
                    name: roleData.name,
                }
            },
            update: {},
            create: {
                ...roleData,
                organizationId: org.id,
                createdById: admin.id,
            },
        });
    }
    console.log('✅ Default Roles created');
    // 5. Add Admin to Organization as Owner
    const ownerRole = await prisma.role.findFirst({
        where: { organizationId: org.id, name: 'Owner' }
    });
    if (ownerRole) {
        await prisma.organizationMember.upsert({
            where: {
                organizationId_userId: {
                    organizationId: org.id,
                    userId: admin.id,
                }
            },
            update: {
                roleId: ownerRole.id,
            },
            create: {
                organizationId: org.id,
                userId: admin.id,
                roleId: ownerRole.id,
            },
        });
        console.log('✅ Admin added to organization as Owner');
    }
    else {
        console.log('⚠️ Owner role not found, skipping admin role assignment');
    }
    console.log('📦 Starting template seeding...');
    const templates = [
        {
            name: 'Professional SaaS Product Launch',
            description: 'A comprehensive roadmap for launching a SaaS product, covering development, marketing, and legal.',
            color: '#4F46E5',
            category: 'Tech/Product',
            lists: [
                {
                    name: 'Product Development',
                    tasks: [
                        { title: 'Finalize MVP feature set', priority: 'URGENT' },
                        { title: 'Core infrastructure setup', priority: 'HIGH' },
                        { title: 'Beta testing phase', priority: 'MEDIUM' }
                    ]
                },
                {
                    name: 'Marketing & PR',
                    tasks: [
                        { title: 'Launch website design', priority: 'HIGH' },
                        { title: 'Social media campaign setup', priority: 'MEDIUM' },
                        { title: 'Press release distribution', priority: 'MEDIUM' }
                    ]
                }
            ]
        },
        {
            name: 'Agile Software Development',
            description: 'Standard scrum-based development workflow.',
            color: '#10B981',
            category: 'Software Dev',
            lists: [
                { name: 'Backlog', tasks: [] },
                { name: 'To Do', tasks: [] },
                { name: 'In Progress', tasks: [] },
                { name: 'Review', tasks: [] },
                { name: 'Done', tasks: [] }
            ]
        }
    ];
    for (const t of templates) {
        const project = await prisma.project.create({
            data: {
                name: t.name,
                description: t.description,
                color: t.color,
                organization: { connect: { id: org.id } },
                createdBy: { connect: { id: admin.id } },
                updatedBy: { connect: { id: admin.id } },
                isTemplate: true,
                category: t.category,
                status: 'NOT_STARTED',
            }
        });
        for (const [lIdx, listData] of t.lists.entries()) {
            await prisma.list.create({
                data: {
                    name: listData.name,
                    position: lIdx,
                    projectId: project.id,
                    tasks: {
                        create: listData.tasks.map((task, tIdx) => ({
                            title: task.title,
                            priority: task.priority,
                            position: tIdx,
                            projectId: project.id,
                            organizationId: org.id,
                            createdById: admin.id,
                            updatedById: admin.id,
                        }))
                    }
                }
            });
        }
        console.log(`✅ Template created: ${t.name}`);
    }
    console.log('🌱 Seeding finished.');
}
main()
    .catch((e) => {
    console.error('❌ SEED ERROR:', e);
    if (e instanceof Error) {
        console.error('Stack:', e.stack);
    }
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
