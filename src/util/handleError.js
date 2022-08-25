import { toast } from 'react-toastify';

export default async function handleError(response, message) {
    switch (response.status) {
        case 401:
            toast.error(message ?? 'Please login!');
            setTimeout(() => {
                if (window.location.pathname !== '/sign-in') {
                    window.location.assign('/sign-in');
                }
            }, 2000)
            break;
        case 400:
            toast.error(message);
            break;
        case 404:
            toast.error("Xảy ra lỗi, vui lòng thử lại!");
            break;
        default:
            break;
    }
}