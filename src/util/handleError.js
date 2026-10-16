import { toast } from 'react-toastify';

// A guest card read in English: the server's words are Vietnamese, so say it plainly in English
function inEnglish() {
    return typeof document !== 'undefined' && document.documentElement.lang === 'en';
}

const ENGLISH = {
    400: 'That did not go through. Please check and try again.',
    403: 'This is not allowed.',
    404: 'Not found.',
    429: 'Too fast: please try again in a moment.',
    default: 'Something went wrong, please try again.',
};

export function genericError() {
    return inEnglish() ? ENGLISH.default : 'Xảy ra lỗi, vui lòng thử lại!';
}

export default async function handleError(response, message) {
    if (inEnglish() && response.status !== 401) {
        toast.error(ENGLISH[response.status] ?? ENGLISH.default);
        return;
    }
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
        case 403:
            toast.error(message ?? 'Bạn không có quyền thực hiện thao tác này!');
            break;
        case 404:
            toast.error('Không tìm thấy tài nguyên!');
            break;
        case 429:
            toast.error(message ?? 'Bạn thao tác quá nhanh, vui lòng thử lại sau giây lát.');
            break;
        default:
            // e.g. a 500: say something rather than fail silently
            toast.error(message ?? 'Xảy ra lỗi, vui lòng thử lại!');
            break;
    }
}
