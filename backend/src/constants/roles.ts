export const ROLES = {
    WORKSPACE_MANAGER: 'Workspace Manager',
    OWNER: 'OWNER',
    ADMIN: 'Admin',
    PROJECT_MANAGER: 'Project Manager',
    MEMBER: 'Member',
    VIEWER: 'Viewer',
    PROJECT_MEMBER: 'Project Member',
    PROJECT_VIEWER: 'Project Viewer',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export const SYSTEM_ROLES = {
    ADMIN: 'ADMIN',
    USER: 'USER',
} as const;

export type SystemRoleType = typeof SYSTEM_ROLES[keyof typeof SYSTEM_ROLES];
