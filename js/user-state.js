// ============================================================
// js/user-state.js
// 爪爪情報站 - 用戶狀態管理 (STATE)
// ============================================================

// ============================================================
// 預設狀態
// ============================================================
var DEFAULT_STATE = {
  user: {
    name: "夾娃娃獵人 #" + Math.floor(Math.random() * 9000 + 1000),
    device: uid(),
    is_bound: false,
    email: '',
    google_id: '',
    user_id: '',
    display_name: '',
    avatar_url: ''
  },
  points: 120,
  filterPassUntil: 0,
  adFree: false,
  favStores: [],
  favMachines: [],
  myPosts: [],
  myIntel: [],
  daily: {},
  recentRegions: [],
  livePosts: [],
  total_xp: 0,
  achievements: {
    unlocked: [],
    stats: {
      submit_store: 0,
      verify_store: 0,
      supplement: 0,
      store_complete: 0,
      region_hk_island: 0,
      region_kowloon: 0,
      region_nt: 0,
      perfect_file: 0,
      streak_days: 0,
      last_active_date: '',
      weekly_days: [],
      monthly_days: [],
      checkin_streak: 0,
      cold_region_verify: 0
    }
  },
  verifications: {},
  titles: [],
  weeklyCheckin: {},
  _pendingPosts: [],
  _pendingFavs: [],
  _offlineReports: [],
  _reportDate: '',
  _reportCount: 0,
  _submitDate: '',
  _submitCount: 0,
  _currentViewingStore: null,
  notifications: [],
  checkins: {},
  taskProgress: {}
};

// ============================================================
// STATE 管理
// ============================================================
var STATE = load();

function load() {
  try {
    var raw = JSON.parse(localStorage.getItem("claw_state"));
    if (raw) {
      var merged = Object.assign({}, structuredClone(DEFAULT_STATE), raw);
      if (merged.achievements && merged.achievements.stats) {
        Object.keys(DEFAULT_STATE.achievements.stats).forEach(function(key) {
          if (merged.achievements.stats[key] === undefined) {
            merged.achievements.stats[key] = 0;
          }
        });
      }
      return merged;
    }
    return structuredClone(DEFAULT_STATE);
  } catch (_a) {
    return structuredClone(DEFAULT_STATE);
  }
}

function save() {
  localStorage.setItem("claw_state", JSON.stringify(STATE));
  renderPoints();
}

function renderPoints() {
  var el = document.getElementById("points-top");
  if (el) el.textContent = STATE.points;
}

function daily() {
  var k = todayKey();
  if (!STATE.daily[k]) STATE.daily[k] = { checkin: 0, review: 0, zombie: 0, ad: 0, adCooldownUntil: 0, live: 0, promoUsed: 0 };
  return STATE.daily[k];
}

function addXP(amount, actionType) {
  if (!STATE.total_xp) STATE.total_xp = 0;
  STATE.total_xp += amount;
  save();
}

