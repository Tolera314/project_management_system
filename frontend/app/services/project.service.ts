const API_URL = 'http://localhost:4000';

export const ProjectService = {
    async getProjects(organizationId: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/projects?organizationId=${organizationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch projects');
        return await res.json();
    },

    async getProjectDetails(id: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/projects/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch project details');
        return await res.json();
    },

    async getProjectStats(id: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/projects/${id}/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to fetch project stats');
        return await res.json();
    },

    async addMember(projectId: string, email: string, roleId: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/projects/${projectId}/members`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ email, roleId })
        });
        if (!res.ok) throw new Error('Failed to add member');
        return await res.json();
    },

    async removeMember(projectId: string, memberId: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/projects/${projectId}/members/${memberId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) throw new Error('Failed to remove member');
        return await res.json();
    },

    async updateMemberRole(projectId: string, memberId: string, roleId: string) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/projects/${projectId}/members/${memberId}/role`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ roleId })
        });
        if (!res.ok) throw new Error('Failed to update member role');
        return await res.json();
    }
};
