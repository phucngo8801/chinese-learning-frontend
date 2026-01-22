// Trang Pinyin Lab: dữ liệu cố định (không gọi AI / không gọi API)
// Quy ước:
// - pinyinNumber: dạng có số thanh ở cuối (ma1, shi4, nü3...)
// - pinyin: dạng có dấu thanh (mā, shì, nǚ...)
// - hanzi: chữ Trung dùng để máy đọc (TTS) chuẩn hơn đọc pinyin

export type MouthShape = "tự nhiên" | "tròn" | "mỉm" | "mở rộng";
export type TonguePos =
  | "tự nhiên"
  | "đầu lưỡi chạm răng"
  | "đầu lưỡi chạm lợi"
  | "cuộn nhẹ"
  | "đẩy ra trước"
  | "nâng giữa lưỡi"
  | "lùi về sau";
export type Airflow = "nhẹ" | "mạnh" | "bật hơi" | "dứt" | "kéo dài";

export type PinyinExample = {
  hanzi: string;
  pinyin: string;        // có dấu thanh
  pinyinNumber: string;  // có số thanh
  vi: string;
};

export type PinyinSound = {
  key: string;
  label: string;
  kind: "initial" | "final" | "tone";
  mouth: MouthShape;
  tongue: TonguePos;
  airflow: Airflow;
  how: string[];           // cách phát âm ngắn gọn
  mistakes: string[];      // lỗi hay gặp
  tips?: string[];         // mẹo
  examples: PinyinExample[];
};

export type PinyinPair = {
  id: string;
  title: string;
  a: string; // key sound A (initial/final)
  b: string; // key sound B
  why: string;
  drills: Array<{
    prompt: string;
    // người học có thể đọc 1 trong các ví dụ (TTS/ASR dựa hanzi)
    options: Array<{
      hanzi: string;
      pinyin: string;
      pinyinNumber: string;
      vi: string;
      soundKey: string; // a hoặc b
    }>;
  }>;
};

