import { useState } from 'react';
import clsx from 'clsx';
import styles from './Money.module.scss';

const FLOAT = 5;

/**
 * Design A (same bank, settle per transaction) next to design B (cross-bank,
 * prefund + netting): pay users a few times and count what reconciliation
 * has to explain on each side.
 */
export default function SettlementDesigns() {
  const [payouts, setPayouts] = useState([]);
  const [netted, setNetted] = useState(0);
  const [runs, setRuns] = useState(0);
  const pending = payouts.length - netted;
  const floatLeft = FLOAT - pending;

  function pay() {
    if (floatLeft <= 0) return;
    setPayouts(p => [...p, p.length + 1]);
  }

  function net() {
    setNetted(payouts.length);
    setRuns(r => r + 1);
  }

  function reset() {
    setPayouts([]);
    setNetted(0);
    setRuns(0);
  }

  return (
    <div className={styles.designs}>
      <div className={styles.designActions}>
        <button type="button" className={styles.primaryBtn} onClick={pay} disabled={floatLeft <= 0}>Trả user 1M</button>
        <button type="button" onClick={net} disabled={pending === 0}>Chạy netting cuối ngày</button>
        <button type="button" onClick={reset} disabled={payouts.length === 0}>Làm lại</button>
      </div>

      <div className={styles.designGrid}>
        <section className={styles.design}>
          <header><code>A</code><div><strong>Cùng bank</strong><span>settle từng giao dịch</span></div></header>
          <ul className={styles.pairs}>
            {payouts.map(n => (
              <li key={n} className={styles.pairIn}>
                <span className={styles.ledgerRow}>ledger #{n} −1M</span>
                <i aria-hidden="true">⇄</i>
                <span className={styles.bankRow}>bank #{n} −1M</span>
              </li>
            ))}
            {payouts.length === 0 && <li className={styles.emptyRow}>Chưa có payout nào.</li>}
          </ul>
          <footer>
            <span><b>{payouts.length}</b> lệnh bank</span>
            <span><b>{payouts.length}</b> cặp 1:1 cần reconcile</span>
            <span>Float: <b>không cần</b></span>
          </footer>
        </section>

        <section className={styles.design}>
          <header><code>B</code><div><strong>Khác bank</strong><span>prefund + netting</span></div></header>
          <div className={styles.float}>
            <span>Float trong pocket</span>
            <div className={styles.floatBar}><i style={{ width: `${(floatLeft / FLOAT) * 100}%` }} /></div>
            <b>{floatLeft}M / {FLOAT}M</b>
          </div>
          <ul className={styles.pairs}>
            {payouts.map(n => (
              <li key={n} className={clsx(styles.pairIn, n <= netted && styles.settled)}>
                <span className={styles.ledgerRow}>ledger #{n} −1M</span>
                <i aria-hidden="true">{n <= netted ? '✓' : '…'}</i>
                <span className={styles.bankRow}>{n <= netted ? 'đã net' : 'trả từ float'}</span>
              </li>
            ))}
            {payouts.length === 0 && <li className={styles.emptyRow}>Chưa có payout nào.</li>}
          </ul>
          {netted > 0 && (
            <div className={styles.netTransfer}>Lệnh net gần nhất: partner nạp lại cho đủ float, và {netted} dòng ledger phải giải thích được tổng các lệnh net</div>
          )}
          <footer>
            <span><b>{runs}</b> lệnh bank</span>
            <span><b>{netted}</b> dòng ledger đã dồn vào {runs > 1 ? 'các lệnh net' : 'lệnh net'}</span>
            <span>Float: <b>{floatLeft <= 0 ? 'hết, phải đợi partner push' : 'đang dùng'}</b></span>
          </footer>
        </section>
      </div>
    </div>
  );
}