// ============================================================
// 積分系統
// ============================================================
async function addPoints(n, why) {
  STATE.points = Math.max(0, STATE.points + n);
  save();
  renderPoints();
  
  var xpAmount = 0;
  if (why && why.includes('提交店鋪')) {
    xpAmount = 15;
    setTimeout(function() { return updateAchievementStat('submit_store'); }, 100);
    setTimeout(function() { return updateStreak(); }, 200);
  } else if (why && why.includes('認證')) {
    xpAmount = 15;
    setTimeout(function() { return updateAchievementStat('verify_store'); }, 100);
  } else if (why && (why.includes('認證通過') || why.includes('追加'))) {
    xpAmount = 35;
  } else if (why && why.includes('補充')) {
    xpAmount = 5;
    setTimeout(function() { return updateAchievementStat('supplement'); }, 100);
  } else if (why && why.includes('打卡')) {
    xpAmount = 5;
    setTimeout(function() { return updateCheckinStreak(); }, 100);
  } else if (why && why.includes('解鎖成就')) {
    xpAmount = 0;
  } else if (why && why.includes('每日任務達標獎勵')) {
    xpAmount = 10;
  } else {
    xpAmount = 2;
  }
  
  if (xpAmount > 0) {
    addXP(xpAmount, why);
  }
  
  // 雲端同步積分
  if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${STATE.user.user_id}`, {
        method: 'PATCH',
        headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          total_points: STATE.points,
          total_xp: STATE.total_xp || 0,
          last_active_at: new Date().toISOString()
        })
      });
      console.log('✅ 積分已同步到雲端');
    } catch (e) {
      console.warn('⚠️ 積分雲端同步失敗:', e.message);
    }
  }
  
  toast((n >= 0 ? "+" : "") + n + " 積分 · " + why, n >= 0 ? "green" : "pink");
}

// ============================================================
// 收藏系統
// ============================================================
async function toggleFav(type, id) {
  var key = type === "store" ? "favStores" : "favMachines";
  var arr = STATE[key];
  var i = arr.indexOf(id);
  var isAdding = false;
  
  if (i >= 0) {
    arr.splice(i, 1);
    toast("已取消收藏", "pink");
  } else {
    arr.push(id);
    isAdding = true;
    toast("⭐ 已收藏！有更新時會通知你", "green");
  }
  save();
  
  // 雲端同步收藏
  if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
    try {
      if (isAdding) {
        await fetch(`${SUPABASE_URL}/rest/v1/user_favorites`, {
          method: 'POST',
          headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify([{
            user_id: STATE.user.user_id,
            store_id: type === "store" ? id : null,
            machine_id: type === "machine" ? id : null,
            created_at: new Date().toISOString()
          }])
        });
      } else {
        var query = `user_id=eq.${STATE.user.user_id}`;
        if (type === "store") {
          query += `&store_id=eq.${id}`;
        } else {
          query += `&machine_id=eq.${id}`;
        }
        await fetch(`${SUPABASE_URL}/rest/v1/user_favorites?${query}`, {
          method: 'DELETE',
          headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' })
        });
      }
      console.log('✅ 收藏已同步到雲端');
    } catch (e) {
      console.warn('⚠️ 收藏雲端同步失敗:', e.message);
      if (!STATE._pendingFavs) STATE._pendingFavs = [];
      STATE._pendingFavs.push({ type: type, id: id, action: isAdding ? 'add' : 'remove' });
      save();
    }
  }
  
  if (type === "store") openStore(id);
}

// ============================================================
// 免廣告兌換
// ============================================================
async function redeemAdFree() {
  if (STATE.adFree) return toast("已兌換", "pink");
  if (STATE.points < 80) return toast("積分不足 80", "pink");
  
  await addPoints(-80, "兌換免廣告");
  STATE.adFree = true;
  save();
  
  if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${STATE.user.user_id}`, {
        method: 'PATCH',
        headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({
          ad_free: true,
          updated_at: new Date().toISOString()
        })
      });
      console.log('✅ 免廣告狀態已同步到雲端');
    } catch (e) {
      console.warn('⚠️ 免廣告狀態雲端同步失敗:', e.message);
    }
  }
  
  showView("me");
}

// ============================================================
// 每日提交限額
// ============================================================
async function checkDailySubmitLimit() {
  var today = new Date().toISOString().slice(0, 10);
  var deviceId = STATE.user.device;
  var userId = STATE.user.user_id || deviceId;
  
  if (CLOUD_ON) {
    try {
      var response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_daily_limits?user_id=eq.${userId}&date=eq.${today}&select=submit_count`,
        {
          headers: getSupabaseHeaders()
        }
      );
      
      if (response.ok) {
        var data = await response.json();
        var count = data.length > 0 ? data[0].submit_count : 0;
        if (count >= 3) {
          toast('⚠️ 每日僅能提交 3 間店鋪，明日再來！', 'pink');
          return false;
        }
        STATE._submitDate = today;
        STATE._submitCount = count;
        save();
        return true;
      }
    } catch (e) {
      console.warn('⚠️ 雲端檢查提交限額失敗，使用本地:', e.message);
    }
  }
  
  // 本地檢查 (fallback)
  if (!STATE._submitDate) {
    STATE._submitDate = today;
    STATE._submitCount = 0;
    save();
  }
  
  if (STATE._submitDate !== today) {
    STATE._submitDate = today;
    STATE._submitCount = 0;
    save();
  }
  
  if (STATE._submitCount >= 3) {
    toast('⚠️ 每日僅能提交 3 間店鋪，明日再來！', 'pink');
    return false;
  }
  
  return true;
}

// ============================================================
// 每日檢舉限額
// ============================================================
async function canUserReport() {
  var today = new Date().toISOString().slice(0, 10);
  var deviceId = STATE.user.device;
  var userId = STATE.user.user_id || deviceId;
  
  if (CLOUD_ON) {
    try {
      var response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_daily_limits?user_id=eq.${userId}&date=eq.${today}&select=report_count`,
        {
          headers: getSupabaseHeaders()
        }
      );
      
      if (response.ok) {
        var data = await response.json();
        var count = data.length > 0 ? data[0].report_count : 0;
        if (count >= 3) {
          toast('⚠️ 今日檢舉次數已達上限 (3次)，明日再來', 'pink');
          return false;
        }
        STATE._reportDate = today;
        STATE._reportCount = count;
        save();
        return true;
      }
    } catch (e) {
      console.warn('⚠️ 雲端檢查檢舉限額失敗，使用本地:', e.message);
    }
  }
  
  // 本地檢查 (fallback)
  if (!STATE._reportDate) {
    STATE._reportDate = today;
    STATE._reportCount = 0;
    save();
  }
  
  if (STATE._reportDate !== today) {
    STATE._reportDate = today;
    STATE._reportCount = 0;
    save();
  }
  
  if (STATE._reportCount >= 3) {
    toast('⚠️ 今日檢舉次數已達上限 (3次)，明日再來', 'pink');
    return false;
  }
  
  return true;
}