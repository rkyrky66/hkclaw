// ============================================================
// js/store-data.js
// 爪爪情報站 - 店鋪資料載入
// ============================================================

// ============================================================
// 全域變數
// ============================================================
var STORES = [];
var MALLS_CACHE = null;

// ============================================================
// 載入店鋪資料
// ============================================================
async function loadCloud() {
  console.log("[v0] 直接從 Supabase 讀取資料...");
  try {
    var response = await fetch(SUPABASE_URL + "/rest/v1/claw_stores?select=*", {
      headers: getSupabaseHeaders()
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    var stores = await response.json();
    console.log("✅ 成功載入 " + stores.length + " 筆資料");
    
    STORES = stores.map(function(s) {
      var isVerified = s.status === "verified" || s.verified === "verified";
      
      return {
        id: String(s.id),
        name: s.name || "未命名店鋪",
        region: s.region || "旺角",
        addr: s.addr || "（未填地址）",
        ig: s.ig || "",
        fb: s.fb || "",
        status: s.status || "pending",
        verified: isVerified ? "verified" : "pending",
        size: s.size || "中",
        token: s.token || false,
        hour24: s.hour24 || false,
        staff: s.staff || false,
        dist: (Math.random() * 2 + 0.1).toFixed(1),
        machines: s.machines || [],
        photo: s.photo || "",
        lat: s.lat || null,
        lng: s.lng || null,
        mall: s.mall || null,
        floor: s.floor || null,
        submitted_by: s.submitted_by || null,
        verification_count: s.verification_count || 0,
        is_verified: s.is_verified || false,
        address_detail: s.address_detail || '',
        has_staff: s.has_staff !== undefined ? s.has_staff : null,
        has_e_coin: s.has_e_coin !== undefined ? s.has_e_coin : null,
        supplement_count: s.supplement_count || 0,
        supplemented_by: s.supplemented_by || null,
        is_hidden: s.is_hidden || false,
        type: s.mall && s.mall.trim() !== '' ? 'mall' : 'street',
        _userVerified: false,
        _userSupplemented: false
      };
    });
    console.log("✅ 已更新 STORES 陣列，共 " + STORES.length + " 家店鋪");
  } catch (e) {
    console.error("[v0] 讀取失敗:", e.message);
    STORES = seedStores();
    toast("無法載入店鋪資料，使用示範店鋪", "pink");
  }
}

// ============================================================
// 示範店鋪資料
// ============================================================
function seedStores() {
  var base = [
    { name: "爪玩店 · 旺角旗艦", region: "旺角", addr: "西洋菜南街 2A 好望角大廈", ig: "clawplay.mk", fb: "clawplayHK", verified: "verified", size: "大", token: false, hour24: true, staff: true },
    { name: "SayHi Claw · 銅鑼灣", region: "銅鑼灣", addr: "記利佐治街 1 號金百利", ig: "sayhi.claw", fb: "sayhiclaw", verified: "verified", size: "中", token: true, hour24: false, staff: true },
    { name: "夾夾樂 · 觀塘店", region: "觀塘", addr: "開源道 33 號建生廣場", ig: "gigilok", fb: "", verified: "pending", size: "細", token: false, hour24: true, staff: false },
    { name: "爪玩店 · 荃灣", region: "荃灣", addr: "沙咀道 388 號中國染廠", ig: "clawplay.tw", fb: "", verified: "verified", size: "中", token: true, hour24: false, staff: true },
    { name: "夾神殿 · 尖沙咀", region: "尖沙咀", addr: "加連威老道 21 號", ig: "clawgod", fb: "clawgodhk", verified: "pending", size: "大", token: false, hour24: true, staff: true }
  ];
  return base.map(function(s, i) {
    return Object.assign({ id: "s" + i }, s, { dist: (Math.random() * 2 + 0.1).toFixed(1), machines: seedMachines("s" + i, i) });
  });
}

function seedMachines(sid, seed) {
  var cnt = [3, 4, 2, 3, 5][seed % 5];
  var arr = [];
  for (var i = 0; i < cnt; i++) {
    var ageH = [2, 10, 60, 400, 26][(seed + i) % 5];
    arr.push({
      id: sid + "_m" + i,
      no: "A" + (i + 1),
      feats: [FEATURE_TAGS[(seed + i) % FEATURE_TAGS.length], FEATURE_TAGS[(seed + i + 4) % FEATURE_TAGS.length]],
      plays: [PLAY_TAGS[(seed + i) % PLAY_TAGS.length]],
      prize: ["chiikawa 公仔", "Sanrio 大布偶", "jellycat 茄子", "一番賞 A賞", "山系毛公仔"][(seed + i) % 5],
      updated: now() - ageH * HOUR,
      photo: ""
    });
  }
  return arr;
}

// ============================================================
// 載入商場資料
// ============================================================
async function loadMalls() {
  if (!CLOUD_ON) return { hk: [], kl: [], nt: [] };
  if (MALLS_CACHE) return MALLS_CACHE;
  try {
    var response = await fetch(SUPABASE_URL + "/rest/v1/malls?select=*&order=name", {
      headers: getSupabaseHeaders()
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    var malls = await response.json();
    var grouped = { hk: [], kl: [], nt: [] };
    malls.forEach(function(m) {
      if (m.region === '港島區') grouped.hk.push(m);
      else if (m.region === '九龍區') grouped.kl.push(m);
      else if (m.region === '新界區') grouped.nt.push(m);
    });
    MALLS_CACHE = grouped;
    return grouped;
  } catch (e) {
    console.error('載入商場失敗:', e);
    return { hk: [], kl: [], nt: [] };
  }
}