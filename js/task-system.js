// ============================================================
// js/task-system.js (修正版)
// 爪爪情報站 - 任務系統與成就系統
// ============================================================

// ============================================================
// 任務定義
// ============================================================
var TASK_TYPES = {
    submit_store: {
        label: '提交店鋪',
        points: 15,
        icon: '🏪',
        category: 'core',
        limit: 3,
        action: 'openIntelForm',
        efficiency: 3
    },
    verify_store: {
        label: '認證店鋪',
        points: 15,
        icon: '🔍',
        category: 'core',
        limit: 3,
        action: 'openVerifyTask',
        efficiency: 3
    },
    supplement: {
        label: '補充資料',
        points: 15,
        icon: '📝',
        category: 'core',
        limit: 3,
        action: 'openSupplementTask',
        efficiency: 3
    },
    checkin: {
        label: '店鋪打卡',
        points: 5,
        icon: '📍',
        category: 'daily',
        limit: 5,
        action: 'quickTaskCheckin',
        efficiency: 1
    },
    machine_checkin: {
        label: '機台打卡',
        points: 5,
        icon: '🎰',
        category: 'daily',
        limit: 5,
        action: 'quickTaskMachine',
        efficiency: 1
    },
    share: {
        label: '分享戰績',
        points: 5,
        icon: '📢',
        category: 'daily',
        limit: 3,
        action: 'quickTaskShare',
        efficiency: 1
    }
};

// ============================================================
// 任務進度管理
// ============================================================
function getTaskProgress() {
    var today = todayKey();
    if (!STATE.taskProgress) STATE.taskProgress = {};
    if (!STATE.taskProgress[today]) {
        STATE.taskProgress[today] = {
            submit_store: 0,
            verify_store: 0,
            supplement: 0,
            checkin: 0,
            machine_checkin: 0,
            share: 0,
            total_points: 0,
            goal_reached: false,
            goal_rewarded: false
        };
    }
    return STATE.taskProgress[today];
}

function calculateDailyScore(progress) {
    if (!progress) progress = getTaskProgress();
    var total = 0;
    for (var key in TASK_TYPES) {
        var done = progress[key] || 0;
        total += done * TASK_TYPES[key].points;
    }
    return total;
}

function isDailyGoalReached(progress) {
    if (!progress) progress = getTaskProgress();
    return calculateDailyScore(progress) >= 50;
}

async function recordTaskCompletion(taskKey) {
    var progress = getTaskProgress();
    var task = TASK_TYPES[taskKey];
    if (!task) return false;
    
    var current = progress[taskKey] || 0;
    if (current >= task.limit) {
        toast('⚠️ 今日 ' + task.label + ' 已達上限 (' + task.limit + ' 次)', 'pink');
        return false;
    }
    
    progress[taskKey] = current + 1;
    progress.total_points = calculateDailyScore(progress);
    
    var wasReached = progress.goal_reached || false;
    var isReached = progress.total_points >= 50;
    
    if (isReached && !wasReached) {
        progress.goal_reached = true;
        progress.goal_rewarded = true;
        await addPoints(20, '🎯 每日任務達標獎勵！');
        toast('🎉 恭喜達成今日目標！獲得 +20 獎勵積分！', 'gold');
    }
    
    save();
    
    if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
        try {
            await syncTaskProgress(progress);
        } catch (e) {
            console.warn('⚠️ 任務進度雲端同步失敗:', e.message);
        }
    }
    
    return true;
}

async function syncTaskProgress(progress) {
    if (!CLOUD_ON || !STATE.user.is_bound || !STATE.user.user_id) return;
    
    var today = todayKey();
    try {
        await fetch(
            SUPABASE_URL + "/rest/v1/task_progress?user_id=eq." + STATE.user.user_id + "&date=eq." + today,
            {
                method: 'PATCH',
                headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
                body: JSON.stringify({
                    submit_store: progress.submit_store || 0,
                    verify_store: progress.verify_store || 0,
                    supplement: progress.supplement || 0,
                    checkin: progress.checkin || 0,
                    machine_checkin: progress.machine_checkin || 0,
                    share: progress.share || 0,
                    total_points: progress.total_points || 0,
                    is_goal_reached: progress.goal_reached || false,
                    updated_at: new Date().toISOString()
                })
            }
        );
    } catch (e) {
        console.warn('⚠️ 同步任務進度失敗:', e.message);
    }
}

