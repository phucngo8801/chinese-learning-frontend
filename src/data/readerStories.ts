export type ReaderVocab = {
  zh: string;
  pinyin: string;
  vi: string;
};

export type ReaderSentence = {
  zh: string;
  pinyin: string;
  vi: string;
};

export type ReaderStory = {
  id: string;
  level: number;
  title: string;
  description: string;
  vocab: ReaderVocab[];
  sentences: ReaderSentence[];
};

export const READER_STORIES: ReaderStory[] = [
  {
    "id": "market_morning",
    "level": 1,
    "title": "Buổi sáng ở chợ",
    "description": "Hỏi giá, mua đồ ăn, nói đơn giản với người bán.",
    "vocab": [
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "早上",
        "pinyin": "zao shang",
        "vi": "buổi sáng"
      },
      {
        "zh": "市场",
        "pinyin": "shi chang",
        "vi": "chợ"
      },
      {
        "zh": "苹果",
        "pinyin": "ping guo",
        "vi": "táo"
      },
      {
        "zh": "香蕉",
        "pinyin": "xiang jiao",
        "vi": "chuối"
      },
      {
        "zh": "多少钱",
        "pinyin": "duo shao qian",
        "vi": "bao nhiêu tiền"
      },
      {
        "zh": "便宜",
        "pinyin": "pian yi",
        "vi": "rẻ"
      },
      {
        "zh": "买",
        "pinyin": "mai",
        "vi": "mua"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：早上好，我们去市场吧。",
        "pinyin": "xiao li: zao shang hao, wo men qu shi chang ba.",
        "vi": "Tiểu Lệ: Chào buổi sáng, mình đi chợ nhé."
      },
      {
        "zh": "小明：好啊，今天我想买苹果和香蕉。",
        "pinyin": "xiao ming: hao a, jin tian wo xiang mai ping guo he xiang jiao.",
        "vi": "Tiểu Minh: Được, hôm nay mình muốn mua táo và chuối."
      },
      {
        "zh": "小丽：老板，苹果多少钱一斤？",
        "pinyin": "xiao li: lao ban, ping guo duo shao qian yi jin?",
        "vi": "Tiểu Lệ: Chủ quán, táo bao nhiêu tiền một cân?"
      },
      {
        "zh": "老板：十块一斤，今天很新鲜。",
        "pinyin": "lao ban: shi kuai yi jin, jin tian hen xin xian.",
        "vi": "Chủ quán: 10 tệ một cân, hôm nay rất tươi."
      },
      {
        "zh": "小明：能便宜一点吗？",
        "pinyin": "xiao ming: neng pian yi yi dian ma?",
        "vi": "Tiểu Minh: Rẻ hơn một chút được không?"
      },
      {
        "zh": "老板：好吧，九块。谢谢！",
        "pinyin": "lao ban: hao ba, jiu kuai. xie xie!",
        "vi": "Chủ quán: Thôi được, 9 tệ. Cảm ơn!"
      }
    ]
  },
  {
    "id": "lost_phone",
    "level": 1,
    "title": "Mình làm rơi điện thoại",
    "description": "Tìm đồ thất lạc và hỏi người khác giúp đỡ.",
    "vocab": [
      {
        "zh": "手机",
        "pinyin": "shou ji",
        "vi": "điện thoại"
      },
      {
        "zh": "不见",
        "pinyin": "bu jian",
        "vi": "mất/không thấy"
      },
      {
        "zh": "发现",
        "pinyin": "fa xian",
        "vi": "phát hiện"
      },
      {
        "zh": "教室",
        "pinyin": "jiao shi",
        "vi": "phòng học"
      },
      {
        "zh": "找",
        "pinyin": "zhao",
        "vi": "tìm"
      },
      {
        "zh": "是不是",
        "pinyin": "shi bu shi",
        "vi": "có phải là"
      },
      {
        "zh": "这里",
        "pinyin": "zhe li",
        "vi": "ở đây"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      },
      {
        "zh": "没关系",
        "pinyin": "mei guan xi",
        "vi": "không sao"
      }
    ],
    "sentences": [
      {
        "zh": "小明：糟了，我的手机不见了。",
        "pinyin": "xiao ming: zao le, wo de shou ji bu jian le.",
        "vi": "Tiểu Minh: Chết rồi, điện thoại của mình mất rồi."
      },
      {
        "zh": "小丽：你什么时候发现的？",
        "pinyin": "xiao li: ni shen me shi hou fa xian de?",
        "vi": "Tiểu Lệ: Bạn phát hiện lúc nào?"
      },
      {
        "zh": "小明：下课以后，我在教室找了一会儿。",
        "pinyin": "xiao ming: xia ke yi hou, wo zai jiao shi zhao le yi hui er.",
        "vi": "Tiểu Minh: Sau giờ học, mình tìm trong lớp một lúc."
      },
      {
        "zh": "小丽：是不是放在桌子下面了？",
        "pinyin": "xiao li: shi bu shi fang zai zhuo zi xia mian le?",
        "vi": "Tiểu Lệ: Có phải để dưới bàn không?"
      },
      {
        "zh": "小明：对！在这里！太好了。",
        "pinyin": "xiao ming: dui! zai zhe li! tai hao le.",
        "vi": "Tiểu Minh: Đúng rồi! Ở đây! Tuyệt quá."
      },
      {
        "zh": "小丽：找到了就好，没关系。",
        "pinyin": "xiao li: zhao dao le jiu hao, mei guan xi.",
        "vi": "Tiểu Lệ: Tìm được là tốt rồi, không sao đâu."
      }
    ]
  },
  {
    "id": "ask_metro",
    "level": 1,
    "title": "Hỏi đường đến tàu điện",
    "description": "Hỏi đường, nghe hướng dẫn đơn giản.",
    "vocab": [
      {
        "zh": "地铁",
        "pinyin": "di tie",
        "vi": "tàu điện ngầm"
      },
      {
        "zh": "站",
        "pinyin": "zhan",
        "vi": "ga/trạm"
      },
      {
        "zh": "怎么走",
        "pinyin": "zen me zou",
        "vi": "đi thế nào"
      },
      {
        "zh": "一直",
        "pinyin": "yi zhi",
        "vi": "đi thẳng"
      },
      {
        "zh": "左转",
        "pinyin": "zuo zhuan",
        "vi": "rẽ trái"
      },
      {
        "zh": "右转",
        "pinyin": "you zhuan",
        "vi": "rẽ phải"
      },
      {
        "zh": "很远",
        "pinyin": "hen yuan",
        "vi": "xa"
      },
      {
        "zh": "不远",
        "pinyin": "bu yuan",
        "vi": "không xa"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：不好意思，请问地铁站怎么走？",
        "pinyin": "xiao ming: bu hao yi si, qing wen di tie zhan zen me zou?",
        "vi": "Tiểu Minh: Xin lỗi, cho hỏi đi đến ga tàu điện ngầm thế nào?"
      },
      {
        "zh": "路人：你先一直走，到路口右转。",
        "pinyin": "lu ren: ni xian yi zhi zou, dao lu kou you zhuan.",
        "vi": "Người qua đường: Bạn đi thẳng, tới ngã tư rẽ phải."
      },
      {
        "zh": "小明：右转以后呢？",
        "pinyin": "xiao ming: you zhuan yi hou ne?",
        "vi": "Tiểu Minh: Rẽ phải rồi sao nữa?"
      },
      {
        "zh": "路人：再走两分钟就到地铁站了，不远。",
        "pinyin": "lu ren: zai zou liang fen zhong jiu dao di tie zhan le, bu yuan.",
        "vi": "Người qua đường: Đi thêm 2 phút là tới, không xa."
      },
      {
        "zh": "小明：太好了，谢谢你！",
        "pinyin": "xiao ming: tai hao le, xie xie ni!",
        "vi": "Tiểu Minh: Tuyệt quá, cảm ơn bạn!"
      },
      {
        "zh": "路人：不客气。",
        "pinyin": "lu ren: bu ke qi.",
        "vi": "Người qua đường: Không có gì."
      }
    ]
  },
  {
    "id": "order_food",
    "level": 1,
    "title": "Gọi món ở quán",
    "description": "Gọi món, hỏi cay hay không.",
    "vocab": [
      {
        "zh": "菜单",
        "pinyin": "cai dan",
        "vi": "thực đơn"
      },
      {
        "zh": "点",
        "pinyin": "dian",
        "vi": "gọi món"
      },
      {
        "zh": "米饭",
        "pinyin": "mi fan",
        "vi": "cơm"
      },
      {
        "zh": "面条",
        "pinyin": "mian tiao",
        "vi": "mì"
      },
      {
        "zh": "辣",
        "pinyin": "la",
        "vi": "cay"
      },
      {
        "zh": "不辣",
        "pinyin": "bu la",
        "vi": "không cay"
      },
      {
        "zh": "再来",
        "pinyin": "zai lai",
        "vi": "thêm nữa"
      },
      {
        "zh": "买单",
        "pinyin": "mai dan",
        "vi": "tính tiền"
      }
    ],
    "sentences": [
      {
        "zh": "服务员：你好，这是菜单。",
        "pinyin": "fu wu yuan: ni hao, zhe shi cai dan.",
        "vi": "Phục vụ: Xin chào, đây là thực đơn."
      },
      {
        "zh": "小丽：我们点一个面条，一个米饭。",
        "pinyin": "xiao li: wo men dian yi ge mian tiao, yi ge mi fan.",
        "vi": "Tiểu Lệ: Bọn mình gọi một mì, một cơm."
      },
      {
        "zh": "服务员：要辣吗？",
        "pinyin": "fu wu yuan: yao la ma?",
        "vi": "Phục vụ: Có muốn cay không?"
      },
      {
        "zh": "小明：我不辣，她一点辣。",
        "pinyin": "xiao ming: wo bu la, ta yi dian la.",
        "vi": "Tiểu Minh: Mình không cay, cô ấy cay chút."
      },
      {
        "zh": "小丽：再来两杯水，谢谢。",
        "pinyin": "xiao li: zai lai liang bei shui, xie xie.",
        "vi": "Tiểu Lệ: Thêm hai cốc nước, cảm ơn."
      },
      {
        "zh": "小明：吃完我们买单。",
        "pinyin": "xiao ming: chi wan wo men mai dan.",
        "vi": "Tiểu Minh: Ăn xong bọn mình tính tiền."
      }
    ]
  },
  {
    "id": "in_class",
    "level": 1,
    "title": "Ở lớp học tiếng Trung",
    "description": "Hỏi bài, nhờ giải thích.",
    "vocab": [
      {
        "zh": "老师",
        "pinyin": "lao shi",
        "vi": "giáo viên"
      },
      {
        "zh": "同学",
        "pinyin": "tong xue",
        "vi": "bạn cùng lớp"
      },
      {
        "zh": "问题",
        "pinyin": "wen ti",
        "vi": "câu hỏi/vấn đề"
      },
      {
        "zh": "意思",
        "pinyin": "yi si",
        "vi": "ý nghĩa"
      },
      {
        "zh": "再说一遍",
        "pinyin": "zai shuo yi bian",
        "vi": "nói lại một lần"
      },
      {
        "zh": "听不懂",
        "pinyin": "ting bu dong",
        "vi": "không hiểu"
      },
      {
        "zh": "练习",
        "pinyin": "lian xi",
        "vi": "luyện tập"
      },
      {
        "zh": "作业",
        "pinyin": "zuo ye",
        "vi": "bài tập"
      }
    ],
    "sentences": [
      {
        "zh": "老师：今天我们练习说中文。",
        "pinyin": "lao shi: jin tian wo men lian xi shuo zhong wen.",
        "vi": "Thầy/cô: Hôm nay chúng ta luyện nói tiếng Trung."
      },
      {
        "zh": "小明：老师，我有一个问题。",
        "pinyin": "xiao ming: lao shi, wo you yi ge wen ti.",
        "vi": "Tiểu Minh: Thầy/cô ơi, em có một câu hỏi."
      },
      {
        "zh": "小明：这个句子的意思我听不懂。",
        "pinyin": "xiao ming: zhe ge ju zi de yi si wo ting bu dong.",
        "vi": "Tiểu Minh: Em không hiểu ý nghĩa câu này."
      },
      {
        "zh": "老师：好，我再说一遍，也写在黑板上。",
        "pinyin": "lao shi: hao, wo zai shuo yi bian, ye xie zai hei ban shang.",
        "vi": "Thầy/cô: Được, thầy/cô nói lại một lần và viết lên bảng."
      },
      {
        "zh": "小丽：下课以后我们一起练习。",
        "pinyin": "xiao li: xia ke yi hou wo men yi qi lian xi.",
        "vi": "Tiểu Lệ: Tan học mình luyện cùng nhé."
      },
      {
        "zh": "老师：别忘了作业。",
        "pinyin": "lao shi: bie wang le zuo ye.",
        "vi": "Thầy/cô: Đừng quên bài tập về nhà."
      }
    ]
  },
  {
    "id": "movie_ticket",
    "level": 1,
    "title": "Mua vé xem phim",
    "description": "Chọn giờ chiếu và ghế ngồi.",
    "vocab": [
      {
        "zh": "电影",
        "pinyin": "dian ying",
        "vi": "phim"
      },
      {
        "zh": "票",
        "pinyin": "piao",
        "vi": "vé"
      },
      {
        "zh": "几点",
        "pinyin": "ji dian",
        "vi": "mấy giờ"
      },
      {
        "zh": "座位",
        "pinyin": "zuo wei",
        "vi": "ghế"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "明天",
        "pinyin": "ming tian",
        "vi": "ngày mai"
      },
      {
        "zh": "两张",
        "pinyin": "liang zhang",
        "vi": "hai tấm"
      },
      {
        "zh": "便宜",
        "pinyin": "pian yi",
        "vi": "rẻ"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：你想看什么电影？",
        "pinyin": "xiao li: ni xiang kan shen me dian ying?",
        "vi": "Tiểu Lệ: Bạn muốn xem phim gì?"
      },
      {
        "zh": "小明：我想看新的喜剧。",
        "pinyin": "xiao ming: wo xiang kan xin de xi ju.",
        "vi": "Tiểu Minh: Mình muốn xem phim hài mới."
      },
      {
        "zh": "售票员：你好，要几张票？",
        "pinyin": "shou piao yuan: ni hao, yao ji zhang piao?",
        "vi": "Nhân viên bán vé: Xin chào, cần mấy vé?"
      },
      {
        "zh": "小明：两张，今天晚上八点的。",
        "pinyin": "xiao ming: liang zhang, jin tian wan shang ba dian de.",
        "vi": "Tiểu Minh: Hai vé, suất 8 giờ tối nay."
      },
      {
        "zh": "售票员：座位在中间，可以吗？",
        "pinyin": "shou piao yuan: zuo wei zai zhong jian, ke yi ma?",
        "vi": "Nhân viên: Ghế ở giữa, được không?"
      },
      {
        "zh": "小丽：可以，谢谢。",
        "pinyin": "xiao li: ke yi, xie xie.",
        "vi": "Tiểu Lệ: Được, cảm ơn."
      }
    ]
  },
  {
    "id": "see_doctor",
    "level": 2,
    "title": "Đi khám bệnh",
    "description": "Mô tả triệu chứng đơn giản và nhận lời khuyên.",
    "vocab": [
      {
        "zh": "医生",
        "pinyin": "yi sheng",
        "vi": "bác sĩ"
      },
      {
        "zh": "不舒服",
        "pinyin": "bu shu fu",
        "vi": "khó chịu"
      },
      {
        "zh": "发烧",
        "pinyin": "fa shao",
        "vi": "sốt"
      },
      {
        "zh": "咳嗽",
        "pinyin": "ke sou",
        "vi": "ho"
      },
      {
        "zh": "多喝水",
        "pinyin": "duo he shui",
        "vi": "uống nhiều nước"
      },
      {
        "zh": "休息",
        "pinyin": "xiu xi",
        "vi": "nghỉ ngơi"
      },
      {
        "zh": "药",
        "pinyin": "yao",
        "vi": "thuốc"
      },
      {
        "zh": "两天",
        "pinyin": "liang tian",
        "vi": "hai ngày"
      }
    ],
    "sentences": [
      {
        "zh": "医生：你哪里不舒服？",
        "pinyin": "yi sheng: ni na li bu shu fu?",
        "vi": "Bác sĩ: Bạn khó chịu chỗ nào?"
      },
      {
        "zh": "小明：我有点发烧，还咳嗽。",
        "pinyin": "xiao ming: wo you dian fa shao, hai ke sou.",
        "vi": "Tiểu Minh: Mình hơi sốt và ho."
      },
      {
        "zh": "医生：先量一下体温。",
        "pinyin": "yi sheng: xian liang yi xia ti wen.",
        "vi": "Bác sĩ: Trước tiên đo nhiệt độ."
      },
      {
        "zh": "医生：问题不大，多喝水，多休息。",
        "pinyin": "yi sheng: wen ti bu da, duo he shui, duo xiu xi.",
        "vi": "Bác sĩ: Không nghiêm trọng, uống nhiều nước, nghỉ nhiều."
      },
      {
        "zh": "医生：我给你开一点药。",
        "pinyin": "yi sheng: wo gei ni kai yi dian yao.",
        "vi": "Bác sĩ: Tôi kê cho bạn ít thuốc."
      },
      {
        "zh": "小明：谢谢医生，我会注意。",
        "pinyin": "xiao ming: xie xie yi sheng, wo hui zhu yi.",
        "vi": "Tiểu Minh: Cảm ơn bác sĩ, tôi sẽ chú ý."
      }
    ]
  },
  {
    "id": "supermarket",
    "level": 1,
    "title": "Ở siêu thị",
    "description": "Tìm đồ và hỏi nhân viên.",
    "vocab": [
      {
        "zh": "超市",
        "pinyin": "chao shi",
        "vi": "siêu thị"
      },
      {
        "zh": "牛奶",
        "pinyin": "niu nai",
        "vi": "sữa"
      },
      {
        "zh": "面包",
        "pinyin": "mian bao",
        "vi": "bánh mì"
      },
      {
        "zh": "在哪儿",
        "pinyin": "zai nar",
        "vi": "ở đâu"
      },
      {
        "zh": "这边",
        "pinyin": "zhe bian",
        "vi": "bên này"
      },
      {
        "zh": "收银台",
        "pinyin": "shou yin tai",
        "vi": "quầy thu ngân"
      },
      {
        "zh": "排队",
        "pinyin": "pai dui",
        "vi": "xếp hàng"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：我们去超市买牛奶和面包。",
        "pinyin": "xiao li: wo men qu chao shi mai niu nai he mian bao.",
        "vi": "Tiểu Lệ: Mình đi siêu thị mua sữa và bánh mì."
      },
      {
        "zh": "小明：牛奶在哪儿？",
        "pinyin": "xiao ming: niu nai zai nar?",
        "vi": "Tiểu Minh: Sữa ở đâu?"
      },
      {
        "zh": "店员：在那边，左边第二排。",
        "pinyin": "dian yuan: zai na bian, zuo bian di er pai.",
        "vi": "Nhân viên: Ở kia, dãy thứ hai bên trái."
      },
      {
        "zh": "小明：谢谢！面包呢？",
        "pinyin": "xiao ming: xie xie! mian bao ne?",
        "vi": "Tiểu Minh: Cảm ơn! Còn bánh mì?"
      },
      {
        "zh": "店员：这边，靠近收银台。",
        "pinyin": "dian yuan: zhe bian, kao jin shou yin tai.",
        "vi": "Nhân viên: Bên này, gần quầy thu ngân."
      },
      {
        "zh": "小丽：买好了，我们去排队。",
        "pinyin": "xiao li: mai hao le, wo men qu pai dui.",
        "vi": "Tiểu Lệ: Mua xong rồi, đi xếp hàng thôi."
      }
    ]
  },
  {
    "id": "hotel_checkin",
    "level": 2,
    "title": "Đặt phòng khách sạn",
    "description": "Nhận phòng, hỏi wifi và giờ trả phòng.",
    "vocab": [
      {
        "zh": "酒店",
        "pinyin": "jiu dian",
        "vi": "khách sạn"
      },
      {
        "zh": "预订",
        "pinyin": "yu ding",
        "vi": "đặt trước"
      },
      {
        "zh": "房间",
        "pinyin": "fang jian",
        "vi": "phòng"
      },
      {
        "zh": "身份证",
        "pinyin": "shen fen zheng",
        "vi": "CMND/hộ chiếu"
      },
      {
        "zh": "钥匙",
        "pinyin": "yao shi",
        "vi": "chìa khóa"
      },
      {
        "zh": "无线网",
        "pinyin": "wu xian wang",
        "vi": "wifi"
      },
      {
        "zh": "退房",
        "pinyin": "tui fang",
        "vi": "trả phòng"
      },
      {
        "zh": "几点",
        "pinyin": "ji dian",
        "vi": "mấy giờ"
      }
    ],
    "sentences": [
      {
        "zh": "前台：你好，请问有预订吗？",
        "pinyin": "qian tai: ni hao, qing wen you yu ding ma?",
        "vi": "Lễ tân: Xin chào, bạn có đặt trước không?"
      },
      {
        "zh": "小明：有，我预订了一个房间。",
        "pinyin": "xiao ming: you, wo yu ding le yi ge fang jian.",
        "vi": "Tiểu Minh: Có, tôi đặt một phòng."
      },
      {
        "zh": "前台：请给我你的身份证。",
        "pinyin": "qian tai: qing gei wo ni de shen fen zheng.",
        "vi": "Lễ tân: Cho tôi xem giấy tờ của bạn."
      },
      {
        "zh": "前台：这是钥匙，无线网密码在这里。",
        "pinyin": "qian tai: zhe shi yao shi, wu xian wang mi ma zai zhe li.",
        "vi": "Lễ tân: Đây là chìa khóa, mật khẩu wifi ở đây."
      },
      {
        "zh": "小丽：退房是几点？",
        "pinyin": "xiao li: tui fang shi ji dian?",
        "vi": "Tiểu Lệ: Trả phòng lúc mấy giờ?"
      },
      {
        "zh": "前台：中午十二点。祝你们住得开心。",
        "pinyin": "qian tai: zhong wu shi er dian. zhu ni men zhu de kai xin.",
        "vi": "Lễ tân: 12 giờ trưa. Chúc bạn ở vui vẻ."
      }
    ]
  },
  {
    "id": "new_friend",
    "level": 1,
    "title": "Gặp bạn mới",
    "description": "Làm quen và giới thiệu bản thân.",
    "vocab": [
      {
        "zh": "认识",
        "pinyin": "ren shi",
        "vi": "làm quen"
      },
      {
        "zh": "名字",
        "pinyin": "ming zi",
        "vi": "tên"
      },
      {
        "zh": "来自",
        "pinyin": "lai zi",
        "vi": "đến từ"
      },
      {
        "zh": "越南",
        "pinyin": "yue nan",
        "vi": "Việt Nam"
      },
      {
        "zh": "学习",
        "pinyin": "xue xi",
        "vi": "học"
      },
      {
        "zh": "中文",
        "pinyin": "zhong wen",
        "vi": "tiếng Trung"
      },
      {
        "zh": "朋友",
        "pinyin": "peng you",
        "vi": "bạn bè"
      },
      {
        "zh": "很高兴",
        "pinyin": "hen gao xing",
        "vi": "rất vui"
      }
    ],
    "sentences": [
      {
        "zh": "小明：你好，我叫小明。",
        "pinyin": "xiao ming: ni hao, wo jiao xiao ming.",
        "vi": "Tiểu Minh: Xin chào, mình tên Tiểu Minh."
      },
      {
        "zh": "小丽：你好，我叫小丽，很高兴认识你。",
        "pinyin": "xiao li: ni hao, wo jiao xiao li, hen gao xing ren shi ni.",
        "vi": "Tiểu Lệ: Xin chào, mình là Tiểu Lệ, rất vui gặp bạn."
      },
      {
        "zh": "小明：你来自哪里？",
        "pinyin": "xiao ming: ni lai zi na li?",
        "vi": "Tiểu Minh: Bạn đến từ đâu?"
      },
      {
        "zh": "小丽：我来自越南，现在在这里学习中文。",
        "pinyin": "xiao li: wo lai zi yue nan, xian zai zai zhe li xue xi zhong wen.",
        "vi": "Tiểu Lệ: Mình từ Việt Nam, hiện đang học tiếng Trung ở đây."
      },
      {
        "zh": "小明：太好了，我们做朋友吧。",
        "pinyin": "xiao ming: tai hao le, wo men zuo peng you ba.",
        "vi": "Tiểu Minh: Tuyệt, mình làm bạn nhé."
      },
      {
        "zh": "小丽：好啊！",
        "pinyin": "xiao li: hao a!",
        "vi": "Tiểu Lệ: Được chứ!"
      }
    ]
  },
  {
    "id": "rain_umbrella",
    "level": 1,
    "title": "Trời mưa mang ô",
    "description": "Nói chuyện về thời tiết và đi chung.",
    "vocab": [
      {
        "zh": "下雨",
        "pinyin": "xia yu",
        "vi": "mưa"
      },
      {
        "zh": "雨伞",
        "pinyin": "yu san",
        "vi": "ô"
      },
      {
        "zh": "带",
        "pinyin": "dai",
        "vi": "mang theo"
      },
      {
        "zh": "出门",
        "pinyin": "chu men",
        "vi": "ra ngoài"
      },
      {
        "zh": "衣服",
        "pinyin": "yi fu",
        "vi": "quần áo"
      },
      {
        "zh": "湿",
        "pinyin": "shi",
        "vi": "ướt"
      },
      {
        "zh": "一起",
        "pinyin": "yi qi",
        "vi": "cùng nhau"
      },
      {
        "zh": "小心",
        "pinyin": "xiao xin",
        "vi": "cẩn thận"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：外面下雨了。",
        "pinyin": "xiao li: wai mian xia yu le.",
        "vi": "Tiểu Lệ: Bên ngoài mưa rồi."
      },
      {
        "zh": "小明：你带雨伞了吗？",
        "pinyin": "xiao ming: ni dai yu san le ma?",
        "vi": "Tiểu Minh: Bạn mang ô chưa?"
      },
      {
        "zh": "小丽：我带了，我们一起走吧。",
        "pinyin": "xiao li: wo dai le, wo men yi qi zou ba.",
        "vi": "Tiểu Lệ: Mình mang rồi, đi cùng nhé."
      },
      {
        "zh": "小明：太好了，不然衣服会湿。",
        "pinyin": "xiao ming: tai hao le, bu ran yi fu hui shi.",
        "vi": "Tiểu Minh: Tuyệt, không thì quần áo sẽ ướt."
      },
      {
        "zh": "小丽：路有点滑，小心。",
        "pinyin": "xiao li: lu you dian hua, xiao xin.",
        "vi": "Tiểu Lệ: Đường hơi trơn, cẩn thận."
      },
      {
        "zh": "小明：谢谢你。",
        "pinyin": "xiao ming: xie xie ni.",
        "vi": "Tiểu Minh: Cảm ơn bạn."
      }
    ]
  },
  {
    "id": "late_work",
    "level": 2,
    "title": "Đi làm muộn",
    "description": "Xin lỗi và giải thích lý do.",
    "vocab": [
      {
        "zh": "上班",
        "pinyin": "shang ban",
        "vi": "đi làm"
      },
      {
        "zh": "迟到",
        "pinyin": "chi dao",
        "vi": "đi muộn"
      },
      {
        "zh": "堵车",
        "pinyin": "du che",
        "vi": "kẹt xe"
      },
      {
        "zh": "经理",
        "pinyin": "jing li",
        "vi": "quản lý"
      },
      {
        "zh": "抱歉",
        "pinyin": "bao qian",
        "vi": "xin lỗi"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "以后",
        "pinyin": "yi hou",
        "vi": "sau này"
      },
      {
        "zh": "早点",
        "pinyin": "zao dian",
        "vi": "sớm hơn"
      }
    ],
    "sentences": [
      {
        "zh": "经理：你今天怎么迟到了？",
        "pinyin": "jing li: ni jin tian zen me chi dao le?",
        "vi": "Quản lý: Hôm nay sao bạn đi muộn?"
      },
      {
        "zh": "小明：抱歉，路上堵车很严重。",
        "pinyin": "xiao ming: bao qian, lu shang du che hen yan zhong.",
        "vi": "Tiểu Minh: Xin lỗi, trên đường kẹt xe nặng."
      },
      {
        "zh": "经理：下次早点出门。",
        "pinyin": "jing li: xia ci zao dian chu men.",
        "vi": "Quản lý: Lần sau ra khỏi nhà sớm hơn."
      },
      {
        "zh": "小明：好的，我以后会注意。",
        "pinyin": "xiao ming: hao de, wo yi hou hui zhu yi.",
        "vi": "Tiểu Minh: Vâng, sau này tôi sẽ chú ý."
      },
      {
        "zh": "经理：先去工作吧。",
        "pinyin": "jing li: xian qu gong zuo ba.",
        "vi": "Quản lý: Đi làm việc trước đi."
      },
      {
        "zh": "小明：谢谢经理。",
        "pinyin": "xiao ming: xie xie jing li.",
        "vi": "Tiểu Minh: Cảm ơn quản lý."
      }
    ]
  },
  {
    "id": "coffee_date",
    "level": 1,
    "title": "Hẹn cà phê",
    "description": "Hẹn thời gian và địa điểm.",
    "vocab": [
      {
        "zh": "咖啡",
        "pinyin": "ka fei",
        "vi": "cà phê"
      },
      {
        "zh": "一起",
        "pinyin": "yi qi",
        "vi": "cùng"
      },
      {
        "zh": "什么时候",
        "pinyin": "shen me shi hou",
        "vi": "khi nào"
      },
      {
        "zh": "下午",
        "pinyin": "xia wu",
        "vi": "buổi chiều"
      },
      {
        "zh": "地方",
        "pinyin": "di fang",
        "vi": "địa điểm"
      },
      {
        "zh": "见面",
        "pinyin": "jian mian",
        "vi": "gặp mặt"
      },
      {
        "zh": "没问题",
        "pinyin": "mei wen ti",
        "vi": "không vấn đề"
      },
      {
        "zh": "再见",
        "pinyin": "zai jian",
        "vi": "tạm biệt"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：周末我们一起喝咖啡吧。",
        "pinyin": "xiao li: zhou mo wo men yi qi he ka fei ba.",
        "vi": "Tiểu Lệ: Cuối tuần mình đi uống cà phê nhé."
      },
      {
        "zh": "小明：好啊，什么时候？",
        "pinyin": "xiao ming: hao a, shen me shi hou?",
        "vi": "Tiểu Minh: Được, khi nào?"
      },
      {
        "zh": "小丽：星期六下午两点。",
        "pinyin": "xiao li: xing qi liu xia wu liang dian.",
        "vi": "Tiểu Lệ: Thứ bảy 2 giờ chiều."
      },
      {
        "zh": "小明：在哪个地方见面？",
        "pinyin": "xiao ming: zai na ge di fang jian mian?",
        "vi": "Tiểu Minh: Gặp ở đâu?"
      },
      {
        "zh": "小丽：在地铁站旁边的咖啡店。",
        "pinyin": "xiao li: zai di tie zhan pang bian de ka fei dian.",
        "vi": "Tiểu Lệ: Ở quán cà phê cạnh ga tàu điện."
      },
      {
        "zh": "小明：没问题，到时候见。",
        "pinyin": "xiao ming: mei wen ti, dao shi hou jian.",
        "vi": "Tiểu Minh: Ok, hẹn gặp."
      }
    ]
  },
  {
    "id": "airport",
    "level": 2,
    "title": "Ở sân bay",
    "description": "Làm thủ tục và hỏi cổng lên máy bay.",
    "vocab": [
      {
        "zh": "机场",
        "pinyin": "ji chang",
        "vi": "sân bay"
      },
      {
        "zh": "登机",
        "pinyin": "deng ji",
        "vi": "lên máy bay"
      },
      {
        "zh": "航班",
        "pinyin": "hang ban",
        "vi": "chuyến bay"
      },
      {
        "zh": "护照",
        "pinyin": "hu zhao",
        "vi": "hộ chiếu"
      },
      {
        "zh": "行李",
        "pinyin": "xing li",
        "vi": "hành lý"
      },
      {
        "zh": "安检",
        "pinyin": "an jian",
        "vi": "an ninh"
      },
      {
        "zh": "登机口",
        "pinyin": "deng ji kou",
        "vi": "cổng lên máy bay"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "工作人员：请出示护照和机票。",
        "pinyin": "gong zuo ren yuan: qing chu shi hu zhao he ji piao.",
        "vi": "Nhân viên: Vui lòng đưa hộ chiếu và vé."
      },
      {
        "zh": "小明：好的，这是我的护照。",
        "pinyin": "xiao ming: hao de, zhe shi wo de hu zhao.",
        "vi": "Tiểu Minh: Vâng, đây là hộ chiếu của tôi."
      },
      {
        "zh": "工作人员：你的行李要托运吗？",
        "pinyin": "gong zuo ren yuan: ni de xing li yao tuo yun ma?",
        "vi": "Nhân viên: Hành lý của bạn có ký gửi không?"
      },
      {
        "zh": "小明：要，一个箱子。",
        "pinyin": "xiao ming: yao, yi ge xiang zi.",
        "vi": "Tiểu Minh: Có, một vali."
      },
      {
        "zh": "小丽：登机口在哪里？",
        "pinyin": "xiao li: deng ji kou zai na li?",
        "vi": "Tiểu Lệ: Cổng lên máy bay ở đâu?"
      },
      {
        "zh": "工作人员：过了安检右转就是。",
        "pinyin": "gong zuo ren yuan: guo le an jian you zhuan jiu shi.",
        "vi": "Nhân viên: Qua an ninh rẽ phải là tới."
      }
    ]
  },
  {
    "id": "take_photo",
    "level": 1,
    "title": "Nhờ chụp ảnh",
    "description": "Nhờ người khác chụp ảnh và cảm ơn.",
    "vocab": [
      {
        "zh": "拍照",
        "pinyin": "pai zhao",
        "vi": "chụp ảnh"
      },
      {
        "zh": "可以吗",
        "pinyin": "ke yi ma",
        "vi": "được không"
      },
      {
        "zh": "帮忙",
        "pinyin": "bang mang",
        "vi": "giúp đỡ"
      },
      {
        "zh": "这里",
        "pinyin": "zhe li",
        "vi": "ở đây"
      },
      {
        "zh": "好看",
        "pinyin": "hao kan",
        "vi": "đẹp"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      },
      {
        "zh": "再拍一张",
        "pinyin": "zai pai yi zhang",
        "vi": "chụp thêm một tấm"
      },
      {
        "zh": "没问题",
        "pinyin": "mei wen ti",
        "vi": "không vấn đề"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：不好意思，可以帮我们拍照吗？",
        "pinyin": "xiao li: bu hao yi si, ke yi bang wo men pai zhao ma?",
        "vi": "Tiểu Lệ: Xin lỗi, bạn có thể chụp ảnh giúp bọn mình không?"
      },
      {
        "zh": "路人：没问题，你们站在这里。",
        "pinyin": "lu ren: mei wen ti, ni men zhan zai zhe li.",
        "vi": "Người qua đường: Không vấn đề, hai bạn đứng ở đây."
      },
      {
        "zh": "小明：这样可以吗？",
        "pinyin": "xiao ming: zhe yang ke yi ma?",
        "vi": "Tiểu Minh: Như vậy được chưa?"
      },
      {
        "zh": "路人：可以，很好看。",
        "pinyin": "lu ren: ke yi, hen hao kan.",
        "vi": "Người qua đường: Được, đẹp lắm."
      },
      {
        "zh": "小丽：再拍一张，谢谢！",
        "pinyin": "xiao li: zai pai yi zhang, xie xie!",
        "vi": "Tiểu Lệ: Chụp thêm tấm nữa, cảm ơn!"
      },
      {
        "zh": "路人：不客气。",
        "pinyin": "lu ren: bu ke qi.",
        "vi": "Người qua đường: Không có gì."
      }
    ]
  },
  {
    "id": "bargain_clothes",
    "level": 2,
    "title": "Trả giá mua áo",
    "description": "Hỏi size, giá và trả giá nhẹ nhàng.",
    "vocab": [
      {
        "zh": "衣服",
        "pinyin": "yi fu",
        "vi": "quần áo"
      },
      {
        "zh": "这件",
        "pinyin": "zhe jian",
        "vi": "cái này"
      },
      {
        "zh": "尺码",
        "pinyin": "chi ma",
        "vi": "size"
      },
      {
        "zh": "太贵",
        "pinyin": "tai gui",
        "vi": "quá đắt"
      },
      {
        "zh": "便宜一点",
        "pinyin": "pian yi yi dian",
        "vi": "rẻ hơn chút"
      },
      {
        "zh": "试穿",
        "pinyin": "shi chuan",
        "vi": "thử"
      },
      {
        "zh": "可以",
        "pinyin": "ke yi",
        "vi": "được"
      },
      {
        "zh": "买",
        "pinyin": "mai",
        "vi": "mua"
      }
    ],
    "sentences": [
      {
        "zh": "小明：这件衣服很好看，有我的尺码吗？",
        "pinyin": "xiao ming: zhe jian yi fu hen hao kan, you wo de chi ma ma?",
        "vi": "Tiểu Minh: Áo này đẹp, có size của mình không?"
      },
      {
        "zh": "店员：有的，你可以试穿。",
        "pinyin": "dian yuan: you de, ni ke yi shi chuan.",
        "vi": "Nhân viên: Có, bạn có thể thử."
      },
      {
        "zh": "小明：多少钱？",
        "pinyin": "xiao ming: duo shao qian?",
        "vi": "Tiểu Minh: Bao nhiêu tiền?"
      },
      {
        "zh": "店员：两百。",
        "pinyin": "dian yuan: liang bai.",
        "vi": "Nhân viên: 200."
      },
      {
        "zh": "小明：有点太贵了，能便宜一点吗？",
        "pinyin": "xiao ming: you dian tai gui le, neng pian yi yi dian ma?",
        "vi": "Tiểu Minh: Hơi đắt, rẻ hơn chút được không?"
      },
      {
        "zh": "店员：好吧，一百八。",
        "pinyin": "dian yuan: hao ba, yi bai ba.",
        "vi": "Nhân viên: Thôi được, 180."
      }
    ]
  },
  {
    "id": "buy_medicine",
    "level": 2,
    "title": "Mua thuốc",
    "description": "Mô tả triệu chứng và mua thuốc ở hiệu.",
    "vocab": [
      {
        "zh": "药店",
        "pinyin": "yao dian",
        "vi": "hiệu thuốc"
      },
      {
        "zh": "头疼",
        "pinyin": "tou teng",
        "vi": "đau đầu"
      },
      {
        "zh": "感冒",
        "pinyin": "gan mao",
        "vi": "cảm"
      },
      {
        "zh": "药",
        "pinyin": "yao",
        "vi": "thuốc"
      },
      {
        "zh": "一天",
        "pinyin": "yi tian",
        "vi": "một ngày"
      },
      {
        "zh": "三次",
        "pinyin": "san ci",
        "vi": "ba lần"
      },
      {
        "zh": "饭后",
        "pinyin": "fan hou",
        "vi": "sau ăn"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "店员：你好，需要什么？",
        "pinyin": "dian yuan: ni hao, xu yao shen me?",
        "vi": "Nhân viên: Xin chào, bạn cần gì?"
      },
      {
        "zh": "小丽：我有点感冒，头疼。",
        "pinyin": "xiao li: wo you dian gan mao, tou teng.",
        "vi": "Tiểu Lệ: Mình hơi cảm, đau đầu."
      },
      {
        "zh": "店员：你要这种药吗？",
        "pinyin": "dian yuan: ni yao zhe zhong yao ma?",
        "vi": "Nhân viên: Bạn lấy loại thuốc này không?"
      },
      {
        "zh": "小丽：怎么吃？",
        "pinyin": "xiao li: zen me chi?",
        "vi": "Tiểu Lệ: Uống thế nào?"
      },
      {
        "zh": "店员：一天三次，饭后吃。",
        "pinyin": "dian yuan: yi tian san ci, fan hou chi.",
        "vi": "Nhân viên: Mỗi ngày 3 lần, uống sau ăn."
      },
      {
        "zh": "小丽：好的，谢谢。",
        "pinyin": "xiao li: hao de, xie xie.",
        "vi": "Tiểu Lệ: Vâng, cảm ơn."
      }
    ]
  },
  {
    "id": "exchange_money",
    "level": 2,
    "title": "Đổi tiền",
    "description": "Đổi tiền và hỏi tỷ giá.",
    "vocab": [
      {
        "zh": "换钱",
        "pinyin": "huan qian",
        "vi": "đổi tiền"
      },
      {
        "zh": "汇率",
        "pinyin": "hui lv",
        "vi": "tỷ giá"
      },
      {
        "zh": "现金",
        "pinyin": "xian jin",
        "vi": "tiền mặt"
      },
      {
        "zh": "银行卡",
        "pinyin": "yin hang ka",
        "vi": "thẻ ngân hàng"
      },
      {
        "zh": "多少",
        "pinyin": "duo shao",
        "vi": "bao nhiêu"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "可以",
        "pinyin": "ke yi",
        "vi": "được"
      },
      {
        "zh": "手续费",
        "pinyin": "shou xu fei",
        "vi": "phí"
      }
    ],
    "sentences": [
      {
        "zh": "小明：你好，我想换钱。",
        "pinyin": "xiao ming: ni hao, wo xiang huan qian.",
        "vi": "Tiểu Minh: Xin chào, tôi muốn đổi tiền."
      },
      {
        "zh": "柜员：你想换多少？",
        "pinyin": "gui yuan: ni xiang huan duo shao?",
        "vi": "Giao dịch viên: Bạn muốn đổi bao nhiêu?"
      },
      {
        "zh": "小明：换一千块，可以吗？",
        "pinyin": "xiao ming: huan yi qian kuai, ke yi ma?",
        "vi": "Tiểu Minh: Đổi 1000 tệ được không?"
      },
      {
        "zh": "柜员：可以。今天的汇率在这里。",
        "pinyin": "gui yuan: ke yi. jin tian de hui lv zai zhe li.",
        "vi": "Giao dịch viên: Được. Tỷ giá hôm nay ở đây."
      },
      {
        "zh": "小明：用现金还是银行卡？",
        "pinyin": "xiao ming: yong xian jin hai shi yin hang ka?",
        "vi": "Tiểu Minh: Dùng tiền mặt hay thẻ?"
      },
      {
        "zh": "柜员：都有手续费。",
        "pinyin": "gui yuan: dou you shou xu fei.",
        "vi": "Giao dịch viên: Đều có phí."
      }
    ]
  },
  {
    "id": "ask_time",
    "level": 1,
    "title": "Hỏi giờ",
    "description": "Hỏi giờ và nói lịch hẹn.",
    "vocab": [
      {
        "zh": "现在",
        "pinyin": "xian zai",
        "vi": "bây giờ"
      },
      {
        "zh": "几点",
        "pinyin": "ji dian",
        "vi": "mấy giờ"
      },
      {
        "zh": "时间",
        "pinyin": "shi jian",
        "vi": "thời gian"
      },
      {
        "zh": "马上",
        "pinyin": "ma shang",
        "vi": "ngay"
      },
      {
        "zh": "迟到",
        "pinyin": "chi dao",
        "vi": "muộn"
      },
      {
        "zh": "约会",
        "pinyin": "yue hui",
        "vi": "hẹn"
      },
      {
        "zh": "十分钟",
        "pinyin": "shi fen zhong",
        "vi": "10 phút"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：现在几点了？",
        "pinyin": "xiao li: xian zai ji dian le?",
        "vi": "Tiểu Lệ: Bây giờ mấy giờ rồi?"
      },
      {
        "zh": "小明：两点半。",
        "pinyin": "xiao ming: liang dian ban.",
        "vi": "Tiểu Minh: 2 giờ rưỡi."
      },
      {
        "zh": "小丽：糟了，我三点有约会。",
        "pinyin": "xiao li: zao le, wo san dian you yue hui.",
        "vi": "Tiểu Lệ: Chết rồi, 3 giờ mình có hẹn."
      },
      {
        "zh": "小明：别急，还有三十分钟。",
        "pinyin": "xiao ming: bie ji, hai you san shi fen zhong.",
        "vi": "Tiểu Minh: Đừng lo, còn 30 phút."
      },
      {
        "zh": "小丽：我们走快一点。",
        "pinyin": "xiao li: wo men zou kuai yi dian.",
        "vi": "Tiểu Lệ: Mình đi nhanh lên."
      },
      {
        "zh": "小明：好的，十分钟就到。",
        "pinyin": "xiao ming: hao de, shi fen zhong jiu dao.",
        "vi": "Tiểu Minh: Ok, 10 phút là tới."
      }
    ]
  },
  {
    "id": "library",
    "level": 1,
    "title": "Đi thư viện",
    "description": "Mượn sách và hỏi thẻ thư viện.",
    "vocab": [
      {
        "zh": "图书馆",
        "pinyin": "tu shu guan",
        "vi": "thư viện"
      },
      {
        "zh": "借书",
        "pinyin": "jie shu",
        "vi": "mượn sách"
      },
      {
        "zh": "还书",
        "pinyin": "huan shu",
        "vi": "trả sách"
      },
      {
        "zh": "卡",
        "pinyin": "ka",
        "vi": "thẻ"
      },
      {
        "zh": "书",
        "pinyin": "shu",
        "vi": "sách"
      },
      {
        "zh": "可以",
        "pinyin": "ke yi",
        "vi": "được"
      },
      {
        "zh": "安静",
        "pinyin": "an jing",
        "vi": "yên tĩnh"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：这里是图书馆吗？",
        "pinyin": "xiao ming: zhe li shi tu shu guan ma?",
        "vi": "Tiểu Minh: Đây là thư viện phải không?"
      },
      {
        "zh": "管理员：是的，请保持安静。",
        "pinyin": "guan li yuan: shi de, qing bao chi an jing.",
        "vi": "Quản lý: Đúng, vui lòng giữ yên tĩnh."
      },
      {
        "zh": "小丽：我想借书，需要卡吗？",
        "pinyin": "xiao li: wo xiang jie shu, xu yao ka ma?",
        "vi": "Tiểu Lệ: Mình muốn mượn sách, cần thẻ không?"
      },
      {
        "zh": "管理员：需要。你可以在前台办卡。",
        "pinyin": "guan li yuan: xu yao. ni ke yi zai qian tai ban ka.",
        "vi": "Quản lý: Cần. Bạn có thể làm thẻ ở quầy."
      },
      {
        "zh": "小明：还书怎么还？",
        "pinyin": "xiao ming: huan shu zen me huan?",
        "vi": "Tiểu Minh: Trả sách thế nào?"
      },
      {
        "zh": "管理员：到期前放到还书箱。",
        "pinyin": "guan li yuan: dao qi qian fang dao huan shu xiang.",
        "vi": "Quản lý: Trước hạn thì bỏ vào thùng trả sách."
      }
    ]
  },
  {
    "id": "restaurant_more",
    "level": 1,
    "title": "Ở nhà hàng gọi thêm",
    "description": "Gọi thêm món và hỏi thanh toán.",
    "vocab": [
      {
        "zh": "再来",
        "pinyin": "zai lai",
        "vi": "thêm nữa"
      },
      {
        "zh": "一杯",
        "pinyin": "yi bei",
        "vi": "một cốc"
      },
      {
        "zh": "茶",
        "pinyin": "cha",
        "vi": "trà"
      },
      {
        "zh": "饺子",
        "pinyin": "jiao zi",
        "vi": "sủi cảo"
      },
      {
        "zh": "好吃",
        "pinyin": "hao chi",
        "vi": "ngon"
      },
      {
        "zh": "买单",
        "pinyin": "mai dan",
        "vi": "tính tiền"
      },
      {
        "zh": "服务员",
        "pinyin": "fu wu yuan",
        "vi": "phục vụ"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：这个饺子真好吃。",
        "pinyin": "xiao ming: zhe ge jiao zi zhen hao chi.",
        "vi": "Tiểu Minh: Sủi cảo này ngon thật."
      },
      {
        "zh": "小丽：服务员，再来一份饺子。",
        "pinyin": "xiao li: fu wu yuan, zai lai yi fen jiao zi.",
        "vi": "Tiểu Lệ: Phục vụ, cho thêm một phần sủi cảo."
      },
      {
        "zh": "服务员：好的，还要喝的吗？",
        "pinyin": "fu wu yuan: hao de, hai yao he de ma?",
        "vi": "Phục vụ: Vâng, còn muốn uống gì không?"
      },
      {
        "zh": "小明：再来一杯茶，谢谢。",
        "pinyin": "xiao ming: zai lai yi bei cha, xie xie.",
        "vi": "Tiểu Minh: Thêm một cốc trà, cảm ơn."
      },
      {
        "zh": "小丽：我们吃完就买单。",
        "pinyin": "xiao li: wo men chi wan jiu mai dan.",
        "vi": "Tiểu Lệ: Ăn xong bọn mình tính tiền."
      },
      {
        "zh": "服务员：没问题。",
        "pinyin": "fu wu yuan: mei wen ti.",
        "vi": "Phục vụ: Không vấn đề."
      }
    ]
  },
  {
    "id": "lost_keys",
    "level": 2,
    "title": "Mất chìa khóa",
    "description": "Tìm chìa khóa và hỏi bảo vệ.",
    "vocab": [
      {
        "zh": "钥匙",
        "pinyin": "yao shi",
        "vi": "chìa khóa"
      },
      {
        "zh": "丢了",
        "pinyin": "diu le",
        "vi": "mất rồi"
      },
      {
        "zh": "门口",
        "pinyin": "men kou",
        "vi": "cửa"
      },
      {
        "zh": "保安",
        "pinyin": "bao an",
        "vi": "bảo vệ"
      },
      {
        "zh": "找到",
        "pinyin": "zhao dao",
        "vi": "tìm thấy"
      },
      {
        "zh": "可能",
        "pinyin": "ke neng",
        "vi": "có thể"
      },
      {
        "zh": "包",
        "pinyin": "bao",
        "vi": "túi"
      },
      {
        "zh": "里面",
        "pinyin": "li mian",
        "vi": "bên trong"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：我把钥匙丢了。",
        "pinyin": "xiao li: wo ba yao shi diu le.",
        "vi": "Tiểu Lệ: Mình làm mất chìa khóa rồi."
      },
      {
        "zh": "小明：你最后一次看到在哪儿？",
        "pinyin": "xiao ming: ni zui hou yi ci kan dao zai nar?",
        "vi": "Tiểu Minh: Lần cuối bạn thấy ở đâu?"
      },
      {
        "zh": "小丽：可能在门口。",
        "pinyin": "xiao li: ke neng zai men kou.",
        "vi": "Tiểu Lệ: Có thể ở cửa."
      },
      {
        "zh": "小明：我们去问一下保安。",
        "pinyin": "xiao ming: wo men qu wen yi xia bao an.",
        "vi": "Tiểu Minh: Mình đi hỏi bảo vệ."
      },
      {
        "zh": "保安：你看看是不是在你的包里面。",
        "pinyin": "bao an: ni kan kan shi bu shi zai ni de bao li mian.",
        "vi": "Bảo vệ: Bạn xem có phải ở trong túi không."
      },
      {
        "zh": "小丽：啊，找到了！谢谢。",
        "pinyin": "xiao li: a, zhao dao le! xie xie.",
        "vi": "Tiểu Lệ: À, tìm thấy rồi! Cảm ơn."
      }
    ]
  },
  {
    "id": "study_group",
    "level": 2,
    "title": "Học bài nhóm",
    "description": "Hẹn học nhóm và chia việc.",
    "vocab": [
      {
        "zh": "一起",
        "pinyin": "yi qi",
        "vi": "cùng nhau"
      },
      {
        "zh": "复习",
        "pinyin": "fu xi",
        "vi": "ôn tập"
      },
      {
        "zh": "考试",
        "pinyin": "kao shi",
        "vi": "kỳ thi"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "明天",
        "pinyin": "ming tian",
        "vi": "ngày mai"
      },
      {
        "zh": "资料",
        "pinyin": "zi liao",
        "vi": "tài liệu"
      },
      {
        "zh": "准备",
        "pinyin": "zhun bei",
        "vi": "chuẩn bị"
      },
      {
        "zh": "负责",
        "pinyin": "fu ze",
        "vi": "phụ trách"
      }
    ],
    "sentences": [
      {
        "zh": "小明：明天要考试，我们一起复习吧。",
        "pinyin": "xiao ming: ming tian yao kao shi, wo men yi qi fu xi ba.",
        "vi": "Tiểu Minh: Mai thi rồi, mình ôn cùng nhé."
      },
      {
        "zh": "小丽：好啊，你准备资料，我负责练习题。",
        "pinyin": "xiao li: hao a, ni zhun bei zi liao, wo fu ze lian xi ti.",
        "vi": "Tiểu Lệ: Ok, bạn chuẩn bị tài liệu, mình phụ trách bài tập."
      },
      {
        "zh": "小明：我们几点开始？",
        "pinyin": "xiao ming: wo men ji dian kai shi?",
        "vi": "Tiểu Minh: Mấy giờ bắt đầu?"
      },
      {
        "zh": "小丽：今天晚上七点，在图书馆。",
        "pinyin": "xiao li: jin tian wan shang qi dian, zai tu shu guan.",
        "vi": "Tiểu Lệ: 7 giờ tối nay, ở thư viện."
      },
      {
        "zh": "小明：没问题，我会准时到。",
        "pinyin": "xiao ming: mei wen ti, wo hui zhun shi dao.",
        "vi": "Tiểu Minh: Ok, mình sẽ đến đúng giờ."
      },
      {
        "zh": "小丽：一起加油！",
        "pinyin": "xiao li: yi qi jia you!",
        "vi": "Tiểu Lệ: Cùng cố lên!"
      }
    ]
  },
  {
    "id": "exercise",
    "level": 1,
    "title": "Tập thể dục",
    "description": "Rủ nhau đi chạy bộ và nói về sức khỏe.",
    "vocab": [
      {
        "zh": "运动",
        "pinyin": "yun dong",
        "vi": "vận động"
      },
      {
        "zh": "跑步",
        "pinyin": "pao bu",
        "vi": "chạy bộ"
      },
      {
        "zh": "健康",
        "pinyin": "jian kang",
        "vi": "sức khỏe"
      },
      {
        "zh": "每天",
        "pinyin": "mei tian",
        "vi": "mỗi ngày"
      },
      {
        "zh": "早上",
        "pinyin": "zao shang",
        "vi": "buổi sáng"
      },
      {
        "zh": "有空",
        "pinyin": "you kong",
        "vi": "rảnh"
      },
      {
        "zh": "一起",
        "pinyin": "yi qi",
        "vi": "cùng"
      },
      {
        "zh": "坚持",
        "pinyin": "jian chi",
        "vi": "kiên trì"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：你喜欢运动吗？",
        "pinyin": "xiao li: ni xi huan yun dong ma?",
        "vi": "Tiểu Lệ: Bạn thích vận động không?"
      },
      {
        "zh": "小明：我喜欢跑步，对健康很好。",
        "pinyin": "xiao ming: wo xi huan pao bu, dui jian kang hen hao.",
        "vi": "Tiểu Minh: Mình thích chạy bộ, tốt cho sức khỏe."
      },
      {
        "zh": "小丽：我们早上一起跑步吧。",
        "pinyin": "xiao li: wo men zao shang yi qi pao bu ba.",
        "vi": "Tiểu Lệ: Sáng mình chạy cùng nhé."
      },
      {
        "zh": "小明：你每天有空吗？",
        "pinyin": "xiao ming: ni mei tian you kong ma?",
        "vi": "Tiểu Minh: Bạn ngày nào cũng rảnh không?"
      },
      {
        "zh": "小丽：不一定，但我会坚持。",
        "pinyin": "xiao li: bu yi ding, dan wo hui jian chi.",
        "vi": "Tiểu Lệ: Không chắc, nhưng mình sẽ kiên trì."
      },
      {
        "zh": "小明：太好了！",
        "pinyin": "xiao ming: tai hao le!",
        "vi": "Tiểu Minh: Tuyệt!"
      }
    ]
  },
  {
    "id": "food_delivery",
    "level": 2,
    "title": "Đặt đồ ăn online",
    "description": "Đặt đồ ăn, chọn địa chỉ và thời gian.",
    "vocab": [
      {
        "zh": "外卖",
        "pinyin": "wai mai",
        "vi": "đồ ăn giao"
      },
      {
        "zh": "下单",
        "pinyin": "xia dan",
        "vi": "đặt đơn"
      },
      {
        "zh": "地址",
        "pinyin": "di zhi",
        "vi": "địa chỉ"
      },
      {
        "zh": "送到",
        "pinyin": "song dao",
        "vi": "giao tới"
      },
      {
        "zh": "多久",
        "pinyin": "duo jiu",
        "vi": "bao lâu"
      },
      {
        "zh": "马上",
        "pinyin": "ma shang",
        "vi": "ngay"
      },
      {
        "zh": "备注",
        "pinyin": "bei zhu",
        "vi": "ghi chú"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：我想点外卖。",
        "pinyin": "xiao ming: wo xiang dian wai mai.",
        "vi": "Tiểu Minh: Mình muốn đặt đồ ăn giao."
      },
      {
        "zh": "小丽：你想吃什么？",
        "pinyin": "xiao li: ni xiang chi shen me?",
        "vi": "Tiểu Lệ: Bạn muốn ăn gì?"
      },
      {
        "zh": "小明：点一个牛肉面，送到这个地址。",
        "pinyin": "xiao ming: dian yi ge niu rou mian, song dao zhe ge di zhi.",
        "vi": "Tiểu Minh: Đặt một mì bò, giao tới địa chỉ này."
      },
      {
        "zh": "小丽：要不要写备注？",
        "pinyin": "xiao li: yao bu yao xie bei zhu?",
        "vi": "Tiểu Lệ: Có cần ghi chú không?"
      },
      {
        "zh": "小明：写“不辣”，谢谢。",
        "pinyin": "xiao ming: xie bu la, xie xie.",
        "vi": "Tiểu Minh: Ghi 'không cay', cảm ơn."
      },
      {
        "zh": "小丽：大概多久送到？",
        "pinyin": "xiao li: da gai duo jiu song dao?",
        "vi": "Tiểu Lệ: Khoảng bao lâu giao tới?"
      }
    ]
  },
  {
    "id": "post_office",
    "level": 2,
    "title": "Gửi bưu kiện",
    "description": "Gửi hàng và hỏi phí.",
    "vocab": [
      {
        "zh": "邮局",
        "pinyin": "you ju",
        "vi": "bưu điện"
      },
      {
        "zh": "包裹",
        "pinyin": "bao guo",
        "vi": "bưu kiện"
      },
      {
        "zh": "寄",
        "pinyin": "ji",
        "vi": "gửi"
      },
      {
        "zh": "到",
        "pinyin": "dao",
        "vi": "đến"
      },
      {
        "zh": "多久",
        "pinyin": "duo jiu",
        "vi": "bao lâu"
      },
      {
        "zh": "多少钱",
        "pinyin": "duo shao qian",
        "vi": "bao nhiêu tiền"
      },
      {
        "zh": "地址",
        "pinyin": "di zhi",
        "vi": "địa chỉ"
      },
      {
        "zh": "填",
        "pinyin": "tian",
        "vi": "điền"
      }
    ],
    "sentences": [
      {
        "zh": "店员：你好，需要寄什么？",
        "pinyin": "dian yuan: ni hao, xu yao ji shen me?",
        "vi": "Nhân viên: Xin chào, bạn muốn gửi gì?"
      },
      {
        "zh": "小明：我要寄一个包裹到越南。",
        "pinyin": "xiao ming: wo yao ji yi ge bao guo dao yue nan.",
        "vi": "Tiểu Minh: Tôi muốn gửi một bưu kiện về Việt Nam."
      },
      {
        "zh": "店员：请把地址填在这里。",
        "pinyin": "dian yuan: qing ba di zhi tian zai zhe li.",
        "vi": "Nhân viên: Vui lòng điền địa chỉ ở đây."
      },
      {
        "zh": "小明：大概多久能到？",
        "pinyin": "xiao ming: da gai duo jiu neng dao?",
        "vi": "Tiểu Minh: Khoảng bao lâu tới?"
      },
      {
        "zh": "店员：一周左右。",
        "pinyin": "dian yuan: yi zhou zuo you.",
        "vi": "Nhân viên: Khoảng một tuần."
      },
      {
        "zh": "小明：多少钱？",
        "pinyin": "xiao ming: duo shao qian?",
        "vi": "Tiểu Minh: Bao nhiêu tiền?"
      }
    ]
  },
  {
    "id": "buy_sim",
    "level": 2,
    "title": "Đăng ký SIM",
    "description": "Mua sim, hỏi gói cước và dung lượng.",
    "vocab": [
      {
        "zh": "手机卡",
        "pinyin": "shou ji ka",
        "vi": "sim"
      },
      {
        "zh": "流量",
        "pinyin": "liu liang",
        "vi": "data"
      },
      {
        "zh": "套餐",
        "pinyin": "tao can",
        "vi": "gói cước"
      },
      {
        "zh": "一个月",
        "pinyin": "yi ge yue",
        "vi": "một tháng"
      },
      {
        "zh": "多少钱",
        "pinyin": "duo shao qian",
        "vi": "bao nhiêu tiền"
      },
      {
        "zh": "身份证",
        "pinyin": "shen fen zheng",
        "vi": "giấy tờ"
      },
      {
        "zh": "开通",
        "pinyin": "kai tong",
        "vi": "kích hoạt"
      },
      {
        "zh": "可以",
        "pinyin": "ke yi",
        "vi": "được"
      }
    ],
    "sentences": [
      {
        "zh": "店员：你好，要办手机卡吗？",
        "pinyin": "dian yuan: ni hao, yao ban shou ji ka ma?",
        "vi": "Nhân viên: Xin chào, bạn muốn làm sim không?"
      },
      {
        "zh": "小丽：是的，有流量多的套餐吗？",
        "pinyin": "xiao li: shi de, you liu liang duo de tao can ma?",
        "vi": "Tiểu Lệ: Vâng, có gói nhiều data không?"
      },
      {
        "zh": "店员：这个套餐一个月一百。",
        "pinyin": "dian yuan: zhe ge tao can yi ge yue yi bai.",
        "vi": "Nhân viên: Gói này 100 tệ/tháng."
      },
      {
        "zh": "小丽：需要身份证吗？",
        "pinyin": "xiao li: xu yao shen fen zheng ma?",
        "vi": "Tiểu Lệ: Cần giấy tờ không?"
      },
      {
        "zh": "店员：需要，我帮你开通。",
        "pinyin": "dian yuan: xu yao, wo bang ni kai tong.",
        "vi": "Nhân viên: Cần, tôi kích hoạt giúp bạn."
      },
      {
        "zh": "小丽：好的，谢谢。",
        "pinyin": "xiao li: hao de, xie xie.",
        "vi": "Tiểu Lệ: Vâng, cảm ơn."
      }
    ]
  },
  {
    "id": "neighbors",
    "level": 1,
    "title": "Làm quen hàng xóm",
    "description": "Chào hỏi và nhờ giúp đỡ nhỏ.",
    "vocab": [
      {
        "zh": "邻居",
        "pinyin": "lin ju",
        "vi": "hàng xóm"
      },
      {
        "zh": "你好",
        "pinyin": "ni hao",
        "vi": "xin chào"
      },
      {
        "zh": "住",
        "pinyin": "zhu",
        "vi": "ở"
      },
      {
        "zh": "楼上",
        "pinyin": "lou shang",
        "vi": "tầng trên"
      },
      {
        "zh": "楼下",
        "pinyin": "lou xia",
        "vi": "tầng dưới"
      },
      {
        "zh": "帮忙",
        "pinyin": "bang mang",
        "vi": "giúp"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      },
      {
        "zh": "很高兴",
        "pinyin": "hen gao xing",
        "vi": "rất vui"
      }
    ],
    "sentences": [
      {
        "zh": "小明：你好，你是新邻居吗？",
        "pinyin": "xiao ming: ni hao, ni shi xin lin ju ma?",
        "vi": "Tiểu Minh: Xin chào, bạn là hàng xóm mới à?"
      },
      {
        "zh": "小丽：是的，我住在楼上。",
        "pinyin": "xiao li: shi de, wo zhu zai lou shang.",
        "vi": "Tiểu Lệ: Vâng, mình ở tầng trên."
      },
      {
        "zh": "小明：我住在楼下，很高兴认识你。",
        "pinyin": "xiao ming: wo zhu zai lou xia, hen gao xing ren shi ni.",
        "vi": "Tiểu Minh: Mình ở tầng dưới, rất vui làm quen."
      },
      {
        "zh": "小丽：我也是。以后请多关照。",
        "pinyin": "xiao li: wo ye shi. yi hou qing duo guan zhao.",
        "vi": "Tiểu Lệ: Mình cũng vậy. Sau này mong giúp đỡ."
      },
      {
        "zh": "小明：有需要就说，我可以帮忙。",
        "pinyin": "xiao ming: you xu yao jiu shuo, wo ke yi bang mang.",
        "vi": "Tiểu Minh: Có cần gì cứ nói, mình có thể giúp."
      },
      {
        "zh": "小丽：谢谢你！",
        "pinyin": "xiao li: xie xie ni!",
        "vi": "Tiểu Lệ: Cảm ơn bạn!"
      }
    ]
  },
  {
    "id": "park",
    "level": 1,
    "title": "Ở công viên",
    "description": "Nói về cảnh đẹp và chụp ảnh.",
    "vocab": [
      {
        "zh": "公园",
        "pinyin": "gong yuan",
        "vi": "công viên"
      },
      {
        "zh": "散步",
        "pinyin": "san bu",
        "vi": "đi dạo"
      },
      {
        "zh": "天气",
        "pinyin": "tian qi",
        "vi": "thời tiết"
      },
      {
        "zh": "漂亮",
        "pinyin": "piao liang",
        "vi": "đẹp"
      },
      {
        "zh": "花",
        "pinyin": "hua",
        "vi": "hoa"
      },
      {
        "zh": "拍照",
        "pinyin": "pai zhao",
        "vi": "chụp ảnh"
      },
      {
        "zh": "湖",
        "pinyin": "hu",
        "vi": "hồ"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：今天天气很好，我们去公园散步吧。",
        "pinyin": "xiao li: jin tian tian qi hen hao, wo men qu gong yuan san bu ba.",
        "vi": "Tiểu Lệ: Hôm nay thời tiết đẹp, đi dạo công viên nhé."
      },
      {
        "zh": "小明：好啊，公园里有湖和很多花。",
        "pinyin": "xiao ming: hao a, gong yuan li you hu he hen duo hua.",
        "vi": "Tiểu Minh: Được, trong công viên có hồ và nhiều hoa."
      },
      {
        "zh": "小丽：你看，那边很漂亮。",
        "pinyin": "xiao li: ni kan, na bian hen piao liang.",
        "vi": "Tiểu Lệ: Bạn nhìn kìa, bên đó đẹp."
      },
      {
        "zh": "小明：我们在这里拍照。",
        "pinyin": "xiao ming: wo men zai zhe li pai zhao.",
        "vi": "Tiểu Minh: Mình chụp ảnh ở đây."
      },
      {
        "zh": "小丽：笑一笑！",
        "pinyin": "xiao li: xiao yi xiao!",
        "vi": "Tiểu Lệ: Cười lên!"
      },
      {
        "zh": "小明：哈哈，好！",
        "pinyin": "xiao ming: ha ha, hao!",
        "vi": "Tiểu Minh: Haha, được!"
      }
    ]
  },
  {
    "id": "shadowing",
    "level": 2,
    "title": "Luyện nói theo giọng",
    "description": "Luyện nói theo câu mẫu, nói chậm hơn.",
    "vocab": [
      {
        "zh": "练习",
        "pinyin": "lian xi",
        "vi": "luyện tập"
      },
      {
        "zh": "跟读",
        "pinyin": "gen du",
        "vi": "đọc theo"
      },
      {
        "zh": "发音",
        "pinyin": "fa yin",
        "vi": "phát âm"
      },
      {
        "zh": "慢一点",
        "pinyin": "man yi dian",
        "vi": "chậm hơn chút"
      },
      {
        "zh": "清楚",
        "pinyin": "qing chu",
        "vi": "rõ"
      },
      {
        "zh": "再来",
        "pinyin": "zai lai",
        "vi": "lại lần nữa"
      },
      {
        "zh": "听",
        "pinyin": "ting",
        "vi": "nghe"
      },
      {
        "zh": "说",
        "pinyin": "shuo",
        "vi": "nói"
      }
    ],
    "sentences": [
      {
        "zh": "小明：我们来练习跟读吧。",
        "pinyin": "xiao ming: wo men lai lian xi gen du ba.",
        "vi": "Tiểu Minh: Mình luyện đọc theo nhé."
      },
      {
        "zh": "小丽：好，你先听，然后再说。",
        "pinyin": "xiao li: hao, ni xian ting, ran hou zai shuo.",
        "vi": "Tiểu Lệ: Ok, bạn nghe trước rồi nói."
      },
      {
        "zh": "小明：我觉得我的发音不清楚。",
        "pinyin": "xiao ming: wo jue de wo de fa yin bu qing chu.",
        "vi": "Tiểu Minh: Mình thấy phát âm chưa rõ."
      },
      {
        "zh": "小丽：没事，你慢一点，再来一次。",
        "pinyin": "xiao li: mei shi, ni man yi dian, zai lai yi ci.",
        "vi": "Tiểu Lệ: Không sao, chậm lại chút, làm lại."
      },
      {
        "zh": "小明：这样好多了。",
        "pinyin": "xiao ming: zhe yang hao duo le.",
        "vi": "Tiểu Minh: Như vậy tốt hơn nhiều."
      },
      {
        "zh": "小丽：坚持就会进步。",
        "pinyin": "xiao li: jian chi jiu hui jin bu.",
        "vi": "Tiểu Lệ: Kiên trì sẽ tiến bộ."
      }
    ]
  },
  {
    "id": "borrow_charger",
    "level": 1,
    "title": "Mượn sạc điện thoại",
    "description": "Mượn sạc và cảm ơn.",
    "vocab": [
      {
        "zh": "充电器",
        "pinyin": "chong dian qi",
        "vi": "sạc"
      },
      {
        "zh": "手机",
        "pinyin": "shou ji",
        "vi": "điện thoại"
      },
      {
        "zh": "没电",
        "pinyin": "mei dian",
        "vi": "hết pin"
      },
      {
        "zh": "可以吗",
        "pinyin": "ke yi ma",
        "vi": "được không"
      },
      {
        "zh": "借",
        "pinyin": "jie",
        "vi": "mượn"
      },
      {
        "zh": "一会儿",
        "pinyin": "yi hui er",
        "vi": "một lát"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      },
      {
        "zh": "当然",
        "pinyin": "dang ran",
        "vi": "đương nhiên"
      }
    ],
    "sentences": [
      {
        "zh": "小明：我的手机快没电了。",
        "pinyin": "xiao ming: wo de shou ji kuai mei dian le.",
        "vi": "Tiểu Minh: Điện thoại mình sắp hết pin."
      },
      {
        "zh": "小丽：你有充电器吗？",
        "pinyin": "xiao li: ni you chong dian qi ma?",
        "vi": "Tiểu Lệ: Bạn có sạc không?"
      },
      {
        "zh": "小明：没有，可以借你的吗？",
        "pinyin": "xiao ming: mei you, ke yi jie ni de ma?",
        "vi": "Tiểu Minh: Không, mượn của bạn được không?"
      },
      {
        "zh": "小丽：当然可以。",
        "pinyin": "xiao li: dang ran ke yi.",
        "vi": "Tiểu Lệ: Tất nhiên được."
      },
      {
        "zh": "小明：我充一会儿就还你。",
        "pinyin": "xiao ming: wo chong yi hui er jiu huan ni.",
        "vi": "Tiểu Minh: Mình sạc một lát rồi trả."
      },
      {
        "zh": "小丽：没问题。",
        "pinyin": "xiao li: mei wen ti.",
        "vi": "Tiểu Lệ: Không vấn đề."
      }
    ]
  },
  {
    "id": "buy_fruit",
    "level": 1,
    "title": "Mua trái cây",
    "description": "Chọn trái cây chín và hỏi giá.",
    "vocab": [
      {
        "zh": "水果",
        "pinyin": "shui guo",
        "vi": "trái cây"
      },
      {
        "zh": "新鲜",
        "pinyin": "xin xian",
        "vi": "tươi"
      },
      {
        "zh": "甜",
        "pinyin": "tian",
        "vi": "ngọt"
      },
      {
        "zh": "西瓜",
        "pinyin": "xi gua",
        "vi": "dưa hấu"
      },
      {
        "zh": "葡萄",
        "pinyin": "pu tao",
        "vi": "nho"
      },
      {
        "zh": "多少钱",
        "pinyin": "duo shao qian",
        "vi": "bao nhiêu tiền"
      },
      {
        "zh": "挑",
        "pinyin": "tiao",
        "vi": "chọn"
      },
      {
        "zh": "一斤",
        "pinyin": "yi jin",
        "vi": "một cân"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：这些水果看起来很新鲜。",
        "pinyin": "xiao li: zhe xie shui guo kan qi lai hen xin xian.",
        "vi": "Tiểu Lệ: Trái cây này nhìn rất tươi."
      },
      {
        "zh": "小明：我想买西瓜，甜吗？",
        "pinyin": "xiao ming: wo xiang mai xi gua, tian ma?",
        "vi": "Tiểu Minh: Mình muốn mua dưa hấu, ngọt không?"
      },
      {
        "zh": "老板：很甜，你可以挑一个。",
        "pinyin": "lao ban: hen tian, ni ke yi tiao yi ge.",
        "vi": "Chủ quán: Rất ngọt, bạn chọn một quả đi."
      },
      {
        "zh": "小明：葡萄多少钱一斤？",
        "pinyin": "xiao ming: pu tao duo shao qian yi jin?",
        "vi": "Tiểu Minh: Nho bao nhiêu tiền một cân?"
      },
      {
        "zh": "老板：十二块。",
        "pinyin": "lao ban: shi er kuai.",
        "vi": "Chủ quán: 12 tệ."
      },
      {
        "zh": "小丽：那我们买一点葡萄。",
        "pinyin": "xiao li: na wo men mai yi dian pu tao.",
        "vi": "Tiểu Lệ: Vậy mình mua ít nho."
      }
    ]
  },
  {
    "id": "ask_room",
    "level": 1,
    "title": "Hỏi số phòng",
    "description": "Hỏi số phòng và tầng.",
    "vocab": [
      {
        "zh": "房间",
        "pinyin": "fang jian",
        "vi": "phòng"
      },
      {
        "zh": "几号",
        "pinyin": "ji hao",
        "vi": "số mấy"
      },
      {
        "zh": "楼层",
        "pinyin": "lou ceng",
        "vi": "tầng"
      },
      {
        "zh": "电梯",
        "pinyin": "dian ti",
        "vi": "thang máy"
      },
      {
        "zh": "右边",
        "pinyin": "you bian",
        "vi": "bên phải"
      },
      {
        "zh": "左边",
        "pinyin": "zuo bian",
        "vi": "bên trái"
      },
      {
        "zh": "前台",
        "pinyin": "qian tai",
        "vi": "lễ tân"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：你好，请问我的房间是几号？",
        "pinyin": "xiao ming: ni hao, qing wen wo de fang jian shi ji hao?",
        "vi": "Tiểu Minh: Xin chào, phòng của tôi số mấy?"
      },
      {
        "zh": "前台：你的房间是508，在五楼。",
        "pinyin": "qian tai: ni de fang jian shi wu ling ba, zai wu lou.",
        "vi": "Lễ tân: Phòng bạn 508, tầng 5."
      },
      {
        "zh": "小明：电梯在哪里？",
        "pinyin": "xiao ming: dian ti zai na li?",
        "vi": "Tiểu Minh: Thang máy ở đâu?"
      },
      {
        "zh": "前台：往右边走就是。",
        "pinyin": "qian tai: wang you bian zou jiu shi.",
        "vi": "Lễ tân: Đi về bên phải là tới."
      },
      {
        "zh": "小明：到了五楼后左边吗？",
        "pinyin": "xiao ming: dao le wu lou hou zuo bian ma?",
        "vi": "Tiểu Minh: Tới tầng 5 rồi rẽ trái phải không?"
      },
      {
        "zh": "前台：对。祝你入住愉快。",
        "pinyin": "qian tai: dui. zhu ni ru zhu yu kuai.",
        "vi": "Lễ tân: Đúng. Chúc bạn ở vui."
      }
    ]
  },
  {
    "id": "ask_leave",
    "level": 2,
    "title": "Xin nghỉ phép",
    "description": "Xin nghỉ và nói lý do.",
    "vocab": [
      {
        "zh": "请假",
        "pinyin": "qing jia",
        "vi": "xin nghỉ"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "明天",
        "pinyin": "ming tian",
        "vi": "ngày mai"
      },
      {
        "zh": "身体",
        "pinyin": "shen ti",
        "vi": "cơ thể"
      },
      {
        "zh": "不舒服",
        "pinyin": "bu shu fu",
        "vi": "khó chịu"
      },
      {
        "zh": "医院",
        "pinyin": "yi yuan",
        "vi": "bệnh viện"
      },
      {
        "zh": "批准",
        "pinyin": "pi zhun",
        "vi": "phê duyệt"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：经理，我想请假。",
        "pinyin": "xiao ming: jing li, wo xiang qing jia.",
        "vi": "Tiểu Minh: Sếp ơi, tôi muốn xin nghỉ."
      },
      {
        "zh": "经理：请多久？",
        "pinyin": "jing li: qing duo jiu?",
        "vi": "Sếp: Nghỉ bao lâu?"
      },
      {
        "zh": "小明：今天下午和明天上午。",
        "pinyin": "xiao ming: jin tian xia wu he ming tian shang wu.",
        "vi": "Tiểu Minh: Chiều nay và sáng mai."
      },
      {
        "zh": "小明：我身体不舒服，要去医院。",
        "pinyin": "xiao ming: wo shen ti bu shu fu, yao qu yi yuan.",
        "vi": "Tiểu Minh: Tôi không khỏe, phải đi bệnh viện."
      },
      {
        "zh": "经理：好，我批准。",
        "pinyin": "jing li: hao, wo pi zhun.",
        "vi": "Sếp: Được, tôi duyệt."
      },
      {
        "zh": "小明：谢谢经理。",
        "pinyin": "xiao ming: xie xie jing li.",
        "vi": "Tiểu Minh: Cảm ơn sếp."
      }
    ]
  },
  {
    "id": "taxi_price",
    "level": 2,
    "title": "Hỏi giá taxi",
    "description": "Hỏi ước tính giá và thời gian.",
    "vocab": [
      {
        "zh": "出租车",
        "pinyin": "chu zu che",
        "vi": "taxi"
      },
      {
        "zh": "到",
        "pinyin": "dao",
        "vi": "đến"
      },
      {
        "zh": "多少钱",
        "pinyin": "duo shao qian",
        "vi": "bao nhiêu tiền"
      },
      {
        "zh": "大概",
        "pinyin": "da gai",
        "vi": "khoảng"
      },
      {
        "zh": "需要",
        "pinyin": "xu yao",
        "vi": "cần"
      },
      {
        "zh": "分钟",
        "pinyin": "fen zhong",
        "vi": "phút"
      },
      {
        "zh": "现在",
        "pinyin": "xian zai",
        "vi": "bây giờ"
      },
      {
        "zh": "走",
        "pinyin": "zou",
        "vi": "đi"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：我们坐出租车吧。",
        "pinyin": "xiao li: wo men zuo chu zu che ba.",
        "vi": "Tiểu Lệ: Mình đi taxi nhé."
      },
      {
        "zh": "小明：到市中心大概多少钱？",
        "pinyin": "xiao ming: dao shi zhong xin da gai duo shao qian?",
        "vi": "Tiểu Minh: Tới trung tâm khoảng bao nhiêu tiền?"
      },
      {
        "zh": "司机：大概五十。",
        "pinyin": "si ji: da gai wu shi.",
        "vi": "Tài xế: Khoảng 50."
      },
      {
        "zh": "小明：需要多少分钟？",
        "pinyin": "xiao ming: xu yao duo shao fen zhong?",
        "vi": "Tiểu Minh: Mất bao nhiêu phút?"
      },
      {
        "zh": "司机：现在不堵车，二十分钟。",
        "pinyin": "si ji: xian zai bu du che, er shi fen zhong.",
        "vi": "Tài xế: Giờ không kẹt, 20 phút."
      },
      {
        "zh": "小丽：好，那就走。",
        "pinyin": "xiao li: hao, na jiu zou.",
        "vi": "Tiểu Lệ: Ok, đi thôi."
      }
    ]
  },
  {
    "id": "reschedule",
    "level": 2,
    "title": "Đổi lịch hẹn",
    "description": "Đổi lịch hẹn sang ngày khác.",
    "vocab": [
      {
        "zh": "改时间",
        "pinyin": "gai shi jian",
        "vi": "đổi giờ"
      },
      {
        "zh": "今天",
        "pinyin": "jin tian",
        "vi": "hôm nay"
      },
      {
        "zh": "明天",
        "pinyin": "ming tian",
        "vi": "ngày mai"
      },
      {
        "zh": "有事",
        "pinyin": "you shi",
        "vi": "có việc"
      },
      {
        "zh": "可以吗",
        "pinyin": "ke yi ma",
        "vi": "được không"
      },
      {
        "zh": "下午",
        "pinyin": "xia wu",
        "vi": "buổi chiều"
      },
      {
        "zh": "没问题",
        "pinyin": "mei wen ti",
        "vi": "không vấn đề"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      }
    ],
    "sentences": [
      {
        "zh": "小明：不好意思，我今天有事。",
        "pinyin": "xiao ming: bu hao yi si, wo jin tian you shi.",
        "vi": "Tiểu Minh: Xin lỗi, hôm nay mình có việc."
      },
      {
        "zh": "小明：我们可以改时间吗？",
        "pinyin": "xiao ming: wo men ke yi gai shi jian ma?",
        "vi": "Tiểu Minh: Mình đổi lịch được không?"
      },
      {
        "zh": "小丽：可以，你想改到什么时候？",
        "pinyin": "xiao li: ke yi, ni xiang gai dao shen me shi hou?",
        "vi": "Tiểu Lệ: Được, bạn muốn đổi sang khi nào?"
      },
      {
        "zh": "小明：明天下午三点可以吗？",
        "pinyin": "xiao ming: ming tian xia wu san dian ke yi ma?",
        "vi": "Tiểu Minh: Mai 3 giờ chiều được không?"
      },
      {
        "zh": "小丽：没问题，明天见。",
        "pinyin": "xiao li: mei wen ti, ming tian jian.",
        "vi": "Tiểu Lệ: Không vấn đề, mai gặp."
      },
      {
        "zh": "小明：谢谢你！",
        "pinyin": "xiao ming: xie xie ni!",
        "vi": "Tiểu Minh: Cảm ơn bạn!"
      }
    ]
  },
  {
    "id": "phone_call",
    "level": 2,
    "title": "Gọi điện thoại",
    "description": "Gọi cho bạn và nói đang ở đâu.",
    "vocab": [
      {
        "zh": "打电话",
        "pinyin": "da dian hua",
        "vi": "gọi điện"
      },
      {
        "zh": "现在",
        "pinyin": "xian zai",
        "vi": "bây giờ"
      },
      {
        "zh": "在哪儿",
        "pinyin": "zai nar",
        "vi": "ở đâu"
      },
      {
        "zh": "等",
        "pinyin": "deng",
        "vi": "đợi"
      },
      {
        "zh": "马上",
        "pinyin": "ma shang",
        "vi": "ngay"
      },
      {
        "zh": "路上",
        "pinyin": "lu shang",
        "vi": "trên đường"
      },
      {
        "zh": "听得清楚",
        "pinyin": "ting de qing chu",
        "vi": "nghe rõ"
      },
      {
        "zh": "再说一遍",
        "pinyin": "zai shuo yi bian",
        "vi": "nói lại"
      }
    ],
    "sentences": [
      {
        "zh": "小明：我给你打电话了，你听得清楚吗？",
        "pinyin": "xiao ming: wo gei ni da dian hua le, ni ting de qing chu ma?",
        "vi": "Tiểu Minh: Mình gọi cho bạn rồi, nghe rõ không?"
      },
      {
        "zh": "小丽：有点小声，你再说一遍。",
        "pinyin": "xiao li: you dian xiao sheng, ni zai shuo yi bian.",
        "vi": "Tiểu Lệ: Hơi nhỏ, bạn nói lại nhé."
      },
      {
        "zh": "小明：我现在在地铁站门口。",
        "pinyin": "xiao ming: wo xian zai zai di tie zhan men kou.",
        "vi": "Tiểu Minh: Mình đang ở cửa ga tàu điện."
      },
      {
        "zh": "小丽：好，我在咖啡店等你。",
        "pinyin": "xiao li: hao, wo zai ka fei dian deng ni.",
        "vi": "Tiểu Lệ: Ok, mình đợi bạn ở quán cà phê."
      },
      {
        "zh": "小明：我马上到，还在路上。",
        "pinyin": "xiao ming: wo ma shang dao, hai zai lu shang.",
        "vi": "Tiểu Minh: Mình tới ngay, vẫn đang trên đường."
      },
      {
        "zh": "小丽：别急，慢慢来。",
        "pinyin": "xiao li: bie ji, man man lai.",
        "vi": "Tiểu Lệ: Không vội, từ từ."
      }
    ]
  },
  {
    "id": "return_item",
    "level": 2,
    "title": "Trả lại đồ thất lạc",
    "description": "Nhặt đồ và trả cho chủ.",
    "vocab": [
      {
        "zh": "捡到",
        "pinyin": "jian dao",
        "vi": "nhặt được"
      },
      {
        "zh": "钱包",
        "pinyin": "qian bao",
        "vi": "ví"
      },
      {
        "zh": "里面",
        "pinyin": "li mian",
        "vi": "bên trong"
      },
      {
        "zh": "证件",
        "pinyin": "zheng jian",
        "vi": "giấy tờ"
      },
      {
        "zh": "是谁的",
        "pinyin": "shi shui de",
        "vi": "của ai"
      },
      {
        "zh": "还给",
        "pinyin": "huan gei",
        "vi": "trả lại"
      },
      {
        "zh": "谢谢",
        "pinyin": "xie xie",
        "vi": "cảm ơn"
      },
      {
        "zh": "太好了",
        "pinyin": "tai hao le",
        "vi": "tuyệt quá"
      }
    ],
    "sentences": [
      {
        "zh": "小明：我在路上捡到一个钱包。",
        "pinyin": "xiao ming: wo zai lu shang jian dao yi ge qian bao.",
        "vi": "Tiểu Minh: Mình nhặt được một cái ví trên đường."
      },
      {
        "zh": "小丽：里面有什么？",
        "pinyin": "xiao li: li mian you shen me?",
        "vi": "Tiểu Lệ: Trong đó có gì?"
      },
      {
        "zh": "小明：有一些钱，还有证件。",
        "pinyin": "xiao ming: you yi xie qian, hai you zheng jian.",
        "vi": "Tiểu Minh: Có ít tiền và giấy tờ."
      },
      {
        "zh": "小丽：我们问问是谁的，然后还给他。",
        "pinyin": "xiao li: wo men wen wen shi shui de, ran hou huan gei ta.",
        "vi": "Tiểu Lệ: Mình hỏi xem của ai rồi trả lại."
      },
      {
        "zh": "失主：这是我的钱包！太好了。",
        "pinyin": "shi zhu: zhe shi wo de qian bao! tai hao le.",
        "vi": "Chủ ví: Đây là ví của tôi! Tuyệt quá."
      },
      {
        "zh": "失主：谢谢你们。",
        "pinyin": "shi zhu: xie xie ni men.",
        "vi": "Chủ ví: Cảm ơn hai bạn."
      }
    ]
  },
  {
    "id": "birthday_gift",
    "level": 1,
    "title": "Chọn quà sinh nhật",
    "description": "Chọn quà và hỏi ý kiến.",
    "vocab": [
      {
        "zh": "生日",
        "pinyin": "sheng ri",
        "vi": "sinh nhật"
      },
      {
        "zh": "礼物",
        "pinyin": "li wu",
        "vi": "quà"
      },
      {
        "zh": "买",
        "pinyin": "mai",
        "vi": "mua"
      },
      {
        "zh": "喜欢",
        "pinyin": "xi huan",
        "vi": "thích"
      },
      {
        "zh": "觉得",
        "pinyin": "jue de",
        "vi": "cảm thấy"
      },
      {
        "zh": "这个",
        "pinyin": "zhe ge",
        "vi": "cái này"
      },
      {
        "zh": "漂亮",
        "pinyin": "piao liang",
        "vi": "đẹp"
      },
      {
        "zh": "合适",
        "pinyin": "he shi",
        "vi": "hợp"
      }
    ],
    "sentences": [
      {
        "zh": "小丽：下周是妈妈的生日。",
        "pinyin": "xiao li: xia zhou shi ma ma de sheng ri.",
        "vi": "Tiểu Lệ: Tuần sau là sinh nhật mẹ."
      },
      {
        "zh": "小明：你想买什么礼物？",
        "pinyin": "xiao ming: ni xiang mai shen me li wu?",
        "vi": "Tiểu Minh: Bạn muốn mua quà gì?"
      },
      {
        "zh": "小丽：我想买一个包，你觉得这个怎么样？",
        "pinyin": "xiao li: wo xiang mai yi ge bao, ni jue de zhe ge zen me yang?",
        "vi": "Tiểu Lệ: Mình muốn mua một cái túi, bạn thấy cái này sao?"
      },
      {
        "zh": "小明：很漂亮，也很合适。",
        "pinyin": "xiao ming: hen piao liang, ye hen he shi.",
        "vi": "Tiểu Minh: Rất đẹp và hợp."
      },
      {
        "zh": "小丽：她会喜欢吗？",
        "pinyin": "xiao li: ta hui xi huan ma?",
        "vi": "Tiểu Lệ: Mẹ sẽ thích chứ?"
      },
      {
        "zh": "小明：我觉得会。",
        "pinyin": "xiao ming: wo jue de hui.",
        "vi": "Tiểu Minh: Mình nghĩ sẽ."
      }
    ]
  },
  {
    "id": "weekend_plan",
    "level": 1,
    "title": "Lên kế hoạch cuối tuần",
    "description": "Nói về kế hoạch và thời gian rảnh.",
    "vocab": [
      {
        "zh": "周末",
        "pinyin": "zhou mo",
        "vi": "cuối tuần"
      },
      {
        "zh": "计划",
        "pinyin": "ji hua",
        "vi": "kế hoạch"
      },
      {
        "zh": "想",
        "pinyin": "xiang",
        "vi": "muốn"
      },
      {
        "zh": "去",
        "pinyin": "qu",
        "vi": "đi"
      },
      {
        "zh": "电影",
        "pinyin": "dian ying",
        "vi": "phim"
      },
      {
        "zh": "公园",
        "pinyin": "gong yuan",
        "vi": "công viên"
      },
      {
        "zh": "有空",
        "pinyin": "you kong",
        "vi": "rảnh"
      },
      {
        "zh": "一起",
        "pinyin": "yi qi",
        "vi": "cùng"
      }
    ],
    "sentences": [
      {
        "zh": "小明：周末你有什么计划？",
        "pinyin": "xiao ming: zhou mo ni you shen me ji hua?",
        "vi": "Tiểu Minh: Cuối tuần bạn có kế hoạch gì?"
      },
      {
        "zh": "小丽：我想去看电影，也想去公园。",
        "pinyin": "xiao li: wo xiang qu kan dian ying, ye xiang qu gong yuan.",
        "vi": "Tiểu Lệ: Mình muốn xem phim và đi công viên."
      },
      {
        "zh": "小明：你哪天有空？",
        "pinyin": "xiao ming: ni na tian you kong?",
        "vi": "Tiểu Minh: Bạn rảnh ngày nào?"
      },
      {
        "zh": "小丽：星期六下午有空。",
        "pinyin": "xiao li: xing qi liu xia wu you kong.",
        "vi": "Tiểu Lệ: Chiều thứ bảy rảnh."
      },
      {
        "zh": "小明：那我们星期六一起去。",
        "pinyin": "xiao ming: na wo men xing qi liu yi qi qu.",
        "vi": "Tiểu Minh: Vậy thứ bảy mình đi cùng."
      },
      {
        "zh": "小丽：好啊，周末见！",
        "pinyin": "xiao li: hao a, zhou mo jian!",
        "vi": "Tiểu Lệ: Ok, hẹn cuối tuần!"
      }
    ]
  }
];
