
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const API_URL = `${API_BASE_URL}/auth`;

export class AuthService {
    static getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }

    static getUser(): any {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    return JSON.parse(userStr);
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    static logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
    }
}
