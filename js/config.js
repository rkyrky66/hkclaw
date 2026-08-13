// ============================================================
// js/config.js
// 爪爪情報站 - 所有配置與常數定義
// ============================================================

// ============================================================
// Supabase 配置
// ============================================================
var SUPABASE_URL = "https://vyoyiqbqmlqfipsaqpbs.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5b3lpcWJxbWxxZmlwc2FxcGJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTg4NTYsImV4cCI6MjEwMDc3NDg1Nn0.up5fdw0ElKh5LGUzKVd0VnMEI2hLUeFhuf1QkNlX92M";

var CLOUD_ON = SUPABASE_URL.startsWith("http") && SUPABASE_KEY && SUPABASE_KEY !== "YOUR_SUPABASE_ANON_KEY";

// ============================================================
// 時間常數
// ============================================================
var DAY = 86400000;
var HOUR = 3600000;

// ============================================================
// 工具函數
// ============================================================
var now = function() { return Date.now(); };
var uid = function() { return Math.random().toString(36).slice(2, 10); };
var todayKey = function() { return new Date().toISOString().slice(0, 10); };

// ============================================================
// 香港地區定義 (用於找店頁面)
// ============================================================
var REGIONS = {
  hk: {
    label: "港島區",
    icon: "🏝️",
    hot: ["銅鑼灣", "天后", "北角"],
    more: ["中環", "金鐘", "上環", "灣仔", "鰂魚涌", "太古", "筲箕灣", "香港仔", "杏花邨", "黃竹坑"]
  },
  kl: {
    label: "九龍區",
    icon: "🏙️",
    hot: ["旺角", "尖沙咀", "觀塘", "深水埗", "紅磡", "藍田"],
    more: ["油麻地", "九龍城", "土瓜灣", "黃大仙", "牛頭角", "九龍灣", "秀茂坪", "油塘", "樂富", "啟德", "黃埔", "慈雲山", "大角咀", "荔枝角"]
  },
  nt: {
    label: "新界區",
    icon: "🌳",
    hot: ["屯門", "荃灣", "元朗", "葵芳", "將軍澳", "大埔"],
    more: ["葵興", "天水圍", "沙田", "大圍", "馬鞍山", "上水", "粉嶺", "青衣", "東涌", "昂坪", "坑口", "調景嶺", "日出康城", "西貢"]
  }
};

// ============================================================
// 18區 → 三大區映射 (用於區域探索進度)
// ============================================================
var REGION_MAPPING = {
    '港島區': ['中西區', '灣仔', '東區', '南區'],
    '九龍區': ['油尖旺', '深水埗', '九龍城', '黃大仙', '觀塘'],
    '新界區': ['荃灣', '屯門', '元朗', '北區', '大埔', '西貢', '沙田', '葵青', '離島']
};

// ============================================================
// 18區顯示名稱 (用於地圖多邊形懸浮顯示)
// ============================================================
var DISTRICT_NAMES = {
    'A': '中西區',
    'B': '灣仔',
    'C': '東區',
    'D': '南區',
    'E': '油尖旺',
    'F': '深水埗',
    'G': '九龍城',
    'H': '黃大仙',
    'J': '觀塘',
    'K': '荃灣',
    'L': '屯門',
    'M': '元朗',
    'N': '北區',
    'P': '大埔',
    'Q': '西貢',
    'R': '沙田',
    'S': '葵青',
    'T': '離島'
};

// ============================================================
// 標籤與玩法定義
// ============================================================
var FEATURE_TAGS = ["技術台", "實爪台", "幸運台", "山崩台", "標準盒", "一番賞", "Sanrio", "chiikawa", "jellycat"];
var PLAY_TAGS = ["刮盤", "夾送", "翻牌", "推幣"];

// ============================================================
// 頁面標題
// ============================================================
var SUBTITLES = {
  map: "📍 附近店鋪 · 地圖探索",
  find: "GPS 找店 · 動態機台情報",
  task: "現場獵人 · 任務積分板",
  live: "前線戰報 · 台主 × 夾客",
  me: "個人中心 · 積分與收藏"
};

// ============================================================
// 導航顏色
// ============================================================
var NAV_COLOR = {
  map: "text-neongreen",
  find: "text-neongreen",
  task: "text-neonpink",
  live: "text-neongreen",
  me: "text-gold"
};

