import { useEffect } from 'react';
import '../auth/SignIn.module.scss';
import styles from './Home.module.scss';

export default function Home() {
    useEffect(() => {
        document.title = "Trang chủ | FollMe";
    }, [])
    return (
        <div className="containerMain">
            <div className="sideFeature mainSide">
                <div className={styles.functionBox}>
                    <a href="stories">
                        <div className={styles.boxIcon}>
                            <img alt="Story" className={styles.boxImg} src="imgs/reading-book.png" />
                        </div>
                    </a>
                    <div className={styles.functionName}>Đọc truyện</div>
                </div>
            </div>

            <div className="sideIntro mainSide">
                <div className={styles.functionBox}>
                    <a >
                        <div className={styles.boxIcon}>
                            <img alt="Manage link" className={styles.boxImg} src="imgs/manage-link.png" />
                        </div>
                    </a>
                    <div className={styles.functionName}>Chia sẻ câu chuyện của bạn<br /></div>
                </div>
            </div>
        </div>
    )
}