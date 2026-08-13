// ============================================================
// viewFind - 找店頁面 (添加到 store-operations.js 末尾)
// ============================================================
function viewFind() {
  var recent = STATE.recentRegions || [];
  var regionGroupOpen = { hk: false, kl: false, nt: false };
  var moreRegionsOpenMap = { hk: false, kl: false, nt: false };
  
  var renderRegionGroupFn = function(groupKey) {
    var data = REGIONS[groupKey];
    var isOpen = regionGroupOpen[groupKey];
    var isMoreOpen = moreRegionsOpenMap[groupKey] || false;
    var allRegions = isMoreOpen ? data.hot.concat(data.more) : data.hot;
    if (!isOpen) return '';
    var items = allRegions.slice();
    if (data.more.length > 0) items.push(isMoreOpen ? '📍 收起' : '📍 更多');
    return '<div class="mb-3 animate-pop"><div class="grid grid-cols-4 gap-2">' + items.map(function(item) {
      if (item === '📍 更多' || item === '📍 收起') {
        return '<button onclick="toggleMoreRegions(\'' + groupKey + '\')" class="rounded-full border py-1.5 text-center text-xs transition-all ' + (isMoreOpen ? 'chip-active-gold border-gold/60' : 'border-gold/40 text-gold hover:border-gold/60') + '">' + item + '</button>';
      }
      return '<button onclick="setRegion(\'' + item + '\')" class="rounded-full border py-1.5 text-center text-xs transition-all ' + (findState.region === item ? 'chip-active-gold border-gold/60' : 'border-gold/40 text-gold hover:border-gold/60') + '">' + item + '</button>';
    }).join('') + '</div></div>';
  };
  
  return '\n    <div class="mb-3 mt-4 flex items-center justify-between">\n      <div class="flex items-center gap-1.5 text-sm text-neongreen neon-green"><span class="flicker">📍</span> GPS · 附近店舖</div>\n      <button onclick="refreshGPS()" class="rounded-full border border-neongreen/40 px-3 py-1 text-xs text-neongreen">重新定位</button>\n    </div>\n    ' + (recent.length > 0 ? '<div class="mb-3"><p class="mb-1.5 text-[10px] font-bold text-white/40">🕐 最近搜索</p><div class="flex flex-wrap gap-2">' + recent.map(function(r) { return '<button onclick="setRegion(\'' + r + '\')" class="rounded-full border py-1.5 px-3 text-center text-xs transition-all ' + (findState.region === r ? 'chip-active-gold border-gold/60' : 'border-gold/40 text-gold hover:border-gold/60') + '">' + r + '</button>'; }).join('') + '</div></div>' : '<div class="mb-3"><p class="mb-1.5 text-[10px] text-white/30">🕐 最近搜索（選擇地區後會顯示在這裡）</p></div>') + '\n    <div class="mb-3 flex gap-2">\n      ' + Object.keys(REGIONS).map(function(key) { return '<button onclick="toggleRegionGroup(\'' + key + '\')" class="flex-1 rounded-xl border py-2 text-sm font-black transition-all ' + (regionGroupOpen[key] ? 'border-gold bg-gold/20 text-gold glow-gold' : 'border-white/20 text-white/45 hover:border-gold/40 hover:text-gold') + '">' + REGIONS[key].icon + ' ' + REGIONS[key].label + '</button>'; }).join('') + '\n    </div>\n    ' + renderRegionGroupFn('hk') + renderRegionGroupFn('kl') + renderRegionGroupFn('nt') + '\n    <div id="store-list" class="space-y-3">' + renderStoreList() + '</div>\n  ';
}