// ====== INITIALS (Âm đầu) ======
export const PINYIN_INITIALS: PinyinSound[] = [
  { key:"b", label:"b", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm răng", airflow:"nhẹ",
    how:["Giống 'b' nhẹ (không bật hơi mạnh)."], mistakes:["Bật hơi quá mạnh thành 'p'."],
    tips:["Đặt tay trước miệng: gần như không thấy gió."],
    examples:[{hanzi:"爸",pinyin:"bà",pinyinNumber:"ba4",vi:"bố"},{hanzi:"杯",pinyin:"bēi",pinyinNumber:"bei1",vi:"cốc"}] },
  { key:"p", label:"p", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm răng", airflow:"bật hơi",
    how:["Giống 'p' bật hơi rõ."], mistakes:["Không bật hơi (nghe thành 'b')."],
    tips:["Đặt tay trước miệng: phải cảm nhận được luồng gió."],
    examples:[{hanzi:"怕",pinyin:"pà",pinyinNumber:"pa4",vi:"sợ"},{hanzi:"朋",pinyin:"péng",pinyinNumber:"peng2",vi:"bạn (trong 朋友)"}] },
  { key:"m", label:"m", kind:"initial", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Mím môi, rung nhẹ, kéo dài được."], mistakes:["Mở môi quá sớm làm âm bị đứt."],
    examples:[{hanzi:"妈",pinyin:"mā",pinyinNumber:"ma1",vi:"mẹ"},{hanzi:"米",pinyin:"mǐ",pinyinNumber:"mi3",vi:"gạo"}] },
  { key:"f", label:"f", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm răng", airflow:"mạnh",
    how:["Răng trên chạm môi dưới, thổi 'f'."], mistakes:["Biến thành 'h' (thổi quá sau)."],
    examples:[{hanzi:"发",pinyin:"fā",pinyinNumber:"fa1",vi:"phát"},{hanzi:"饭",pinyin:"fàn",pinyinNumber:"fan4",vi:"cơm"}] },

  { key:"d", label:"d", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm lợi", airflow:"nhẹ",
    how:["Giống 'đ' nhẹ, không bật hơi mạnh."], mistakes:["Bật hơi mạnh thành 't'."],
    examples:[{hanzi:"大",pinyin:"dà",pinyinNumber:"da4",vi:"to"},{hanzi:"东",pinyin:"dōng",pinyinNumber:"dong1",vi:"đông"}] },
  { key:"t", label:"t", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm lợi", airflow:"bật hơi",
    how:["Giống 't' bật hơi rõ."], mistakes:["Không bật hơi (nghe thành 'd')."],
    examples:[{hanzi:"他",pinyin:"tā",pinyinNumber:"ta1",vi:"anh ấy"},{hanzi:"天",pinyin:"tiān",pinyinNumber:"tian1",vi:"trời"}] },
  { key:"n", label:"n", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm lợi", airflow:"kéo dài",
    how:["Đầu lưỡi chạm lợi trên, rung mũi."], mistakes:["Nhầm với 'l' (đầu lưỡi rơi xuống)."],
    tips:["Thử bịt mũi: âm 'n' sẽ đổi rõ."],
    examples:[{hanzi:"你",pinyin:"nǐ",pinyinNumber:"ni3",vi:"bạn"},{hanzi:"南",pinyin:"nán",pinyinNumber:"nan2",vi:"nam"}] },
  { key:"l", label:"l", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm lợi", airflow:"kéo dài",
    how:["Đầu lưỡi chạm lợi, luồng hơi đi qua 2 bên lưỡi."], mistakes:["Nhầm với 'n' (đẩy hơi qua mũi)."],
    examples:[{hanzi:"来",pinyin:"lái",pinyinNumber:"lai2",vi:"đến"},{hanzi:"冷",pinyin:"lěng",pinyinNumber:"leng3",vi:"lạnh"}] },

  { key:"g", label:"g", kind:"initial", mouth:"tự nhiên", tongue:"lùi về sau", airflow:"nhẹ",
    how:["Giống 'g' nhẹ ở cuống lưỡi."], mistakes:["Nhầm với 'k' do bật hơi."],
    examples:[{hanzi:"高",pinyin:"gāo",pinyinNumber:"gao1",vi:"cao"},{hanzi:"哥",pinyin:"gē",pinyinNumber:"ge1",vi:"anh trai"}] },
  { key:"k", label:"k", kind:"initial", mouth:"tự nhiên", tongue:"lùi về sau", airflow:"bật hơi",
    how:["'k' bật hơi ở cuống lưỡi."], mistakes:["Không bật hơi (nghe thành 'g')."],
    examples:[{hanzi:"看",pinyin:"kàn",pinyinNumber:"kan4",vi:"nhìn"},{hanzi:"可",pinyin:"kě",pinyinNumber:"ke3",vi:"có thể"}] },
  { key:"h", label:"h", kind:"initial", mouth:"tự nhiên", tongue:"lùi về sau", airflow:"mạnh",
    how:["Thổi từ cổ họng (không khàn như tiếng Việt)."], mistakes:["Khàn quá (giống 'kh')."],
    examples:[{hanzi:"好",pinyin:"hǎo",pinyinNumber:"hao3",vi:"tốt"},{hanzi:"喝",pinyin:"hē",pinyinNumber:"he1",vi:"uống"}] },

  { key:"j", label:"j", kind:"initial", mouth:"mỉm", tongue:"nâng giữa lưỡi", airflow:"nhẹ",
    how:["Giống 'ch' mềm (vòm cứng), môi hơi mỉm."], mistakes:["Đọc thành 'gi' Việt (quá nặng)."],
    tips:["j/q/x đi với 'u' thực ra là 'ü' (ju= jü)."],
    examples:[{hanzi:"鸡",pinyin:"jī",pinyinNumber:"ji1",vi:"gà"},{hanzi:"家",pinyin:"jiā",pinyinNumber:"jia1",vi:"nhà"}] },
  { key:"q", label:"q", kind:"initial", mouth:"mỉm", tongue:"nâng giữa lưỡi", airflow:"bật hơi",
    how:["Giống 'ch' bật hơi (vòm cứng), môi mỉm."], mistakes:["Không bật hơi (nghe thành j)."],
    examples:[{hanzi:"七",pinyin:"qī",pinyinNumber:"qi1",vi:"bảy"},{hanzi:"去",pinyin:"qù",pinyinNumber:"qu4",vi:"đi"}] },
  { key:"x", label:"x", kind:"initial", mouth:"mỉm", tongue:"nâng giữa lưỡi", airflow:"nhẹ",
    how:["Giống 'xì' nhẹ, hơi qua khe nhỏ."], mistakes:["Nhầm với 'sh' do cuộn lưỡi."],
    examples:[{hanzi:"西",pinyin:"xī",pinyinNumber:"xi1",vi:"tây"},{hanzi:"学",pinyin:"xué",pinyinNumber:"xue2",vi:"học"}] },

  { key:"zh", label:"zh", kind:"initial", mouth:"tự nhiên", tongue:"cuộn nhẹ", airflow:"dứt",
    how:["Cuộn nhẹ đầu lưỡi về sau (retroflex)."], mistakes:["Không cuộn -> nhầm 'z'."],
    examples:[{hanzi:"中",pinyin:"zhōng",pinyinNumber:"zhong1",vi:"trung"},{hanzi:"这",pinyin:"zhè",pinyinNumber:"zhe4",vi:"này"}] },
  { key:"ch", label:"ch", kind:"initial", mouth:"tự nhiên", tongue:"cuộn nhẹ", airflow:"bật hơi",
    how:["Như zh nhưng bật hơi."], mistakes:["Thiếu bật hơi -> nhầm 'zh'."],
    examples:[{hanzi:"吃",pinyin:"chī",pinyinNumber:"chi1",vi:"ăn"},{hanzi:"车",pinyin:"chē",pinyinNumber:"che1",vi:"xe"}] },
  { key:"sh", label:"sh", kind:"initial", mouth:"tự nhiên", tongue:"cuộn nhẹ", airflow:"kéo dài",
    how:["Cuộn nhẹ lưỡi, thổi 'sh' dài."], mistakes:["Nhầm 'x' (lưỡi không cuộn)."],
    examples:[{hanzi:"是",pinyin:"shì",pinyinNumber:"shi4",vi:"là"},{hanzi:"十",pinyin:"shí",pinyinNumber:"shi2",vi:"mười"}] },
  { key:"r", label:"r", kind:"initial", mouth:"tự nhiên", tongue:"cuộn nhẹ", airflow:"kéo dài",
    how:["Giống 'r' Trung: hơi cuộn lưỡi + rung nhẹ."], mistakes:["Đọc 'r' Việt hoặc 'd'."],
    examples:[{hanzi:"人",pinyin:"rén",pinyinNumber:"ren2",vi:"người"},{hanzi:"日",pinyin:"rì",pinyinNumber:"ri4",vi:"ngày"}] },

  { key:"z", label:"z", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm răng", airflow:"dứt",
    how:["Giống 'dz' (xát + dứt), không cuộn lưỡi."], mistakes:["Cuộn lưỡi -> nhầm zh."],
    examples:[{hanzi:"在",pinyin:"zài",pinyinNumber:"zai4",vi:"ở/tại"},{hanzi:"走",pinyin:"zǒu",pinyinNumber:"zou3",vi:"đi"}] },
  { key:"c", label:"c", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm răng", airflow:"bật hơi",
    how:["Như z nhưng bật hơi."], mistakes:["Thiếu bật hơi -> nhầm z."],
    examples:[{hanzi:"菜",pinyin:"cài",pinyinNumber:"cai4",vi:"rau"},{hanzi:"次",pinyin:"cì",pinyinNumber:"ci4",vi:"lần"}] },
  { key:"s", label:"s", kind:"initial", mouth:"tự nhiên", tongue:"đầu lưỡi chạm răng", airflow:"kéo dài",
    how:["Thổi 's' mảnh, không cuộn."], mistakes:["Nhầm sh (do cuộn)."],
    examples:[{hanzi:"三",pinyin:"sān",pinyinNumber:"san1",vi:"ba"},{hanzi:"四",pinyin:"sì",pinyinNumber:"si4",vi:"bốn"}] },

  // y, w coi như bán nguyên âm đầu (rất phổ biến)
  { key:"y", label:"y", kind:"initial", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"nhẹ",
    how:["Dẫn vào i/ü (ya, ye, yi, yu...)."], mistakes:["Bỏ mất y làm đọc gãy."],
    examples:[{hanzi:"一",pinyin:"yī",pinyinNumber:"yi1",vi:"một"},{hanzi:"月",pinyin:"yuè",pinyinNumber:"yue4",vi:"tháng"}] },
  { key:"w", label:"w", kind:"initial", mouth:"tròn", tongue:"tự nhiên", airflow:"nhẹ",
    how:["Dẫn vào u (wa, wo, wu...)."], mistakes:["Bỏ w làm nghe thành âm đầu khác."],
    examples:[{hanzi:"我",pinyin:"wǒ",pinyinNumber:"wo3",vi:"tôi"},{hanzi:"五",pinyin:"wǔ",pinyinNumber:"wu3",vi:"năm"}] },
];