async function loadTaskProgressFromCloud() {
    if (!CLOUD_ON || !STATE.user.is_bound || !STATE.user.user_id) return;
    
    var today = todayKey();
    try {
        var response = await fetch(
            SUPABASE_URL + "/rest/v1/task_progress?user_id=eq." + STATE.user.user_id + "&date=eq." + today,
            { headers: getSupabaseHeaders() }
        );
        if (!response.ok) throw new Error('HTTP ' + response.status);
        var data = await response.json();
        
        if (data && data.length > 0) {
            var cloudProgress = data[0];
            var localProgress = getTaskProgress();
            
            for (var key in TASK_TYPES) {
                if (cloudProgress[key] !== undefined) {
                    localProgress[key] = Math.max(localProgress[key] || 0, cloudProgress[key] || 0);
                }
            }
            localProgress.total_points = calculateDailyScore(localProgress);
            localProgress.goal_reached = cloudProgress.is_goal_reached || false;
            
            save();
            console.log('✅ 任務進度已從雲端同步');
        }
    } catch (e) {
        console.warn('⚠️ 加載任務進度失敗:', e.message);
    }
}

// ============================================================
// 成就系統
// ============================================================
function getAchievementState() {
  if (!STATE.achievements) {
    STATE.achievements = {
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
        cold_region_verify: 0
      }
    };
    save();
  }
  return STATE.achievements;
}

function updateAchievementStat(statType, increment) {
  if (increment === void 0) increment = 1;
  var state = getAchievementState();
  if (state.stats[statType] !== undefined) {
    state.stats[statType] += increment;
    save();
    checkAchievements();
    
    if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
      if (!window._statsSyncTimer) {
        window._statsSyncTimer = setTimeout(function() {
          window._statsSyncTimer = null;
          syncAchievementStats();
        }, 3000);
      }
    }
  }
}

async function syncAchievementStats() {
  if (!CLOUD_ON || !STATE.user.is_bound || !STATE.user.user_id) return;
  
  try {
    var state = getAchievementState();
    await fetch(`${SUPABASE_URL}/rest/v1/user_stats?user_id=eq.${STATE.user.user_id}`, {
      method: 'PATCH',
      headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify({
        submit_store: state.stats.submit_store || 0,
        verify_store: state.stats.verify_store || 0,
        supplement: state.stats.supplement || 0,
        store_complete: state.stats.store_complete || 0,
        streak_days: state.stats.streak_days || 0,
        last_active_date: state.stats.last_active_date || '',
        updated_at: new Date().toISOString()
      })
    });
    console.log('✅ 成就統計已同步到雲端');
  } catch (e) {
    console.warn('⚠️ 成就統計雲端同步失敗:', e.message);
  }
}

function getAchievementProgress(key) {
  var state = getAchievementState();
  var def = ACHIEVEMENT_DEFS[key];
  if (!def) return { current: 0, required: 0, percentage: 0, isUnlocked: false };
  var stats = state.stats;
  var unlocked = state.unlocked || [];
  var current = 0, required = def.condition.count;
  
  switch (def.condition.type) {
    case 'submit_store': current = stats.submit_store || 0; break;
    case 'verify_store': current = stats.verify_store || 0; break;
    case 'store_complete': current = stats.store_complete || 0; break;
    case 'region_hk_island': current = stats.region_hk_island || 0; break;
    case 'region_kowloon': current = stats.region_kowloon || 0; break;
    case 'region_nt': current = stats.region_nt || 0; break;
    case 'region_all': current = unlocked.includes('hk_island') && unlocked.includes('kowloon') && unlocked.includes('nt') ? 1 : 0; break;
    case 'supplement': current = stats.supplement || 0; break;
    case 'perfect_file': current = stats.perfect_file || 0; break;
    case 'streak': current = stats.streak_days || 0; break;
    case 'weekly_perfect': current = stats.weekly_perfect || 0; break;
    case 'monthly_perfect': current = stats.monthly_perfect || 0; break;
    case 'cold_region_verify': current = stats.cold_region_verify || 0; break;
    default: break;
  }
  
  var isUnlocked = unlocked.includes(key);
  var percentage = Math.min(100, Math.round((current / required) * 100));
  return { current: current, required: required, percentage: percentage, isUnlocked: isUnlocked };
}