// ============================================================
// 地圖中心點
// ============================================================
var HK_CENTER = { lat: 22.3193, lng: 114.1694 };

// ============================================================
// 地區中心點 (用於地圖定位)
// ============================================================
var REGION_CENTERS = {
  '銅鑼灣': { lat: 22.2799, lng: 114.1838 },
  '天后': { lat: 22.2810, lng: 114.1900 },
  '北角': { lat: 22.2910, lng: 114.2005 },
  '中環': { lat: 22.2820, lng: 114.1560 },
  '旺角': { lat: 22.3193, lng: 114.1694 },
  '尖沙咀': { lat: 22.2960, lng: 114.1720 },
  '觀塘': { lat: 22.3120, lng: 114.2230 },
  '深水埗': { lat: 22.3308, lng: 114.1572 },
  '荃灣': { lat: 22.3710, lng: 114.1150 },
  '葵芳': { lat: 22.3582, lng: 114.1270 },
  '葵涌': { lat: 22.3582, lng: 114.1253 },
  '元朗': { lat: 22.4430, lng: 114.0340 },
  '屯門': { lat: 22.3930, lng: 113.9700 },
  '將軍澳': { lat: 22.3185, lng: 114.2580 }
};

// ============================================================
// 檢舉分類
// ============================================================
var REPORT_CATEGORIES = [
  { value: 'store_not_exist', label: '🏪 店鋪不存在' },
  { value: 'location_wrong', label: '📍 位置錯誤' },
  { value: 'photo_fake', label: '📸 照片造假' },
  { value: 'machine_not_exist', label: '🎰 機台不存在' },
  { value: 'tag_wrong', label: '🏷️ 標籤錯誤' },
  { value: 'other', label: '💬 其他' }
];