// ============================================================
// viewMe - 我的頁面 (添加到 store-operations.js 末尾)
// ============================================================
function viewMe() {
  var favS = STORES.filter(function(s) { return STATE.favStores.includes(s.id); });
  var levelInfo = getUserLevel();
  var achState = getAchievementState();
  var unlockedCount = (achState.unlocked || []).length;
  var totalAchievements = Object.keys(ACHIEVEMENT_DEFS).length;
  var myPosts = (STATE.livePosts || []).filter(function(p) { return p.author === STATE.user.name; }).sort(function(a, b) { return b.ts - a.ts; });
  
  var postHtml = myPosts.length ? myPosts.map(function(p) {
    var isExpired = p.expire < now();
    var isLinked = p.is_linked || false;
    var status = isExpired ? '<span class="text-white/30">⏳ 已過期</span>' : '<span class="text-neongreen">✅ ' + Math.ceil((p.expire - now()) / DAY) + ' 天' + (isLinked ? ' 🔗' : '') + '</span>';
    return '<div class="my-post-item rounded-xl border ' + (isExpired ? 'border-white/10 expired' : 'border-gold/30') + ' bg-zinc-950/80 p-3">\n      <div class="flex items-center justify-between"><span class="text-sm text-white/80 truncate flex-1">' + (p.content || '貼文') + '</span>' + status + '</div>\n      <div class="flex items-center gap-3 text-[10px] text-white/30 mt-1"><span>' + timeAgo(p.ts) + '</span><span>' + (p.track === 'player' ? '🎯 出貨戰報' : '🏬 台主宣傳') + '</span>' + (p.is_linked ? '<span class="text-neongreen">🔗 ' + (p.link_days || 3) + '天方案</span>' : '') + '</div>\n    </div>';
  }).join('') : '<p class="text-white/40 text-center text-xs py-4">尚無貼文</p>';
  
  var levelHtml = '<div class="mt-5"><h3 class="mb-2 text-sm font-black text-white/90">🏅 等級</h3>\n    <div class="rounded-xl border border-gold/25 bg-zinc-950 p-3">\n      <div class="flex items-center justify-between"><span class="text-lg font-black text-gold">' + levelInfo.title + '</span><span class="text-xs text-white/40">Lv.' + levelInfo.level + ' / 10</span></div>\n      <div class="mt-1 h-2 w-full rounded-full bg-white/10 overflow-hidden"><div class="h-full rounded-full bg-gold transition-all" style="width:' + levelInfo.percentage + '%"></div></div>\n      <div class="mt-1 flex justify-between text-[10px] text-white/40"><span>' + levelInfo.xpForCurrent + ' XP</span><span>' + levelInfo.xp + ' XP</span><span>' + levelInfo.xpForNext + ' XP</span></div>\n      <div class="mt-1 text-[10px] text-white/30 text-center">' + (levelInfo.nextTitle ? '下一級：' + levelInfo.nextTitle + ' (還需 ' + (levelInfo.xpForNext - levelInfo.xp) + ' XP)' : '👑 已達最高等級！') + '</div>\n    </div>\n  </div>';
  
  var categories = {
    submission: { label: '🏪 店鋪提交' },
    verification: { label: '🔍 店鋪認證' },
    complete: { label: '🏅 完整貢獻' },
    region: { label: '🏙️ 地區探索' },
    supplement: { label: '📝 資料補充' },
    streak: { label: '🔥 連續貢獻' }
  };
  
  var achListHtml = '';
  for (var catKey in categories) {
    var cat = categories[catKey];
    var items = Object.keys(ACHIEVEMENT_DEFS).filter(function(k) { return ACHIEVEMENT_DEFS[k].category === catKey; }).map(function(k) {
      var def = ACHIEVEMENT_DEFS[k];
      var progress = getAchievementProgress(k);
      var isUnlocked = progress.isUnlocked;
      return '<div class="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">\n        <span class="text-base">' + (isUnlocked ? '✅' : '⏳') + '</span>\n        <span class="text-xs flex-1 ' + (isUnlocked ? 'text-gold' : 'text-white/40') + '">' + def.icon + ' ' + def.name + '</span>\n        <span class="text-[10px] ' + (isUnlocked ? 'text-neongreen' : 'text-white/30') + '">' + (isUnlocked ? '已解鎖' : progress.current + '/' + progress.required) + '</span>\n      </div>';
    }).join('');
    if (items) achListHtml += '<div class="mt-3"><p class="text-[10px] font-bold text-white/40">' + cat.label + '</p><div class="mt-1 rounded-lg bg-white/5 p-2">' + items + '</div></div>';
  }
  
  var achievementHtml = '<div class="mt-5"><div class="flex items-center justify-between"><h3 class="text-sm font-black text-white/90">🏆 成就 (' + unlockedCount + '/' + totalAchievements + ')</h3></div>' + levelHtml + achListHtml + '</div>';
  
  return '\n    <div class="animate-pop rounded-3xl border border-gold/40 bg-gradient-to-b from-zinc-900 to-black p-5 glow-gold">\n      <div class="flex items-center gap-4"><div class="flex h-16 w-16 items-center justify-center rounded-2xl border border-neongreen/50 bg-black text-3xl glow-green">🕹️</div><div><div class="text-lg font-black">' + STATE.user.name + '</div><div class="text-[11px] text-gold/70">裝置 ' + STATE.user.device + '</div></div></div>\n      <div class="mt-5 grid grid-cols-2 gap-3"><div class="rounded-2xl border border-neongreen/30 bg-black/50 p-3 text-center"><div class="text-[10px] text-white/50">持有積分</div><div class="text-2xl font-black text-neongreen neon-green">' + STATE.points + '</div></div><div class="rounded-2xl border border-neonpink/30 bg-black/50 p-3 text-center"><div class="text-[10px] text-white/50">Filter</div><div class="text-sm font-black text-neonpink neon-pink">' + (filterActive() ? "剩 " + Math.ceil((STATE.filterPassUntil - now()) / DAY) + " 天" : "未開通") + '</div></div></div>\n      <button onclick="redeemAdFree()" class="mt-5 w-full rounded-2xl ' + (STATE.adFree ? "bg-white/10 text-white/50" : "bg-gold text-black glow-gold") + ' py-3.5 text-base font-black">' + (STATE.adFree ? "✅ 已兌換免廣告" : "✨ 兌換免廣告（80 積分）") + '</button>\n    </div>\n    <div class="mt-5"><h3 class="mb-2 text-sm font-black text-white/90">📝 我的貼文</h3><div class="space-y-2">' + postHtml + '</div></div>\n    <div class="mt-5"><h3 class="mb-2 text-sm font-black text-white/90">⭐ 收藏店鋪</h3>\n      <div class="space-y-2">\n        ' + (favS.length ? favS.map(function(s) {
    return '\n          <div class="flex items-center gap-2 rounded-xl border border-gold/25 bg-zinc-950 p-3">\n            <button onclick="openStore(\'' + s.id + '\')" class="flex-1 text-left text-sm text-gold truncate">\n              ' + s.name + ' <span class="text-[10px] text-white/40">· ' + s.region + '</span>\n            </button>\n            <div class="flex gap-1 flex-shrink-0">\n              <button onclick="quickAction(\'checkin\', \'' + s.id + '\')" class="quick-action-btn rounded-lg border border-neongreen/30 px-2 py-1 text-[10px] text-neongreen hover:bg-neongreen/10 transition-all">打卡</button>\n              <button onclick="quickAction(\'update\', \'' + s.id + '\')" class="quick-action-btn rounded-lg border border-gold/30 px-2 py-1 text-[10px] text-gold hover:bg-gold/10 transition-all">更新</button>\n              <button onclick="quickAction(\'post\', \'' + s.id + '\')" class="quick-action-btn rounded-lg border border-neonpink/30 px-2 py-1 text-[10px] text-neonpink hover:bg-neonpink/10 transition-all">戰報</button>\n            </div>\n          </div>\n        ';
  }).join('') : '<p class="rounded-xl border border-white/10 p-3 text-center text-xs text-white/40">尚無收藏</p>') + '\n      </div>\n    </div>\n    ' + (!STATE.user.is_bound ? '\n    <div class="mt-4 rounded-xl border border-gold/30 bg-gold/5 p-4">\n      <p class="text-sm font-bold text-gold">🔗 綁定帳號</p>\n      <p class="text-xs text-white/40 mt-1">綁定後數據永久保存，換手機也不怕遺失</p>\n      <button onclick="bindGoogleAccount()" class="mt-3 w-full rounded-lg bg-white text-black py-2.5 text-sm font-black">🔐 用 Google 帳號綁定</button>\n      <p class="text-[9px] text-white/30 mt-2">📌 綁定後可獲得 <span class="text-neongreen">+20 積分</span></p>\n      <p class="text-[8px] text-white/20 mt-1">💡 需要 Supabase 後台啟用 Google Provider</p>\n    </div>\n    ' : '\n    <div class="mt-4 rounded-xl border border-neongreen/30 bg-neongreen/5 p-4">\n      <div class="flex items-center gap-2">\n        <span class="text-neongreen">✅ 已綁定</span>\n        <span class="text-xs text-white/40">' + (STATE.user.email || '') + '</span>\n        <button onclick="logoutGoogle()" class="ml-auto text-xs text-white/30 hover:text-white">登出</button>\n      </div>\n    </div>\n    ') + '\n    ' + achievementHtml + '\n    <button onclick="resetAll()" class="mt-6 w-full rounded-xl border border-neonpink/40 py-2 text-xs text-neonpink">重置資料</button>\n  ';
}

