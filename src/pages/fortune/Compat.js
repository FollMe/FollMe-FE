import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import { toast } from 'react-toastify';
import { IoHeart, IoImageOutline, IoLinkOutline, IoCheckmark, IoSwapHorizontal, IoCalendarOutline } from 'react-icons/io5';
import { Link } from 'react-router-dom';
import ArticleHeader from 'components/article/ArticleHeader';
import PersonInput, { EMPTY_PERSON as EMPTY } from 'components/fortune/PersonInput';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import {
  DISCLAIMER, decodeCompatFragment, encodeCompatFragment, fortuneApi, parseDateString, zodiacOf,
} from 'util/fortune';
import styles from './Compat.module.scss';

function ScoreRing({ score }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(score));
    return () => cancelAnimationFrame(id);
  }, [score]);
  // Literal colours as SVG attributes: the image export does not carry CSS
  // classes or variables into SVG children.
  const css = getComputedStyle(document.documentElement);
  const brand = css.getPropertyValue('--brand').trim() || '#ea580c';
  const track = css.getPropertyValue('--surface-3').trim() || '#ebe6df';
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className={styles.ring} role="img" aria-label={`${score} trên 10 điểm`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke={track} strokeWidth="10" />
        <circle
          className={styles.ringValue}
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={brand}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 10)}
        />
      </svg>
      <div className={styles.ringText}>
        <strong>{score}</strong>
        <span>/10</span>
      </div>
    </div>
  );
}

function PersonBadge({ person }) {
  const z = zodiacOf(person.yearName.split(' ')[1]);
  return (
    <div className={styles.badge}>
      <span className={styles.emoji} aria-hidden>{z.emoji}</span>
      <strong>{person.name}</strong>
      <span>{person.yearName} · tuổi {z.name}</span>
      <span>Mệnh {person.napAm}</span>
      <span>Số chủ đạo {person.lifePath}</span>
    </div>
  );
}

export default function Compat() {
  const [a, setA] = useState(EMPTY);
  const [b, setB] = useState(EMPTY);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    setPageMeta({
      title: 'Xem tuổi hợp nhau',
      description: 'Hai bạn hợp nhau mấy điểm? Xem độ hợp theo con giáp, thiên can, mệnh và thần số học, kèm lời giải thích dễ hiểu.',
    });
    const shared = decodeCompatFragment(window.location.hash);
    if (shared) {
      setA(shared.a);
      setB(shared.b);
      check(shared.a, shared.b);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function check(pa = a, pb = b) {
    if (!parseDateString(pa.birthDate) || !parseDateString(pb.birthDate)) {
      toast.error('Vui lòng nhập ngày sinh của cả hai người');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fortuneApi.compat({ a: pa, b: pb });
      setResult(res);
      track('compat_checked', { score: res.score });
      window.history.replaceState(null, '', `#${encodeCompatFragment(pa, pb)}`);
      setTimeout(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyLink() {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Xem tuổi hợp nhau trên FollMe', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDownload() {
    if (!cardRef.current) {
      return;
    }
    setIsExporting(true);
    try {
      const { toPng } = await import('html-to-image');
      const background = getComputedStyle(document.body).backgroundColor;
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, backgroundColor: background, cacheBust: true });
      const link = document.createElement('a');
      link.download = `hop-tuoi-${result.score}-diem.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.log(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="container page">
      <ArticleHeader
        back={{ to: '/fortune', label: 'Thần số học & Tử vi' }}
        eyebrow="Xem tuổi"
        title="Hai bạn có hợp nhau không?"
        subtitle="Nhập ngày sinh của hai người để xem độ hợp theo con giáp, thiên can, mệnh và thần số học. Dùng cho người yêu, vợ chồng, bạn thân hay cả đồng nghiệp."
      />

      <form
        className={styles.form}
        onSubmit={e => {
          e.preventDefault();
          check();
        }}
      >
        <PersonInput label="Bạn" value={a} onChange={setA} />
        <button
          type="button"
          className={styles.swap}
          aria-label="Đổi chỗ hai người"
          title="Đổi chỗ"
          onClick={() => {
            setA(b);
            setB(a);
          }}
        >
          <IoSwapHorizontal />
        </button>
        <PersonInput label="Người ấy" value={b} onChange={setB} />
        <div className={styles.submit}>
          <LoadingButton type="submit" variant="contained" size="large" loading={isLoading} startIcon={<IoHeart />}>
            Xem độ hợp
          </LoadingButton>
          <span className={styles.privacy}>Không cần đăng nhập, không lưu thông tin.</span>
        </div>
      </form>

      {result && (
        <section className={styles.result}>
          <div ref={cardRef} className={styles.card}>
            <div className={styles.pair}>
              <PersonBadge person={result.people[0]} />
              <ScoreRing score={result.score} />
              <PersonBadge person={result.people[1]} />
            </div>
            <div className={clsx(styles.label, result.score >= 7 && styles.labelGood)}>{result.label}</div>
            <p className={styles.summary}>{result.summary}</p>
            <div className={styles.brand}>follme · Xem tuổi hợp nhau</div>
          </div>

          <div className={styles.actions}>
            <Button variant="outlined" size="small" onClick={handleCopyLink} startIcon={isCopied ? <IoCheckmark /> : <IoLinkOutline />}>
              {isCopied ? 'Đã sao chép' : 'Gửi cho người ấy'}
            </Button>
            <Button variant="outlined" size="small" onClick={handleDownload} disabled={isExporting} startIcon={<IoImageOutline />}>
              {isExporting ? 'Đang tạo ảnh…' : 'Tải ảnh'}
            </Button>
            <Button
              variant="contained"
              size="small"
              component={Link}
              to="/cuoi-hoi/chon-ngay"
              state={{ groom: a, bride: b }}
              startIcon={<IoCalendarOutline />}
            >
              Chọn ngày cưới cho hai bạn
            </Button>
          </div>

          <h2 className={styles.h2}>Vì sao ra kết quả này?</h2>
          <ol className={styles.factors}>
            {result.factors.map(f => (
              <li key={f.id} className={styles.factor}>
                <div className={styles.factorHead}>
                  <h3>{f.title}</h3>
                  <span className={clsx(styles.points, f.points > 0 && styles.plus, f.points < 0 && styles.minus)}>
                    {f.points > 0 ? `+${f.points}` : f.points}
                  </span>
                </div>
                <p>{f.text}</p>
              </li>
            ))}
          </ol>

          <h2 className={styles.h2}>Gợi ý cho hai bạn</h2>
          <ul className={styles.tips}>
            {result.tips.map(tip => <li key={tip}>{tip}</li>)}
          </ul>

          <p className={styles.disclaimer}>
            Điểm bắt đầu từ 5 và được cộng trừ theo từng yếu tố ở trên. {DISCLAIMER}
          </p>
        </section>
      )}
    </div>
  );
}
