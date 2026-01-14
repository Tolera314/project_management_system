import axios from 'axios';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:4000/admin';

export interface AdminStats {
    users: { total: number; active: number; growth: number };
    workspaces: { total: number; active: number; growth: number };
    projects: { total: number; active: number; growth: number };
    revenue: { total: number; growth: number };
}

export interface WorkspaceData {
    id: string;
    name: string;
    owner: string;
    plan: string;
    members: number;
    projects: number;
    createdAt: string;
    status: string;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    systemRole: 'SYSTEM_ADMIN' | 'SUPPORT' | 'USER';
    status: string;
    mfaEnabled: boolean;
    workspaceCount: number;
    lastLogin?: string;
    createdAt: string;
}

export interface UserDetailData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    systemRole: 'SYSTEM_ADMIN' | 'SUPPORT' | 'USER';
    status: string;
    mfaEnabled: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    workspaces: WorkspaceMembership[];
    activeSessions: SessionData[];
}

export interface WorkspaceMembership {
    organizationId: string;
    organizationName: string;
    role: string;
    joinedAt: string;
}

export interface SessionData {
    id: string;
    userAgent?: string;
    ipAddress?: string;
    lastActive: string;
    createdAt: string;
}

export interface AuditLogData {
    id: string;
    action: string;
    entityType: string;
    targetUserId?: string;
    performedById: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    performedBy: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

export class AdminService {
    private static getHeaders() {
        return { Authorization: `Bearer ${AuthService.getToken()}` };
    }

    static async getStats(): Promise<AdminStats> {
        const response = await axios.get(`${API_URL}/stats`, {
            headers: this.getHeaders()
        });
        return response.data;
    }

    static async getWorkspaces(page = 1, limit = 10, query = ''): Promise<{ workspaces: WorkspaceData[], metadata: any }> {
        const response = await axios.get(`${API_URL}/workspaces`, {
            params: { page, limit, q: query },
            headers: this.getHeaders()
        });
        return response.data;
    }

    // User Management Methods
    static async getUsers(
        page = 1,
        limit = 10,
        filters: {
            q?: string;
            role?: string;
            status?: string;
            mfaEnabled?: boolean;
            minWorkspaces?: number;
        } = {}
    ): Promise<{ users: UserData[], metadata: any }> {
        const response = await axios.get(`${API_URL}/users`, {
            params: { page, limit, ...filters },
            headers: this.getHeaders()
        });
        return response.data;
    }

    static async getUserDetail(userId: string): Promise<UserDetailData> {
        const response = await axios.get(`${API_URL}/users/${userId}`, {
            headers: this.getHeaders()
        });
        return response.data;
    }

    static async updateUserRole(userId: string, systemRole: string): Promise<void> {
        await axios.put(
            `${API_URL}/users/${userId}/role`,
            { systemRole },
            { headers: this.getHeaders() }
        );
    }

    static async updateUserStatus(userId: string, status: string): Promise<void> {
        await axios.put(
            `${API_URL}/users/${userId}/status`,
            { status },
            { headers: this.getHeaders() }
        );
    }

    static async forceLogoutUser(userId: string): Promise<{ sessionsRevoked: number }> {
        const response = await axios.post(
            `${API_URL}/users/${userId}/force-logout`,
            {},
            { headers: this.getHeaders() }
        );
        return response.data;
    }

    static async resetUserPassword(userId: string): Promise<void> {
        await axios.post(
            `${API_URL}/users/${userId}/reset-password`,
            {},
            { headers: this.getHeaders() }
        );
    }

    static async toggleUserMFA(userId: string, mfaEnabled: boolean): Promise<void> {
        await axios.put(
            `${API_URL}/users/${userId}/mfa`,
            { mfaEnabled },
            { headers: this.getHeaders() }
        );
    }

    static async removeUserFromWorkspace(userId: string, organizationId: string): Promise<void> {
        await axios.delete(
            `${API_URL}/users/${userId}/workspaces/${organizationId}`,
            { headers: this.getHeaders() }
        );
    }

    static async getUserAuditHistory(
        userId: string,
        page = 1,
        limit = 20,
        actionType?: string
    ): Promise<{ logs: AuditLogData[], metadata: any }> {
        const response = await axios.get(`${API_URL}/users/${userId}/audit`, {
            params: { page, limit, actionType },
            headers: this.getHeaders()
        });
        return response.data;
    }

    static async deleteUser(userId: string): Promise<void> {
        await axios.delete(
            `${API_URL}/users/${userId}`,
            { headers: this.getHeaders() }
        );
    }
}
