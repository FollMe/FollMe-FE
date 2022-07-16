import { useEffect } from 'react';
import '../auth/SignIn.module.scss';
import './Home.css';

export default function Home() {
    useEffect(() => {
        document.title = "Trang chủ | FollMe";
    }, [])
    return (
        <div className="containerMain">
            <div className="sideFeature mainSide">
                <div className="functionBox">
                    <a href="story">
                        <div className="boxIcon">
                            <img alt="Story" className="boxImg" src="imgs/reading-book.png" />
                        </div>
                    </a>
                    <div className="functionName">Đọc truyện</div>
                </div>
                <img className="arrowDownIcon" src="imgs/arrow-down.gif" />
            </div>

            <div className="sideIntro mainSide">
                <div className="functionBox">
                    <a >
                        <div className="boxIcon">
                            <img alt="Manage link" className="boxImg" src="imgs/manage-link.png" />
                        </div>
                    </a>
                    <div className="functionName">Chia sẻ câu chuyện của bạn<br /></div>
                </div>
            </div>
        </div>
    )
}