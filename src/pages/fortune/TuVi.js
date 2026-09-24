import { useEffect, useRef } from 'react';
import ArticleHeader from 'components/article/ArticleHeader';
import BirthInfoForm from 'components/fortune/BirthInfoForm';
import TuViChart from 'components/fortune/TuViChart';
import ReadingList from 'components/fortune/ReadingList';
import ResultActions from 'components/fortune/ResultActions';
import { DISCLAIMER, formatBirth, fortuneApi } from 'util/fortune';
import useFortuneResult from './useFortuneResult';
import styles from './Fortune.module.scss';

export default function TuVi() {
  const { birth, data, isLoading, compute, resultRef } = useFortuneResult(fortuneApi.tuvi);
  const chartRef = useRef(null);

  useEffect(() => {
    document.title = 'Lá số tử vi | FollMe';
  }, []);

  return (
    <div className="container page">
      <ArticleHeader
        back={{ to: '/fortune', label: 'Thần số học & Tử vi' }}
        eyebrow="Tử Vi Đẩu Số"
        title="Lập lá số tử vi"
        subtitle="Lá số được lập theo lịch âm Việt Nam. Giờ sinh càng chính xác, lá số càng đúng."
      />
      <div className={styles.panel}>
        <BirthInfoForm
          mode="tuvi"
          initialValues={birth}
          onSubmit={compute}
          isSubmitting={isLoading}
          submitLabel="Lập lá số"
        />
        <p className={styles.privacy}>Không cần đăng nhập. Thông tin bạn nhập không được lưu lại.</p>
      </div>

      {data && (
        <div ref={resultRef} className={styles.result}>
          <div className={styles.resultHead}>
            <div>
              <h2 className={styles.resultTitle}>Lá số{birth?.fullName ? ` của ${birth.fullName}` : ''}</h2>
              <p className={styles.resultSub}>
                {formatBirth(birth)} · Dương lịch {data.solarDate.day}/{data.solarDate.month}/{data.solarDate.year}
              </p>
            </div>
            <ResultActions
              title="Lá số tử vi của tôi"
              birth={birth}
              method="tuvi"
              cardRef={chartRef}
              fileName="la-so-tu-vi"
            />
          </div>
          <TuViChart ref={chartRef} chart={data.chart} name={birth?.fullName} />
          <div className={styles.narrow}>
            <ReadingList readings={data.readings} />
          </div>
          <p className={`${styles.disclaimer} ${styles.narrow}`}>{DISCLAIMER}</p>
          <div className={styles.engine}>Phiên bản bộ tính: {data.engineVersion}</div>
        </div>
      )}
    </div>
  );
}
