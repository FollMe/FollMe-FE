import { toast } from 'react-toastify';

export default async function handleError(response, message) {
    switch (response.status) {
        case 401:
            toast.error(message ?? 'Vui lòng đăng nhập!');
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userInfo');
                if (window.location.pathname !== '/sign-in') {
                    window.location.assign('/sign-in');
                }
            }, 2000)
            break;
        case 400:
            toast.error(message);
            break;
        case 404:
            toast.error('Không tìm thấy tài nguyên!');
            break;
        case 429:
            toast.error(message ?? 'Bạn thao tác quá nhanh, vui lòng thử lại sau giây lát.');
            break;
        default:
            break;
    }
}