// ====== FINALS (Vần) ======
export const PINYIN_FINALS: PinyinSound[] = [
  { key:"a", label:"a", kind:"final", mouth:"mở rộng", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Mở miệng rộng, âm 'a' rõ."], mistakes:["Đọc quá ngắn."],
    examples:[{hanzi:"啊",pinyin:"a",pinyinNumber:"a5",vi:"à/ơ"},{hanzi:"八",pinyin:"bā",pinyinNumber:"ba1",vi:"tám"}] },
  { key:"o", label:"o", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Môi tròn vừa, âm gần 'o'."], mistakes:["Tròn quá thành 'u'."],
    examples:[{hanzi:"哦",pinyin:"ó",pinyinNumber:"o2",vi:"ồ"},{hanzi:"我",pinyin:"wǒ",pinyinNumber:"wo3",vi:"tôi"}] },
  { key:"e", label:"e", kind:"final", mouth:"tự nhiên", tongue:"lùi về sau", airflow:"kéo dài",
    how:["Âm 'ơ' (không phải 'ê')."], mistakes:["Đọc thành 'ê'."],
    examples:[{hanzi:"饿",pinyin:"è",pinyinNumber:"e4",vi:"đói"},{hanzi:"喝",pinyin:"hē",pinyinNumber:"he1",vi:"uống"}] },
  { key:"i", label:"i", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["Môi hơi mỉm, lưỡi trước."], mistakes:["Đọc thành 'ư'."],
    examples:[{hanzi:"一",pinyin:"yī",pinyinNumber:"yi1",vi:"một"},{hanzi:"你",pinyin:"nǐ",pinyinNumber:"ni3",vi:"bạn"}] },
  { key:"u", label:"u", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Môi tròn, âm 'u'."], mistakes:["Mở môi quá (nghe thành 'o')."],
    examples:[{hanzi:"五",pinyin:"wǔ",pinyinNumber:"wu3",vi:"năm"},{hanzi:"不",pinyin:"bù",pinyinNumber:"bu4",vi:"không"}] },
  { key:"ü", label:"ü", kind:"final", mouth:"tròn", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["Môi tròn như 'u' nhưng lưỡi đẩy ra trước (giống 'ư' + tròn môi)."], mistakes:["Đọc thành 'u'."],
    tips:["Nhìn gương: môi tròn nhưng cảm giác âm ở phía trước miệng."],
    examples:[{hanzi:"女",pinyin:"nǚ",pinyinNumber:"nü3",vi:"nữ"},{hanzi:"绿",pinyin:"lǜ",pinyinNumber:"lü4",vi:"xanh lá"}] },

  // Nhóm đôi
  { key:"ai", label:"ai", kind:"final", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["a -> i (trượt)"], mistakes:["Đọc thành 'ê'."],
    examples:[{hanzi:"爱",pinyin:"ài",pinyinNumber:"ai4",vi:"yêu"},{hanzi:"白",pinyin:"bái",pinyinNumber:"bai2",vi:"trắng"}] },
  { key:"ei", label:"ei", kind:"final", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["ê -> i (trượt)"], mistakes:["Đọc thành 'ây' Việt quá nặng."],
    examples:[{hanzi:"黑",pinyin:"hēi",pinyinNumber:"hei1",vi:"đen"},{hanzi:"累",pinyin:"lèi",pinyinNumber:"lei4",vi:"mệt"}] },
  { key:"ao", label:"ao", kind:"final", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["a -> o"], mistakes:["Đọc thành 'o' quá sớm."],
    examples:[{hanzi:"好",pinyin:"hǎo",pinyinNumber:"hao3",vi:"tốt"},{hanzi:"包",pinyin:"bāo",pinyinNumber:"bao1",vi:"gói"}] },
  { key:"ou", label:"ou", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["o -> u"], mistakes:["Đọc thành 'âu' Việt."],
    examples:[{hanzi:"走",pinyin:"zǒu",pinyinNumber:"zou3",vi:"đi"},{hanzi:"口",pinyin:"kǒu",pinyinNumber:"kou3",vi:"miệng"}] },

  { key:"an", label:"an", kind:"final", mouth:"mở rộng", tongue:"tự nhiên", airflow:"kéo dài",
    how:["a + n (mũi)"], mistakes:["Nhầm ang (thêm 'g')."],
    examples:[{hanzi:"安",pinyin:"ān",pinyinNumber:"an1",vi:"an"},{hanzi:"看",pinyin:"kàn",pinyinNumber:"kan4",vi:"nhìn"}] },
  { key:"en", label:"en", kind:"final", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["ơ + n"], mistakes:["Nhầm eng."],
    examples:[{hanzi:"人",pinyin:"rén",pinyinNumber:"ren2",vi:"người"},{hanzi:"本",pinyin:"běn",pinyinNumber:"ben3",vi:"gốc"}] },
  { key:"ang", label:"ang", kind:"final", mouth:"mở rộng", tongue:"lùi về sau", airflow:"kéo dài",
    how:["a + ng (mũi, mở rộng hơn an)"], mistakes:["Đọc thiếu 'ng'."],
    examples:[{hanzi:"忙",pinyin:"máng",pinyinNumber:"mang2",vi:"bận"},{hanzi:"长",pinyin:"cháng",pinyinNumber:"chang2",vi:"dài"}] },
  { key:"eng", label:"eng", kind:"final", mouth:"tự nhiên", tongue:"lùi về sau", airflow:"kéo dài",
    how:["ơ + ng"], mistakes:["Đọc thành en."],
    examples:[{hanzi:"冷",pinyin:"lěng",pinyinNumber:"leng3",vi:"lạnh"},{hanzi:"能",pinyin:"néng",pinyinNumber:"neng2",vi:"có thể"}] },
  { key:"ong", label:"ong", kind:"final", mouth:"tròn", tongue:"lùi về sau", airflow:"kéo dài",
    how:["o + ng"], mistakes:["Đọc thành 'ông' Việt quá nặng."],
    examples:[{hanzi:"中",pinyin:"zhōng",pinyinNumber:"zhong1",vi:"trung"},{hanzi:"东",pinyin:"dōng",pinyinNumber:"dong1",vi:"đông"}] },
  { key:"er", label:"er", kind:"final", mouth:"tự nhiên", tongue:"cuộn nhẹ", airflow:"kéo dài",
    how:["Âm 'ơ' + cuộn lưỡi nhẹ (er)."], mistakes:["Không cuộn (nghe thành 'e')."],
    examples:[{hanzi:"二",pinyin:"èr",pinyinNumber:"er4",vi:"hai"},{hanzi:"儿",pinyin:"ér",pinyinNumber:"er2",vi:"con (trẻ)"}] },

  // i- finals
  { key:"ia", label:"ia", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["i + a"], mistakes:["Bỏ i (đọc thành a)."],
    examples:[{hanzi:"家",pinyin:"jiā",pinyinNumber:"jia1",vi:"nhà"},{hanzi:"下",pinyin:"xià",pinyinNumber:"xia4",vi:"dưới"}] },
  { key:"ie", label:"ie", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["i + ê"], mistakes:["Đọc thành 'ia'."],
    examples:[{hanzi:"写",pinyin:"xiě",pinyinNumber:"xie3",vi:"viết"},{hanzi:"些",pinyin:"xiē",pinyinNumber:"xie1",vi:"một ít"}] },
  { key:"iao", label:"iao", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["i + ao"], mistakes:["Đọc thành 'yêu'."],
    examples:[{hanzi:"小",pinyin:"xiǎo",pinyinNumber:"xiao3",vi:"nhỏ"},{hanzi:"叫",pinyin:"jiào",pinyinNumber:"jiao4",vi:"gọi"}] },
  { key:"iu", label:"iu", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["i + ou (viết tắt iu)"], mistakes:["Đọc thành 'iu' Việt."],
    examples:[{hanzi:"九",pinyin:"jiǔ",pinyinNumber:"jiu3",vi:"chín"},{hanzi:"六",pinyin:"liù",pinyinNumber:"liu4",vi:"sáu"}] },
  { key:"ian", label:"ian", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["i + an"], mistakes:["Đọc thành 'iang'."],
    examples:[{hanzi:"天",pinyin:"tiān",pinyinNumber:"tian1",vi:"trời"},{hanzi:"年",pinyin:"nián",pinyinNumber:"nian2",vi:"năm"}] },
  { key:"in", label:"in", kind:"final", mouth:"mỉm", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["i + n"], mistakes:["Đọc thành 'ing'."],
    examples:[{hanzi:"新",pinyin:"xīn",pinyinNumber:"xin1",vi:"mới"},{hanzi:"林",pinyin:"lín",pinyinNumber:"lin2",vi:"rừng"}] },
  { key:"iang", label:"iang", kind:"final", mouth:"mỉm", tongue:"lùi về sau", airflow:"kéo dài",
    how:["i + ang"], mistakes:["Bỏ 'g'."],
    examples:[{hanzi:"想",pinyin:"xiǎng",pinyinNumber:"xiang3",vi:"nghĩ"},{hanzi:"两",pinyin:"liǎng",pinyinNumber:"liang3",vi:"hai (lượng)"}] },
  { key:"ing", label:"ing", kind:"final", mouth:"mỉm", tongue:"lùi về sau", airflow:"kéo dài",
    how:["i + ng"], mistakes:["Đọc thành in."],
    examples:[{hanzi:"听",pinyin:"tīng",pinyinNumber:"ting1",vi:"nghe"},{hanzi:"名",pinyin:"míng",pinyinNumber:"ming2",vi:"tên"}] },
  { key:"iong", label:"iong", kind:"final", mouth:"mỉm", tongue:"lùi về sau", airflow:"kéo dài",
    how:["i + ong"], mistakes:["Đọc thiếu 'ng'."],
    examples:[{hanzi:"熊",pinyin:"xióng",pinyinNumber:"xiong2",vi:"gấu"},{hanzi:"穷",pinyin:"qióng",pinyinNumber:"qiong2",vi:"nghèo"}] },

  // u- finals
  { key:"ua", label:"ua", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["u + a"], mistakes:["Đọc thành 'oa'."],
    examples:[{hanzi:"花",pinyin:"huā",pinyinNumber:"hua1",vi:"hoa"},{hanzi:"话",pinyin:"huà",pinyinNumber:"hua4",vi:"lời nói"}] },
  { key:"uo", label:"uo", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["u + o"], mistakes:["Đọc thành 'u'."],
    examples:[{hanzi:"国",pinyin:"guó",pinyinNumber:"guo2",vi:"nước"},{hanzi:"多",pinyin:"duō",pinyinNumber:"duo1",vi:"nhiều"}] },
  { key:"uai", label:"uai", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["u + ai"], mistakes:["Đọc thành 'wai'."],
    examples:[{hanzi:"快",pinyin:"kuài",pinyinNumber:"kuai4",vi:"nhanh"},{hanzi:"坏",pinyin:"huài",pinyinNumber:"huai4",vi:"xấu"}] },
  { key:"ui", label:"ui", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["u + ei (viết tắt ui)"], mistakes:["Đọc thành 'ui' Việt."],
    examples:[{hanzi:"水",pinyin:"shuǐ",pinyinNumber:"shui3",vi:"nước"},{hanzi:"对",pinyin:"duì",pinyinNumber:"dui4",vi:"đúng"}] },
  { key:"uan", label:"uan", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["u + an"], mistakes:["Đọc thành 'uang'."],
    examples:[{hanzi:"关",pinyin:"guān",pinyinNumber:"guan1",vi:"đóng"},{hanzi:"晚",pinyin:"wǎn",pinyinNumber:"wan3",vi:"tối"}] },
  { key:"un", label:"un", kind:"final", mouth:"tròn", tongue:"tự nhiên", airflow:"kéo dài",
    how:["u + en (viết un)"], mistakes:["Đọc thành 'ung'."],
    examples:[{hanzi:"文",pinyin:"wén",pinyinNumber:"wen2",vi:"văn"},{hanzi:"春",pinyin:"chūn",pinyinNumber:"chun1",vi:"xuân"}] },
  { key:"uang", label:"uang", kind:"final", mouth:"tròn", tongue:"lùi về sau", airflow:"kéo dài",
    how:["u + ang"], mistakes:["Bỏ g."],
    examples:[{hanzi:"黄",pinyin:"huáng",pinyinNumber:"huang2",vi:"vàng"},{hanzi:"广",pinyin:"guǎng",pinyinNumber:"guang3",vi:"rộng"}] },
  { key:"ueng", label:"ueng", kind:"final", mouth:"tròn", tongue:"lùi về sau", airflow:"kéo dài",
    how:["u + eng"], mistakes:["Đọc thành 'weng'."],
    examples:[{hanzi:"风",pinyin:"fēng",pinyinNumber:"feng1",vi:"gió"},{hanzi:"翁",pinyin:"wēng",pinyinNumber:"weng1",vi:"ông"}] },

  // ü- finals
  { key:"üe", label:"üe", kind:"final", mouth:"tròn", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["ü + ê"], mistakes:["Đọc thành 'ue' (mất ü)."],
    examples:[{hanzi:"学",pinyin:"xué",pinyinNumber:"xue2",vi:"học"},{hanzi:"月",pinyin:"yuè",pinyinNumber:"yue4",vi:"tháng"}] },
  { key:"üan", label:"üan", kind:"final", mouth:"tròn", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["ü + an"], mistakes:["Đọc thành 'uan'."],
    examples:[{hanzi:"远",pinyin:"yuǎn",pinyinNumber:"yuan3",vi:"xa"},{hanzi:"选",pinyin:"xuǎn",pinyinNumber:"xuan3",vi:"chọn"}] },
  { key:"ün", label:"ün", kind:"final", mouth:"tròn", tongue:"đẩy ra trước", airflow:"kéo dài",
    how:["ü + n"], mistakes:["Đọc thành 'un'."],
    examples:[{hanzi:"云",pinyin:"yún",pinyinNumber:"yun2",vi:"mây"},{hanzi:"军",pinyin:"jūn",pinyinNumber:"jun1",vi:"quân"}] },
];

