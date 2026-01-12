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
}
