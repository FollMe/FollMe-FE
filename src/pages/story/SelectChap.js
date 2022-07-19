import './BaseView.css';
import './SelectChap.css'

export default function SelectChap() {
    return (
        <div className="container-view grid">
            <div className="body">
                <h4>Truyện: Yêu nhầm chị hai, được nhầm em gái</h4>
                <div className="box-select-chap">
                    <ul className="select-chap">
                        <a href="story/view/?chap={{this.chap}}">
                            <li className="chap-number">1</li>
                        </a>
                    </ul>
                </div>
            </div>
            <footer>
                <img src="/imgs/follme-logo.png" alt="follme-logo" className="follme-logo" />
                <h4>FollMe</h4>
            </footer>
        </div>
    )
}