// ====== TONES (Thanh điệu) ======
export const PINYIN_TONES: PinyinSound[] = [
  { key:"tone1", label:"Thanh 1 (ngang cao)", kind:"tone", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Giữ cao và đều."], mistakes:["Bị rơi xuống cuối."],
    tips:["Nói như kéo một đường thẳng."],
    examples:[{hanzi:"妈",pinyin:"mā",pinyinNumber:"ma1",vi:"mẹ"},{hanzi:"七",pinyin:"qī",pinyinNumber:"qi1",vi:"bảy"}] },
  { key:"tone2", label:"Thanh 2 (lên)", kind:"tone", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Từ trung lên cao."], mistakes:["Lên quá mạnh thành hỏi."],
    examples:[{hanzi:"十",pinyin:"shí",pinyinNumber:"shi2",vi:"mười"},{hanzi:"人",pinyin:"rén",pinyinNumber:"ren2",vi:"người"}] },
  { key:"tone3", label:"Thanh 3 (xuống rồi lên)", kind:"tone", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"kéo dài",
    how:["Hạ xuống rồi nhấc lên nhẹ."], mistakes:["Đọc thành thanh 2."],
    tips:["Trong câu thường đọc 'bán tam' (xuống là chính)."],
    examples:[{hanzi:"你",pinyin:"nǐ",pinyinNumber:"ni3",vi:"bạn"},{hanzi:"好",pinyin:"hǎo",pinyinNumber:"hao3",vi:"tốt"}] },
  { key:"tone4", label:"Thanh 4 (rơi)", kind:"tone", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"dứt",
    how:["Rơi nhanh từ cao xuống thấp."], mistakes:["Rơi chậm hoặc không đủ lực."],
    examples:[{hanzi:"是",pinyin:"shì",pinyinNumber:"shi4",vi:"là"},{hanzi:"爸",pinyin:"bà",pinyinNumber:"ba4",vi:"bố"}] },
  { key:"tone0", label:"Thanh nhẹ (neutral)", kind:"tone", mouth:"tự nhiên", tongue:"tự nhiên", airflow:"nhẹ",
    how:["Nhẹ, ngắn, không nhấn."], mistakes:["Nhấn thành 1 trong 4 thanh."],
    examples:[{hanzi:"吗",pinyin:"ma",pinyinNumber:"ma5",vi:"trợ từ hỏi"},{hanzi:"的",pinyin:"de",pinyinNumber:"de5",vi:"trợ từ"}] },
];

