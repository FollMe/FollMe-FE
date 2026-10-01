import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import { IoArrowBack, IoHomeOutline } from "react-icons/io5";
import styles from "./Page404.module.scss";

function Page404() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Không tìm thấy trang | FollMe";
    }, []);

    return (
        <div className={styles.page}>
            <div className={styles.code} aria-hidden>
                <span>4</span>
                <span className={styles.seal}>囍</span>
                <span>4</span>
            </div>
            <div className="eyebrow">Lỗi 404</div>
            <h1 className={styles.title}>Tấm thiệp này đã thất lạc.</h1>
            <p className={styles.text}>
                Có thể đường dẫn đã bị thay đổi hoặc không còn tồn tại.
                Quay về trang chủ, hoặc mở thử một tấm thiệp mẫu nhé.
            </p>
            <div className={styles.actions}>
                <Button variant="contained" size="large" startIcon={<IoHomeOutline />} onClick={() => navigate('/')}>
                    Về trang chủ
                </Button>
                <Button variant="outlined" size="large" startIcon={<IoArrowBack />} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </div>
            <button type="button" className={styles.demoLink} onClick={() => navigate('/thiep-mau/blush')}>
                Xem thiệp mẫu →
            </button>
        </div>
    );
}

export default Page404;
