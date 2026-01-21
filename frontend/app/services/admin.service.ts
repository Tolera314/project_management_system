import axios from 'axios';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:4000/admin';

export interface AdminStats {
    users: { total: number; active: number; growth: number };
    workspaces: { total: number; active: number; growth: number };
    projects: { total: number; active: number; growth: number };
    revenue: { total: number; growth: number };
    recentActivity: { action: string; target: string; user: string; time: string }[];
}

export interface WorkspaceData {
    id: string;
    name: string;
    owner: string;
    ownerEmail: string;
    plan: string;
    members: number;
    projects: number;
    createdAt: string;
    status: string;
}

export class AdminService {
    static async getStats(): Promise<AdminStats> {
        const response = await axios.get(`${API_URL}/stats`, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async getWorkspaces(page = 1, limit = 10, query = ''): Promise<{ workspaces: WorkspaceData[], metadata: any }> {
        const response = await axios.get(`${API_URL}/workspaces`, {
            params: { page, limit, q: query },
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async getWorkspaceDetail(id: string): Promise<any> {
        const response = await axios.get(`${API_URL}/workspaces/${id}`, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async updateWorkspaceStatus(id: string, status: string): Promise<any> {
        const response = await axios.patch(`${API_URL}/workspaces/${id}/status`, { status }, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async getUsers(page = 1, limit = 10, query = '', role = '', status = ''): Promise<{ users: any[], metadata: any }> {
        const response = await axios.get(`${API_URL}/users`, {
            params: { page, limit, q: query, role, status },
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async updateUser(id: string, data: { systemRole?: string, status?: string, resetMFA?: boolean }): Promise<any> {
        const response = await axios.patch(`${API_URL}/users/${id}`, data, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    // Roles & Permissions
    static async getRoles(): Promise<any[]> {
        const response = await axios.get(`${API_URL}/roles`, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async createRole(data: { name: string; description: string; organizationId: string }): Promise<any> {
        const response = await axios.post(`${API_URL}/roles`, data, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<any> {
        const response = await axios.patch(`${API_URL}/roles/${roleId}/permissions`, { permissionIds }, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async getAllPermissions(): Promise<Record<string, any[]>> {
        const response = await axios.get(`${API_URL}/permissions`, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async getAuditLogs(page = 1, limit = 50, query = '', action = ''): Promise<{ logs: any[], metadata: any }> {
        const response = await axios.get(`${API_URL}/audit-logs`, {
            params: { page, limit, q: query, action },
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }

    static async getPlatformStats(): Promise<any> {
        const response = await axios.get(`${API_URL}/stats/platform`, {
            headers: { Authorization: `Bearer ${AuthService.getToken()}` }
        });
        return response.data;
    }
}
