import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import FlowPlayer from 'components/fintech/FlowPlayer';
import StateMachineView from 'components/fintech/StateMachineView';
import FlowTabs from 'components/fintech/FlowTabs';
import ArticleContext from 'components/fintech/ArticleContext';
import { SAVINGS_FUND_CONTEXT } from 'fintech/context';
import {
  CAS_SQL, DECISIONS, FLOWS, INSERT_SQL, INVARIANTS, RECOVERY,
} from 'fintech/savingsFund';
import { setPageMeta } from 'util/meta';
import styles from './Fintech.module.scss';

const SECTIONS = [
  ['buc-tranh', 'Bức tranh chung'],
  ['tung-buoc', 'Từng bước'],
  ['machine-state', 'State machine'],
  ['khi-co-loi', 'Khi có lỗi'],
  ['invariants', 'Invariants'],
  ['quyet-dinh', 'Decisions'],
  ['idempotency', 'Idempotency'],
  ['recovery', 'Recovery'],
];

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
      title: 'Gửi tiết kiệm sinh lời trong ví: flow nộp và rút, từng bước',
      description: 'Luồng nộp và rút tiền giữa ví điện tử và quỹ của partner: sequence chạy từng bước, tiền nằm ở đâu, state machine, compensation, idempotency và recovery.',
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
          title="Gửi tiết kiệm sinh lời trong ví: flow nộp và rút"
          subtitle="Tiền của bạn đi đâu khi bấm Gửi tiết kiệm, và mình thiết kế flow thế nào để không bên nào làm mất tiền. Ở từng phần, bấm Chạy để xem ai gọi ai, order sang state nào, và 100k đang nằm ở đâu."
          meta={['Sequence', 'State machine', 'Saga']}
        />

        <ArticleContext {...SAVINGS_FUND_CONTEXT} />

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
              Điều đầu tiên cần nhớ: partner là source of truth cho số dư và lãi. Service của mình chỉ là orchestrator,
              không phải ledger. Nó không tự tính lãi, cũng không cộng các order lại để ra số dư, mà hỏi thẳng partner mỗi lần cần.
            </p>
            <p>
              Khác với trả hoá đơn, trả xong là xong, ở đây mỗi lần nộp thành công để lại một position sống rất lâu.
              Lãi chạy mỗi ngày dù user có mở app hay không.
            </p>
          </div>

          <div className={styles.concepts}>
            <div><span>Money movement</span><strong>ví + bank rails</strong><em>vài giây</em></div>
            <div><span>Order: một lần thử di chuyển tiền</span><strong>service của mình</strong><em>có lúc kết thúc</em></div>
            <div><span>Position: units + lãi</span><strong>partner</strong><em>còn mãi, đổi mỗi ngày</em></div>
          </div>

          <h3>Pocket chỉ là pass-through</h3>
          <div className={styles.prose}>
            <p>
              Trên ví, partner được đăng ký như một merchant bình thường: có một pocket (merchant wallet trên ledger) và một
              tài khoản bank liên kết. Mỗi giao dịch phía ví đi cặp 1:1 với một lệnh bank thật, chỉ cách nhau vài giây,
              vì hai tài khoản cùng bank và settlement chạy theo từng giao dịch. Tiền không nằm lại trong pocket.
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
            Cái tên dễ làm mình nhầm nhất: cash-in và cash-out được đặt theo góc nhìn của pocket, không phải của user.
            User nộp tiền thì sinh ra một lệnh merchant cash-out (pocket → bank partner), còn user rút thì sinh ra một lệnh
            merchant cash-in. Cũng không ai phải ứng liquidity: khi rút, bank của partner chuyển tiền trước, pocket chỉ được
            credit khi bank xác nhận đã nhận tiền, rồi mới tới user. Tiền trong safeguarding account không bao giờ bị dùng
            để trả thay cho partner.
          </p>
        </section>

        <div className={styles.flowBar}>
          <FlowTabs flows={FLOWS} flowKey={flowKey} onChange={setFlow} />
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
          <p className={styles.hint}>Bấm vào một dòng trong sequence để nhảy tới bước đó, hoặc dùng phím ← →. Bấm vào status để xem nó nằm ở đâu trong state machine.</p>
        </section>

        <section id="machine-state" ref={smSection} className={styles.section}>
          <h2>State machine</h2>
          <div className={styles.prose}>
            <p>
              Chọn một scenario rồi bấm Chạy, token sẽ đi theo từng transition và các state đã qua sáng lên. Bấm vào một state
              để xem lúc đó điều gì đang đúng, tiền đang ở đâu, và hết deadline thì worker làm gì.
            </p>
            <p>
              Một điều mình thấy quan trọng: stuck là một flag, không phải một status. Hết retry thì order vẫn giữ status thật
              của nó, chỉ bật <code>needs_manual</code> kèm <code>manual_reason</code>. Nhìn vào là biết nó kẹt ở đâu.
            </p>
          </div>
          <StateMachineView ref={smRef} flow={flow} />

          <div className={styles.rules}>
            <h3>Cách mình đặt tên status</h3>
            <ol>
              <li>Status là một điều đang đúng, không phải một hành động. Viết <code>WALLET_DEBITED</code>, đừng viết <code>DEBITING</code>.</li>
              <li>Theo pattern <code>&lt;COMPONENT&gt;_&lt;PAST VERB&gt;</code>. Terminal state chỉ một từ.</li>
              <li>Chỉ dùng <code>_REQUESTED</code> khi kết quả về async, qua event hay callback.</li>
              <li>Tên nói chuyện gì đã xảy ra. Còn bước tiếp theo là gì thì để registry trả lời.</li>
            </ol>
          </div>
        </section>

        <section id="khi-co-loi" className={styles.section}>
          <h2>Khi có lỗi: hai source of truth</h2>
          <div className={styles.truths}>
            <div><span>Tiền đã thật sự rời đi chưa?</span><strong>Bank</strong></div>
            <div><span>Units đã chốt chưa?</span><strong>Partner</strong></div>
          </div>

          {flowKey === 'deposit' ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Partner báo ERROR…</th><th>Làm gì</th></tr></thead>
                  <tbody>
                    <tr><td>trước payout, hoặc payout đã fail</td><td>compensate: cancel partner rồi refund</td></tr>
                    <tr><td>sau khi payout thành công</td><td><code>DISPUTED</code>: chờ partner phát hành units hoặc trả tiền về; tiền về rồi mới refund user</td></tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.callout}>
                Câu mình luôn tự nhắc: never refund money you can't prove you still have. Compensation chỉ chạy khi payout fail
                dứt khoát, do worker của mình điều khiển, và mỗi bước đều idempotent theo <code>order_ref</code>. Alert cũng tách
                riêng từng bước, vì cancel bị kẹt là chuyện của partner, còn refund bị kẹt là chuyện của wallet core. Hai owner khác nhau.
              </p>
            </>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead><tr><th>Partner nói</th><th>Bank nói</th><th>Làm gì</th><th>User thấy</th></tr></thead>
                  <tbody>
                    <tr><td>sent</td><td>đã tới, đúng số</td><td>cash-in → credit → <code>COMPLETED</code></td><td>✅ thành công</td></tr>
                    <tr><td>sent</td><td>chưa thấy</td><td>check lại, có backoff</td><td>⏳ đang xử lý</td></tr>
                    <tr><td>sent</td><td>tới deadline vẫn không thấy / lệch số</td><td><code>DISPUTED</code></td><td>⏳ đang xử lý</td></tr>
                    <tr><td>failed</td><td>không check</td><td><code>FAILED</code></td><td>❌ thất bại</td></tr>
                    <tr><td>im lặng</td><td>–</td><td>inquiry, không bao giờ tự fail</td><td>⏳ đang xử lý</td></tr>
                  </tbody>
                </table>
              </div>
              <p className={styles.callout}>
                Luồng rút không cần compensation. Bên mình không động vào tiền cho tới khi bank xác nhận tiền đã tới, nên mọi lỗi
                trước bước cash-in chỉ cần đóng wallet order là xong. Từ cash-in trở đi, mọi bước đều là của mình và retry được.
                Còn trường hợp partner báo "failed" mà tiền vẫn tới thì để reconciliation bắt, order flow không lo phần đó.
              </p>
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
          <h2>Các decision và lý do</h2>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>Câu hỏi</th><th>Options</th><th>Chọn</th><th>Vì sao</th></tr></thead>
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
              Quy tắc gói gọn trong một câu: bên nhận dedup, bên gửi thì retry bao nhiêu lần cũng gửi lại đúng key cũ.
            </p>
            <p>
              Key là <code>order_ref</code> (UUIDv7), sinh ngay lúc INSERT nên có trước mọi call và đi theo order tới cuối.
              ID của các bên khác chỉ lưu làm reference. Dedup không bao giờ dựa vào header. Thao tác nào tạo ra một giao dịch mới,
              như refund hay cash-in, thì có key riêng: <code>refund-{'{order_ref}'}</code>, <code>cashin-{'{order_ref}'}</code>.
            </p>
          </div>
          <div className={styles.codeGrid}>
            <figure>
              <figcaption>Trùng <code>request_id</code> thì reject luôn, không gọi wallet</figcaption>
              <pre><code>{INSERT_SQL}</code></pre>
            </figure>
            <figure>
              <figcaption>Mọi transition đều là một compare-and-set</figcaption>
              <pre><code>{CAS_SQL}</code></pre>
            </figure>
          </div>
          <div className={styles.prose}>
            <p>
              Khi CAS trả về 0 row, mình nhìn status hiện tại. Nếu nó đã là kết quả của event đó, hoặc đi xa hơn rồi, thì đây là
              duplicate: bỏ qua và log. Nếu nó là kết quả ngược lại thì là contradiction: không transition, bắn alert. Với callback,
              chỉ reply success sau khi transition đã commit.
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
            Mình không hứa "xử lý xong trong X phút". Cái mình hứa là không ai phát hiện ra một order bị kẹt một cách tình cờ.
            Retry budget kéo dài cả tiếng để sống sót qua sự cố, deadline sau bước debit thì để ngắn. Ngoài ra luôn có alert trên
            tuổi của order non-terminal lâu nhất: nếu chính worker chết thì không order nào bị flag, nhưng con số này sẽ cứ tăng.
          </p>
        </section>

        <p className={styles.disclaimer}>
          Đây là pattern tổng quát mình rút ra từ một hệ thống thật. Tên hệ thống, partner và chi tiết triển khai nội bộ đã được bỏ đi.
        </p>
      </div>
    </>
  );
}
