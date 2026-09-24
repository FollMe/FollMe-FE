import { useEffect, useRef } from 'react';
import ArticleHeader from 'components/article/ArticleHeader';
import BirthInfoForm from 'components/fortune/BirthInfoForm';
import NumerologyResult from 'components/fortune/NumerologyResult';
import ReadingList from 'components/fortune/ReadingList';
import ResultActions from 'components/fortune/ResultActions';
import { DISCLAIMER, fortuneApi } from 'util/fortune';
import useFortuneResult from './useFortuneResult';
import styles from './Fortune.module.scss';

export default function Numerology() {
  const { birth, data, isLoading, compute, resultRef } = useFortuneResult(fortuneApi.numerology);
  const cardRef = useRef(null);

  useEffect(() => {
    document.title = 'Thần số học | FollMe';
  }, []);

  const lifePathReading = data?.readings.find(r => r.id.startsWith('num.life_path.'));
  const lifePathTitle = lifePathReading?.title.split(': ').slice(1).join(': ');

  return (
    <div className="container page">
      <ArticleHeader
        back={{ to: '/fortune', label: 'Thần số học & Tử vi' }}
        eyebrow="Thần số học"
        title="Những con số của bạn"
        subtitle="Nhập họ tên khai sinh và ngày sinh để xem số chủ đạo, biểu đồ ngày sinh và các giai đoạn đỉnh cao."
      />
      <div className={styles.panel}>
        <BirthInfoForm
          mode="numerology"
          initialValues={birth}
          onSubmit={compute}
          isSubmitting={isLoading}
          submitLabel="Xem kết quả"
        />
        <p className={styles.privacy}>Không cần đăng nhập. Thông tin bạn nhập không được lưu lại.</p>
      </div>

      {data && (
        <div ref={resultRef} className={styles.result}>
          <div className={styles.resultHead}>
            <div>
              <h2 className={styles.resultTitle}>Kết quả{birth?.fullName ? ` của ${birth.fullName}` : ''}</h2>
              {data.result.normalizedName && <p className={styles.resultSub}>Tên dùng để tính: {data.result.normalizedName}</p>}
            </div>
            <ResultActions
              title="Thần số học của tôi"
              birth={birth}
              method="numerology"
              cardRef={cardRef}
              fileName={`than-so-hoc-${data.result.lifePath.value}`}
            />
          </div>
          <div className={styles.narrow}>
            <NumerologyResult ref={cardRef} result={data.result} lifePathTitle={lifePathTitle} />
          </div>
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