function filterActive() { return STATE.filterPassUntil > now(); }

function resetAll() {
  if (confirm("確定重置所有本地資料？")) {
    localStorage.removeItem("claw_state");
    STATE = load();
    save();
    showView("me");
  }
}

function toggleMoreRegions(group) { 
  findState.group = group;
  showView("find"); 
}

function toggleRegionGroup(group) {
  showView("find");
}

function renderStoreList() {
  var list = filteredStores();
  if (!list.length) return '<p class="py-10 text-center text-sm text-white/40">此區暫無店舖情報</p>';
  var start = 0, end = Math.min(PAGE_SIZE, list.length);
  var pageItems = list.slice(start, end);
  var hasMore = list.length > PAGE_SIZE;
  
  var formatDist = function(s) {
    if (s._dist === 9999) return '📍 位置未知';
    if (s._dist < 1) return Math.round(s._dist * 1000) + "m";
    return s._dist.toFixed(1) + "km";
  };
  
  var html = pageItems.map(function(s) {
    var isVerified = s.status === "verified" || s.verified === "verified";
    var badge = isVerified ? '<span class="rounded-full border border-neongreen/40 bg-neongreen/10 px-2 py-0.5 text-[10px] text-neongreen whitespace-nowrap">✅ 已認證</span>' : '<span class="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-400 whitespace-nowrap">⏳ 審核中</span>';
    var borderClass = isVerified ? "border-gold/25 hover:border-gold/60" : "border-yellow-400/30 border-dashed hover:border-yellow-400/60";
    var distDisplay = (userLocation && s.lat && s.lng) ? '<span class="text-neonpink neon-pink whitespace-nowrap">📍 ' + formatDist(s) + '</span>' : '<span class="text-white/40 whitespace-nowrap">📍 ' + (s.dist || '?') + ' km</span>';
    
    return '<button onclick="openStore(\'' + s.id + '\')" class="w-full rounded-2xl border ' + borderClass + ' bg-zinc-950 p-4 text-left transition-all">\n      <div class="flex gap-3">\n        <div class="shrink-0">' + (s.photo ? '<img src="' + s.photo + '" class="h-16 w-16 rounded-lg object-cover" alt="' + s.name + '" />' : '<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-800 text-3xl">🏪</div>') + '</div>\n        <div class="min-w-0 flex-1">\n          <div class="flex items-start justify-between gap-2">\n            <div class="min-w-0 flex-1">\n              <h3 class="font-black text-gold truncate">' + s.name + '</h3>\n              <p class="mt-0.5 text-xs text-white/50 truncate">' + s.region + ' · ' + s.addr + '</p>\n            </div>\n            <div class="shrink-0">' + badge + '</div>\n          </div>\n          <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/50">' + distDisplay + '<span class="whitespace-nowrap">🎰 ' + s.machines.length + ' 部機台</span><span class="whitespace-nowrap">' + s.size + '型' + (s.hour24 ? ' · 24H' : '') + (s.token ? ' · 需代幣' : '') + '</span></div>\n        </div>\n      </div>\n    </button>';
  }).join('');
  
  var moreBtn = hasMore ? '<button onclick="loadMoreStores()" class="mt-2 w-full rounded-2xl border border-gold/40 bg-zinc-950 py-4 text-center text-gold hover:border-gold/60 transition-all">🔽 顯示更多（' + (list.length - PAGE_SIZE) + ' 間）</button>' : '';
  return html + moreBtn;
}

