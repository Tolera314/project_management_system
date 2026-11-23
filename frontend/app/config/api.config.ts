import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// Enable credentials / cookies for all requests (HttpOnly JWT session support)
axios.defaults.withCredentials = true;
