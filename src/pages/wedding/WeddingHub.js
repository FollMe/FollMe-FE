import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import QRCode from 'react-qr-code';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { IoArrowForward, IoChevronDown, IoTvOutline } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import WeddingJourney from 'components/wedding/WeddingJourney';
import ThemeShowcase from 'components/wedding/ThemeShowcase';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './WeddingHub.module.scss';

const FAQ = [
  ['Tạo thiệp có mất phí không?', 'Không. Bạn chỉ cần một tài khoản FollMe để quản lý thiệp; khách mở thiệp không cần đăng nhập.'],
  ['Link chung và link riêng khác nhau thế nào?', 'Link chung dùng để gửi vào nhóm Zalo, Messenger: ai có link cũng xem được, xác nhận tham dự bằng cách nhập tên. Link riêng ghi sẵn tên từng khách ("Trân trọng kính mời anh Minh"). Chủ thiệp biết từng người đã mở thiệp và trả lời gì.'],
  ['Có chiếu lời chúc lên màn hình ở tiệc được không?', 'Được. Trong trang quản lý thiệp có link "Màn hình lời chúc": mở trên laptop nối với TV hoặc máy chiếu, hoặc gửi cho bên âm thanh ánh sáng. Khách quét mã QR trên màn hình để gửi lời chúc, lời chúc hiện lên sau vài giây, kèm album ảnh cưới chạy tự động.'],
  ['Ngày cưới ai đứng bàn tiếp tân?', 'Gửi link "Đón khách" trong trang quản lý thiệp cho người nhà đứng bàn tiếp tân. Họ mở trên điện thoại, không cần tài khoản: tìm tên khách (gõ không dấu cũng được), bấm "Đã đến", ghi số người đi cùng, thêm khách không có trong danh sách. Nhiều người cùng đón được, bạn xem ai đã đến, mỗi nhóm bao nhiêu người ngay trên điện thoại của mình.'],
  ['Có ghi sổ mừng được không?', 'Có. Sau tiệc, mở "Sổ mừng" trong trang quản lý thiệp: tìm tên trên phong bì, gõ "500k" hay "1tr2" là xong, quà không phải tiền thì ghi chú. Sổ cộng tổng theo nhà trai, nhà gái và tải về Excel để giữ. Chỉ bạn xem được.'],
  ['Tôi vẫn muốn in thiệp giấy?', 'Cứ in như bình thường và thêm mã QR của link chung lên thiệp. Khách quét mã là xem được chỉ đường, lưu vào lịch và gửi lời chúc.'],
  ['Nhập danh sách khách có lâu không?', 'Dán cả danh sách từ Ghi chú, Zalo hay Excel, mỗi dòng một tên. Dòng như "Nhà trai:" hay "Bạn bè:" sẽ chia khách thành nhóm. Trên Android còn chọn được khách từ danh bạ.'],
  ['Làm sao biết bao nhiêu người sẽ đến?', 'Trang quản lý thiệp tổng hợp ai đã mở thiệp, ai sẽ đến, đi mấy người, tách riêng nhà trai, nhà gái và từng nhóm bạn. Khách đã nhận thiệp mà chưa trả lời được nhắc lần lượt qua Zalo, mỗi người một lần bấm.'],
  ['Thông tin của khách có bị lộ không?', 'Thiệp không hiện trên Google, chỉ người có link mới xem được. Khi bạn xoá thiệp, mọi link ngừng hoạt động ngay. Chi tiết ở trang Chính sách bảo mật.'],
  ['Ngày cưới được chọn theo quy tắc nào?', 'Chỉ giữ ngày hoàng đạo, không xung tuổi cô dâu chú rể, tránh tháng 7 âm lịch, ngày Tam Nương và Nguyệt Kỵ, rồi xếp hạng theo độ hợp với tuổi hai bạn. Kim Lâu được báo riêng để gia đình cân nhắc.'],
];