function filteredStores() {
  var list = STORES.slice();
  if (findState.region !== "全部" && findState.region !== "") list = list.filter(function(s) { return s.region === findState.region; });
  if (userLocation) {
    list.forEach(function(s) { s._dist = (s.lat && s.lng) ? calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) : 9999; });
    list.sort(function(a, b) { return a._dist - b._dist; });
  } else {
    list.forEach(function(s) { s._dist = parseFloat(s.dist) || 9999; });
    list.sort(function(a, b) { return a._dist - b._dist; });
  }
  allFilteredStores = list;
  currentPage = 0;
  return list;
}

function loadMoreStores() {
  currentPage++;
  var start = currentPage * PAGE_SIZE, end = Math.min((currentPage + 1) * PAGE_SIZE, allFilteredStores.length);
  var pageItems = allFilteredStores.slice(start, end);
  if (pageItems.length === 0) { toast('已顯示全部店鋪', 'pink'); return; }
  var container = document.getElementById('store-list');
  if (!container) return;
  var oldMoreBtn = container.querySelector('button:last-child');
  if (oldMoreBtn && oldMoreBtn.textContent.includes('顯示更多')) oldMoreBtn.remove();
  
  var formatDist = function(s) {
    if (s._dist === 9999) return '📍 位置未知';
    if (s._dist < 1) return Math.round(s._dist * 1000) + "m";
    return s._dist.toFixed(1) + "km";
  };
  
  var newHtml = pageItems.map(function(s) {
    var isVerified = s.status === "verified" || s.verified === "verified";
    var badge = isVerified ? '<span class="rounded-full border border-neongreen/40 bg-neongreen/10 px-2 py-0.5 text-[10px] text-neongreen">✅ 已認證</span>' : '<span class="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-[10px] text-yellow-400">⏳ 審核中</span>';
    var borderClass = isVerified ? "border-gold/25 hover:border-gold/60" : "border-yellow-400/30 border-dashed hover:border-yellow-400/60";
    var distDisplay = (userLocation && s.lat && s.lng) ? '<span class="text-neonpink neon-pink">📍 ' + formatDist(s) + '</span>' : '<span class="text-white/40">📍 ' + (s.dist || '?') + ' km</span>';
    return '<button onclick="openStore(\'' + s.id + '\')" class="w-full rounded-2xl border ' + borderClass + ' bg-zinc-950 p-4 text-left transition-all">\n      <div class="flex gap-3">\n        <div class="shrink-0">' + (s.photo ? '<img src="' + s.photo + '" class="h-16 w-16 rounded-lg object-cover" alt="' + s.name + '" />' : '<div class="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-800 text-3xl">🏪</div>') + '</div>\n        <div class="min-w-0 flex-1">\n          <div class="flex items-start justify-between gap-2">\n            <div><h3 class="font-black text-gold">' + s.name + '</h3><p class="mt-0.5 text-xs text-white/50">' + s.region + ' · ' + s.addr + '</p></div>\n            ' + badge + '\n          </div>\n          <div class="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/50">' + distDisplay + '<span>🎰 ' + s.machines.length + ' 部機台</span><span>' + s.size + '型' + (s.hour24 ? ' · 24H' : '') + (s.token ? ' · 需代幣' : '') + '</span></div>\n        </div>\n      </div>\n    </button>';
  }).join('');
  
  container.insertAdjacentHTML('beforeend', newHtml);
  var hasMore = (currentPage + 1) * PAGE_SIZE < allFilteredStores.length;
  if (hasMore) {
    var remaining = allFilteredStores.length - (currentPage + 1) * PAGE_SIZE;
    container.insertAdjacentHTML('beforeend', '<button onclick="loadMoreStores()" class="mt-2 w-full rounded-2xl border border-gold/40 bg-zinc-950 py-4 text-center text-gold hover:border-gold/60 transition-all">🔽 顯示更多（剩餘 ' + remaining + ' 間）</button>');
  } else {
    container.insertAdjacentHTML('beforeend', '<p class="mt-2 text-center text-xs text-white/40">— 已顯示全部 ' + allFilteredStores.length + ' 間店鋪 —</p>');
  }
}