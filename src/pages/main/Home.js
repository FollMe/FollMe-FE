import '../auth/SignIn.module.scss';
import './Home.css';

export default function Home() {
  return (
    <div className="container-main">
      <div className="side-feature main-side">
        <div className="function-box">
          <a href="story">
            <div className="box-icon">
              <img alt="Story" className="box-img" src="imgs/reading-book.png" />
              <div className="function-name">Đọc truyện</div>
            </div>
          </a>
        </div>
      </div>

      <div className="side-intro main-side">
        <div className="function-box">
          <a >
            <div className="box-icon">
              <img alt="Manage link" className="box-img" src="imgs/manage-link.png" />
              <div className="function-name">Quản lý link của bạn<br /></div>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}