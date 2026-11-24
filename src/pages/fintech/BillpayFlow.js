import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import FlowPlayer from 'components/fintech/FlowPlayer';
import FlowTabs from 'components/fintech/FlowTabs';
import StateMachineView from 'components/fintech/StateMachineView';
import ArticleContext from 'components/fintech/ArticleContext';
import { BILLPAY_CONTEXT } from 'fintech/context';
import {
  BILLPAY_FLOWS, BILLPAY_RULES, CHECKLIST, CLAIM_SQL, RECON_STEPS, TABLES_SQL,
} from 'fintech/billpay';
import { setPageMeta } from 'util/meta';
import styles from './Fintech.module.scss';

const SECTIONS = [
  ['buc-tranh', 'Bức tranh chung'],
  ['tung-buoc', 'Từng bước'],
  ['state-machine', 'State machine'],
  ['quy-tac', 'Quy tắc'],
  ['push-pull', 'Push + pull'],
  ['reconciliation', 'Reconciliation'],
  ['checklist', 'Checklist'],
];

const ROLES = [
  { name: 'Team service', body: 'Orchestrator. Giữ transaction và status của nó.' },
  { name: 'Core', body: 'Giữ payment/wallet và cả payment screen dùng chung. Bước trả tiền thì app nói chuyện thẳng với Core.' },
  { name: 'Partner', body: 'Lo phần sản phẩm, ví dụ gạch nợ hoá đơn. Core không gọi partner, partner cũng không gọi Core.' },
  { name: 'Kafka', body: 'Kênh để Core báo cho team service là payment đã xong, vì team service không ngồi trong luồng trả tiền.' },
];