export default function WeddingHub() {
  useEffect(() => {
    setPageMeta({
      title: 'Cưới hỏi: xem tuổi, chọn ngày, thiệp cưới online',
      description: 'Chuẩn bị đám cưới trong ba bước: xem tuổi hợp nhau, chọn ngày cưới đẹp theo tuổi và gửi thiệp cưới online miễn phí có xác nhận tham dự và sổ lưu bút.',
    });
    if (new URLSearchParams(window.location.search).get('ref') === 'invitation') {
      track('hub_from_invitation');
    }
  }, []);

  return (
    <div className="container page">
      <PageHeader
        eyebrow="Cưới hỏi"
        title="Mọi thứ cho ngày vui của hai bạn"
        description="Xem tuổi, chọn ngày và gửi thiệp cưới online ở cùng một nơi. Miễn phí, không cần cài ứng dụng."
        actions={
          <>
            <Button component={Link} to="/thiep-mau" variant="outlined" size="large">Mở thử thiệp mẫu</Button>
            <Button component={Link} to="/events/create?type=wedding" variant="contained" size="large" endIcon={<IoArrowForward />}>
              Tạo thiệp cưới
            </Button>
          </>
        }
      />

      <WeddingJourney />

      <section className={styles.section}>
        <div className="eyebrow">Mẫu thiệp</div>
        <h2 className={styles.h2}>Chọn một phong cách, đổi lúc nào cũng được</h2>
        <ThemeShowcase />
      </section>

      <section className={styles.section}>
        <div className="eyebrow">Trong ngày cưới</div>
        <h2 className={styles.h2}>Lời chúc của khách hiện lên màn hình tiệc</h2>
        <div className={styles.screenFeature}>
          <Link to="/man-hinh/mau" target="_blank" className={styles.screenMock} aria-label="Xem màn hình lời chúc mẫu">
            <div className={styles.mockSide}>
              <span className={styles.mockArch} />
              <strong>Khoa &amp; Ngân</strong>
              <span className={styles.mockQr}>
                <QRCode value={`${window.location.origin}/thiep-mau#loi-chuc`} size={96} />
              </span>
            </div>
            <div className={styles.mockStage}>
              <span className={styles.mockBadge}>Lời chúc mới</span>
              <p>“Chúc hai bạn trăm năm hạnh phúc, sớm có tin vui!”</p>
              <em>— Hội bạn cấp 3</em>
            </div>
          </Link>
          <div className={styles.screenText}>
            <p>
              Mở link màn hình trên TV hoặc máy chiếu ở tiệc. Khách quét mã QR, viết lời chúc trên điện thoại, vài giây sau
              lời chúc hiện lên giữa tiệc kèm pháo giấy, bên cạnh album ảnh cưới chạy tự động.
            </p>
            <p>Gửi link cho bên âm thanh ánh sáng là xong, không cần cài đặt hay đăng nhập.</p>
            <Button component={Link} to="/man-hinh/mau" target="_blank" variant="outlined" startIcon={<IoTvOutline />}>
              Xem màn hình mẫu
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className="eyebrow">Hỏi đáp</div>
        <h2 className={styles.h2}>Câu hỏi thường gặp</h2>
        <div className={styles.faq}>
          {FAQ.map(([q, a]) => (
            <Accordion key={q} disableGutters elevation={0} className={styles.faqItem}>
              <AccordionSummary expandIcon={<IoChevronDown />}>
                <strong>{q}</strong>
              </AccordionSummary>
              <AccordionDetails>
                <p>{a}</p>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Sẵn sàng gửi thiệp?</h2>
        <p>Mất khoảng 3 phút. Bạn có thể sửa thông tin và đổi mẫu bất cứ lúc nào.</p>
        <Button component={Link} to="/events/create?type=wedding" variant="contained" size="large" endIcon={<IoArrowForward />}>
          Tạo thiệp cưới miễn phí
        </Button>
      </section>
    </div>
  );
}
