import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoArrowForward } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import { FINTECH_ARTICLES } from 'fintech/articles';
import { setPageMeta } from 'util/meta';
import styles from './Fintech.module.scss';

export default function FintechHub() {
  useEffect(() => {
    setPageMeta({
      title: 'Kiến thức fintech',
      description: 'Các luồng tiền trong ví điện tử và thanh toán ở Việt Nam, giải thích bằng sequence chạy từng bước và state machine.',
    });
  }, []);

  return (
    <div className={`container page ${styles.hub}`}>
      <PageHeader
        eyebrow="Fintech"
        title="Kiến thức fintech"
        description="Mục này giải thích những gì xảy ra phía sau các nút bấm có tiền trong ví điện tử: nạp tiền, gửi tiết kiệm, trả hoá đơn. Mình viết cho backend engineer, BA, hay bất kỳ ai đang làm sản phẩm thanh toán, và cho chính mình đọc lại sau này."
      />

      <ol className={styles.path} aria-label="Lộ trình đọc">
        {FINTECH_ARTICLES.map(a => (
          <li key={a.slug}>
            <Link to={a.to}>
              <span>{a.order}</span>
              {a.title.split(':')[0]}
            </Link>
          </li>
        ))}
      </ol>

      <div className={styles.cards}>
        {FINTECH_ARTICLES.map(a => (
          <Link key={a.slug} to={a.to} className={styles.card}>
            <span className={styles.cardTag}>Bài {a.order} · {a.tag}</span>
            <h2>{a.title}</h2>
            <p>{a.description}</p>
            <ul>
              {a.topics.map(t => <li key={t}>{t}</li>)}
            </ul>
            <span className={styles.cardCta}>Đọc bài <IoArrowForward /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
