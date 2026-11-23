import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoArrowForward } from 'react-icons/io5';
import ArticleHeader from 'components/article/ArticleHeader';
import ReadingProgress from 'components/ReadingProgress';
import SafeguardingSim from 'components/fintech/SafeguardingSim';
import TopologyDemo from 'components/fintech/TopologyDemo';
import SettlementDesigns from 'components/fintech/SettlementDesigns';
import { setPageMeta } from 'util/meta';
import styles from './Fintech.module.scss';

const SECTIONS = [
  ['hai-layer', 'Hai layer'],
  ['safeguarding', 'Safeguarding'],
  ['topology', 'Cùng bank hay khác bank'],
  ['design', 'Design A vs B'],
  ['quy-tac', 'Quy tắc chung'],
];

const PAYOUT_CODE = `User gửi 1M vào dịch vụ của partner:
  ví user            −1M   ┐ liabilities không đổi,
  pocket partner     +1M   ┘ tiền chỉ đổi người giữ
  safeguarding acct:  không đổi

Payout sang bank của partner:
  pocket partner     −1M   ← liabilities giảm
  safeguarding acct  −1M   ← cash giảm`;

const RULES = [
  { id: '1', title: 'Timeout ≠ failure', body: 'Một money call bị timeout không chứng minh được là tiền chưa đi. Compensate ngay thì có thể trả tiền lại cho user đã được trả rồi. Cứ để ở trạng thái mơ hồ và resolve bằng inquiry.' },
  { id: '2', title: 'Push for speed, poll for guarantee', body: 'Webhook và event làm happy path chạy nhanh. Còn cái làm cho nó đúng là một reconciliation job đi poll. Đừng bao giờ chỉ dựa vào push.' },
  { id: '3', title: 'One source of truth per fact', body: 'Ai tính ra con số thì người đó sở hữu nó. Mirror lại thì được, còn tự tính lại cùng con số đó theo một cách khác là con đường ngắn nhất để ledger bị lệch.' },
];

