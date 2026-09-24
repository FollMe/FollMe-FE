import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "@mui/material/Button";
import { IoArrowBack, IoHomeOutline } from "react-icons/io5";
import Animation404 from "components/animations/Animation404";
import styles from "./Page404.module.scss";

function Page404() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "Không tìm thấy trang | FollMe";
    }, []);

    return (
        <div className={styles.page}>
            <div className={styles.animation}>
                <Animation404 />
            </div>
            <div className="eyebrow">Lỗi 404</div>
            <h1 className={styles.title}>Trang này đã đi lạc mất rồi.</h1>
            <p className={styles.text}>
                Có thể đường dẫn đã bị thay đổi hoặc không còn tồn tại.
                Hãy quay về trang chủ để tiếp tục khám phá nhé.
            </p>
            <div className={styles.actions}>
                <Button variant="contained" size="large" startIcon={<IoHomeOutline />} onClick={() => navigate('/')}>
                    Về trang chủ
                </Button>
                <Button variant="outlined" size="large" startIcon={<IoArrowBack />} onClick={() => navigate(-1)}>
                    Quay lại
                </Button>
            </div>
        </div>
    );
}

export default Page404;
