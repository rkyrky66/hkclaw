// ============================================================
// 品牌資料庫
// ============================================================
var BRAND_DATABASE = [
  {
    "id": "sanrio",
    "primary_name": "Sanrio",
    "category": "公仔",
    "aliases": [
      "Sanrio", "三麗鷗", "サンリオ",
      "玉桂狗", "肉桂狗", "大耳狗", "Cinnamoroll",
      "庫洛米", "黑米", "Kuromi",
      "帕恰狗", "PC狗", "Pochacco",
      "布甸狗", "布丁狗", "Pompompurin",
      "水怪", "魚怪", "半魚人", "Hangyodon",
      "Hello Kitty", "吉蒂貓", "美樂蒂", "Melody"
    ]
  },
  {
    "id": "popmart",
    "primary_name": "Pop Mart",
    "category": "玩具",
    "aliases": [
      "Pop Mart", "泡泡瑪特", "盒蛋", "盲盒",
      "Labubu", "拉布布", "The Monsters", "Zimomo", "吉莫莫",
      "Dimoo", "迪木", "迪姆",
      "Crybaby", "哭娃",
      "Hirono", "小野",
      "Molly", "茉莉", "Skullpanda", "SP"
    ]
  },
  {
    "id": "pokemon",
    "primary_name": "Pokémon",
    "category": "公仔",
    "aliases": [
      "Pokémon", "寶可夢", "寵物小精靈", "精灵宝可梦",
      "比卡超", "皮卡丘", "Pikachu",
      "耿鬼", "Gengar",
      "伊布", "伊貝", "Eevee",
      "卡比獸", "Snorlax"
    ]
  },
  {
    "id": "disney",
    "primary_name": "Disney",
    "category": "公仔",
    "aliases": [
      "Disney", "迪士尼",
      "玲娜貝兒", "LinaBell", "狐狸仔", "Duffy", "達菲",
      "勞蘇", "草莓熊", "Lotso",
      "三眼仔", "三眼", "Alien", "反斗奇兵", "Toy Story",
      "史迪仔", "史迪奇", "Stitch"
    ]
  },
  {
    "id": "chiikawa",
    "primary_name": "Chiikawa",
    "category": "公仔",
    "aliases": [
      "Chiikawa", "吉伊卡哇", "智卡哇", "ちいかわ",
      "小八", "hachiware", "兔兔", "烏薩奇", "usagi",
      "飛鼠", "momonga", "栗子饅頭"
    ]
  },
  {
    "id": "jellycat",
    "primary_name": "Jellycat",
    "category": "公仔",
    "aliases": [
      "Jellycat", "Jelly cat", "傑利貓", "英國毛絨", "邦尼兔", "Bashful Bunny"
    ]
  },
  {
    "id": "mofusand",
    "primary_name": "Mofusand",
    "category": "公仔",
    "aliases": [
      "Mofusand", "貓福珊迪", "モフサンド",
      "鯊魚貓", "炸蝦貓", "蜜蜂貓", "水果貓", "炸雞貓"
    ]
  },
  {
    "id": "capybara",
    "primary_name": "Capybara (水豚君)",
    "category": "公仔",
    "aliases": [
      "Capybara", "水豚君", "水豚", "卡皮巴拉", "カピバラ",
      "烏龜水豚", "背囊水豚", "鼻涕水豚"
    ]
  },
  {
    "id": "loopy",
    "primary_name": "Loopy",
    "category": "公仔",
    "aliases": [
      "Loopy", "露比", "海狸露比", "粉紅小海狸", "Zanmang Loopy", "贊芒露比"
    ]
  },
  {
    "id": "snoopy",
    "primary_name": "Snoopy",
    "category": "公仔",
    "aliases": [
      "Snoopy", "史努比", "花生漫畫", "Peanuts", "查理布朗", "Charlie Brown", "胡士托", "Woodstock"
    ]
  },
  {
    "id": "line_friends",
    "primary_name": "Line Friends",
    "category": "公仔",
    "aliases": [
      "Line Friends", "Line", "布朗熊", "Brown", "熊大",
      "莎莉", "Sally", "兔兔", "Cony", "Choco", "熊美"
    ]
  },
  {
    "id": "haikyu",
    "primary_name": "排球少年!!",
    "category": "玩具",
    "aliases": [
      "排球少年", "排少", "Haikyu", "古館春一",
      "日向翔陽", "影山飛雄", "孤爪研磨", "黑尾鐵朗", "及川徹"
    ]
  },
  {
    "id": "blue_lock",
    "primary_name": "藍色監獄",
    "category": "玩具",
    "aliases": [
      "藍色監獄", "Blue Lock", "潔世一", "蜂樂迴", "凪誠士郎", "御影玲王", "絲師凛"
    ]
  },
  {
    "id": "one_piece",
    "primary_name": "One Piece",
    "category": "玩具",
    "aliases": [
      "One Piece", "海賊王", "航海王", "路飛", "索隆", "卓洛", "艾斯", "奈美", "卓巴", "喬巴"
    ]
  },
  {
    "id": "dragon_ball",
    "primary_name": "龍珠",
    "category": "玩具",
    "aliases": [
      "龍珠", "七龍珠", "Dragon Ball", "悟空", "比達", "達爾", "悟飯", "杜拉格斯"
    ]
  },
  {
    "id": "demon_slayer",
    "primary_name": "鬼滅之刃",
    "category": "玩具",
    "aliases": [
      "鬼滅之刃", "鬼滅", "Demon Slayer", "炭治郎", "禰豆子", "善逸", "伊之助", "炎柱", "音柱"
    ]
  },
  {
    "id": "sega",
    "primary_name": "Sega景品",
    "category": "玩具",
    "aliases": [
      "Sega", "世嘉", "Sega Plaza", "Luminasta", "日版景品", "Sega模型"
    ]
  },
  {
    "id": "taito",
    "primary_name": "Taito景品",
    "category": "玩具",
    "aliases": [
      "Taito", "太東", "Coreful", "Aqua Float", "日版景品", "Taito模型"
    ]
  },
  {
    "id": "remax",
    "primary_name": "Remax",
    "category": "電子產品",
    "aliases": [
      "Remax", "睿量", "Remax尿袋", "Remax火牛", "行動電源", "外置充電器"
    ]
  },
  {
    "id": "baseus",
    "primary_name": "Baseus",
    "category": "電子產品",
    "aliases": [
      "Baseus", "倍思", "Baseus耳機", "倍思充電線", "車用精品"
    ]
  },
  {
    "id": "xiaomi",
    "primary_name": "Xiaomi (小米)",
    "category": "電子產品",
    "aliases": [
      "Xiaomi", "小米", "米家", "Mijia", "紅米", "Redmi", "小米尿袋", "小家電"
    ]
  },
  {
    "id": "havit",
    "primary_name": "Havit",
    "category": "電子產品",
    "aliases": [
      "Havit", "海威特", "Havit耳機", "藍牙喇叭", "骨傳導耳機"
    ]
  },
  {
    "id": "noodoll",
    "primary_name": "Noodoll",
    "category": "公仔",
    "aliases": [
      "Noodoll", "奴兜", "英國薯仔", "薯仔公仔", "馬鈴薯公仔",
      "Ricespud", "薯仔家族", "Potato Gang", "大佬薯", "紋身薯", "逃犯薯", "麥樂雞公仔"
    ]
  },
  {
    "id": "jra_horses",
    "primary_name": "JRA 日本賽馬系列",
    "category": "公仔",
    "aliases": [
      "JRA", "JRC", "日本馬", "日本馬仔", "賽馬公仔", "純種馬", "Thoroughbred Collection",
      "珍寶馬", "冠軍馬", "有馬紀念", "日本盃", "黃金船", "Gold Ship", "大震撼", "Deep Impact",
      "春秋分", "Equinox", "北島三郎", "Kitasan Black", "浪漫勇士", "馬仔公仔"
    ]
  },
  {
    "id": "nici",
    "primary_name": "Nici",
    "category": "公仔",
    "aliases": [
      "Nici", "德國Nici", "磁吸公仔", "Nici動物", "Nici鑰匙扣",
      "小豬威比", "Wibbly Pig", "拉米長頸鹿", "磁石公仔", "磁鐵公仔"
    ]
  },
  {
    "id": "52toys",
    "primary_name": "52Toys",
    "category": "玩具",
    "aliases": [
      "52Toys", "52 Toys", "五二玩具", "蠟筆小新盲盒", "Crayon Shin-chan",
      "Panda Roll", "胖噠幼", "BB機系列", "萬能匣", "Box Series", "Tom and Jerry盲盒"
    ]
  },
  {
    "id": "finding_unicorn",
    "primary_name": "Finding Unicorn",
    "category": "玩具",
    "aliases": [
      "Finding Unicorn", "尋找獨角獸", "ShinWoo", "幽靈熊", "FARMER BOB",
      "波布", "RiCO", "Agan", "阿 grumpy", "Moly", "卓大王"
    ]
  },
  {
    "id": "gundam_bandai",
    "primary_name": "Gundam (萬代高達)",
    "category": "玩具",
    "aliases": [
      "Gundam", "高達", "鋼彈", "Bandai Hobby", "Gunpla", "高達模型",
      "SD高達", "HG高達", "RG高達", "MG高達", "水星的魔女", "SEED FREEDOM"
    ]
  },
  {
    "id": "care_bears",
    "primary_name": "Care Bears",
    "category": "公仔",
    "aliases": [
      "Care Bears", "CareBears", "愛心熊", "彩虹熊", "彩色熊", "分享熊", "幸運熊"
    ]
  },
  {
    "id": "shinchan",
    "primary_name": "蠟筆小新",
    "category": "公仔",
    "aliases": [
      "蠟筆小新", "小新", "Shin-chan", "野原新之助", "小白", "不理不理左衛門",
      "鱷魚阿山", "動感超人", "雙葉幼稚園"
    ]
  },
  {
    "id": "miffy",
    "primary_name": "Miffy (米飛兔)",
    "category": "公仔",
    "aliases": [
      "Miffy", "米飛兔", "米菲兔", "荷蘭兔", "米菲", "ミッフィー"
    ]
  },
  {
    "id": "one_piece_card",
    "primary_name": "One Piece Card Game (海賊王紙牌)",
    "category": "玩具",
    "aliases": [
      "海賊王紙牌", "航海王卡牌", "OP卡包", "OP05", "OP06", "OP07", "OP08", "OP09",
      "PSA10", "鑑定卡", "海賊王卡", "頂上決戰", "新時代的主角", "二哥", "動漫卡包"
    ]
  },
  {
    "id": "pokemon_tcg",
    "primary_name": "Pokémon TCG (寶可夢紙牌)",
    "category": "玩具",
    "aliases": [
      "寶可夢卡牌", "神奇寶貝卡", "PTCG", "寶可夢卡包", "黑噴", "莉莉艾",
      "香港限量卡", "擴充包", "寵物小精靈卡", "PSA10", "鑑定卡"
    ]
  },
  {
    "id": "union_arena",
    "primary_name": "Union Arena (UA卡牌)",
    "category": "玩具",
    "aliases": [
      "Union Arena", "UA卡", "UA卡包", "萬代卡牌", "排球少年卡", "藍色監獄卡", "HUNTER卡"
    ]
  },
  {
    "id": "samyang",
    "primary_name": "Samyang (三養食品)",
    "category": "生活用品",
    "aliases": [
      "三養", "Samyang", "辣雞麵", "火辣雞肉麵", "韓國辣麵", "四重芝士辣雞麵", "奶油辣雞麵", "泡麵"
    ]
  },
  {
    "id": "nissin",
    "primary_name": "Nissin (日清食品)",
    "category": "生活用品",
    "aliases": [
      "日清", "Nissin", "合味道", "Cup Noodles", "出前一丁", "UFO炒麵", "日清兵衛", "烏冬", "拉麵"
    ]
  },
  {
    "id": "calbee",
    "primary_name": "Calbee (卡樂B)",
    "category": "生活用品",
    "aliases": [
      "卡樂B", "Calbee", "卡樂比", "熱浪", "熱浪薯片", "蝦條", "薯條三兄弟", "粟米條", "薯片"
    ]
  },
  {
    "id": "lays",
    "primary_name": "Lay's (樂事薯片)",
    "category": "生活用品",
    "aliases": [
      "Lay's", "Lays", "樂事", "樂事薯片", "大波浪薯片", "美國薯片"
    ]
  },
  {
    "id": "thermos",
    "primary_name": "Thermos (膳魔師)",
    "category": "生活用品",
    "aliases": [
      "Thermos", "膳魔師", "保溫杯", "保溫瓶", "燜燒罐", "保冷杯", "露營杯"
    ]
  },
  {
    "id": "bruno",
    "primary_name": "Bruno (生活家品)",
    "category": "生活用品",
    "aliases": [
      "Bruno", "Bruno餐具", "Bruno水杯", "保溫保冷杯", "陶瓷碗", "日系餐具"
    ]
  },
  {
    "id": "downy",
    "primary_name": "Downy (當妮)",
    "category": "生活用品",
    "aliases": [
      "Downy", "當妮", "香香珠", "洗衣香體珠", "柔順劑", "洗衣凝珠"
    ]
  },
  {
    "id": "sonny_angel",
    "primary_name": "Sonny Angel",
    "category": "玩具",
    "aliases": [
      "Sonny Angel", "SonnyAngel", "索尼天使", "光屁股娃娃", "SA盲盒", "SA公仔", "水果娃娃"
    ]
  },
  {
    "id": "smiski",
    "primary_name": "Smiski (夜光精靈)",
    "category": "玩具",
    "aliases": [
      "Smiski", "夜光精靈", "角落精靈", "發光小人", "角落小人", "Dreams盲盒"
    ]
  },
  {
    "id": "takara_tomy_beyblade",
    "primary_name": "Takara Tomy (爆旋陀螺)",
    "category": "玩具",
    "aliases": [
      "Takara Tomy", "特佳樂多美", "達佳兒美", "TOMY",
      "爆旋陀螺", "戰鬥陀螺", "Beyblade", "Beyblade X", "BB陀螺",
      "BX00", "BX01", "BX14", "BX20", "BX38", "BX48", "UX04",
      "隨機盲盒", "陀螺盲盒", "陀螺軸心", "陀螺盤", "發射器", "拉線發射器"
    ]
  }
];