// ====== Pairs dễ nhầm ======
export const PINYIN_PAIRS: PinyinPair[] = [
  {
    id: "zh-z",
    title: "zh vs z",
    a: "zh",
    b: "z",
    why: "zh cuộn lưỡi nhẹ; z không cuộn (đầu lưỡi sát răng).",
    drills: [
      {
        prompt: "Nghe và phân biệt: zh hay z?",
        options: [
          { hanzi: "中", pinyin: "zhōng", pinyinNumber: "zhong1", vi: "trung", soundKey: "zh" },
          { hanzi: "走", pinyin: "zǒu", pinyinNumber: "zou3", vi: "đi", soundKey: "z" },
        ],
      },
    ],
  },
  {
    id: "sh-x",
    title: "sh vs x",
    a: "sh",
    b: "x",
    why: "sh cuộn lưỡi; x là vòm cứng (môi mỉm, lưỡi nâng giữa).",
    drills: [
      {
        prompt: "Nghe và phân biệt: sh hay x?",
        options: [
          { hanzi: "是", pinyin: "shì", pinyinNumber: "shi4", vi: "là", soundKey: "sh" },
          { hanzi: "西", pinyin: "xī", pinyinNumber: "xi1", vi: "tây", soundKey: "x" },
        ],
      },
    ],
  },
  {
    id: "l-n",
    title: "l vs n",
    a: "l",
    b: "n",
    why: "n đi qua mũi; l đi qua hai bên lưỡi.",
    drills: [
      {
        prompt: "Nghe và phân biệt: l hay n?",
        options: [
          { hanzi: "来", pinyin: "lái", pinyinNumber: "lai2", vi: "đến", soundKey: "l" },
          { hanzi: "你", pinyin: "nǐ", pinyinNumber: "ni3", vi: "bạn", soundKey: "n" },
        ],
      },
    ],
  },
  {
    id: "u-ü",
    title: "u vs ü",
    a: "u",
    b: "ü",
    why: "ü cần tròn môi nhưng lưỡi đẩy ra trước; u lưỡi tự nhiên.",
    drills: [
      {
        prompt: "Nghe và phân biệt: u hay ü?",
        options: [
          { hanzi: "五", pinyin: "wǔ", pinyinNumber: "wu3", vi: "năm", soundKey: "u" },
          { hanzi: "女", pinyin: "nǚ", pinyinNumber: "nü3", vi: "nữ", soundKey: "ü" },
        ],
      },
    ],
  },
  {
    id: "an-ang",
    title: "an vs ang",
    a: "an",
    b: "ang",
    why: "ang mở hơn và có 'ng' rõ ở cuối.",
    drills: [
      {
        prompt: "Nghe và phân biệt: an hay ang?",
        options: [
          { hanzi: "安", pinyin: "ān", pinyinNumber: "an1", vi: "an", soundKey: "an" },
          { hanzi: "忙", pinyin: "máng", pinyinNumber: "mang2", vi: "bận", soundKey: "ang" },
        ],
      },
    ],
  },
];
