import * as dotenv from "dotenv";
dotenv.config({ path: ".env" }); // force load

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

console.log("DEBUG: DATABASE_URL exists?", !!process.env.DATABASE_URL);

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const permissions = [
  // Project Permissions
  { name: "view_project", category: "Project", description: "View project details" },
  { name: "edit_project", category: "Project", description: "Edit project details" },
  { name: "delete_project", category: "Project", description: "Delete project" },
  { name: "manage_project_members", category: "Project", description: "Add/remove members" },
  { name: "manage_project_settings", category: "Project", description: "Manage settings" },

  // Task Permissions
  { name: "create_task", category: "Task", description: "Create new tasks" },
  { name: "edit_task", category: "Task", description: "Edit task details" },
  { name: "delete_task", category: "Task", description: "Delete tasks" },
  { name: "assign_task", category: "Task", description: "Assign users to tasks" },
  { name: "change_status", category: "Task", description: "Change task status" },
  { name: "comment_task", category: "Task", description: "Comment on tasks" },
  { name: "upload_task_file", category: "Task", description: "Upload files to tasks" },
  { name: "log_time", category: "Task", description: "Log time on tasks" },

  // Planning Permissions
  { name: "manage_lists", category: "Planning", description: "Create/Edit/Delete lists" },
  { name: "manage_milestones", category: "Planning", description: "Create/Edit/Delete milestones" },
  { name: "manage_dependencies", category: "Planning", description: "Manage dependencies" },
  { name: "edit_timeline", category: "Planning", description: "Edit timeline view" },

  // File Permissions
  { name: "upload_file", category: "Files", description: "Upload files" },
  { name: "download_file", category: "Files", description: "Download files" },
  { name: "delete_file", category: "Files", description: "Delete files" },
  { name: "view_file_versions", category: "Files", description: "View file history" },

  // Reporting Permissions
  { name: "view_reports", category: "Reports", description: "View analytics" },
  { name: "export_reports", category: "Reports", description: "Export data" },
];

async function main() {
  console.log("DB URL in seed:", process.env.DATABASE_URL);
  console.log("🌱 Starting seed...");

  // 1. Permissions
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
  }
  console.log("✅ Permissions seeded");

  // 2. System Admin
  const adminEmail = "admin@projectos.com";
  const hashedPassword = await bcrypt.hash("AdminPassword123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { systemRole: "SYSTEM_ADMIN" },
    create: {
      email: adminEmail,
      firstName: "System",
      lastName: "Admin",
      password: hashedPassword,
      systemRole: "SYSTEM_ADMIN",
    },
  });
  console.log("✅ System Admin created:", adminEmail);

  // 3. Organization
  const org = await prisma.organization.upsert({
    where: { id: "default-org-id" },
    update: {},
    create: {
      id: "default-org-id",
      name: "ProjectOS HQ",
      color: "#4F46E5",
    },
  });
  console.log("✅ Initial Organization created:", org.id);

  // 4. Roles
  const roles = [
    { name: "Owner", description: "Full organization access", isSystem: true },
    { name: "Admin", description: "Organization administrator", isSystem: true },
    { name: "Member", description: "Regular workspace member", isSystem: true },
    { name: "Viewer", description: "Read-only access", isSystem: true },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        organizationId_name: {
          organizationId: org.id,
          name: role.name,
        },
      },
      update: {},
      create: {
        ...role,
        organizationId: org.id,
        createdById: admin.id,
      },
    });
  }
  console.log("✅ Default Roles created");

  // 5. Add admin to org
  const ownerRole = await prisma.role.findFirst({
    where: { organizationId: org.id, name: "Owner" },
  });

  if (ownerRole) {
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: admin.id,
        },
      },
      update: { roleId: ownerRole.id },
      create: {
        organizationId: org.id,
        userId: admin.id,
        roleId: ownerRole.id,
      },
    });
    console.log("✅ Admin added to organization as Owner");
  }

  // 6. Templates
  console.log("📦 Starting template seeding...");

  const templates = [
    {
      name: "Professional SaaS Product Launch",
      description: "A comprehensive roadmap for launching a SaaS product.",
      color: "#4F46E5",
      category: "Tech/Product",
      lists: [
        {
          name: "Product Development",
          tasks: [
            { title: "Finalize MVP feature set", priority: "URGENT" },
            { title: "Core infrastructure setup", priority: "HIGH" },
            { title: "Beta testing phase", priority: "MEDIUM" },
          ],
        },
        {
          name: "Marketing & PR",
          tasks: [
            { title: "Launch website design", priority: "HIGH" },
            { title: "Social media campaign setup", priority: "MEDIUM" },
            { title: "Press release distribution", priority: "MEDIUM" },
          ],
        },
      ],
    },
  ];

  for (const t of templates) {
    const project = await prisma.project.create({
      data: {
        name: t.name,
        description: t.description,
        color: t.color,
        category: t.category,
        status: "NOT_STARTED",
        isTemplate: true,
        organization: { connect: { id: org.id } },
        createdBy: { connect: { id: admin.id } },
        updatedBy: { connect: { id: admin.id } },
      },
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
              priority: task.priority as any,
              position: tIdx,
              projectId: project.id,
              createdById: admin.id,
              updatedById: admin.id,
            })),
          },
        },
      });
    }

    console.log(`✅ Template created: ${t.name}`);
  }

  console.log("🌱 Seeding finished.");
}

main()
  .catch((e) => {
    console.error("❌ SEED ERROR:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
