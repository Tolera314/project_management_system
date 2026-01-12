
import axios from 'axios';

const API_URL = 'http://localhost:4000/auth';

export class AuthService {
    static getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token');
        }
        return null;
    }
}