function showAchievementUnlock(def) {
  var root = document.getElementById('toast-root');
  if (!root) return;
  var el = document.createElement('div');
  el.className = 'animate-pop pointer-events-auto rounded-2xl border border-gold bg-black/90 px-5 py-3 text-center glow-gold max-w-sm';
  el.innerHTML = '<div class="text-2xl">' + def.icon + '</div><div class="text-xs text-white/50 mt-0.5">🏆 成就解鎖！</div><div class="text-sm font-bold text-gold">' + def.name + '</div><div class="text-[10px] text-white/40">' + def.description + '</div>' + (def.reward.points > 0 ? '<div class="text-[10px] text-neongreen mt-1">+' + def.reward.points + ' 積分</div>' : '') + (def.reward.title ? '<div class="text-[10px] text-neonpink">獲得稱號：' + def.reward.title + '</div>' : '');
  root.appendChild(el);
  setTimeout(function() { return el.remove(); }, 4000);
}

function checkAchievements() {
  var state = getAchievementState();
  var unlocked = state.unlocked || [];
  var newUnlocks = [];
  
  Object.keys(ACHIEVEMENT_DEFS).forEach(function(key) {
    if (unlocked.includes(key)) return;
    var def = ACHIEVEMENT_DEFS[key];
    var stats = state.stats;
    var isUnlocked = false;
    
    switch (def.condition.type) {
      case 'submit_store': if (stats.submit_store >= def.condition.count) isUnlocked = true; break;
      case 'verify_store': if (stats.verify_store >= def.condition.count) isUnlocked = true; break;
      case 'store_complete': if (stats.store_complete >= def.condition.count) isUnlocked = true; break;
      case 'region_hk_island': if (stats.region_hk_island >= def.condition.count) isUnlocked = true; break;
      case 'region_kowloon': if (stats.region_kowloon >= def.condition.count) isUnlocked = true; break;
      case 'region_nt': if (stats.region_nt >= def.condition.count) isUnlocked = true; break;
      case 'region_all': if (unlocked.includes('hk_island') && unlocked.includes('kowloon') && unlocked.includes('nt')) isUnlocked = true; break;
      case 'supplement': if (stats.supplement >= def.condition.count) isUnlocked = true; break;
      case 'perfect_file': if (stats.perfect_file >= def.condition.count) isUnlocked = true; break;
      case 'streak': if (stats.streak_days >= def.condition.count) isUnlocked = true; break;
      case 'weekly_perfect': if (stats.weekly_perfect >= def.condition.count) isUnlocked = true; break;
      case 'monthly_perfect': if (stats.monthly_perfect >= def.condition.count) isUnlocked = true; break;
      case 'cold_region_verify': if (stats.cold_region_verify >= def.condition.count) isUnlocked = true; break;
      default: break;
    }
    
    if (isUnlocked) {
      unlocked.push(key);
      newUnlocks.push(key);
      if (def.reward.points > 0) {
        addPoints(def.reward.points, '解鎖成就：' + def.name);
      }
      if (def.reward.title) {
        if (!STATE.titles) STATE.titles = [];
        if (!STATE.titles.includes(def.reward.title)) STATE.titles.push(def.reward.title);
      }
      showAchievementUnlock(def);
      
      if (CLOUD_ON) {
        var userId = STATE.user.user_id || STATE.user.device;
        cloudInsert('user_achievements', {
          user_id: userId,
          achievement_key: key,
          achievement_name: def.name,
          unlocked_at: new Date().toISOString()
        });
      }
    }
  });
  
  STATE.achievements.unlocked = unlocked;
  save();
}

