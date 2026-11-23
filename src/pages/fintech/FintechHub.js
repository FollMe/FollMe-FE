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
      description: 'Các luồng tiền trong ví điện tử và thanh toán ở Việt Nam, giải thích bằng sequence chạy từng bước và machine state.',
    });
  }, []);

  return (
    <div className={`container page ${styles.hub}`}>
      <PageHeader
        eyebrow="Fintech"
        title="Kiến thức fintech"
        description="Các luồng tiền trong ví và thanh toán, viết theo kiểu mình muốn đọc lại: tiền nằm ở đâu sau mỗi bước, order đang ở state nào, và khi một bên im lặng thì làm gì."
      />

      <div className={styles.cards}>
        {FINTECH_ARTICLES.map(a => (
          <Link key={a.slug} to={a.to} className={styles.card}>
            <span className={styles.cardTag}>{a.tag}</span>
            <h2>{a.title}</h2>
            <p>{a.description}</p>
            <ul>
              {a.topics.map(t => <li key={t}>{t}</li>)}
            </ul>
            <span className={styles.cardCta}>Xem flow <IoArrowForward /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