// ============================================================
// 成就定義
// ============================================================
var ACHIEVEMENT_DEFS = {
  pioneer: { key: 'pioneer', name: '開路先鋒', category: 'submission', icon: '🏪', description: '提交第 1 間店鋪', condition: { type: 'submit_store', count: 1 }, reward: { points: 10, title: '拓荒者' } },
  local_guide: { key: 'local_guide', name: '在地導遊', category: 'submission', icon: '🏪', description: '提交 5 間店鋪', condition: { type: 'submit_store', count: 5 }, reward: { points: 20, title: null } },
  explorer: { key: 'explorer', name: '城市探險家', category: 'submission', icon: '🏪', description: '提交 15 間店鋪', condition: { type: 'submit_store', count: 15 }, reward: { points: 50, title: '探險家' } },
  hk_expert: { key: 'hk_expert', name: '香港通', category: 'submission', icon: '🏪', description: '提交 30 間店鋪', condition: { type: 'submit_store', count: 30 }, reward: { points: 100, title: '香港通' } },
  store_king: { key: 'store_king', name: '店鋪之王', category: 'submission', icon: '🏪', description: '提交 50 間店鋪', condition: { type: 'submit_store', count: 50 }, reward: { points: 200, title: '店王' } },
  legend_hunter: { key: 'legend_hunter', name: '傳奇店鋪獵人', category: 'submission', icon: '🏪', description: '提交 100 間店鋪', condition: { type: 'submit_store', count: 100 }, reward: { points: 500, title: '傳奇獵人' } },
  trainee_verifier: { key: 'trainee_verifier', name: '見習驗證員', category: 'verification', icon: '🔍', description: '認證 1 間店鋪', condition: { type: 'verify_store', count: 1 }, reward: { points: 10, title: null } },
  senior_verifier: { key: 'senior_verifier', name: '資深驗證員', category: 'verification', icon: '🔍', description: '認證 10 間店鋪', condition: { type: 'verify_store', count: 10 }, reward: { points: 30, title: '驗證員' } },
  chief_verifier: { key: 'chief_verifier', name: '首席驗證官', category: 'verification', icon: '🔍', description: '認證 30 間店鋪', condition: { type: 'verify_store', count: 30 }, reward: { points: 80, title: '首席驗證官' } },
  trusted: { key: 'trusted', name: '信譽保證', category: 'verification', icon: '🔍', description: '認證 50 間店鋪（且無錯誤記錄）', condition: { type: 'verify_store', count: 50 }, reward: { points: 150, title: '信譽保證' } },
  first_complete: { key: 'first_complete', name: '完成任務', category: 'complete', icon: '🏅', description: '有 1 間店鋪完成全部認證', condition: { type: 'store_complete', count: 1 }, reward: { points: 10, title: null } },
  reliable: { key: 'reliable', name: '可靠情報員', category: 'complete', icon: '🏅', description: '有 5 間店鋪完成全部認證', condition: { type: 'store_complete', count: 5 }, reward: { points: 30, title: '可靠情報員' } },
  gold_spy: { key: 'gold_spy', name: '金牌情報員', category: 'complete', icon: '🏅', description: '有 15 間店鋪完成全部認證', condition: { type: 'store_complete', count: 15 }, reward: { points: 80, title: '金牌情報員' } },
  diamond_spy: { key: 'diamond_spy', name: '鑽石情報員', category: 'complete', icon: '🏅', description: '有 30 間店鋪完成全部認證', condition: { type: 'store_complete', count: 30 }, reward: { points: 200, title: '鑽石情報員' } },
  hk_island: { key: 'hk_island', name: '港島通', category: 'region', icon: '🏙️', description: '在港島區有 5 間店鋪完成認證', condition: { type: 'region_hk_island', count: 5 }, reward: { points: 20, title: null } },
  kowloon: { key: 'kowloon', name: '九龍通', category: 'region', icon: '🏙️', description: '在九龍區有 5 間店鋪完成認證', condition: { type: 'region_kowloon', count: 5 }, reward: { points: 20, title: null } },
  nt: { key: 'nt', name: '新界通', category: 'region', icon: '🏙️', description: '在新界區有 5 間店鋪完成認證', condition: { type: 'region_nt', count: 5 }, reward: { points: 20, title: null } },
  hk_all: { key: 'hk_all', name: '全港制霸', category: 'region', icon: '🌟', description: '三個地區成就全解鎖', condition: { type: 'region_all', count: 1 }, reward: { points: 100, title: '全港制霸' } },
  data_assistant: { key: 'data_assistant', name: '資料助理', category: 'supplement', icon: '📝', description: '補充 10 次店鋪資料', condition: { type: 'supplement', count: 10 }, reward: { points: 15, title: null } },
  data_expert: { key: 'data_expert', name: '資料專家', category: 'supplement', icon: '📝', description: '補充 30 次店鋪資料', condition: { type: 'supplement', count: 30 }, reward: { points: 40, title: '資料專家' } },
  data_master: { key: 'data_master', name: '資料大師', category: 'supplement', icon: '📝', description: '補充 50 次店鋪資料', condition: { type: 'supplement', count: 50 }, reward: { points: 80, title: '資料大師' } },
  perfect_file: { key: 'perfect_file', name: '完美檔案', category: 'supplement', icon: '📝', description: '同一間店鋪完成全部 4 項補充', condition: { type: 'perfect_file', count: 1 }, reward: { points: 20, title: '檔案整理師' } },
  streak_7: { key: 'streak_7', name: '連續 7 天貢獻', category: 'streak', icon: '🔥', description: '連續 7 天有提交或認證', condition: { type: 'streak', count: 7 }, reward: { points: 20, title: null } },
  streak_30: { key: 'streak_30', name: '連續 30 天貢獻', category: 'streak', icon: '🔥🔥', description: '連續 30 天有提交或認證', condition: { type: 'streak', count: 30 }, reward: { points: 80, title: null } },
  streak_100: { key: 'streak_100', name: '連續 100 天貢獻', category: 'streak', icon: '🔥🔥🔥', description: '連續 100 天有提交或認證', condition: { type: 'streak', count: 100 }, reward: { points: 300, title: null } },
  weekly_perfect: { key: 'weekly_perfect', name: '一週全勤', category: 'streak', icon: '⭐', description: '一週 7 天都有貢獻', condition: { type: 'weekly_perfect', count: 1 }, reward: { points: 30, title: null } },
  monthly_perfect: { key: 'monthly_perfect', name: '月度全勤', category: 'streak', icon: '⭐', description: '一個月 30 天都有貢獻', condition: { type: 'monthly_perfect', count: 1 }, reward: { points: 100, title: null } },
  cold_region_explorer: {
    key: 'cold_region_explorer',
    name: '秘境探索者',
    category: 'region',
    icon: '🗺️',
    description: '認證 3 間冷門區域的店鋪（該區少於 5 間店）',
    condition: { type: 'cold_region_verify', count: 3 },
    reward: { points: 40, title: '秘境探索者' }
  }
};