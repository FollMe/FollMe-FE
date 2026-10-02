import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import ArticleHeader from 'components/article/ArticleHeader';
import { CONTACT_EMAIL } from 'config/constant';

/** What FollMe stores, who sees it and how long it is kept, in plain words. */
export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Chính sách bảo mật | FollMe';
  }, []);

  return (
    <div className="container container--narrow" style={{ paddingBottom: 72 }}>
      <ArticleHeader
        eyebrow="Pháp lý"
        title="Chính sách bảo mật"
        meta={['Cập nhật ngày 02/10/2026']}
      />
      <div className="prose">
        <p>
          FollMe giúp bạn chọn ngày cưới, gửi thiệp mời online và nhận lời chúc. Trang này nói rõ chúng mình lưu những
          gì, ai được xem và lưu trong bao lâu. Chúng mình không bán dữ liệu và không dùng dữ liệu của bạn để quảng cáo.
        </p>

        <h2>Dữ liệu chúng mình lưu</h2>
        <ul>
          <li>
            <b>Tài khoản:</b> tên, email và ảnh đại diện (lấy từ Google hoặc Facebook nếu bạn đăng nhập bằng cách đó).
            Mật khẩu được băm bằng bcrypt, không ai đọc được mật khẩu gốc.
          </li>
          <li>
            <b>Thiệp bạn tạo:</b> thông tin sự kiện, ảnh cưới, tài khoản ngân hàng nhận mừng (nếu bạn thêm) và danh sách
            khách mời: tên, nhóm, email nếu bạn nhập.
          </li>
          <li>
            <b>Phản hồi của khách:</b> có tham dự hay không, số người đi cùng, lời nhắn, lời chúc và số lần khách mở thiệp.
            Khách mở thiệp không cần tài khoản; khách qua link chung chỉ cần nhập tên.
          </li>
          <li>
            <b>Nội dung khác bạn đăng:</b> bình luận, lượt thả tim, hồ sơ xem tử vi (ngày giờ sinh) nếu bạn lưu.
          </li>
          <li>
            <b>Nhật ký truy cập:</b> địa chỉ IP, trình duyệt, loại thiết bị và trang đã gọi, để chống lạm dụng và xử lý sự cố.
          </li>
        </ul>

        <h2>Ai xem được</h2>
        <ul>
          <li>
            <b>Chủ thiệp</b> xem được danh sách khách, câu trả lời, lời nhắn và mọi lời chúc của thiệp mình.
          </li>
          <li>
            <b>Người có link thiệp</b> xem được thông tin sự kiện, ảnh, tài khoản nhận mừng và các lời chúc chủ thiệp
            không ẩn. Link riêng ghi tên một vị khách, ai có link đều mở được, nên chỉ gửi cho đúng người.
          </li>
          <li>
            <b>Màn hình lời chúc tại tiệc</b> hiện tên và lời chúc của khách cho mọi người trong tiệc.
          </li>
        </ul>

        <h2>Dịch vụ chúng mình dùng</h2>
        <ul>
          <li><b>Cloudinary</b> lưu và hiển thị ảnh.</li>
          <li><b>Vercel</b> chạy trang web và đếm lượt xem trang, không dùng cookie theo dõi.</li>
          <li><b>Google, Facebook</b> khi bạn chọn đăng nhập bằng tài khoản đó.</li>
          <li><b>Gmail</b> gửi email xác thực và thiệp mời qua email.</li>
        </ul>

        <h2>Lưu trên trình duyệt của bạn</h2>
        <p>
          Trình duyệt giữ phiên đăng nhập, chế độ sáng tối, danh sách đọc sau, lời mời bạn soạn, câu trả lời bạn đã gửi
          qua link chung và thiệp bạn đã mở, để lần sau không phải làm lại. Xoá dữ liệu trang web trong trình duyệt là xoá
          hết những thứ này.
        </p>

        <h2>Lưu bao lâu, xoá thế nào</h2>
        <ul>
          <li>
            <b>Xoá thiệp:</b> link riêng, link chung và màn hình lời chúc ngừng hoạt động ngay, ảnh bị xoá ngay. Danh sách
            khách, câu trả lời và lời chúc được giữ thêm 30 ngày để khôi phục nếu bạn xoá nhầm, sau đó bị xoá hẳn.
          </li>
          <li><b>Xoá một khách:</b> link của khách ngừng hoạt động ngay, dữ liệu của khách bị xoá hẳn sau 30 ngày.</li>
          <li><b>Nhật ký truy cập</b> tự xoá sau 90 ngày.</li>
          <li>
            Muốn xoá tài khoản, xoá một lời chúc của bạn trên thiệp người khác hay hỏi về dữ liệu của mình, hãy gửi email
            tới <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Chúng mình trả lời trong vòng 7 ngày.
          </li>
        </ul>

        <h2>Liên hệ</h2>
        <p>
          Mọi câu hỏi về dữ liệu cá nhân, gửi về <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Khi chính sách
          thay đổi, ngày cập nhật ở đầu trang sẽ đổi theo. Xem thêm{' '}
          <Link to="/documents/facebook-data-deletion-instructions-url">hướng dẫn xoá dữ liệu đăng nhập Facebook</Link>.
        </p>
      </div>
    </div>
  );
}
