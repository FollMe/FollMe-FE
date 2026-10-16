import { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import { toast } from 'react-toastify';
import { IoArrowForward, IoShareSocialOutline, IoInformationCircleOutline } from 'react-icons/io5';
import ArticleHeader from 'components/article/ArticleHeader';
import {
  PEOPLE, REGIONS, RELATIONS, VENUES, choiceFromQuery, choiceToQuery, giftAdvice,
} from 'util/giftAdvice';
import { formatVnd } from 'util/gifts';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './GiftCalculator.module.scss';

const TIPS = [
  'Mừng số tròn như 500.000 đ, 1.000.000 đ; nhiều người tránh số có chữ 4.',
  'Bỏ tiền vào phong bì và ghi tên ngoài phong bì, để cô dâu chú rể biết ai mừng.',
  'Chuyển khoản thì ghi nội dung: tên bạn và một lời chúc ngắn.',
  'Không đi được thì nên báo sớm để gia chủ bớt suất, rồi gửi quà hoặc chuyển khoản.',
];

/** A chip group: one value out of a few. */
function Choice({ label, options, value, onChange }) {
  return (
    <fieldset className={styles.group}>
      <legend>{label}</legend>
      <div className={styles.chips} role="radiogroup" aria-label={label}>
        {options.map(o => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={clsx(value === o.value && styles.on)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * "Đi đám cưới mừng bao nhiêu?": a few taps (who, how many, where) and a
 * suggested amount with why. The choice lives in the link, to share it.
 */
export default function GiftCalculator() {
  const [params, setParams] = useSearchParams();
  const choice = useMemo(() => choiceFromQuery(params), [params]);
  const advice = useMemo(() => giftAdvice(choice), [choice]);
  const set = patch => setParams(choiceToQuery({ ...choice, ...patch }), { replace: true });
  const relation = RELATIONS.find(r => r.value === choice.relation);

  useEffect(() => {
    setPageMeta({
      title: 'Đi đám cưới mừng bao nhiêu là hợp lý?',
      description: 'Tính nhanh tiền mừng cưới theo mối quan hệ, số người đi, nơi tổ chức và khu vực. Gợi ý số tiền tròn, đẹp kèm cách tính dễ hiểu.',
    });
  }, []);

  async function share() {
    const url = `${window.location.origin}/cuoi-hoi/tien-mung?${choiceToQuery(choice)}`;
    const text = `Đi đám cưới mừng bao nhiêu? Gợi ý ${formatVnd(advice.pick)} (khoảng ${formatVnd(advice.low)} – ${formatVnd(advice.high)})`;
    track('gift_calculator_shared');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Đi đám cưới mừng bao nhiêu?', text, url });
      } else {
        await navigator.clipboard.writeText(`${text}: ${url}`);
        toast.success('Đã copy link');
      }
    } catch (err) {
      // Closed the share sheet
    }
  }

  return (
    <div className={`container page ${styles.page}`}>
      <ArticleHeader
        back={{ to: '/cuoi-hoi', label: 'Cưới hỏi' }}
        eyebrow="Đi ăn cưới"
        title="Đi đám cưới mừng bao nhiêu?"
        subtitle="Chọn vài thông tin, FollMe gợi ý số tiền tròn, đẹp và giải thích vì sao. Chỉ để tham khảo: tình cảm và khả năng của bạn mới là chính."
      />

      <div className={styles.layout}>
        <div className={styles.form}>
          <Choice label="Bạn là gì của cô dâu chú rể?" options={RELATIONS} value={choice.relation} onChange={v => set({ relation: v })} />
          <Choice label="Đi mấy người?" options={PEOPLE} value={choice.people} onChange={v => set({ people: v })} />
          <Choice label="Tiệc tổ chức ở đâu?" options={VENUES} value={choice.venue} onChange={v => set({ venue: v })} />
          <Choice label="Khu vực" options={REGIONS} value={choice.region} onChange={v => set({ region: v })} />
          <Choice
            label="Bạn có đi dự không?"
            options={[{ value: true, label: 'Có đi' }, { value: false, label: 'Không đi, gửi mừng' }]}
            value={choice.attend}
            onChange={v => set({ attend: v })}
          />
        </div>

        <section id="goi-y" className={styles.result} aria-label="Gợi ý">
          <span className={styles.kicker}>Nên mừng khoảng</span>
          <strong className={styles.pick}>{formatVnd(advice.pick)}</strong>
          <span className={styles.range}>Thường từ {formatVnd(advice.low)} đến {formatVnd(advice.high)}</span>

          <ul className={styles.why}>
            <li>
              Một suất tiệc ({VENUES.find(v => v.value === choice.venue).label.toLowerCase()},{' '}
              {REGIONS.find(r => r.value === choice.region).label}) khoảng {formatVnd(advice.plate[0])} – {formatVnd(advice.plate[1])} một người.
            </li>
            <li>
              {relation.label}: thường mừng gấp {String(relation.mult[0]).replace('.', ',')}–{String(relation.mult[1]).replace('.', ',')} lần
              giá suất ăn{choice.people > 1 ? `, nhân cho ${choice.people === 3 ? '3 người trở lên' : '2 người'}` : ''}.
            </li>
            {!choice.attend && <li>Không đi thì không tính suất ăn: khoảng một nửa tới hai phần ba.</li>}
          </ul>

          <Button variant="outlined" startIcon={<IoShareSocialOutline />} onClick={share}>Gửi cho bạn đi cùng</Button>
          <p className={styles.note}>
            <IoInformationCircleOutline aria-hidden /> Giá suất tiệc là ước tính năm 2026 để tham khảo, mỗi nơi mỗi khác.
          </p>
        </section>
      </div>

      {/* Phones: the answer stays in sight while choosing */}
      <a href="#goi-y" className={styles.bar} aria-live="polite">
        <span>Nên mừng</span>
        <strong>{formatVnd(advice.pick)}</strong>
        <span>Cách tính</span>
      </a>

      <section className={styles.tips} aria-labelledby="tips">
        <h2 id="tips">Mấy điều nên biết</h2>
        <ul>
          {TIPS.map(t => <li key={t}>{t}</li>)}
        </ul>
      </section>

      <section className={styles.cta}>
        <h2>Sắp tới lượt bạn?</h2>
        <p>Tạo thiệp cưới online miễn phí: khách xác nhận tham dự, gửi lời chúc, và bạn ghi sổ mừng ngay trên điện thoại.</p>
        <Button component={Link} to="/cuoi-hoi" variant="contained" endIcon={<IoArrowForward />} onClick={() => track('gift_calculator_cta')}>
          Xem thiệp cưới FollMe
        </Button>
      </section>
    </div>
  );
}
