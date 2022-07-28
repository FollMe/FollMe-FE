import AppsIcon from '@mui/icons-material/Apps';
import styles from "./Story.module.scss";

export default function Story() {
    return (
        <div className="container-view grid">
            <div className={styles.chapNumber}><b>Chap: 1</b></div>
            <div className={styles.boxContent}>
                <pre className={styles.content}>
                    tính ra cái rank dưới này skill khủng nhiều. Cơ mà mấy bố ủ nó lên men lên mốc luôn nên k vào giải, còn mấy thằng vào giải toàn mấy thằng quèn quèn skill 5-7.
                    điển hình như thằng dưới, có đợt nó rủ mình tập trận hoài, đánh oải luôn mà nó vẫn không ăn đc 😂😂 nay thấy nó top với vài đứa khác quen quen, toàn top 30/30.
                </pre>
                <div className={styles.paginateChap}>
                    <span>Đang đọc: Chap 1 <br /> Tiếp theo:</span>
                    {/* {{ #if nextChap }}
                    <a href="/story/view/?chap={{nextChap.chap}}"><div className="button-chap">{{ nextChap.chap }}</div></a>

                    {{ else}}
                    <span>Đang viết</span>
                    {{/if}} */}
                    <a href="/story">
                        <div className={styles.buttonChap}>
                            <AppsIcon sx={{ fontSize: 24 }} />
                        </div>
                    </a>
                </div>

            </div>
            <footer>
                <img src="/imgs/follme-logo.png" alt="follme-logo" className="follme-logo" />
                <h4>FollMe</h4>
            </footer>
        </div>
    )
}