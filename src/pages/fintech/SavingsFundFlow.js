import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import FlowPlayer from 'components/fintech/FlowPlayer';
import StateMachineView from 'components/fintech/StateMachineView';
import {
  CAS_SQL, DECISIONS, FLOWS, INSERT_SQL, INVARIANTS, RECOVERY,
} from 'fintech/savingsFund';
import { setPageMeta } from 'util/meta';
import styles from './Fintech.module.scss';

const SECTIONS = [
  ['buc-tranh', 'Bức tranh'],
  ['tung-buoc', 'Từng bước'],
  ['machine-state', 'Machine state'],
  ['khi-co-loi', 'Khi có lỗi'],
  ['invariants', 'Invariants'],
  ['quyet-dinh', 'Quyết định'],
  ['idempotency', 'Idempotency'],
  ['recovery', 'Recovery'],
];

function FlowTabs({ flowKey, onChange }) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Chọn luồng">
      {Object.values(FLOWS).map(f => (
        <button
          key={f.key}
          type="button"
          role="tab"
          aria-selected={f.key === flowKey}
          className={clsx(f.key === flowKey && styles.tabOn)}
          onClick={() => onChange(f.key)}
        >
          <strong>{f.short}</strong>
          <span>{f.title}</span>
        </button>
      ))}
    </div>
  );
}

/** Three hops of the pass-through pocket, with dots running along them. */
function PocketStrip({ hops }) {
  return (
    <div className={styles.strip}>
      {hops.map((h, i) => (
        <div key={h} className={styles.stripPart}>
          <span className={styles.stripNode}>{h}</span>
          {i < hops.length - 1 && <span className={styles.stripArrow} aria-hidden="true"><i /><i /><i /></span>}
        </div>
      ))}
    </div>
  );
}

