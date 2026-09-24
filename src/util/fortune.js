import { request } from './request';

const API = 'comment-svc/api/fortune';

export const fortuneApi = {
  numerology: (payload) => request.post(`${API}/numerology`, payload),
  tuvi: (payload) => request.post(`${API}/tuvi`, payload),
  lunarConvert: (payload) => request.post(`${API}/lunar/convert`, payload),

  listProfiles: () => request.get(`${API}/me/profiles`),
  createProfile: (payload) => request.post(`${API}/me/profiles`, payload),
  updateProfile: (id, payload) => request.put(`${API}/me/profiles/${id}`, payload),
  deleteProfile: (id) => request.del(`${API}/me/profiles/${id}`),
  listReadings: () => request.get(`${API}/me/readings`),
  createReading: (payload) => request.post(`${API}/me/readings`, payload),
  deleteReading: (id) => request.del(`${API}/me/readings/${id}`),
  deleteAll: () => request.del(`${API}/me/data`),
};

// The 12 two-hour periods (giờ), index = earthly branch (0 = Tý).
export const HOUR_BRANCHES = [
  { value: 0, name: 'Tý', range: '23:00 – 00:59' },
  { value: 1, name: 'Sửu', range: '01:00 – 02:59' },
  { value: 2, name: 'Dần', range: '03:00 – 04:59' },
  { value: 3, name: 'Mão', range: '05:00 – 06:59' },
  { value: 4, name: 'Thìn', range: '07:00 – 08:59' },
  { value: 5, name: 'Tỵ', range: '09:00 – 10:59' },
  { value: 6, name: 'Ngọ', range: '11:00 – 12:59' },
  { value: 7, name: 'Mùi', range: '13:00 – 14:59' },
  { value: 8, name: 'Thân', range: '15:00 – 16:59' },
  { value: 9, name: 'Dậu', range: '17:00 – 18:59' },
  { value: 10, name: 'Tuất', range: '19:00 – 20:59' },
  { value: 11, name: 'Hợi', range: '21:00 – 22:59' },
];

// Human-readable explanation of each engine rule, shown in "Vì sao?" tooltips.
export const RULE_LABELS = {
  NUM_LIFE_PATH: 'Cộng tất cả chữ số của ngày/tháng/năm sinh, giữ lại 10, 11, 22, 33',
  NUM_BIRTHDAY: 'Rút gọn ngày sinh về một chữ số (giữ số bậc thầy)',
  NUM_ATTITUDE: 'Cộng chữ số của ngày và tháng sinh',
  NUM_EXPRESSION: 'Cộng giá trị tất cả chữ cái trong họ tên (A=1 … I=9)',
  NUM_SOUL_URGE: 'Cộng giá trị các nguyên âm trong họ tên',
  NUM_PERSONALITY: 'Cộng giá trị các phụ âm trong họ tên',
  NUM_PERSONAL_YEAR: 'Cộng chữ số của ngày, tháng sinh và năm hiện tại',
  NUM_PEAK: 'Đỉnh cao đầu tiên ở tuổi 36 trừ số chủ đạo, sau đó cách nhau 9 năm',
  NUM_CHALLENGE: 'Hiệu giữa các chữ số rút gọn của ngày, tháng, năm sinh',
  NUM_BIRTH_CHART: 'Các chữ số của ngày sinh xếp trên lưới 3×3',
  TV_MENH_THAN_BY_MONTH_HOUR: 'Từ cung Dần đếm thuận đến tháng sinh, rồi đếm nghịch (Mệnh) hoặc thuận (Thân) đến giờ sinh',
  TV_PALACE_STEM_NGU_HO_DON: 'Can của các cung theo Ngũ Hổ Độn từ can năm sinh',
  TV_CUC_BY_MENH_NAP_AM: 'Cục lấy theo nạp âm của can chi cung Mệnh',
  TV_TUVI_BY_CUC_DAY: 'Sao Tử Vi an theo số Cục và ngày sinh âm lịch',
  TV_TUVI_GROUP: 'Chòm Tử Vi an nghịch từ vị trí sao Tử Vi',
  TV_THIENPHU_MIRROR_DAN_THAN: 'Thiên Phủ đối xứng với Tử Vi qua trục Dần – Thân',
  TV_THIENPHU_GROUP: 'Chòm Thiên Phủ an thuận từ vị trí sao Thiên Phủ',
  TV_BY_YEAR_STEM: 'An theo can năm sinh',
  TV_BY_YEAR_BRANCH: 'An theo chi năm sinh',
  TV_BY_MONTH: 'An theo tháng sinh âm lịch',
  TV_BY_HOUR: 'An theo giờ sinh',
  TV_BY_DAY: 'An theo ngày sinh âm lịch',
  TV_HOA_LINH_BY_YEAR_HOUR_GENDER: 'An theo chi năm, giờ sinh, âm dương và giới tính',
  TV_TU_HOA_BY_YEAR_STEM: 'Tứ Hóa (Lộc, Quyền, Khoa, Kỵ) theo can năm sinh',
  TV_RING_THAI_TUE: 'Vòng Thái Tuế bắt đầu từ cung có chi năm sinh',
  TV_RING_BAC_SI: 'Vòng Bác Sĩ bắt đầu từ Lộc Tồn',
  TV_RING_TRANG_SINH: 'Vòng Tràng Sinh bắt đầu theo Cục',
  TV_FIXED_BY_PALACE: 'Cố định theo cung (Nô Bộc, Tật Ách)',
  TV_BRIGHTNESS_TABLE: 'Độ sáng (Miếu, Vượng, Đắc, Bình, Hãm) theo bảng vị trí',
  TV_DAI_HAN_BY_CUC_GENDER: 'Đại hạn bắt đầu từ cung Mệnh, tuổi khởi bằng số Cục',
  TV_TIEU_HAN_BY_YEAR_BRANCH_GENDER: 'Tiểu hạn khởi theo chi năm sinh, nam đi thuận, nữ đi nghịch',
};

