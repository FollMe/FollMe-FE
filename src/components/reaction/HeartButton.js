import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { IoHeart, IoHeartOutline } from 'react-icons/io5';
import RequestSignInDialog from 'components/dialog/RequestSignInDialog';
import { useUserInfo } from 'customHooks/useUserInfo';
import { handleCheckLoggedIn } from 'util/authHelper';
import { reactionApi } from 'util/reaction';
import styles from './HeartButton.module.scss';

const PARTICLES = 8;

/**
 * "Thả tim" button. Shows the count to everyone; logged-in users can toggle
 * their own heart (optimistically, rolled back if the server refuses).
 *
 * @param {string} postKey - e.g. blogPostKey(slug)
 * @param {'pill'|'large'} variant
 */
export default function HeartButton({ postKey, variant = 'pill', label }) {
  const [userInfo] = useUserInfo();
  const isLoggedIn = useMemo(() => handleCheckLoggedIn(userInfo.sessionExp), [userInfo]);
  const [count, setCount] = useState(null);
  const [reacted, setReacted] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [showSignIn, setShowSignIn] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    let isActive = true;
    load();

    async function load() {
      try {
        if (isLoggedIn) {
          const status = await reactionApi.status(postKey);
          if (isActive) {
            setCount(status?.count ?? 0);
            setReacted(Boolean(status?.reacted));
          }
          return;
        }
        const counts = await reactionApi.counts([postKey]);
        if (isActive) {
          setCount(counts[postKey] ?? 0);
          setReacted(false);
        }
      } catch (err) {
        console.log(err);
      }
    }

    return () => {
      isActive = false;
    };
  }, [postKey, isLoggedIn]);

  async function handleClick() {
    if (!isLoggedIn) {
      setShowSignIn(true);
      return;
    }
    if (pending.current) {
      return;
    }
    pending.current = true;
    const next = !reacted;
    const previous = { count, reacted };
    setReacted(next);
    setCount(c => Math.max(0, (c ?? 0) + (next ? 1 : -1)));
    if (next) {
      setBurstKey(k => k + 1);
    }
    try {
      const status = next ? await reactionApi.react(postKey) : await reactionApi.unreact(postKey);
      setCount(status?.count ?? 0);
      setReacted(Boolean(status?.reacted));
    } catch (err) {
      console.log(err);
      setCount(previous.count);
      setReacted(previous.reacted);
    } finally {
      pending.current = false;
    }
  }

  const countLabel = count === null ? '…' : count.toLocaleString('vi-VN');

  return (
    <>
      <button
        type="button"
        className={clsx(styles.button, styles[variant], reacted && styles.reacted)}
        onClick={handleClick}
        aria-pressed={reacted}
        aria-label={reacted ? 'Bỏ thả tim' : 'Thả tim'}
        title={reacted ? 'Bỏ thả tim' : 'Thả tim'}
      >
        <span className={styles.iconWrap}>
          {reacted ? <IoHeart className={styles.icon} /> : <IoHeartOutline className={styles.icon} />}
          {burstKey > 0 && (
            <span key={burstKey} className={styles.burst} aria-hidden>
              {Array.from({ length: PARTICLES }, (_, i) => (
                <span key={i} style={{ '--angle': `${(360 / PARTICLES) * i}deg` }} />
              ))}
            </span>
          )}
        </span>
        <span className={styles.count}>{countLabel}</span>
        {label && <span className={styles.label}>{label}</span>}
      </button>
      {showSignIn && <RequestSignInDialog open={true} setOpen={setShowSignIn} action="thả tim" />}
    </>
  );
}