export default function SavingsFundFlow() {
  const [params, setParams] = useSearchParams();
  const flowKey = params.get('flow') === 'withdraw' ? 'withdraw' : 'deposit';
  const flow = FLOWS[flowKey];
  const smRef = useRef(null);
  const smSection = useRef(null);

  useEffect(() => {
    setPageMeta({
      title: 'Nộp & rút tiền vào quỹ tiết kiệm: từng bước và machine state',
      description: 'Luồng nộp và rút tiền giữa ví điện tử và quỹ của partner: sequence chạy từng bước, tiền nằm ở đâu, machine state, compensation, idempotency và recovery.',
    });
  }, []);

  function setFlow(key) {
    const next = new URLSearchParams(params);
    if (key === 'deposit') next.delete('flow'); else next.set('flow', key);
    setParams(next, { replace: true });
  }

  function showStatus(id) {
    smRef.current?.select(id);
    smSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const decisions = DECISIONS.filter(d => d.flow === 'both' || d.flow === flowKey);

  return (
    <>
      <ReadingProgress />
      <div className={`container page ${styles.page}`}>
        <ArticleHeader
          back={{ to: '/fintech', label: 'Kiến thức fintech' }}
          eyebrow="Fintech · Savings fund"
          title="Nộp & rút tiền vào quỹ tiết kiệm"
          subtitle="User gửi tiền từ ví sang một quỹ do partner quản lý để hưởng lãi, rồi rút về. Ví điều phối, partner giữ tiền và lãi. Bấm Chạy để xem từng bước: ai gọi ai, order sang state nào, và 100k đang nằm ở đâu."
          meta={['Sequence', 'State machine', 'Saga']}
        />

        <nav className={styles.toc} aria-label="Mục lục">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <section id="buc-tranh" className={styles.section}>
          <h2>Bức tranh</h2>
          <div className={styles.prose}>
            <p>
              <strong>Partner là nguồn sự thật về số dư và lãi.</strong> Service của mình là orchestrator, không phải ledger:
              không tự tính lãi, không cộng các order của mình để ra số dư, mà hỏi partner trực tiếp. Khác với trả hoá đơn
              (trả xong là hết), mỗi lần nộp thành công để lại một vị thế sống lâu, tự thay đổi mỗi ngày vì lãi.
            </p>
          </div>

          <div className={styles.concepts}>
            <div><span>Money movement</span><strong>ví + bank rails</strong><em>vài giây</em></div>
            <div><span>Order: một lần thử di chuyển tiền</span><strong>service của mình</strong><em>có kết thúc</em></div>
            <div><span>Position: units + lãi</span><strong>partner</strong><em>vĩnh viễn, đổi mỗi ngày</em></div>
          </div>

          <h3>Pocket là trạm trung chuyển, không phải két</h3>
          <div className={styles.prose}>
            <p>
              Partner được đăng ký như một merchant bình thường trên ví, có pocket (merchant wallet trên ledger) và một tài khoản
              bank liên kết. Mỗi giao dịch phía ví đi cặp 1:1 với một lệnh bank thật trong vài giây (cùng bank, settle từng giao dịch).
            </p>
          </div>
          <div className={styles.strips}>
            <div>
              <span className={styles.stripTitle}>Nộp</span>
              <PocketStrip hops={['Ví user', 'Pocket partner', 'Bank partner']} />
            </div>
            <div>
              <span className={styles.stripTitle}>Rút</span>
              <PocketStrip hops={['Bank partner', 'Pocket partner', 'Ví user']} />
            </div>
          </div>
          <p className={styles.callout}>
            <strong>Bẫy tên gọi:</strong> cash-in / cash-out được viết theo góc nhìn của <em>pocket</em>, không phải của user.
            User <em>nộp</em> sinh ra một lệnh merchant <em>cash-out</em> (pocket → bank partner); user <em>rút</em> sinh ra
            một lệnh merchant <em>cash-in</em>. Và không ai ứng thanh khoản: khi rút, bank của partner chuyển tiền trước,
            pocket chỉ được ghi có khi bank đã xác nhận, rồi mới tới user. Tiền trong tài khoản safeguarding không bao giờ
            bị dùng để trả thay cho partner.
          </p>
        </section>

        <div className={styles.flowBar}>
          <FlowTabs flowKey={flowKey} onChange={setFlow} />
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
          <p className={styles.hint}>Bấm vào một dòng trong sequence để nhảy tới bước đó, hoặc dùng phím ← →. Bấm vào status để xem nó trong machine state.</p>
        </section>

        <section id="machine-state" ref={smSection} className={styles.section}>
          <h2>Machine state</h2>
          <div className={styles.prose}>
            <p>
              Chọn một kịch bản rồi bấm Chạy: token đi theo từng transition, các state đã qua sáng lên. Bấm vào một state để
              xem điều gì đang đúng, tiền đang ở đâu, và khi hết deadline thì worker làm gì. <strong>Stuck là một flag, không phải
              một status</strong>: hết retry thì order giữ status thật, set <code>needs_manual</code> và <code>manual_reason</code>.
            </p>
          </div>
          <StateMachineView ref={smRef} flow={flow} />

          <div className={styles.rules}>
            <h3>Luật đặt tên status</h3>
            <ol>
              <li><strong>Status là một sự thật đang đúng</strong>, không phải hành động: <code>WALLET_DEBITED</code>, không bao giờ <code>DEBITING</code>.</li>
              <li>Pattern <code>&lt;COMPONENT&gt;_&lt;PAST VERB&gt;</code>. State kết thúc chỉ một từ.</li>
              <li><code>_REQUESTED</code> chỉ dùng khi kết quả về bất đồng bộ (event, callback).</li>
              <li>Tên nói điều đã xảy ra; registry nói điều xảy ra tiếp theo.</li>
            </ol>
          </div>
        </section>

        <section id="khi-co-loi" className={styles.section}>
          <h2>Khi có lỗi: hai nguồn sự thật</h2>
          <div className={styles.truths}>
            <div><span>Tiền mặt đã rời đi chưa?</span><strong>Bank</strong></div>
            <div><span>Units đã chốt chưa?</span><strong>Partner</strong></div>
          </div>

          {flowKey === 'deposit' ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Partner báo ERROR…</th><th>Làm gì</th></tr></thead>
                  <tbody>
                    <tr><td>trước payout, hoặc payout đã fail</td><td>compensate: cancel partner → refund</td></tr>
                    <tr><td>sau khi payout thành công</td><td><code>DISPUTED</code>: partner phát hành units hoặc trả tiền về; chỉ refund user khi tiền đã về</td></tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.callout}><strong>Never refund money you can't prove you still have.</strong> Compensation chỉ chạy khi payout fail <em>dứt khoát</em>, do worker của mình điều khiển, mỗi bước idempotent theo <code>order_ref</code>, alert riêng từng bước vì cancel kẹt (partner) và refund kẹt (wallet core) có owner khác nhau.</p>
            </>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Partner nói</th><th>Bank nói</th><th>Làm gì</th><th>User thấy</th></tr></thead>
                  <tbody>
                    <tr><td>sent</td><td>đã tới, đúng số</td><td>cash-in → credit → <code>COMPLETED</code></td><td>✅ thành công</td></tr>
                    <tr><td>sent</td><td>chưa thấy</td><td>re-check có backoff</td><td>⏳ đang xử lý</td></tr>
                    <tr><td>sent</td><td>không thấy tới deadline / lệch số</td><td><code>DISPUTED</code></td><td>⏳ đang xử lý</td></tr>
                    <tr><td>failed</td><td>không check</td><td><code>FAILED</code></td><td>❌ thất bại</td></tr>
                    <tr><td>không trả lời</td><td>–</td><td>inquiry, không bao giờ fail</td><td>⏳ đang xử lý</td></tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.callout}><strong>Không có chuỗi compensation.</strong> Bên mình không có gì di chuyển trước khi bank xác nhận tiền tới. Mọi lỗi trước bước cash-in kết thúc bằng việc đóng wallet order; sau đó mọi bước là của mình và retry được. Partner báo "failed" mà tiền lại tới thì reconciliation bắt, không phải order flow.</p>
            </>
          )}
        </section>

        <section id="invariants" className={styles.section}>
          <h2>Invariants</h2>
          <div className={styles.invariants}>
            {INVARIANTS.filter(i => flowKey === 'withdraw' || !i.id.startsWith('W')).map(i => (
              <div key={i.id}>
                <code>{i.id}</code>
                <strong>{i.title}</strong>
                <p>{i.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="quyet-dinh" className={styles.section}>
          <h2>Các quyết định và vì sao</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Câu hỏi</th><th>Các lựa chọn</th><th>Chọn</th><th>Vì sao</th></tr></thead>
              <tbody>
                {decisions.map(d => (
                  <tr key={d.topic}>
                    <td><strong>{d.topic}</strong></td>
                    <td className={styles.muted}>{d.options}</td>
                    <td><span className={styles.pick}>{d.pick}</span></td>
                    <td>{d.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section id="idempotency" className={styles.section}>
          <h2>Idempotency và compare-and-set</h2>
          <div className={styles.prose}>
            <p>
              <strong>Bên nhận dedup; bên gửi gửi lại đúng key cũ</strong> cho mọi lần retry của cùng một hiệu ứng. Key là
              <code>order_ref</code> (UUIDv7) sinh lúc INSERT, tồn tại trước mọi call và suốt đời order; ID của bên khác chỉ lưu
              làm reference. Dedup không bao giờ dựa vào header. Thao tác tạo mới (refund, cash-in) có key riêng:
              <code>refund-{'{order_ref}'}</code>, <code>cashin-{'{order_ref}'}</code>.
            </p>
          </div>
          <div className={styles.codeGrid}>
            <figure>
              <figcaption>Request trùng <code>request_id</code> bị từ chối, không gọi wallet</figcaption>
              <pre><code>{INSERT_SQL}</code></pre>
            </figure>
            <figure>
              <figcaption>Mọi transition là một compare-and-set</figcaption>
              <pre><code>{CAS_SQL}</code></pre>
            </figure>
          </div>
          <div className={styles.prose}>
            <p>
              CAS trả 0 row thì xem status hiện tại: đã là kết quả của event (hoặc xa hơn) → duplicate, bỏ qua và log; kết quả
              ngược lại → contradiction, không transition và alert. Reply success cho callback chỉ sau khi transition đã commit.
            </p>
          </div>
        </section>

        <section id="recovery" className={styles.section}>
          <h2>Recovery nhiều lớp</h2>
          <ol className={styles.layers}>
            {RECOVERY.map((r, i) => (
              <li key={r.layer}>
                <span className={styles.layerNo}>{i + 1}</span>
                <div><strong>{r.layer}</strong><p>{r.covers}</p></div>
              </li>
            ))}
          </ol>
          <p className={styles.callout}>
            Không hứa "xử lý xong trong X phút". Hứa: <strong>không ai phát hiện một order bị kẹt một cách tình cờ</strong>.
            Retry budget kéo dài hàng giờ để vượt qua sự cố, deadline ngắn sau bước debit, và alert trên
            <em> tuổi của order non-terminal lâu nhất</em>: worker chết thì không ai bị flag, nhưng con số đó cứ tăng.
          </p>
        </section>

        <p className={styles.disclaimer}>
          Đây là pattern tổng quát rút ra từ một hệ thống thật. Tên hệ thống, đối tác và chi tiết triển khai nội bộ đã được lược bỏ.
        </p>
      </div>
    </>
  );
}
