// import './SelectChap.css'
import styles from './SelectChap.module.scss';

export default function SelectChap() {
    return (
        <div className="container-view grid mobilePage">
            <div className={styles.body}>
                <h4>Truyện: Yêu nhầm chị hai, được nhầm em gái va cuoi cung la kha buon luon</h4>
                <div>
                    <ul className={styles.selectChap}>
                        <a href="story/view/?chap={{this.chap}}">
                            <li className={styles.chapNumber}>1</li>
                        </a>
                        <a href="story/view/?chap={{this.chap}}">
                            <li className={styles.chapNumber}>2</li>
                        </a>
                        <a href="story/view/?chap={{this.chap}}">
                            <li className={styles.chapNumber}>3</li>
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