function updateStreak() {
  var state = getAchievementState();
  var today = todayKey();
  var yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  var yesterdayKey = yesterday.toISOString().slice(0, 10);
  
  if (state.stats.last_active_date === today) return;
  if (state.stats.last_active_date === yesterdayKey) state.stats.streak_days += 1;
  else if (state.stats.last_active_date !== today) state.stats.streak_days = 1;
  state.stats.last_active_date = today;
  
  var dayOfWeek = new Date().getDay();
  var weekDay = dayOfWeek === 0 ? 7 : dayOfWeek;
  if (!state.stats.weekly_days.includes(weekDay)) {
    state.stats.weekly_days.push(weekDay);
    if (state.stats.weekly_days.length === 7) {
      updateAchievementStat('weekly_perfect', 1);
      state.stats.weekly_days = [];
    }
  }
  
  var dayOfMonth = new Date().getDate();
  if (!state.stats.monthly_days.includes(dayOfMonth)) {
    state.stats.monthly_days.push(dayOfMonth);
    if (state.stats.monthly_days.length === 30 || state.stats.monthly_days.length === 31) {
      updateAchievementStat('monthly_perfect', 1);
      state.stats.monthly_days = [];
    }
  }
  
  save();
  checkAchievements();
}

function updateCheckinStreak() {
  var progress = getWeeklyCheckinProgress();
  if (!STATE.achievements) STATE.achievements = {};
  if (!STATE.achievements.stats) STATE.achievements.stats = {};
  STATE.achievements.stats.checkin_streak = progress.count;
  save();
}