export const DISCLAIMER = 'Nội dung chỉ mang tính tham khảo và giải trí, không thay thế lời khuyên chuyên môn về sức khỏe, tài chính hay pháp lý.';

export function toDateString(year, month, day) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${String(year).padStart(4, '0')}-${pad(month)}-${pad(day)}`;
}

export function parseDateString(value = '') {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

const SHARE_KEYS = {
  fullName: 'n',
  birthDate: 'd',
  calendar: 'c',
  isLeapMonth: 'l',
  birthTime: 't',
  hourBranch: 'h',
  gender: 'g',
};

/**
 * Encodes birth input for a share link. It goes in the URL fragment (#d=…),
 * which browsers never send to any server.
 */
export function encodeShareFragment(input) {
  const compact = {};
  Object.entries(SHARE_KEYS).forEach(([key, short]) => {
    const value = input[key];
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      compact[short] = value;
    }
  });
  return `d=${toBase64Url(JSON.stringify(compact))}`;
}

export function decodeShareFragment(hash = '') {
  const match = /(?:^#?|&)d=([A-Za-z0-9_-]+)/.exec(hash);
  if (!match) {
    return null;
  }
  try {
    const compact = JSON.parse(fromBase64Url(match[1]));
    const input = {};
    Object.entries(SHARE_KEYS).forEach(([key, short]) => {
      if (compact[short] !== undefined) {
        input[key] = compact[short];
      }
    });
    if (!parseDateString(input.birthDate)) {
      return null;
    }
    return input;
  } catch (err) {
    return null;
  }
}

/** Builds the API payload for a birth from form values or a saved profile. */
export function toBirthPayload(values) {
  const payload = {
    birthDate: values.birthDate,
    calendar: values.calendar || 'solar',
    isLeapMonth: Boolean(values.isLeapMonth),
  };
  if (values.fullName) {
    payload.fullName = values.fullName;
  }
  if (values.gender) {
    payload.gender = values.gender;
  }
  if (values.birthTime) {
    payload.birthTime = values.birthTime;
  } else if (values.hourBranch !== undefined && values.hourBranch !== null && values.hourBranch !== '') {
    payload.hourBranch = Number(values.hourBranch);
  }
  return payload;
}

export function formatBirth(values) {
  const date = parseDateString(values.birthDate);
  if (!date) {
    return '';
  }
  let text = `${date.day}/${date.month}/${date.year}`;
  if (values.calendar === 'lunar') {
    text += values.isLeapMonth ? ' (âm lịch, tháng nhuận)' : ' (âm lịch)';
  }
  if (values.birthTime) {
    text += `, ${values.birthTime}`;
  } else if (values.hourBranch !== undefined && values.hourBranch !== null && values.hourBranch !== '') {
    text += `, giờ ${HOUR_BRANCHES[Number(values.hourBranch)]?.name}`;
  }
  return text;
}
