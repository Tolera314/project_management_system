This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Project Management Website

## 🌟 Overview

This is a **modern, production-ready Project Management Web Application** designed for teams to plan, track, and collaborate on projects. 

✅ **Database Schema Implemented**: Complete PostgreSQL schema with Prisma ORM
✅ **Core Hierarchy**: Organization → Project → List → Task

It supports:

- Project & task planning
- Team & role management
- Deadlines & scheduling
- Progress tracking & visualization
- Team communication & collaboration
- File & document management
- Risk & issue management
- Reports & analytics
- Security & access control
- System settings & customization

**Frontend:** Next.js (TypeScript, Tailwind CSS)  
**Backend:** Node.js (Express) + PostgreSQL + Prisma ORM  

---

## 🛠️ Tech Stack

| Layer        | Technology / Tool |
|-------------|-----------------|
| Frontend     | Next.js, TypeScript, Tailwind CSS |
| Backend      | Node.js, Express, TypeScript, Prisma ORM |
| Database     | PostgreSQL |
| Authentication | JWT, Role-based access control |
| Validation   | Zod |
| Version Control | GitHub |
| Deployment   | Optional: Vercel / AWS / DigitalOcean |

---

| Table                  | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `users`                | Stores user profiles, authentication credentials, and status      |
| `organizations`        | Multi-tenant support for companies / teams                        |
| `organization_members` | Links users to organizations with roles & membership status       |
| `roles`                | Defines roles: Admin, Project Manager, Member, Viewer             |
| `permissions`          | Atomic actions (create_task, delete_project, etc.)                |
| `role_permissions`     | Maps permissions to roles                                         |
| `project_members`      | Assigns users to projects with contextual roles & permissions     |
| `projects`             | Core project data: title, description, timeline, status           |
| `project_templates`    | Reusable project blueprints                                       |
| `lists`                | Task grouping within projects (e.g., To Do, In Progress, Backlog) |
| `tasks`                | Tasks & subtasks (parent_id for hierarchy)                        |
| `task_dependencies`    | Task-to-task prerequisite logic                                   |
| `list_dependencies`    | List-to-list prerequisite logic                                   |
| `task_statuses`        | Custom workflow states per organization/project                   |
| `milestones`           | Key delivery checkpoints within projects                          |
| `task_assignees`       | Many-to-many assignment of users to tasks                         |
| `time_entries`         | Tracks actual work logs (manual or timer-based)                   |
| `comments`             | Threaded comments on tasks and projects                           |
| `activity_logs`        | Immutable audit trail of user actions                             |
| `notifications`        | In-app notification queue (email optional)                        |
| `files`                | File metadata and ownership                                       |
| `file_versions`        | Version history for production-grade traceability                 |
| `file_links`           | Links files to tasks, projects, or comments                       |

## Core Hierarchy Implemented
Organization - Top-level container for projects and users
Project - Belongs to an organization
List - Belongs to a project (implementing the requested hierarchy)
Task - Can belong directly to a project or to a list within a project

## Enhanced Features Implemented
- **Role-Based Access Control**: Full RBAC system with roles, permissions, and role-permission mapping
- **Custom Task Statuses**: Flexible workflow states per organization/project
- **Project Templates**: Reusable project blueprints
- **Milestones**: Key delivery checkpoints within projects
- **Dependencies**: Both task-to-task and list-to-list prerequisite logic
- **File Management**: Complete file attachment system with versioning
- **Time Tracking**: Work log tracking with timer support
- **Activity Audit**: Complete audit trail of user actions
- **Notifications**: In-app notification system

## 🌐 API Endpoints (68)

The application provides **RESTful API endpoints** across all modules. Examples include:
API Endpoints Table (Key Endpoints, 68 total)

