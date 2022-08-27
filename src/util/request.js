import { toast } from 'react-toastify';
import handleError from './handleError';

async function post(url = '', data = {}, isHaveFile = false) {
    try {
        const token = localStorage.getItem('token');
        const requestConfigs = {
            method: 'POST',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                Authorization: `Bearer ${token}`
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: isHaveFile ? data : JSON.stringify(data)
        };
        if (!isHaveFile) {
            requestConfigs.headers['Content-Type'] = 'application/json';
        }
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/${url}`, requestConfigs);
        const dataRes = await response.json();

        if (!dataRes.meta.ok) {
            handleError(response, dataRes.meta.message);
            return new Error(dataRes.meta.message);
        }

        return dataRes.data;
    } catch (err) {
        toast.error("Xảy ra lỗi, vui lòng thử lại!");
        return err;
    }
}

async function get(url = '') {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/${url}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
        });
        if (!response.ok) {
            handleError(response);
        }

        const dataRes = await response.json();
        return dataRes.data;
    } catch (err) {
        console.log(err);
        return {};
    }
}

async function authenticate(route, data) {
    const response = await post(route, data);
    const token = response.token;

    localStorage.setItem("token", token);
    localStorage.setItem("userInfo", JSON.stringify(response.user));
    return response.user;
}

export const authRouteList = {
    'facebook': 'api/auth/facebook',
    'google': 'api/auth/google',
    'local': 'api/auth/local',
    'default': 'api/auth/local'
}

export const request = { get, post, authenticate };