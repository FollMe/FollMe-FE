import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { IoArrowForward, IoChevronDown } from 'react-icons/io5';
import PageHeader from 'components/PageHeader';
import WeddingJourney from 'components/wedding/WeddingJourney';
import ThemeShowcase from 'components/wedding/ThemeShowcase';
import { setPageMeta } from 'util/meta';
import { track } from 'util/analytics';
import styles from './WeddingHub.module.scss';

const FAQ = [
  ['Tạo thiệp có mất phí không?', 'Không. Bạn chỉ cần một tài khoản FollMe để quản lý thiệp; khách mở thiệp không cần đăng nhập.'],
  ['Link chung và link riêng khác nhau thế nào?', 'Link chung dùng để gửi vào nhóm Zalo, Messenger: ai có link cũng xem được, xác nhận tham dự bằng cách nhập tên. Link riêng ghi sẵn tên từng khách ("Trân trọng kính mời anh Minh") và có mã check-in.'],
  ['Tôi vẫn muốn in thiệp giấy?', 'Cứ in như bình thường và thêm mã QR của link chung lên thiệp. Khách quét mã là xem được chỉ đường, lưu vào lịch và gửi lời chúc.'],
  ['Làm sao biết bao nhiêu người sẽ đến?', 'Trang quản lý thiệp tổng hợp ai đã mở thiệp, ai sẽ đến, đi mấy người, ai chưa trả lời. Bạn nhắn riêng cho người chưa trả lời là xong.'],
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
          <Button component={Link} to="/events/create?type=wedding" variant="contained" size="large" endIcon={<IoArrowForward />}>
            Tạo thiệp cưới
          </Button>
        }
      />

      <WeddingJourney />

      <section className={styles.section}>
        <div className="eyebrow">Mẫu thiệp</div>
        <h2 className={styles.h2}>Chọn một phong cách, đổi lúc nào cũng được</h2>
        <ThemeShowcase />
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