| Module            | Endpoint                             | Method | Description                     |
| ----------------- | ------------------------------------ | ------ | ------------------------------- |
| Auth              | `/auth/register`                     | POST   | Register a new user             |
| Auth              | `/auth/login`                        | POST   | User login                      |
| Auth              | `/auth/logout`                       | POST   | Logout current user             |
| Auth              | `/auth/me`                           | GET    | Get current user profile        |
| Auth              | `/auth/profile`                      | PUT    | Update user profile             |
| Auth              | `/auth/forgot-password`              | POST   | Send password reset email       |
| Auth              | `/auth/reset-password`               | POST   | Reset password                  |
| Organizations     | `/organizations`                     | POST   | Create a new organization       |
| Organizations     | `/organizations/:id`                 | GET    | Get organization details        |
| Organizations     | `/organizations/:id`                 | PUT    | Update organization             |
| Organizations     | `/organizations/:id/invite`          | POST   | Invite a user                   |
| Organizations     | `/organizations/:id/members`         | GET    | List members                    |
| Organizations     | `/organizations/:id/members/:userId` | DELETE | Remove a member                 |
| Projects          | `/projects`                          | POST   | Create a new project            |
| Projects          | `/projects`                          | GET    | List projects                   |
| Projects          | `/projects/:id`                      | GET    | Get project details             |
| Projects          | `/projects/:id`                      | PUT    | Update project                  |
| Projects          | `/projects/:id`                      | DELETE | Delete project                  |
| Projects          | `/projects/:id/members`              | POST   | Add member to project           |
| Project Templates | `/project-templates`                 | GET    | List project templates          |
| Lists             | `/projects/:id/lists`                | GET    | Get all lists in project        |
| Lists             | `/projects/:id/lists`                | POST   | Create a new list in project    |
| Lists             | `/lists/:id`                         | PUT    | Update list (title/position)    |
| Lists             | `/lists/:id`                         | DELETE | Delete a list                   |
| Tasks             | `/lists/:listId/tasks`               | POST   | Create task in a list           |
| Tasks             | `/lists/:listId/tasks`               | GET    | Get tasks in a list             |
| Tasks             | `/tasks/:id`                         | GET    | Get task details                |
| Tasks             | `/tasks/:id`                         | PUT    | Update task                     |
| Tasks             | `/tasks/:id`                         | DELETE | Delete task                     |
| Tasks             | `/tasks/:id/assign`                  | POST   | Assign user(s) to task          |
| Tasks             | `/tasks/:id/status`                  | PUT    | Update task status              |
| Tasks             | `/tasks/:id/dependencies`            | POST   | Add task dependency             |
| Tasks             | `/tasks/:id/dependencies/:depId`     | DELETE | Remove dependency               |
| Tasks             | `/tasks/:id/time`                    | POST   | Log time entry                  |
| Tasks             | `/tasks/:id/time`                    | GET    | Get time entries                |
| Comments          | `/comments`                          | POST   | Create comment                  |
| Comments          | `/tasks/:id/comments`                | GET    | Get comments for a task         |
| Comments          | `/comments/:id`                      | PUT    | Update comment                  |
| Comments          | `/comments/:id`                      | DELETE | Delete comment                  |
| Mentions          | `/mentions`                          | GET    | Get mentions for user           |
| Files             | `/files/upload`                      | POST   | Upload a file                   |
| Files             | `/files/:id`                         | GET    | Get file details                |
| Files             | `/files/:id`                         | DELETE | Delete file                     |
| Files             | `/files/:id/versions`                | GET    | List file versions              |
| Files             | `/files/:id/versions`                | POST   | Upload new version              |
| Files             | `/files/:id/preview`                 | GET    | Preview file                    |
| Calendar          | `/events`                            | POST   | Create calendar event           |
| Calendar          | `/events`                            | GET    | List events                     |
| Calendar          | `/events/:id`                        | PUT    | Update event                    |
| Reminders         | `/reminders`                         | POST   | Create reminder                 |
| Risks             | `/risks`                             | POST   | Create a project risk           |
| Risks             | `/projects/:id/risks`                | GET    | Get project risks               |
| Issues            | `/issues`                            | POST   | Create an issue                 |
| Issues            | `/projects/:id/issues`               | GET    | List project issues             |
| Issue Links       | `/issue-links`                       | POST   | Link issue to task/project      |
| Notifications     | `/notifications`                     | GET    | Get user notifications          |
| Notifications     | `/notifications/:id/read`            | PUT    | Mark notification as read       |
| Notifications     | `/notifications/read-all`            | PUT    | Mark all notifications as read  |
| Dashboards        | `/dashboards`                        | GET    | List dashboards                 |
| Dashboards        | `/dashboards/:id`                    | PUT    | Update dashboard                |
| Reports           | `/reports`                           | POST   | Create report                   |
| Reports           | `/reports/:id`                       | GET    | Get report details              |
| Reports           | `/reports/:id/download`              | GET    | Download report                 |
| Analytics         | `/analytics/project/:id`             | GET    | Project analytics               |
| Security          | `/audit-logs`                        | GET    | Get audit logs                  |
| Security          | `/activity-logs`                     | GET    | Get activity logs               |
| Security          | `/notifications/preferences`         | PUT    | Update notification preferences |
| Security          | `/data-export`                       | POST   | Export user/org data            |

> **Note:** All endpoints require JWT authentication and role-based permissions.

---

## 🎨 Color Branding

We use a **premium, SaaS-oriented color palette**:

```js
colors: {
  primary: '#4F46E5'  // Brand primary: main actions, links, active states (Create, Save, Assign)
  background: '#020617' // App background (dark mode base), reduces eye strain for long sessions
  surface: '#1E293B'    // Card, modal, sidebar, and panel surfaces layered above background
  textPrimary: '#E5E7EB' // Primary text: headings, titles, key content for maximum readability
  textSecondary: '#94A3B8' // Secondary text: labels, metadata, helper text, muted information
  success: '#10B981'      // Success states: completed tasks, confirmations, positive indicators
  warning: '#F59E0B'     // Warning states: approaching deadlines, risks, caution messages
  danger: '#EF4444'      // Danger states: errors, overdue tasks, destructive actions (delete)
  accent: '#A78BFA'       // Accent highlight: charts, selected tabs, special badges
}



