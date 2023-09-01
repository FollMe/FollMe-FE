
import styles from "./Footer.module.scss";

export default function Footer() {
  return (
    <div className={`footer ${styles.footer}`}>
      <p >FollMe - Chia sẻ câu chuyện của bạn 😎</p>
      <a
        href="https://www.freeprivacypolicy.com/live/b2e00735-5907-4d28-9a1a-875d2f56053c"
        target="_blank"
        rel="noreferrer"
      >
        Privacy Policy
      </a>
      <a
        href="https://www.freeprivacypolicy.com/live/882e116b-73b8-4713-85a2-bbc173c68be0"
        target="_blank"
        rel="noreferrer"
      >
        Terms & Conditions
      </a>
    </div>
  )
}
