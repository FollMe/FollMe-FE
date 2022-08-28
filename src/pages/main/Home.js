import { useEffect, useState } from 'react';
import '../auth/SignIn.module.scss';
import styles from './Home.module.scss';
import WumpusHiLoading from 'components/WumpusHiLoading';
import { request } from 'util/request';

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = "Trang chủ | FollMe";

        function checkIsLoggedIn() {
            setTimeout(async () => {
                await request.get('api/auth/is-logged-in');
                setIsLoading(false);
            }, 1000);
        }
        checkIsLoggedIn();
    }, [])
    return (
        <div className="containerMain">
            {isLoading ? <WumpusHiLoading /> : null}
            <div className="sideFeature mainSide">
                {!isLoading ?
                    <div className={styles.functionBox}>
                        <a href="stories">
                            <div className={styles.boxIcon}>
                                <img alt="Story" className={styles.boxImg} src="imgs/reading-book.png" />
                            </div>
                        </a>
                        <div className={styles.functionName}>Đọc truyện</div>
                    </div>
                    : null
                }
            </div>

            <div className="sideIntro mainSide">
                {!isLoading ?
                    <div className={styles.functionBox}>
                        <a href="shares" disabled>
                            <div className={styles.boxIcon}>
                                <img alt="Manage link" className={styles.boxImg} src="imgs/manage-link.png" />
                            </div>
                        </a>
                        <div className={styles.functionName}>Chia sẻ câu chuyện của bạn<br /></div>
                    </div>
                    : null
                }
            </div>
        </div>
    )
}