function getUserLevel() {
  var xp = STATE.total_xp || 0;
  var levels = [
    { level: 1, title: '新手爪友', xp: 0 },
    { level: 2, title: '見習爪客', xp: 50 },
    { level: 3, title: '探索爪客', xp: 150 },
    { level: 4, title: '情報爪客', xp: 300 },
    { level: 5, title: '資深爪客', xp: 500 },
    { level: 6, title: '偵查爪客', xp: 800 },
    { level: 7, title: '獵人爪客', xp: 1200 },
    { level: 8, title: '金牌爪客', xp: 1800 },
    { level: 9, title: '傳說爪客', xp: 2500 },
    { level: 10, title: '爪皇', xp: 3500 }
  ];
  var currentLevel = levels[0], nextLevel = levels[1];
  for (var i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].xp) {
      currentLevel = levels[i];
      nextLevel = levels[i + 1] || null;
      break;
    }
  }
  return {
    level: currentLevel.level,
    title: currentLevel.title,
    xp: xp,
    xpForCurrent: currentLevel.xp,
    xpForNext: nextLevel ? nextLevel.xp : xp,
    nextTitle: nextLevel ? nextLevel.title : null,
    percentage: nextLevel ? Math.min(100, Math.round(((xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100)) : 100
  };
}

// ============================================================
// 簽到管理 (CheckinManager) - 移到此處確保可用
// ============================================================
const CheckinManager = {
  getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  },
  getReminderKey() {
    return 'claw_reminder_' + this.getTodayKey();
  },
  hasShownToday() {
    return localStorage.getItem(this.getReminderKey()) === 'true';
  },
  markShownToday() {
    localStorage.setItem(this.getReminderKey(), 'true');
  },
  
  async isCheckedInToday() {
    const today = this.getTodayKey();
    const deviceId = STATE.user.device;
    
    if (!CLOUD_ON) {
      const progress = getWeeklyCheckinProgress();
      return progress.isTodaySigned;
    }
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_checkins?select=id&device_id=eq.${deviceId}&checkin_date=eq.${today}&limit=1`,
        { headers: getSupabaseHeaders() }
      );
      if (!response.ok) return false;
      const data = await response.json();
      return data.length > 0;
    } catch (e) {
      console.warn('⚠️ 檢查簽到失敗，使用本地:', e.message);
      const progress = getWeeklyCheckinProgress();
      return progress.isTodaySigned;
    }
  },
  
  async doCheckin() {
    const today = this.getTodayKey();
    const deviceId = STATE.user.device;
    const userId = STATE.user.user_id || null;
    
    const alreadyChecked = await this.isCheckedInToday();
    if (alreadyChecked) {
      toast('今日已簽到，明天再來吧！', 'gold');
      return false;
    }
    
    const progress = getWeeklyCheckinProgress();
    const daysSigned = progress.count + 1;
    let bonus = 5;
    let bonusMsg = '基礎簽到 +5 分';
    if (daysSigned === 3) {
      bonus += 5;
      bonusMsg = '連續 3 天！額外 +5 分 🎉';
    } else if (daysSigned === 5) {
      bonus += 5;
      bonusMsg = '連續 5 天！額外 +5 分 🎉🎉';
    } else if (daysSigned === 7) {
      bonus += 15;
      bonusMsg = '🎊 本週全勤！額外 +15 分 🎊';
    }
    
    if (CLOUD_ON) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/user_checkins`, {
          method: 'POST',
          headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify([{
            device_id: deviceId,
            user_id: userId,
            checkin_date: today,
            created_at: new Date().toISOString()
          }])
        });
        if (!response.ok) {
          if (response.status === 409) {
            toast('今日已簽到', 'gold');
            return false;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        console.log('✅ 簽到已同步到雲端');
      } catch (e) {
        console.warn('⚠️ 雲端同步失敗，儲存到本地:', e.message);
        this._saveLocal(today);
      }
    } else {
      this._saveLocal(today);
    }
    
    this._updateLocalState(today);
    await addPoints(bonus, `簽到 (第 ${daysSigned} 天)`);
    updateAchievementStat('checkin', 1);
    updateStreak();
    this.markShownToday();
    
    await recordTaskCompletion('checkin');
    
    toast(`✅ 簽到成功！獲得 ${bonus} 分（${bonusMsg}）`, 'green');
    showView('task');
    return true;
  },
  
  _saveLocal(today) {
    const weekStart = getWeekStartDate(new Date());
    const weekKey = weekStart.toISOString().slice(0, 10);
    if (!STATE.weeklyCheckin) STATE.weeklyCheckin = {};
    if (!STATE.weeklyCheckin[weekKey]) {
      STATE.weeklyCheckin[weekKey] = { days: [], claimed: false };
    }
    const dayOfWeek = new Date().getDay();
    const todayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    if (!STATE.weeklyCheckin[weekKey].days.includes(todayNum)) {
      STATE.weeklyCheckin[weekKey].days.push(todayNum);
    }
    save();
  },
  
  _updateLocalState(today) {
    const weekStart = getWeekStartDate(new Date());
    const weekKey = weekStart.toISOString().slice(0, 10);
    const dayOfWeek = new Date().getDay();
    const todayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
    if (!STATE.weeklyCheckin) STATE.weeklyCheckin = {};
    if (!STATE.weeklyCheckin[weekKey]) {
      STATE.weeklyCheckin[weekKey] = { days: [], claimed: false };
    }
    if (!STATE.weeklyCheckin[weekKey].days.includes(todayNum)) {
      STATE.weeklyCheckin[weekKey].days.push(todayNum);
    }
    save();
  },
  
  async checkAndShowReminder() {
    if (this.hasShownToday()) {
      console.log('📅 今日已顯示過簽到提醒，跳過');
      return;
    }
    
    const checkedIn = await this.isCheckedInToday();
    if (checkedIn) {
      this.markShownToday();
      console.log('📅 今日已簽到，標記為已顯示');
      return;
    }
    
    console.log('📅 今日尚未簽到，顯示提醒');
    setTimeout(() => {
      showCheckinReminder();
      this.markShownToday();
    }, 2000);
  },
  
  async syncFromCloud() {
    const deviceId = STATE.user.device;
    const today = new Date();
    const weekStart = getWeekStartDate(today);
    const weekStartStr = weekStart.toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);
    
    if (!CLOUD_ON) return;
    
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/user_checkins?select=checkin_date&device_id=eq.${deviceId}&checkin_date=gte.${weekStartStr}&checkin_date=lte.${todayStr}`,
        { headers: getSupabaseHeaders() }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const days = data.map(item => {
        const date = new Date(item.checkin_date);
        const day = date.getDay();
        return day === 0 ? 7 : day;
      });
      
      const weekKey = weekStartStr;
      if (!STATE.weeklyCheckin) STATE.weeklyCheckin = {};
      STATE.weeklyCheckin[weekKey] = {
        days: days,
        claimed: days.length >= 7
      };
      
      const todayNum = today.getDay() === 0 ? 7 : today.getDay();
      if (days.includes(todayNum)) {
        this.markShownToday();
      }
      
      save();
      console.log('📅 簽到狀態已同步，本週簽到:', days.length, '天');
    } catch (e) {
      console.warn('⚠️ 同步簽到失敗:', e.message);
    }
  }
};

function getWeekStartDate(date) {
  var d = new Date(date);
  var day = d.getDay();
  var diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeeklyCheckinProgress() {
  var today = new Date();
  var weekStart = getWeekStartDate(today);
  var weekKey = weekStart.toISOString().slice(0, 10);
  if (!STATE.weeklyCheckin) STATE.weeklyCheckin = {};
  if (!STATE.weeklyCheckin[weekKey]) {
    STATE.weeklyCheckin[weekKey] = { days: [], claimed: false };
  }
  var weekData = STATE.weeklyCheckin[weekKey];
  var dayOfWeek = today.getDay();
  var todayNum = dayOfWeek === 0 ? 7 : dayOfWeek;
  var isTodaySigned = weekData.days.includes(todayNum);
  return {
    days: weekData.days,
    count: weekData.days.length,
    isTodaySigned: isTodaySigned,
    weekKey: weekKey,
    isComplete: weekData.days.length >= 7
  };
}

function doCheckin() {
  CheckinManager.doCheckin();
}

function showCheckinReminder() {
  const progress = getWeeklyCheckinProgress();
  const dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  
  let daysHtml = progress.days.map(d => {
    return `<span class="inline-block w-8 h-8 rounded-full bg-neongreen text-black text-xs font-bold leading-8 text-center mx-0.5">${dayNames[d-1]}</span>`;
  }).join('');
  
  const emptyDays = 7 - progress.days.length;
  for (let i = 0; i < emptyDays; i++) {
    daysHtml += `<span class="inline-block w-8 h-8 rounded-full bg-white/10 text-white/30 text-xs leading-8 text-center mx-0.5">${i+1}</span>`;
  }
  
  openModal(`
    <div class="flex flex-col items-center py-4">
      <div class="text-6xl mb-3">📅</div>
      <h2 class="text-xl font-black text-gold">今日簽到</h2>
      <p class="text-xs text-white/40 mt-1">每天簽到累積獎勵</p>
      <div class="mt-4 flex gap-1">
        ${daysHtml}
      </div>
      <p class="text-xs text-white/30 mt-2">本週簽到 ${progress.count}/7 天</p>
      <div class="mt-4 w-full rounded-xl border border-gold/30 bg-gold/5 p-3">
        <p class="text-xs text-white/40">📌 獎勵規則</p>
        <div class="mt-1 text-[10px] text-white/30 space-y-0.5">
          <p>✅ 每日簽到：<span class="text-neongreen">+5 分</span></p>
          <p>🔥 連續 3 天：<span class="text-gold">+5 分</span></p>
          <p>🔥 連續 5 天：<span class="text-gold">+5 分</span></p>
          <p>🎊 全勤 7 天：<span class="text-gold">+15 分</span></p>
        </div>
      </div>
      <button onclick="doCheckinFromReminder()" 
        class="mt-4 w-full rounded-2xl bg-gold py-3.5 text-base font-black text-black glow-gold">
        📝 立即簽到
      </button>
      <button onclick="closeModal()" 
        class="mt-2 text-xs text-white/30 hover:text-white/60 transition-colors">
        稍後再說
      </button>
    </div>
  `);
}

function doCheckinFromReminder() {
  closeModal();
  CheckinManager.doCheckin();
}

// ============================================================
// 任務頁面
// ============================================================
function viewTask() {
    var progress = getTaskProgress();
    var totalScore = calculateDailyScore(progress);
    var percentage = Math.min(100, (totalScore / 50) * 100);
    var isReached = isDailyGoalReached(progress);
    var levelInfo = getUserLevel();
    
    var tasksHtml = '';
    for (var key in TASK_TYPES) {
        var task = TASK_TYPES[key];
        var done = progress[key] || 0;
        var limit = task.limit;
        var isCore = task.category === 'core';
        var isComplete = done >= limit;
        var progressPercent = Math.min(100, (done / limit) * 100);
        
        var stars = '';
        for (var s = 0; s < task.efficiency; s++) stars += '⭐';
        for (var s = task.efficiency; s < 3; s++) stars += '☆';
        
        var statusText = isComplete ? '✅ 已達上限' : (done > 0 ? '⏳ 進行中' : '');
        var statusColor = isComplete ? 'text-white/30' : (done > 0 ? 'text-neongreen' : '');
        
        tasksHtml += 
            '<div class="task-item flex items-center justify-between rounded-xl border border-gold/25 bg-zinc-950 p-3" data-task="' + key + '">' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-center gap-2">' +
                        '<div class="task-icon ' + (isCore ? 'core' : 'daily') + '">' + task.icon + '</div>' +
                        '<div class="min-w-0">' +
                            '<p class="text-sm font-bold text-white/90 truncate">' + task.label + '</p>' +
                            '<p class="text-[10px] text-white/40">+' + task.points + ' 分/次 · ' + stars + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="mt-1 flex items-center gap-2">' +
                        '<div class="task-progress-mini flex-1">' +
                            '<div class="fill" style="width:' + progressPercent + '%;background:' + (isComplete ? '#00FF00' : '#D4AF37') + ';"></div>' +
                        '</div>' +
                        '<span class="text-[10px] ' + statusColor + ' whitespace-nowrap">' + done + '/' + limit + ' ' + statusText + '</span>' +
                    '</div>' +
                '</div>' +
                '<button onclick="quickTaskAction(\'' + key + '\')" class="rounded-lg bg-gold text-black glow-gold px-3 py-1.5 text-xs font-black flex-shrink-0 ml-2">' + 
                    (isComplete ? '✅ 已完成' : '前往') +
                '</button>' +
            '</div>';
    }
    
    return '\n    <div class="rounded-2xl border border-gold/40 bg-zinc-950 p-4 glow-gold">' +
            '<div class="flex items-center justify-between">' +
                '<p class="text-xs text-white/50">🎯 今日獵人進度</p>' +
                '<span class="text-xs ' + (isReached ? 'text-neongreen' : 'text-gold') + ' font-bold">' + totalScore + ' / 50 分</span>' +
            '</div>' +
            '<div class="task-progress-bar mt-1 h-3 w-full rounded-full overflow-hidden">' +
                '<div class="bar-fill h-full ' + (isReached ? 'complete' : '') + '" style="width:' + percentage + '%;"></div>' +
            '</div>' +
            '<div class="mt-2 flex items-center justify-between text-[10px]">' +
                '<span class="text-white/30">' + 
                    (isReached ? '🎉 已達標！' : '還差 ' + (50 - totalScore) + ' 分達標') + 
                '</span>' +
                '<span class="' + (isReached ? 'text-neongreen' : 'text-white/30') + '">' +
                    (isReached ? '✅ 已獲得 +20 獎勵積分！' : '🎁 達標獎勵 +20 分') +
                '</span>' +
            '</div>' +
        '</div>' +
        
        '\n    <div class="mt-5"><h3 class="mb-2 text-sm font-black text-neongreen neon-green">📋 獵人任務</h3>\n' +
        '<div class="space-y-2">' + tasksHtml + '</div></div>\n' +
        
        '\n    <div class="mt-5"><h3 class="mb-2 text-sm font-black text-neongreen neon-green">📋 打卡</h3>\n' +
        '<div class="space-y-2">\n' +
            '<div class="flex items-center justify-between rounded-xl border border-gold/25 bg-zinc-950 p-3">\n' +
                '<div class="flex-1">\n' +
                    '<p class="text-sm font-bold text-white/90">每週簽到</p>\n' +
                    '<p class="text-[11px] text-white/50">每日簽到累積獎勵</p>\n' +
                    renderWeeklyCheckin() + '\n' +
                '</div>\n' +
                '<button onclick="doCheckin()" class="rounded-lg bg-gold text-black glow-gold px-3 py-1.5 text-xs font-black flex-shrink-0 ml-2">簽到</button>\n' +
            '</div>\n' +
        '</div></div>\n' +
        
        '\n    ' + renderAchievementProgress() + '\n' +
        
        '\n    <div class="mt-4 text-center">\n' +
        '<button onclick="refreshAllData()" class="text-xs text-white/30 hover:text-white/60 transition-colors">🔄 同步資料</button>\n' +
        '</div>\n';
}

function renderWeeklyCheckin() {
  var progress = getWeeklyCheckinProgress();
  var dayNames = ['一', '二', '三', '四', '五', '六', '日'];
  var html = '<div class="mt-2">';
  html += '<div class="flex gap-1 justify-center">';
  for (var i = 1; i <= 7; i++) {
    var isSigned = progress.days.includes(i);
    var bg = isSigned ? 'bg-neongreen' : 'bg-white/10';
    var text = isSigned ? 'text-black' : 'text-white/30';
    html += '<div class="w-8 h-8 rounded-full ' + bg + ' flex items-center justify-center text-xs font-bold ' + text + '">' + dayNames[i - 1] + '</div>';
  }
  html += '</div>';
  html += '<div class="text-center text-[10px] text-white/40 mt-1">本週簽到 ' + progress.count + '/7 天</div>';
  var bonusInfo = '';
  if (progress.count >= 7) {
    bonusInfo = '🎊 已達全勤！';
  } else if (progress.count >= 5) {
    bonusInfo = '再 2 天達全勤 (+15分)';
  } else if (progress.count >= 3) {
    bonusInfo = '再 2 天達 5 天 (+5分)';
  } else {
    bonusInfo = (7 - progress.count) + ' 天後全勤 (+15分)';
  }
  html += '<div class="text-center text-[9px] text-gold/60 mt-0.5">' + bonusInfo + '</div>';
  html += '</div>';
  return html;
}

function renderAchievementProgress() {
  var achState = getAchievementState();
  var unlocked = achState.unlocked || [];
  var total = Object.keys(ACHIEVEMENT_DEFS).length;
  var nextAch = null;
  var minProgress = 100;
  
  for (var key in ACHIEVEMENT_DEFS) {
    if (unlocked.includes(key)) continue;
    var progress = getAchievementProgress(key);
    if (progress.percentage < minProgress && progress.percentage > 0) {
      minProgress = progress.percentage;
      nextAch = Object.assign({ key: key }, progress, { def: ACHIEVEMENT_DEFS[key] });
    }
  }
  
  var html = '<div class="mt-4 rounded-xl border border-gold/20 bg-zinc-950/50 p-3">\n    <div class="flex items-center justify-between">\n      <span class="text-xs text-white/40">🏆 成就進度</span>\n      <span class="text-[10px] text-gold">' + unlocked.length + '/' + total + '</span>\n    </div>\n    <div class="mt-1 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">\n      <div class="h-full rounded-full bg-gold transition-all" style="width:' + (unlocked.length / total) * 100 + '%"></div>\n    </div>';
  
  if (nextAch) {
    html += '<div class="mt-2 text-[10px] text-white/40">\n      下一個成就：<span class="text-gold">' + nextAch.def.icon + ' ' + nextAch.def.name + '</span>\n      （' + nextAch.current + '/' + nextAch.required + '）\n    </div>';
  } else {
    html += '<div class="mt-2 text-[10px] text-neongreen">🎉 所有成就已解鎖！</div>';
  }
  html += '</div>';
  return html;
}

function openVerifyTask() {
  showView('map');
  setTimeout(function() {
    setMapFilter('pending');
    toast('🔍 顯示待認證店鋪，請在地圖上選擇並認證', 'gold');
    showFilterGuide('請點擊地圖上黃色的圖釘來開始認證 🗺️');
  }, 400);
}

function openSupplementTask() {
  showView('map');
  setTimeout(function() {
    setMapFilter('incomplete');
    toast('📝 顯示待完善店鋪，請在地圖上選擇並補充資料', 'gold');
    showFilterGuide('請點擊地圖上標記的店鋪來補充資料 📝');
  }, 400);
}

function showFilterGuide(message) {
  var oldGuide = document.getElementById('filter-guide');
  if (oldGuide) oldGuide.remove();
  var filterContainer = document.getElementById('filter-container');
  if (!filterContainer) return;
  var guide = document.createElement('div');
  guide.id = 'filter-guide';
  guide.style.cssText = 'width:100%; text-align:center; padding:4px 0; font-size:11px; color:rgba(255,255,255,0.6); background:rgba(212,175,55,0.1); border-radius:4px;';
  guide.textContent = '💡 ' + message;
  filterContainer.appendChild(guide);
  setTimeout(function() {
    if (guide.parentNode) guide.remove();
  }, 5000);
}

// 將 CheckinManager 掛載到 window 以便其他檔案訪問
window.CheckinManager = CheckinManager;
window.getWeeklyCheckinProgress = getWeeklyCheckinProgress;
window.doCheckin = doCheckin;
window.showCheckinReminder = showCheckinReminder;
window.doCheckinFromReminder = doCheckinFromReminder;