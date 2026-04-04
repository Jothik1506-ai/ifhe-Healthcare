import axios from 'axios';
import { BACKEND_URL } from '../config/api';

const publicAxios = axios.create({
    baseURL: BACKEND_URL,
});

const privateAxios = axios.create({
    baseURL: BACKEND_URL,
});

privateAxios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export { privateAxios, publicAxios };