export default function BillpayFlow() {
  const [params, setParams] = useSearchParams();
  const flowKey = params.get('core') === 'debit' ? 'debit' : 'hold';
  const flow = BILLPAY_FLOWS[flowKey];
  const smRef = useRef(null);
  const smSection = useRef(null);

  useEffect(() => {
    setPageMeta({
      title: 'Billpay: trả hoá đơn trong ví hoạt động thế nào',
      description: 'Pattern cho mọi feature mà một team service điều phối payment và fulfillment: payment session, payment screen của Core, Kafka outbox, partner, hold/commit hay debit/refund, và reconciliation.',
    });
  }, []);

  function setFlow(key) {
    const next = new URLSearchParams(params);
    if (key === 'hold') next.delete('core'); else next.set('core', key);
    setParams(next, { replace: true });
  }

  function showStatus(id) {
    smRef.current?.select(id);
    smSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <>
      <ReadingProgress />
      <div className={`container page ${styles.page}`}>
        <ArticleHeader
          back={{ to: '/fintech', label: 'Kiến thức fintech' }}
          eyebrow="Fintech · Billpay"
          title="Billpay: trả hoá đơn trong ví hoạt động thế nào"
          subtitle="Từ lúc bạn bấm Thanh toán tới lúc hoá đơn được gạch nợ có ba bên tham gia, và một khoảng mù đúng lúc tiền bị trừ. Bài này đi qua từng bước, và cách xử lý khi một bên im lặng hay báo lỗi."
          meta={['Sequence', 'State machine', 'Reconciliation']}
        />

        <ArticleContext {...BILLPAY_CONTEXT} />

        <p className={styles.prereq}>
          Nên đọc trước: <Link to="/fintech/money-movement">Money movement</Link>, về hai layer ledger và bank, safeguarding account và settlement topology.
        </p>

        <nav className={styles.toc} aria-label="Mục lục">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <section id="buc-tranh" className={styles.section}>
          <h2>Bức tranh chung</h2>
          <div className={styles.prose}>
            <p>
              Có ba pha. Đầu tiên team service nhờ Core tạo một payment session, lúc này chưa có tiền nào đi. Sau đó user tự
              trả ở payment screen của Core. Cuối cùng team service biết được kết quả và gọi partner để gạch nợ.
            </p>
            <p>
              Khác với Savings Fund, billpay là fire-and-forget: trả xong hoá đơn là transaction kết thúc, không để lại position
              nào sống tiếp.
            </p>
          </div>
          <div className={styles.participants}>
            {ROLES.map(r => (
              <div key={r.name}><strong>{r.name}</strong><span>{r.body}</span></div>
            ))}
          </div>
          <p className={styles.callout}>
            Vì app trả tiền thẳng với Core, ngay lúc tiền di chuyển thì team service không hề hay biết. Mình lấp khoảng mù này
            giống như cách lấp khoảng trống phía partner: push để nhanh, pull để chắc. Push là event Kafka từ Core, pull là
            reconciliation tự đi hỏi.
          </p>
        </section>

        <div className={styles.flowBar}>
          <FlowTabs flows={BILLPAY_FLOWS} flowKey={flowKey} onChange={setFlow} label="Core hỗ trợ gì" />
          <p>{flow.summary}</p>
        </div>

        <section id="tung-buoc" className={styles.section}>
          <h2>Từng bước: {flow.title.toLowerCase()}</h2>
          <div className={styles.participants}>
            {flow.participants.map(p => (
              <div key={p.id}><strong>{p.label}</strong><span>{p.role}</span></div>
            ))}
          </div>
          <FlowPlayer flow={flow} onStatusClick={showStatus} />
          <p className={styles.hint}>Bấm vào một dòng trong sequence để nhảy tới bước đó, hoặc dùng phím ← →. Đổi tab Hold / Debit ở trên để thấy hai cách Core xử lý tiền khác nhau thế nào.</p>
        </section>

        <section id="state-machine" ref={smSection} className={styles.section}>
          <h2>State machine</h2>
          <div className={styles.prose}>
            <p>
              Chỉ có năm status, và status do team service giữ, đi theo response và event từ Core và partner. Client gửi gì
              lên cũng không làm status đổi.
            </p>
            <p>
              Mũi tên <code>failed → pending_payment</code> là user tự retry. Nó chỉ chạy lại bước tạo session từ đầu, y như lần đầu tiên.
            </p>
          </div>
          <StateMachineView ref={smRef} flow={flow} />
        </section>

        <section id="quy-tac" className={styles.section}>
          <h2>Mấy quy tắc không được phá</h2>
          <div className={styles.invariants}>
            {BILLPAY_RULES.map(r => (
              <div key={r.id}>
                <code>{r.id}</code>
                <strong>{r.title}</strong>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
          <h3>Hold hay debit?</h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Core hỗ trợ</th><th>Partner ok</th><th>Partner fail</th><th>Lưu ý</th></tr></thead>
              <tbody>
                <tr><td><strong>hold</strong></td><td>commit</td><td>rollback</td><td>Fail thì chỉ cần nhả hold, không phát sinh giao dịch mới.</td></tr>
                <tr><td><strong>chỉ debit</strong></td><td>no-op</td><td>refund</td><td>Refund là một external call, nên cũng cần idempotency key và retry như mọi call khác.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="push-pull" className={styles.section}>
          <h2>Core báo về cho team service: push + pull</h2>
          <ol className={styles.layers}>
            <li>
              <span className={styles.layerNo}>1</span>
              <div>
                <strong>Push qua Kafka, có outbox</strong>
                <p>Core ghi event "payment completed" vào bảng outbox trong cùng DB transaction với lệnh hold/debit, rồi một publisher riêng đẩy lên Kafka. Nhờ vậy publish có lỗi một lúc thì event cũng không mất.</p>
              </div>
            </li>
            <li>
              <span className={styles.layerNo}>2</span>
              <div>
                <strong>Consumer idempotent</strong>
                <p>Kafka giao at-least-once. Team service phải upsert status theo session/transaction ref, không được apply lại event một cách mù quáng.</p>
              </div>
            </li>
            <li>
              <span className={styles.layerNo}>3</span>
              <div>
                <strong>Pull bằng reconciliation</strong>
                <p>Cùng job reconciliation dùng cho partner cũng hỏi API get payment status của Core, cho những transaction kẹt ở <code>pending_payment</code> hay <code>partner_processing</code> quá timeout mà chưa thấy event nào.</p>
              </div>
            </li>
          </ol>
        </section>

        <section id="reconciliation" className={styles.section}>
          <h2>Reconciliation khi event bị mất</h2>
          <div className={styles.prose}>
            <p>
              Mình tách làm hai bảng: <code>transactions</code> là source of truth cho status, còn <code>retry_jobs</code> giữ
              trạng thái retry riêng, unique trên <code>(tx_id, job_type)</code>. Một scheduler sinh việc, nhiều worker làm việc.
            </p>
          </div>
          <ol className={styles.layers}>
            {RECON_STEPS.map((r, i) => (
              <li key={r.layer}>
                <span className={styles.layerNo}>{i + 1}</span>
                <div><strong>{r.layer}</strong><p>{r.covers}</p></div>
              </li>
            ))}
          </ol>
          <div className={styles.codeGrid}>
            <figure>
              <figcaption><code>SKIP LOCKED</code>: lock sẵn có của Postgres, đủ dùng</figcaption>
              <pre><code>{CLAIM_SQL}</code></pre>
            </figure>
            <figure>
              <figcaption>Unique constraint và partial index</figcaption>
              <pre><code>{TABLES_SQL}</code></pre>
            </figure>
          </div>
          <p className={styles.callout}>
            Partial index chỉ chứa các transaction chưa kết thúc, nên nó luôn nhỏ, vì phần lớn transaction kết thúc rất nhanh.
            Khi bảng <code>transactions</code> tiến tới khoảng 50–100 triệu row thì mới tính chuyện partition (đo volume thật trước đã),
            và chuyển dữ liệu ngoài hot window sang cold storage như BigQuery hay Parquet. Quy định lưu trữ không bắt dữ liệu cũ phải nằm trong DB production.
          </p>
        </section>

        <section id="checklist" className={styles.section}>
          <h2>Checklist khi dùng lại pattern</h2>
          <ul className={styles.checklist}>
            {CHECKLIST.map(item => (
              <li key={item}>
                <label>
                  <input type="checkbox" />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        <p className={styles.disclaimer}>
          Đây là pattern tổng quát mình rút ra từ các feature thật trên ví. Tên hệ thống, partner và chi tiết triển khai nội bộ đã được bỏ đi.
        </p>
      </div>
    </>
  );
}
