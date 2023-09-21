import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../auth/SignIn.module.scss';
import styles from './Home.module.scss';
import WumpusHiLoading from 'components/loading/WumpusHiLoading';
import { request } from 'util/request';

export default function Home() {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = "Trang chủ | FollMe";

        function checkIsLoggedIn() {
            setTimeout(async () => {
                await request.get('api/auth/is-logged-in');
                setIsLoading(false);
            }, 500);
        }
        checkIsLoggedIn();
    }, [])
    return (
        <div className="containerMain">
            {/* {isLoading ? <WumpusHiLoading /> : null}
            <div className="sideFeature mainSide">
                {!isLoading ?
                    <div className={styles.functionBox}>
                        <Link to="stories">
                            <div className={styles.boxIcon}>
                                <img alt="Story" className={styles.boxImg} src="imgs/reading-book.png" />
                            </div>
                        </Link>
                        <div className={styles.functionName}>Đọc truyện</div>
                    </div>
                    : null
                }
            </div>

            <div className="sideIntro mainSide">
                {!isLoading ?
                    <div className={styles.functionBox}>
                        <Link to="#" disabled>
                            <div className={styles.boxIcon}>
                                <img alt="Manage link" className={styles.boxImg} src="imgs/manage-link.png" />
                            </div>
                        </Link>
                        <div className={styles.functionName}>Chia sẻ câu chuyện của bạn<br /></div>
                    </div>
                    : null
                }
            </div> */}
            
        </div>
    )
}