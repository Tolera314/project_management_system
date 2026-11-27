
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const API_URL = API_BASE_URL;

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export interface Template {
    id: string;
    name: string;
    description?: string;
    color?: string;
    category?: string;
    _count?: {
        lists: number;
        tasks: number;
        milestones: number;
    };
    lists?: any[];
    milestones?: any[];
}

export const TemplateService = {
    getTemplates: async (params?: any) => {
        const res = await axios.get(`${API_URL}/templates`, {
            headers: getAuthHeader(),
            params
        });
        return res.data.templates as Template[];
    },

    getTemplateById: async (id: string) => {
        const res = await axios.get(`${API_URL}/templates/${id}`, {
            headers: getAuthHeader()
        });
        return res.data.template as Template;
    },

    useTemplate: async (id: string, data: { name: string; organizationId: string; ownerId?: string }) => {
        const res = await axios.post(`${API_URL}/templates/use/${id}`, data, {
            headers: getAuthHeader()
        });
        return res.data;
    },

    convertToTemplate: async (projectId: string) => {
        const res = await axios.post(`${API_URL}/templates/convert/${projectId}`, {}, {
            headers: getAuthHeader()
        });
        return res.data;
    }
};