export default function MoneyMovement() {
  useEffect(() => {
    setPageMeta({
      title: 'Money movement: tiền thật sự đi như thế nào trong một ví điện tử',
      description: 'Hai layer ledger và bank, safeguarding account theo Nghị định 52/2024, cùng bank hay khác bank, settle từng giao dịch hay prefund + netting. Có mô phỏng để bấm thử.',
    });
  }, []);

  return (
    <>
      <ReadingProgress />
      <div className={`container page ${styles.page}`}>
        <ArticleHeader
          back={{ to: '/fintech', label: 'Kiến thức fintech' }}
          eyebrow="Fintech · Nền tảng"
          title="Money movement: tiền thật sự đi như thế nào"
          subtitle="Mấy luật nền mà flow nào trong ví cũng phải theo, từ billpay, savings fund tới VietQR hay PayLater. Đọc bài này trước thì các bài flow sẽ dễ hiểu hơn nhiều."
          meta={['Ledger', 'Safeguarding', 'Settlement']}
        />

        <nav className={styles.toc} aria-label="Mục lục">
          {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
        </nav>

        <section id="hai-layer" className={styles.section}>
          <h2>Hai layer, đừng bao giờ nhầm</h2>
          <div className={styles.prose}>
            <p>
              Mỗi lần tiền di chuyển trong ví đều xảy ra trên hai layer, và hai layer này chạy với tốc độ khác nhau.
              Ledger là các row trong core của ví, gồm ví user và pocket của merchant, cập nhật tức thì. Bank là tiền thật
              trong tài khoản thật, mất từ vài giây tới cả ngày.
            </p>
            <p>
              Mình hay nhớ bằng một câu: <em>ledger entries are promises, bank transfers keep them</em>. User chỉ nhìn thấy ledger.
              Bank layer thì vô hình với họ và có thể chạy chậm hơn.
            </p>
            <p>
              Phần lớn những lần mình rối khi đọc một flow là do đọc một bước ledger như thể tiền thật đang đi, hoặc ngược lại.
              Nên với mỗi bước, hãy hỏi nó chạm vào layer nào. Có bước chạm cả hai cùng lúc.
            </p>
          </div>
          <div className={styles.truths}>
            <div><span>Ledger · lời hứa</span><strong>instant</strong></div>
            <div><span>Bank · tiền thật</span><strong>vài giây → 1 ngày</strong></div>
          </div>
        </section>

        <section id="safeguarding" className={styles.section}>
          <h2>Safeguarding account: luật trói mọi thứ</h2>
          <div className={styles.prose}>
            <p>
              Ví không sở hữu tiền của user. Ví chỉ giữ hộ, và phải luôn có đủ tiền mặt tương ứng nằm ở bank.
            </p>
            <p>
              Theo khoản 3 Điều 6 Nghị định 52/2024/NĐ-CP, tổng số dư trên tất cả tài khoản đảm bảo thanh toán của dịch vụ ví
              điện tử mở tại ngân hàng không được thấp hơn tổng số dư của tất cả ví điện tử đã phát hành cho khách hàng. Về bản
              chất thì không mới, Thông tư 23/2019 sửa Thông tư 39/2014 đã có rồi.
            </p>
            <p>
              Để ý là luật nói <strong>≥</strong> chứ không phải <strong>=</strong>. Bank thường cao hơn vì ba lý do: có buffer
              cố ý để một cú lệch thời gian không đẩy mình xuống dưới, có độ trễ (tiền nạp tới safeguarding account trước khi
              ví được credit), và phép so sánh tính tổng trên mọi tài khoản đảm bảo ở nhiều bank chứ không theo từng tài khoản.
            </p>
            <p>
              Chỉ có một chiều nguy hiểm. Cash thấp hơn liabilities là shortfall: tiền của user đã bị tiêu vào việc không được
              phép. Vì vậy tiền vận hành của chính công ty ví luôn nằm ở một tài khoản riêng. Trộn hai thứ này là cách một ví
              đi tới chỗ không trả nổi tiền rút.
            </p>
            <p>
              Một điều nữa: pocket của merchant cũng là một ví như ví user, nên nó cũng là liability và cũng phải được back bằng cash y như vậy.
            </p>
          </div>

          <h3>Bấm thử</h3>
          <SafeguardingSim />

          <div className={styles.codeGrid}>
            <figure>
              <figcaption>Payout sạch: hai bên đi cùng nhau</figcaption>
              <pre><code>{PAYOUT_CODE}</code></pre>
            </figure>
            <div className={styles.prose}>
              <p>
                <strong>Hệ quả cho design:</strong> lệnh trừ pocket và lệnh chuyển bank phải cùng thành công hoặc cùng thất bại.
                Pocket bị trừ mà bank fail thì liabilities giảm còn cash đứng yên. Ví bị over-collateralised một cách âm thầm,
                và ledger không còn giải thích được số dư bank.
              </p>
              <p>
                <strong>Hệ quả cho deal với partner:</strong> partner phải tự lo liquidity. Nếu ví lấy tiền từ safeguarding
                account để trả thay nghĩa vụ payout của partner, thì đó là cho bên thứ ba vay tiền của user, đúng thứ luật cấm.
              </p>
            </div>
          </div>
        </section>

        <section id="topology" className={styles.section}>
          <h2>Cùng bank hay khác bank?</h2>
          <div className={styles.prose}>
            <p>
              Câu đầu tiên nên hỏi trước mọi integration với partner: hai tài khoản bank nằm ở đâu? Nghe như chuyện của ops,
              nhưng nó quyết định tiền có thể đi theo từng giao dịch hay chỉ theo batch, kéo theo liquidity, payout tức thì và
              cả khối lượng reconciliation.
            </p>
            <p>
              Cùng bank thì một tổ chức chỉ đổi hai con số trong core của chính nó. Khác bank thì có bên thứ ba đứng giữa, và
              tiền thật sự rời một tổ chức trước khi tới tổ chức kia.
            </p>
          </div>
          <TopologyDemo />
          <div className={styles.tableWrap} style={{ marginTop: 16 }}>
            <table className={styles.table}>
              <thead><tr><th></th><th>Cùng bank</th><th>Khác bank</th></tr></thead>
              <tbody>
                <tr><td><strong>Tốc độ</strong></td><td>dưới một giây</td><td>vài giây (NAPAS) tới vài giờ (Citad)</td></tr>
                <tr><td><strong>Giờ chạy</strong></td><td>24/7</td><td>NAPAS 24/7; Citad có cut-off, nghỉ cuối tuần và lễ</td></tr>
                <tr><td><strong>Limit mỗi giao dịch</strong></td><td>gần như không</td><td>NAPAS có trần (tuỳ bank); vượt thì sang Citad</td></tr>
                <tr><td><strong>Phí</strong></td><td>gần như free</td><td>tính theo giao dịch, volume lớn là tiền thật</td></tr>
                <tr><td><strong>Reversal</strong></td><td>nhanh</td><td>làm claim, mất vài ngày, thủ công</td></tr>
                <tr><td><strong>Failure modes</strong></td><td>ít</td><td>timeout, bank đích sập, rail bảo trì</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="design" className={styles.section}>
          <h2>Hai design từ đó mà ra</h2>
          <div className={styles.prose}>
            <p>
              <strong>A · Cùng bank, settle từng giao dịch.</strong> Mỗi bước trên ledger đi cặp 1:1 với một lệnh bank thật,
              trong vài giây. Không có float để quản lý, không có gì để net, reconcile theo từng cặp.
            </p>
            <p>
              <strong>B · Khác bank, prefund + netting.</strong> Partner giữ sẵn một float trong pocket, đủ cho lượng payout dự
              kiến. User được trả ngay từ float. Mỗi ngày một hai lần, các luồng tiền được net lại và chỉ <em>một</em> lệnh chuyển
              để cân sổ. Bấm thử để thấy khác biệt:
            </p>
          </div>
          <SettlementDesigns />
          <div className={styles.prose} style={{ marginTop: 20 }}>
            <p>Rơi vào design B thì có ba hệ quả.</p>
            <p>
              Một, cái vùng mơ hồ ở giữa trở thành chuyện hằng ngày. Cùng bank thì lệnh chuyển hoặc đã xảy ra hoặc chưa, core của
              bank lo atomic. Khác bank thì có hẳn một trạng thái tiền đã rời A mà chưa tới B, và call timeout không có câu trả lời.
              Timeout ≠ failure đúng ở cả hai thế giới, nhưng ở design B nó là chuyện của một ngày thứ Ba bình thường, và inquiry
              cron từ chỗ là lưới an toàn trở thành thứ gánh cả hệ thống.
            </p>
            <p>
              Hai, push hay pull. Tiền đi <em>ra</em> thì sao cũng được, ví tự điều khiển. Tiền đi <em>vào</em> để nạp lại pocket
              thì không: khác bank thường không pull được, nên partner phải push và họ quyết định lúc nào nạp. Không nạp đồng bộ
              được thì mọi lời hứa payout tức thì cũng mất theo.
            </p>
            <p>
              Ba, reconciliation phình ra. Settle từng giao dịch cho mình các cặp 1:1. Netting cho mình một lệnh tổng mà hàng trăm
              dòng ledger phải giải thích được, cộng thêm một float cứ trôi dần.
            </p>
          </div>
          <p className={styles.callout}>
            Câu để mang theo: cùng bank mới cho mình quyền settle từng giao dịch. Trước khi dùng lại bất kỳ design per-transaction
            nào, hãy check hai tài khoản nằm ở đâu. Khác bank thì design đó không mang sang được, điểm xuất phát là prefund + netting.
          </p>
        </section>

        <section id="quy-tac" className={styles.section}>
          <h2>Ba quy tắc chung</h2>
          <div className={styles.invariants}>
            {RULES.map(r => (
              <div key={r.id}>
                <code>{r.id}</code>
                <strong>{r.title}</strong>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Đọc tiếp</h2>
          <div className={styles.nextReads}>
            <Link to="/fintech/savings-fund">
              <span>Savings Fund</span>
              <strong>Nộp & rút tiền vào quỹ tiết kiệm</strong>
              <em>Design A trong thực tế: pocket pass-through, settle từng giao dịch <IoArrowForward /></em>
            </Link>
            <Link to="/fintech/billpay">
              <span>Billpay</span>
              <strong>Trả hoá đơn qua ví</strong>
              <em>Push + pull, outbox và reconciliation <IoArrowForward /></em>
            </Link>
          </div>
        </section>

        <p className={styles.disclaimer}>
          Đây là ghi chép của mình, không phải tư vấn pháp lý. Luôn đọc văn bản gốc trước khi dựa vào một điều luật.
        </p>
      </div>
    </>
  );
}
