import Button from '@mui/material/Button';
import { IoChatbubblesOutline, IoArrowForward } from 'react-icons/io5';
import styles from './CommentInterface.module.scss';

export function CommentInterface({ numsOfCmt, setOpenCmtDialog, isCmtLoading }) {
  return (
    <section className={styles.card}>
      <span className={styles.icon}><IoChatbubblesOutline /></span>
      <div className={styles.text}>
        <h2 className={styles.title}>
          Bình luận <span className={styles.count}>{isCmtLoading ? "…" : numsOfCmt}</span>
        </h2>
        <p className={styles.sub}>
          {!isCmtLoading && numsOfCmt === 0
            ? 'Hãy là người đầu tiên chia sẻ cảm xúc của mình.'
            : 'Cùng thảo luận với tác giả và những người đọc khác.'}
        </p>
      </div>
      <Button variant="contained" endIcon={<IoArrowForward />} onClick={() => setOpenCmtDialog(true)}>
        Xem bình luận
      </Button>
    </section>
  )
}
