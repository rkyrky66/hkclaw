// ============================================================
// js/store-operations.js
// 爪爪情報站 - 店鋪操作 (詳情、認證、補充、打卡、機台)
// ============================================================

// ============================================================
// 全域變數
// ============================================================
var _storeContext = null;
var _currentMallData = null;
var _currentMallFloor = null;
var _currentHighlightId = null;
var _vfGpsReady = false;
var _vfGpsLat = null;
var _vfGpsLng = null;

// ============================================================
// 商場視圖
// ============================================================
function openMallModal(mallName, highlightStoreId, highlightFloor) {
  var group = window._mallGroups && window._mallGroups[mallName];
  if (!group || !group.stores.length) {
    toast('找不到該商場的店鋪資料', 'pink');
    return;
  }
  _currentMallData = group;
  _currentHighlightId = highlightStoreId || null;
  var targetFloor = highlightFloor;
  if (!targetFloor && highlightStoreId) {
    var store_1 = group.stores.find(function(s) { return s.id === highlightStoreId; });
    if (store_1) targetFloor = store_1.floor || 'G';
  }
  if (!targetFloor) {
    var floors = getFloorsInMall(mallName);
    targetFloor = floors.length > 0 ? floors[0] : 'G';
  }
  _currentMallFloor = targetFloor;
  renderMallModalStructure(mallName, targetFloor, highlightStoreId);
}

function getFloorsInMall(mallName) {
  var group = window._mallGroups && window._mallGroups[mallName];
  if (!group) return [];
  var floorSet = new Set();
  group.stores.forEach(function(s) { floorSet.add(s.floor || 'G'); });
  var floors = Array.from(floorSet);
  floors.sort(function(a, b) {
    if (a === 'G') return -1;
    if (b === 'G') return 1;
    var numA = parseInt(a), numB = parseInt(b);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return a.localeCompare(b);
  });
  return floors;
}

function getStoresByFloor(mallName, floor) {
  var group = window._mallGroups && window._mallGroups[mallName];
  if (!group) return [];
  return group.stores.filter(function(s) { return (s.floor || 'G') === floor; });
}

function renderMallModalStructure(mallName, activeFloor, highlightStoreId) {
  var group = _currentMallData;
  if (!group) return;
  var total = group.totalStores;
  var allVerified = group.stores.every(function(s) { return s.verified === "verified"; });
  var statusIcon = allVerified ? '🟢' : '🟡';
  var statusText = allVerified ? '全部已認證' : '部分審核中';
  var floors = getFloorsInMall(mallName);
  var tabsHtml = floors.map(function(floor) {
    var count = getStoresByFloor(mallName, floor).length;
    var isActive = floor === activeFloor;
    return "<button class=\"mall-tab " + (isActive ? 'active' : '') + "\" onclick=\"switchMallFloor('" + mallName.replace(/'/g, "\\'") + "', '" + floor + "')\">" + floor + "F <span class=\"tab-count\">" + count + "</span></button>";
  }).join('');
  var storesHtml = generateStoreListHtml(mallName, activeFloor, highlightStoreId);
  var modalHtml = '\n    <div class="mall-modal-wrapper">\n      <div class="mall-modal-header">\n        <div style="display:flex;justify-content:space-between;align-items:flex-start;">\n          <div>\n            <div class="mall-name">🏬 ' + mallName + '</div>\n            <div class="mall-addr">' + (group.stores[0]?.region || '') + ' · ' + total + ' 間店鋪</div>\n            <div class="mall-count">' + statusIcon + ' ' + statusText + '</div>\n          </div>\n          <button onclick="closeModal()" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:20px;cursor:pointer;">✕</button>\n        </div>\n      </div>\n      <div class="mall-tabs">' + tabsHtml + '</div>\n      <div class="mall-store-list-scroll" id="mall-store-list-scroll">' + storesHtml + '</div>\n      <button class="mall-footer-btn" onclick="onSubmitMissingStore(\'' + mallName.replace(/'/g, "\\'") + '\')">\n        📝 沒有你要的店？按此提交（10 積分）！\n        <span class="sub-text">認證後再追加 40 積分</span>\n      </button>\n    </div>\n  ';
  openModal(modalHtml);
}

function generateStoreListHtml(mallName, floor, highlightStoreId) {
  var stores = getStoresByFloor(mallName, floor);
  if (!stores.length) {
    return '<p style="text-align:center;color:rgba(255,255,255,0.3);padding:30px 0;font-size:13px;">此樓層暫無店鋪</p>';
  }
  return stores.map(function(s, idx) {
    var number = idx + 1;
    var isHighlight = s.id === highlightStoreId;
    var statusClass = s.verified === "verified" ? 'verified' : 'pending';
    var statusText = s.verified === "verified" ? '✅ 已認證' : '⏳ 審核中';
    return '<div class="mall-store-item ' + (isHighlight ? 'highlight' : '') + '" onclick="onMallStoreClick(\'' + s.id + '\', \'' + mallName.replace(/'/g, "\\'") + '\', \'' + floor + '\')">\n      <span class="store-number">#' + number + '</span>\n      <span class="store-name">' + s.name + '</span>\n      <span class="store-status ' + statusClass + '">' + statusText + '</span>\n    </div>';
  }).join('');
}

function switchMallFloor(mallName, floor) {
  _currentMallFloor = floor;
  var container = document.getElementById('mall-store-list-scroll');
  if (container) {
    container.innerHTML = generateStoreListHtml(mallName, floor, _currentHighlightId);
    container.scrollTop = 0;
  }
  document.querySelectorAll('.mall-tab').forEach(function(tab) {
    tab.classList.toggle('active', tab.textContent.trim().startsWith(floor + 'F'));
  });
}

function onSubmitMissingStore(mallName) {
  closeModal();
  var group = _currentMallData;
  if (group && group.stores.length > 0) {
    var region = group.stores[0]?.region || '';
    if (typeof openIntelForm === 'function') {
      openIntelForm(mallName, region);
    } else {
      toast('請在「任務」頁面提交店鋪情報', 'gold');
    }
  } else {
    toast('請在「任務」頁面提交店鋪情報', 'gold');
  }
}

function onMallStoreClick(storeId, mallName, currentFloor) {
  var s = STORES.find(function(x) { return x.id === storeId; });
  if (!s) {
    toast('找不到該店鋪', 'pink');
    return;
  }
  _storeContext = {
    from: 'mall',
    mallName: mallName,
    floor: currentFloor,
    highlightId: storeId
  };
  closeModal();
  setTimeout(function() {
    openStore(storeId);
  }, 200);
}

// ============================================================
// 店鋪詳情
// ============================================================
function openStore(id, isSwitch) {
  var s = STORES.find(function(x) { return x.id === id; });
  if (!s) return;
  UserFocus.setCurrentViewing(id);
  if (isSwitch) { updateStoreContent(id); return; }
  createStoreModal(id);
}

function createStoreModal(id) {
  var s = STORES.find(function(x) { return x.id === id; });
  if (!s) return;
  var fav = STATE.favStores.includes(s.id);
  var _a = getMallStores(s), mallStores = _a.mallStores, currentIndex = _a.currentIndex, mallName = _a.mallName;
  var hasNav = mallStores.length > 1 && currentIndex >= 0;
  var prevId = hasNav ? mallStores[(currentIndex - 1 + mallStores.length) % mallStores.length].id : null;
  var nextId = hasNav ? mallStores[(currentIndex + 1) % mallStores.length].id : null;
  var contentHtml = buildStoreContent(s, { fav: fav, hasNav: hasNav, currentIndex: currentIndex, mallStores: mallStores, mallName: mallName, prevId: prevId, nextId: nextId });
  openModal('<div id="store-modal-container" class="flex flex-col h-full">' + contentHtml + '</div>');
}

function updateStoreContent(id) {
  var s = STORES.find(function(x) { return x.id === id; });
  if (!s) return;
  var container = document.getElementById('store-modal-container');
  if (!container) return;
  var fav = STATE.favStores.includes(s.id);
  var _a = getMallStores(s), mallStores = _a.mallStores, currentIndex = _a.currentIndex, mallName = _a.mallName;
  var hasNav = mallStores.length > 1 && currentIndex >= 0;
  var prevId = hasNav ? mallStores[(currentIndex - 1 + mallStores.length) % mallStores.length].id : null;
  var nextId = hasNav ? mallStores[(currentIndex + 1) % mallStores.length].id : null;
  var newContent = buildStoreContent(s, { fav: fav, hasNav: hasNav, currentIndex: currentIndex, mallStores: mallStores, mallName: mallName, prevId: prevId, nextId: nextId });
  container.innerHTML = newContent;
}

function getMallStores(s) {
  var mallStores = [], currentIndex = -1, mallName = '';
  if (s.mall && s.mall.trim() !== '') {
    mallName = s.mall;
    var group = window._mallGroups && window._mallGroups[mallName];
    if (group && group.stores) {
      mallStores = group.stores.slice().sort(function(a, b) {
        var floorA = a.floor || 'G', floorB = b.floor || 'G';
        if (floorA === 'G') return -1;
        if (floorB === 'G') return 1;
        var numA = parseInt(floorA), numB = parseInt(floorB);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return floorA.localeCompare(floorB);
      });
      currentIndex = mallStores.findIndex(function(store) { return store.id === s.id; });
    }
  }
  return { mallStores: mallStores, currentIndex: currentIndex, mallName: mallName };
}

function buildStoreContent(s, _a) {
    var fav = _a.fav, hasNav = _a.hasNav, currentIndex = _a.currentIndex, mallStores = _a.mallStores, mallName = _a.mallName, prevId = _a.prevId, nextId = _a.nextId;
    var backBtn = (_storeContext && _storeContext.from === 'mall') ? '<button onclick="backToMall()" class="text-sm text-gold mr-2">← 返回</button>' : '';
    var locationLabel = '';
    if (hasNav && mallStores.length > 0) {
        var floor = s.floor || 'G';
        var sameFloorStores = mallStores.filter(function(store) { return (store.floor || 'G') === floor; });
        var storeIndex = sameFloorStores.findIndex(function(store) { return store.id === s.id; });
        locationLabel = floor + 'F  #' + (storeIndex + 1);
    }
    var isInMall = s.mall && s.mall.trim() !== '';
    var mallInfo = isInMall ? '<span class="text-[10px] text-white/30 ml-2">' + s.mall + '</span>' : '';
    var isVerified = s.status === "verified" || s.verified === "verified";
    var statusBadge = isVerified ? '<span class="text-[10px] text-neongreen">✅ 已認證</span>' : '<span class="text-[10px] text-yellow-400">⏳ 審核中 (' + (s.verification_count || 0) + '/2)</span>';
    
    var markerInfo = getMarkerLevelInfo(s.id);
    var contributionBadge = '';
    if (markerInfo.level > 0) {
        var levelClass = 'level-' + markerInfo.level;
        contributionBadge = '<div class="mt-2 contribution-badge ' + levelClass + '">' +
            markerInfo.icon + ' 我的貢獻：' + markerInfo.label +
            '<span class="progress-text">（貢獻值 ' + markerInfo.contribution + '）</span>' +
            (markerInfo.nextLevel ? '<span class="progress-text">→ 下一級需 ' + markerInfo.nextLevel.requirement + '</span>' : '') +
        '</div>';
    }
    
    var photoHtml = buildPhotoWithArrows(s, hasNav, prevId, nextId, locationLabel);
    
    var machinesHtml = '';
    if (s.machines && s.machines.length > 0) {
        var machineItems = [];
        for (var mi = 0; mi < s.machines.length; mi++) {
            var m = s.machines[mi];
            var isFresh = (now() - m.updated < 2 * DAY);
            var borderClass = isFresh ? 'border-neongreen/70 glow-green' : 'border-white/20 stale';
            var staleBadge = isFresh ? '' : '<span class="text-[9px] text-white/40">[存疑]</span>';
            var photoContent = m.photo ? '<img src="' + m.photo + '" class="h-24 w-full rounded-lg object-cover" alt="機台 ' + m.no + '" />' : '<div class="flex h-24 w-full items-center justify-center rounded-lg bg-black/50 text-3xl">🎰</div>';
            var featsHtml = '';
            if (m.feats && m.feats.length > 0) {
                var featItems = [];
                for (var fi = 0; fi < Math.min(m.feats.length, 2); fi++) {
                    featItems.push('<span class="rounded bg-neonpink/15 px-1.5 py-0.5 text-[9px] text-neonpink">' + m.feats[fi] + '</span>');
                }
                featsHtml = featItems.join('');
            }
            var prizeText = m.prize || '待更新';
            var timeText = timeAgo(m.updated);
            
            machineItems.push(
                '<div class="rounded-xl border ' + borderClass + ' bg-zinc-950 p-2 text-left">' +
                    photoContent +
                    '<div class="mt-1.5 flex items-center justify-between"><b class="text-xs text-gold">台號 ' + m.no + '</b>' + staleBadge + '</div>' +
                    '<div class="mt-1 flex flex-wrap gap-1">' + featsHtml + '</div>' +
                    '<p class="mt-1 truncate text-[10px] text-white/50">🎁 <span class="text-gold">' + prizeText + '</span></p>' +
                    '<p class="text-[9px] text-white/40">' + timeText + '</p>' +
                '</div>'
            );
        }
        machinesHtml = machineItems.join('');
    } else {
        machinesHtml = '<p class="col-span-2 py-6 text-center text-xs text-white/40">尚無機台</p>';
    }
    
    return '\n    <div class="flex items-center justify-between border-b border-gold/30 pb-3 pt-3 flex-shrink-0">\n      <div>\n        <div class="flex items-center gap-2 flex-wrap">\n          ' + backBtn + '\n          <h2 class="text-lg font-black text-gold neon-gold">' + s.name + '</h2>\n          ' + mallInfo + '\n        </div>\n        <div class="flex items-center gap-2 mt-0.5">\n          <p class="text-xs text-white/50">' + s.region + ' · ' + s.addr + '</p>\n          ' + statusBadge + '\n        </div>\n        ' + contributionBadge + '\n      </div>\n      <button onclick="closeStoreModal()" class="text-2xl text-white/50 hover:text-white transition-colors">✕</button>\n    </div>\n    ' + photoHtml + '\n    <div class="mt-3 flex flex-wrap gap-2 text-xs flex-shrink-0">\n      ' + (s.ig ? '<a href="https://instagram.com/' + s.ig + '" target="_blank" class="rounded-full border border-neonpink/50 px-3 py-1 text-neonpink glow-pink">📸 IG @' + s.ig + '</a>' : '') + '\n      ' + (s.fb ? '<a href="https://facebook.com/' + s.fb + '" target="_blank" class="rounded-full border border-neongreen/50 px-3 py-1 text-neongreen">🔗 FB</a>' : '') + '\n      <button onclick="toggleFav(\'store\',\'' + s.id + '\')" class="rounded-full border border-gold/50 px-3 py-1 text-gold">' + (fav ? '★ 已收藏' : '☆ 收藏') + '</button>\n      ' + (isInMall ? '<button onclick="backToMall()" class="rounded-full border border-neongreen/30 px-3 py-1 text-xs text-neongreen">🏬 返回商場</button>' : '') + '\n      ' + (!isVerified ? '<button onclick="openVerifyForm(\'' + s.id + '\')" class="rounded-full border border-neongreen/50 px-3 py-1 text-xs text-neongreen glow-green">🔍 認證此店 (+15分)</button>' : '') + '\n      <button onclick="openSupplementForm(\'' + s.id + '\')" class="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">📝 補充資料 (+5分/項)</button>\n      <button onclick="quickAction(\'post\', \'' + s.id + '\')" class="rounded-full border border-neonpink/30 px-3 py-1 text-xs text-neonpink">📢 戰報</button>\n      <button onclick="openReportForm(\'store\', \'' + s.id + '\', \'' + s.name.replace(/'/g, "\\'") + '\')" class="rounded-full border border-neonpink/30 px-3 py-1 text-xs text-neonpink">🚨 檢舉</button>\n      <button onclick="doStoreCheckin(\'' + s.id + '\')" class="rounded-full border border-neongreen/50 px-3 py-1 text-xs text-neongreen glow-green">📍 打卡 (+5分)</button>\n    </div>\n    <div class="mt-2 flex flex-wrap gap-2 text-[10px] flex-shrink-0">\n      ' + (s.size && s.size !== '中' ? '<span class="rounded bg-white/10 px-2 py-0.5 text-white/60">📏 ' + (s.size === 'small' ? '小型 (6台以下)' : s.size === 'large' ? '大型 (12台以上)' : '中型 (7-12台)') + '</span>' : '') + '\n      ' + (s.has_staff !== undefined ? '<span class="rounded bg-white/10 px-2 py-0.5 text-white/60">' + (s.has_staff ? '👤 有場務' : '👤 無場務') + '</span>' : '') + '\n      ' + (s.has_e_coin !== undefined ? '<span class="rounded bg-white/10 px-2 py-0.5 text-white/60">' + (s.has_e_coin ? '🪙 有電子兌幣' : '🪙 無電子兌幣') + '</span>' : '') + '\n      ' + (s.address_detail ? '<span class="rounded bg-white/10 px-2 py-0.5 text-white/60">📍 ' + s.address_detail + '</span>' : '') + '\n    </div>\n    <div class="mt-2 flex flex-wrap gap-2 text-[10px] flex-shrink-0">\n      ' + (s.verification_count > 0 ? '<span class="text-white/40">🔍 已獲 ' + s.verification_count + ' 個認證</span>' : '') + '\n      ' + (s.verified === 'verified' ? '<span class="text-neongreen">✅ 已通過認證</span>' : '') + '\n    </div>\n    <div class="mt-4 flex-1 overflow-y-auto">\n      <div class="flex items-center justify-between">\n        <h3 class="text-sm font-black text-neongreen neon-green">🎰 現場機台流</h3>\n        <span class="text-[10px] text-white/40">綠框=48H內更新 · 灰框=存疑</span>\n      </div>\n      <div class="mt-3 grid grid-cols-2 gap-3">\n        ' + machinesHtml + '\n      </div>\n      <button onclick="openMachineForm(\'' + s.id + '\')" class="mt-4 w-full rounded-2xl bg-neongreen py-3 text-base font-black text-black glow-green">➕ 共享此店第一部機台</button>\n    </div>\n  ';
}

function buildPhotoWithArrows(s, hasNav, prevId, nextId, locationLabel) {
  var photoContent = s.photo ? '<img src="' + s.photo + '" class="w-full h-full object-cover" alt="' + s.name + '" />' : '<div class="flex h-full w-full items-center justify-center bg-zinc-800 text-7xl">🏪</div>';
  return '\n    <div class="relative mt-3 rounded-xl overflow-hidden" style="height:200px; flex-shrink:0; background:#111;">\n      ' + photoContent + '\n      ' + (hasNav ? '<button onclick="switchStore(\'' + prevId + '\')" class="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-2xl text-white transition-all hover:scale-110 active:scale-95 border border-white/20" style="z-index:10;">‹</button>' : '') + '\n      ' + (hasNav ? '<button onclick="switchStore(\'' + nextId + '\')" class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-2xl text-white transition-all hover:scale-110 active:scale-95 border border-white/20" style="z-index:10;">›</button>' : '') + '\n      ' + (locationLabel ? '<div class="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-xs text-gold font-bold border border-gold/30" style="z-index:10;">' + locationLabel + '</div>' : '') + '\n    </div>\n  ';
}

function switchStore(id) { updateStoreContent(id); }

function closeStoreModal() {
  UserFocus.clearCurrentViewing();
  const isFromMall = _storeContext && _storeContext.from === 'mall';
  closeModal();
  if (isFromMall) {
    const ctx = _storeContext;
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (ctx && ctx.mallName) {
          openMallModal(ctx.mallName, ctx.highlightId, ctx.floor);
        }
        _storeContext = null;
      }, 50);
    });
  } else {
    _storeContext = null;
  }
}

function backToMall() {
  var ctx = _storeContext;
  if (!ctx || ctx.from !== 'mall') {
    closeModal();
    _storeContext = null;
    return;
  }
  closeModal();
  requestAnimationFrame(function() {
    setTimeout(function() {
      if (_storeContext && _storeContext.from === 'mall') {
        openMallModal(ctx.mallName, ctx.highlightId, ctx.floor);
        _storeContext = null;
      } else {
        openMallModal(ctx.mallName, ctx.highlightId, ctx.floor);
      }
    }, 50);
  });
}

function openStoreFromMap(id) {
  if (map) map.closePopup();
  openStore(id);
}

// ============================================================
// 認證店鋪 (修正版 - 使用 status 欄位)
// ============================================================
function openVerifyForm(storeId) {
  var s = STORES.find(function(x) { return x.id === storeId; });
  if (!s) { toast('找不到該店鋪', 'pink'); return; }
  if (s.status === 'verified' || s.verified === 'verified') { 
        toast('此店鋪已認證', 'gold'); 
        return; 
    }
  if (s.submitted_by === STATE.user.device) { toast('你不能認證自己提交的店鋪', 'pink'); return; }
  var existingVerification = STATE.verifications && STATE.verifications[s.id];
  if (existingVerification) { toast('你已經認證過這間店鋪了', 'gold'); return; }
  
  openModal('\n    <div class="flex items-center justify-between border-b border-neongreen/30 pb-3 flex-shrink-0">\n      <h2 class="font-black text-neongreen neon-green">🔍 認證店鋪</h2>\n      <button onclick="closeModal()" class="text-2xl text-white/50 hover:text-white transition-colors">✕</button>\n    </div>\n    <div class="flex-1 overflow-y-auto mt-4 space-y-4">\n      <div class="rounded-xl border border-gold/30 bg-gold/5 p-4">\n        <p class="text-sm font-bold text-gold">' + s.name + '</p>\n        <p class="text-xs text-white/40 mt-1">' + s.region + ' · ' + s.addr + '</p>\n        <p class="text-xs text-white/30 mt-2">認證此店鋪可獲得 <span class="text-neongreen font-bold">+15 積分</span></p>\n        <p class="text-xs text-white/30">提交者將獲得額外 <span class="text-neongreen font-bold">+35 積分</span></p>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">📷 現場拍攝店鋪照片 <span class="text-neonpink">（必填）</span></label>\n        <div id="vf-camera-container" class="mt-2 rounded-xl border-2 border-dashed border-white/20 bg-zinc-900 p-3 text-center">\n          <button id="vf-camera-btn" class="w-full rounded-lg bg-white/10 text-white/30 cursor-not-allowed" disabled>📸 開啟相機拍照</button>\n          <img id="vf-preview" class="mt-2 hidden w-full rounded-lg" alt="預覽" />\n        </div>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">📍 GPS 定位 <span class="text-neonpink">（必填）</span></label>\n        <div class="mt-2 rounded-xl border border-white/10 bg-zinc-900/50 p-3">\n          <span id="vf-gps" class="text-yellow-400 text-xs">定位中，請確認已開啟 GPS...</span>\n          <button onclick="retryVerifyGPS()" id="vf-gps-retry" class="hidden mt-2 text-xs text-gold">🔄 重新定位</button>\n        </div>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">📝 備註 <span class="text-white/40">（選填）</span></label>\n        <textarea id="vf-note" placeholder="例如：店鋪在 3 樓，電梯左轉..." class="mt-1 w-full rounded-lg border border-gold/40 bg-zinc-900 px-3 py-2.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-gold resize-none" rows="2"></textarea>\n      </div>\n    </div>\n    <div class="flex-shrink-0 mt-4 pt-3 border-t border-white/10">\n      <button id="vf-submit-btn" onclick="submitVerification(\'' + storeId + '\')" class="w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed">請完成所有必填欄位</button>\n    </div>\n  ');
  
  setTimeout(function() {
    grabVerifyGPS();
    var camBtn = document.getElementById('vf-camera-btn');
    if (camBtn) {
      camBtn.disabled = false;
      camBtn.className = 'w-full rounded-lg bg-neongreen/90 py-2.5 text-sm font-black text-black';
      camBtn.innerHTML = '📸 開啟相機拍照';
      camBtn.onclick = function() { openCamera('vf'); };
    }
  }, 500);
  
  var checkInterval = setInterval(function() {
    var photoReady = window._camPreview && window._camPreview.vf;
    var gpsReady = window._vfGpsReady;
    var btn = document.getElementById('vf-submit-btn');
    if (btn) {
      if (photoReady && gpsReady) {
        btn.className = 'w-full rounded-2xl bg-neongreen py-3.5 text-base font-black text-black glow-green transition-all hover:scale-[1.02] active:scale-[0.98]';
        btn.disabled = false;
        btn.innerHTML = '✅ 提交認證（+15 積分）';
      } else {
        btn.className = 'w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed';
        btn.disabled = true;
        btn.innerHTML = photoReady ? (gpsReady ? '✅ 可以提交' : '📍 等待 GPS 定位中...') : '📷 請先拍攝店鋪照片';
      }
    }
  }, 500);
  setTimeout(function() { return clearInterval(checkInterval); }, 30000);
}

function grabVerifyGPS() {
  var el = document.getElementById('vf-gps');
  if (!el) return;
  el.textContent = '定位中，請確認已開啟 GPS...';
  el.className = 'text-yellow-400 text-xs';
  _vfGpsReady = false;
  var retryBtn = document.getElementById('vf-gps-retry');
  if (retryBtn) retryBtn.classList.add('hidden');
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      _vfGpsLat = pos.coords.latitude;
      _vfGpsLng = pos.coords.longitude;
      _vfGpsReady = true;
      el.textContent = '📍 定位成功：' + _vfGpsLat.toFixed(2) + ', ' + _vfGpsLng.toFixed(2) + ' (精度 ±' + Math.round(pos.coords.accuracy) + 'm)';
      el.className = 'text-neongreen text-xs';
      var submitBtn = document.getElementById('vf-submit-btn');
      if (submitBtn) submitBtn.dispatchEvent(new Event('change'));
    }, function(err) {
      _vfGpsReady = false;
      el.textContent = '⚠️ 定位失敗，請確認已開啟 GPS 並重新嘗試';
      el.className = 'text-neonpink text-xs';
      var retryBtn = document.getElementById('vf-gps-retry');
      if (retryBtn) retryBtn.classList.remove('hidden');
    }, { enableHighAccuracy: true, timeout: 10000 });
  } else {
    _vfGpsReady = false;
    el.textContent = '⚠️ 此裝置不支援 GPS';
    el.className = 'text-neonpink text-xs';
  }
}

function retryVerifyGPS() {
  var retryBtn = document.getElementById('vf-gps-retry');
  if (retryBtn) retryBtn.classList.add('hidden');
  grabVerifyGPS();
}

function getRegionStat(region) {
  var regionMap = {
    '銅鑼灣': 'region_hk_island', '天后': 'region_hk_island', '北角': 'region_hk_island',
    '中環': 'region_hk_island', '金鐘': 'region_hk_island', '上環': 'region_hk_island',
    '灣仔': 'region_hk_island', '鰂魚涌': 'region_hk_island', '太古': 'region_hk_island',
    '筲箕灣': 'region_hk_island', '香港仔': 'region_hk_island', '杏花邨': 'region_hk_island',
    '黃竹坑': 'region_hk_island', '旺角': 'region_kowloon', '尖沙咀': 'region_kowloon',
    '觀塘': 'region_kowloon', '深水埗': 'region_kowloon', '紅磡': 'region_kowloon',
    '藍田': 'region_kowloon', '油麻地': 'region_kowloon', '九龍城': 'region_kowloon',
    '土瓜灣': 'region_kowloon', '黃大仙': 'region_kowloon', '牛頭角': 'region_kowloon',
    '九龍灣': 'region_kowloon', '秀茂坪': 'region_kowloon', '油塘': 'region_kowloon',
    '樂富': 'region_kowloon', '啟德': 'region_kowloon', '黃埔': 'region_kowloon',
    '慈雲山': 'region_kowloon', '大角咀': 'region_kowloon', '荔枝角': 'region_kowloon',
    '屯門': 'region_nt', '荃灣': 'region_nt', '元朗': 'region_nt',
    '葵芳': 'region_nt', '將軍澳': 'region_nt', '大埔': 'region_nt',
    '葵興': 'region_nt', '天水圍': 'region_nt', '沙田': 'region_nt',
    '大圍': 'region_nt', '馬鞍山': 'region_nt', '上水': 'region_nt',
    '粉嶺': 'region_nt', '青衣': 'region_nt', '東涌': 'region_nt',
    '昂坪': 'region_nt', '坑口': 'region_nt', '調景嶺': 'region_nt',
    '日出康城': 'region_nt', '西貢': 'region_nt'
  };
  return regionMap[region] || null;
}

async function submitVerification(storeId) {
    var s = STORES.find(function(x) { return x.id === storeId; });
    if (!s) { toast('找不到該店鋪', 'pink'); return; }
    
    var photoBlob = window._cam?.vf;
    if (!photoBlob) { toast('請先拍攝店鋪照片', 'pink'); return; }
    
    if (!_vfGpsReady || !_vfGpsLat || !_vfGpsLng) { 
        toast('請等待 GPS 定位完成', 'pink'); 
        return; 
    }
    
    var isMallStore = s.type === 'mall' || (s.mall && s.mall.trim() !== '');
    var limitDistance = isMallStore ? 0.5 : 0.3;
    var storeTypeLabel = isMallStore ? '商場鋪 (GPS 可能不準確)' : '地鋪';
    
    if (s.lat && s.lng) {
        var distance = calculateDistance(s.lat, s.lng, _vfGpsLat, _vfGpsLng);
        var distanceMeters = Math.round(distance * 1000);
        var limitMeters = Math.round(limitDistance * 1000);
        if (distance > limitDistance) {
            toast('⚠️ 你距離該' + storeTypeLabel + ' ' + distanceMeters + ' 米，請在 ' + limitMeters + ' 米內認證', 'pink');
            return;
        }
        toast('✅ 距離 ' + distanceMeters + ' 米，在 ' + limitMeters + ' 米範圍內 (' + storeTypeLabel + ')', 'green');
    }
    
    var photoUrl = window._camPreview?.vf || '';
    if (CLOUD_ON) {
        try {
            var file = new File([photoBlob], "verify_" + Date.now() + ".jpg", { type: 'image/jpeg' });
            photoUrl = await uploadImage(file, 'verifications');
        } catch (e) { 
            toast('圖片上傳失敗', 'pink'); 
            return; 
        }
    }
    
    var verification = {
        store_id: storeId,
        verifier_device: STATE.user.device,
        verifier_user_id: STATE.user.user_id || null,
        verifier_name: STATE.user.name || '匿名用戶',
        photo_url: photoUrl,
        lat: _vfGpsLat,
        lng: _vfGpsLng,
        note: document.getElementById('vf-note')?.value.trim() || '',
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    if (CLOUD_ON) {
        try {
            await cloudInsert('store_verifications', verification);
            console.log('✅ 認證已同步到雲端');
        } catch (e) {
            console.warn('⚠️ 認證雲端同步失敗:', e.message);
            toast('⚠️ 認證記錄失敗，請稍後重試', 'pink');
            return;
        }
    }
    
    s.verification_count = (s.verification_count || 0) + 1;
    s._userVerified = true;
    
    if (s.verification_count >= 2) {
        s.status = 'verified';
        s.verified = 'verified';
        s.is_verified = true;
        
        if (s.submitted_by) {
            await addPoints(35, '認證通過追加獎勵');
            toast('🎉 ' + s.name + ' 已通過認證！提交者獲得 +35 分', 'green');
        }
        updateAchievementStat('store_complete');
        var regionStat = getRegionStat(s.region);
        if (regionStat) updateAchievementStat(regionStat);
        
        if (CLOUD_ON) {
            try {
                var checkResponse = await fetch(
                    SUPABASE_URL + "/rest/v1/verification_reviews?select=id&store_id=eq." + storeId + "&admin_status=eq.pending",
                    {
                        headers: {
                            'apikey': SUPABASE_KEY,
                            'Authorization': 'Bearer ' + SUPABASE_KEY
                        }
                    }
                );
                var checkData = await checkResponse.json();
                if (!checkData || checkData.length === 0) {
                    toast('🔔 此店鋪已達到 2 人認證，等待管理員審核', 'gold');
                }
            } catch (e) {
                console.warn('⚠️ 檢查審核記錄失敗:', e.message);
            }
        }
    } else {
        toast('✅ 認證提交成功！目前 ' + s.verification_count + '/2 人認證', 'green');
    }
    
    save();
    
    if (CLOUD_ON) {
        try {
            await fetch(
                SUPABASE_URL + "/rest/v1/claw_stores?id=eq." + storeId,
                {
                    method: 'PATCH',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': 'Bearer ' + SUPABASE_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        verification_count: s.verification_count,
                        status: s.status,
                        verified: s.verified,
                        is_verified: s.is_verified
                    })
                }
            );
            console.log('✅ 前台認證計數已同步');
        } catch (e) {
            console.warn('⚠️ 同步認證計數失敗:', e.message);
        }
    }
    
    await recordTaskCompletion('verify_store');
    
    if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
        try {
            await fetch(
                SUPABASE_URL + "/rest/v1/user_contributions",
                {
                    method: 'POST',
                    headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
                    body: JSON.stringify([{
                        user_id: STATE.user.user_id,
                        device_id: STATE.user.device,
                        store_id: storeId,
                        contribution_type: 'verify',
                        contribution_value: 1,
                        created_at: new Date().toISOString()
                    }])
                }
            );
        } catch (e) {
            console.warn('⚠️ 貢獻記錄同步失敗:', e.message);
        }
    }
    
    await addPoints(15, '認證店鋪');
    updateAchievementStat('verify_store');
    updateStreak();
    
    closeModal();
    openStore(storeId);
}

// ============================================================
// 補充資料表單
// ============================================================
function openSupplementForm(storeId) {
  var s = STORES.find(function(x) { return x.id === storeId; });
  if (!s) { toast('找不到該店鋪', 'pink'); return; }
  var isStreetStore = s.type !== 'mall' && s.mall === '';
  var existing = { address: s.address_detail && s.address_detail !== '', size: s.size && s.size !== '中', staff: s.has_staff !== undefined && s.has_staff !== null, coin: s.has_e_coin !== undefined && s.has_e_coin !== null };
  var completedCount = [existing.address, existing.size, existing.staff, existing.coin].filter(Boolean).length;
  var allCompleted = completedCount === 4;
  var isMallStore = s.type === 'mall' || s.mall !== '';
  var addressRequired = isStreetStore;
  var addressCompleted = isMallStore ? true : existing.address;
  
  openModal('\n    <div class="flex items-center justify-between border-b border-gold/30 pb-3 flex-shrink-0">\n      <h2 class="font-black text-gold neon-gold">📝 補充店鋪資料</h2>\n      <button onclick="closeModal()" class="text-2xl text-white/50 hover:text-white transition-colors">✕</button>\n    </div>\n    <div class="flex-1 overflow-y-auto mt-4 space-y-4">\n      <div class="rounded-xl border border-gold/30 bg-gold/5 p-3">\n        <p class="text-sm font-bold text-gold">' + s.name + '</p>\n        <p class="text-xs text-white/40">' + s.region + ' · ' + s.addr + '</p>\n        <div class="mt-2 flex items-center gap-3 text-xs">\n          <span class="text-white/40">📊 完成進度：</span>\n          <span class="text-neongreen font-bold">' + (allCompleted ? '✅ 已完成' : completedCount + '/4') + '</span>\n        </div>\n        <p class="text-xs text-white/30 mt-1">全部完成可獲得 <span class="text-neongreen font-bold">+15 積分</span></p>\n      </div>\n      ' + (addressRequired ? '<div><label class="text-xs font-bold text-gold flex items-center gap-2">📍 詳細地址 <span class="text-neonpink">（必填）</span>' + (addressCompleted ? '<span class="text-[9px] text-neongreen">✅ 已補充</span>' : '') + '</label><input id="sf-address" placeholder="例如：西洋菜南街 2A 好望角大廈" class="mt-1 w-full rounded-lg border border-gold/40 bg-zinc-900 px-3 py-2 text-sm placeholder-zinc-600 focus:outline-none focus:border-gold" value="' + (s.address_detail || '') + '" ' + (addressCompleted ? 'disabled style="opacity:0.5;"' : '') + ' /></div>' : '<div class="rounded-lg bg-white/5 p-3 text-xs text-white/40">🏬 商場鋪自動使用商場地址，無需補充</div>') + '\n      <div><label class="text-xs font-bold text-gold flex items-center gap-2">📏 規模 <span class="text-neonpink">（必填）</span>' + (existing.size ? '<span class="text-[9px] text-neongreen">✅ 已補充</span>' : '') + '</label><div class="mt-1 flex gap-2"><button onclick="selectSizeUI(\'small\')" class="sf-size-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.size === 'small' ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">小型 (6台以下)</button><button onclick="selectSizeUI(\'medium\')" class="sf-size-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.size === 'medium' ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">中型 (7-12台)</button><button onclick="selectSizeUI(\'large\')" class="sf-size-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.size === 'large' ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">大型 (12台以上)</button></div></div>\n      <div><label class="text-xs font-bold text-gold flex items-center gap-2">👤 場務 <span class="text-neonpink">（必填）</span>' + (existing.staff ? '<span class="text-[9px] text-neongreen">✅ 已補充</span>' : '') + '</label><div class="mt-1 flex gap-2"><button onclick="selectStaffUI(true)" class="sf-staff-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.has_staff === true ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">👤 有場務</button><button onclick="selectStaffUI(false)" class="sf-staff-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.has_staff === false ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">👤 無場務</button></div></div>\n      <div><label class="text-xs font-bold text-gold flex items-center gap-2">🪙 電子兌幣 <span class="text-neonpink">（必填）</span>' + (existing.coin ? '<span class="text-[9px] text-neongreen">✅ 已補充</span>' : '') + '</label><div class="mt-1 flex gap-2"><button onclick="selectCoinUI(true)" class="sf-coin-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.has_e_coin === true ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">🪙 有電子兌幣</button><button onclick="selectCoinUI(false)" class="sf-coin-btn flex-1 rounded-lg border py-2 text-sm transition-all ' + (s.has_e_coin === false ? 'border-neongreen bg-neongreen/20 text-neongreen' : 'border-white/20 text-white/45 hover:border-gold/40') + '">🪙 無電子兌幣</button></div></div>\n      <button onclick="submitAllSupplement(\'' + s.id + '\')" id="sf-submit-btn" class="w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed">請完成所有必填欄位</button>\n    </div>\n  ');
  
  window._sfSelections = { size: s.size || null, staff: s.has_staff !== undefined && s.has_staff !== null ? s.has_staff : null, coin: s.has_e_coin !== undefined && s.has_e_coin !== null ? s.has_e_coin : null };
  
  var checkInterval = setInterval(function() {
    var isStreet = s.type !== 'mall' && s.mall === '';
    var addrInput = document.getElementById('sf-address');
    var hasAddress = isStreet ? (addrInput && addrInput.value.trim() !== '') : true;
    var hasSize = window._sfSelections.size !== null;
    var hasStaff = window._sfSelections.staff !== null;
    var hasCoin = window._sfSelections.coin !== null;
    var addressDone = isStreet ? (s.address_detail && s.address_detail !== '') || hasAddress : true;
    var sizeDone = (s.size && s.size !== '中') || hasSize;
    var staffDone = (s.has_staff !== undefined && s.has_staff !== null) || hasStaff;
    var coinDone = (s.has_e_coin !== undefined && s.has_e_coin !== null) || hasCoin;
    var allDone = addressDone && sizeDone && staffDone && coinDone;
    var btn = document.getElementById('sf-submit-btn');
    if (btn) {
      if (allDone) {
        btn.className = 'w-full rounded-2xl bg-neongreen py-3.5 text-base font-black text-black glow-green transition-all hover:scale-[1.02] active:scale-[0.98]';
        btn.disabled = false;
        btn.innerHTML = '✅ 提交全部資料（+15 積分）';
      } else {
        btn.className = 'w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed';
        btn.disabled = true;
        btn.innerHTML = '請完成所有必填欄位 (' + [addressDone, sizeDone, staffDone, coinDone].filter(Boolean).length + '/4)';
      }
    }
  }, 300);
  setTimeout(function() { return clearInterval(checkInterval); }, 60000);
}

function selectSizeUI(size) {
  window._sfSelections.size = size;
  document.querySelectorAll('.sf-size-btn').forEach(function(btn) {
    btn.classList.remove('border-neongreen', 'bg-neongreen/20', 'text-neongreen');
    btn.classList.add('border-white/20', 'text-white/45');
  });
  var label = size === 'small' ? '小型' : size === 'large' ? '大型' : '中型';
  document.querySelectorAll('.sf-size-btn').forEach(function(btn) {
    if (btn.textContent.includes(label)) {
      btn.classList.remove('border-white/20', 'text-white/45');
      btn.classList.add('border-neongreen', 'bg-neongreen/20', 'text-neongreen');
    }
  });
}

function selectStaffUI(value) {
  window._sfSelections.staff = value;
  document.querySelectorAll('.sf-staff-btn').forEach(function(btn) {
    btn.classList.remove('border-neongreen', 'bg-neongreen/20', 'text-neongreen');
    btn.classList.add('border-white/20', 'text-white/45');
  });
  var label = value ? '有場務' : '無場務';
  document.querySelectorAll('.sf-staff-btn').forEach(function(btn) {
    if (btn.textContent.includes(label)) {
      btn.classList.remove('border-white/20', 'text-white/45');
      btn.classList.add('border-neongreen', 'bg-neongreen/20', 'text-neongreen');
    }
  });
}

function selectCoinUI(value) {
  window._sfSelections.coin = value;
  document.querySelectorAll('.sf-coin-btn').forEach(function(btn) {
    btn.classList.remove('border-neongreen', 'bg-neongreen/20', 'text-neongreen');
    btn.classList.add('border-white/20', 'text-white/45');
  });
  var label = value ? '有電子兌幣' : '無電子兌幣';
  document.querySelectorAll('.sf-coin-btn').forEach(function(btn) {
    if (btn.textContent.includes(label)) {
      btn.classList.remove('border-white/20', 'text-white/45');
      btn.classList.add('border-neongreen', 'bg-neongreen/20', 'text-neongreen');
    }
  });
}

async function submitAllSupplement(storeId) {
    var s = STORES.find(function(x) { return x.id === storeId; });
    if (!s) { toast('找不到該店鋪', 'pink'); return; }
    
    var isStreet = s.type !== 'mall' && s.mall === '';
    var address = '';
    if (isStreet) {
        var addrInput = document.getElementById('sf-address');
        if (addrInput) address = addrInput.value.trim();
    }
    var size = window._sfSelections.size;
    var staff = window._sfSelections.staff;
    var coin = window._sfSelections.coin;
    
    if (isStreet && !address) { toast('請輸入詳細地址', 'pink'); return; }
    if (!size) { toast('請選擇規模', 'pink'); return; }
    if (staff === null || staff === undefined) { toast('請選擇是否有場務', 'pink'); return; }
    if (coin === null || coin === undefined) { toast('請選擇是否有電子兌幣', 'pink'); return; }
    
    var hasAddress = s.address_detail && s.address_detail !== '';
    var hasSize = s.size && s.size !== '中';
    var hasStaff = s.has_staff !== undefined && s.has_staff !== null;
    var hasCoin = s.has_e_coin !== undefined && s.has_e_coin !== null;
    
    if ((!isStreet || hasAddress) && hasSize && hasStaff && hasCoin) {
        toast('此店鋪資料已完整，無需重複補充', 'gold');
        return;
    }
    
    var currentGps = null;
    if (gpsLat && gpsLng) {
        currentGps = { lat: gpsLat, lng: gpsLng };
        console.log('📍 補充資料時 GPS 位置:', currentGps);
    }
    
    if (isStreet && address) s.address_detail = address;
    s.size = size;
    s.has_staff = staff;
    s.has_e_coin = coin;
    s.supplement_count = (s.supplement_count || 0) + 1;
    s.supplemented_by = STATE.user.device;
    s._userSupplemented = true;
    
    var supplementFields = [];
    if (isStreet && address) supplementFields.push('address_detail');
    supplementFields.push('size');
    supplementFields.push('has_staff');
    supplementFields.push('has_e_coin');
    
    for (var i = 0; i < supplementFields.length; i++) {
        var fieldName = supplementFields[i];
        var fieldValue = s[fieldName];
        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
            await sb.from('field_status').upsert({
                table_name: 'claw_stores',
                record_id: storeId,
                field_name: fieldName,
                status: 'pending',
                submitted_by: STATE.user.device,
                submitted_type: 'supplement',
                updated_at: new Date().toISOString()
            }, { onConflict: 'table_name, record_id, field_name' });
        }
    }
    
    if (CLOUD_ON) {
        var updates = {};
        if (isStreet && address) updates.address_detail = address;
        updates.size = size;
        updates.has_staff = staff;
        updates.has_e_coin = coin;
        updates.supplemented_by = STATE.user.device;
        cloudInsert('claw_stores', Object.assign({ id: storeId }, updates));
        
        if (currentGps) {
            cloudInsert('store_supplements', {
                store_id: storeId,
                user_id: STATE.user.device,
                user_name: STATE.user.name,
                supplement_type: 'bulk_update',
                new_value: JSON.stringify({
                    address: address,
                    size: size,
                    has_staff: staff,
                    has_e_coin: coin
                }),
                gps_lat: currentGps.lat,
                gps_lng: currentGps.lng
            });
        }
    }
    
    await recordTaskCompletion('supplement');
    
    if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
        try {
            await fetch(
                SUPABASE_URL + "/rest/v1/user_contributions",
                {
                    method: 'POST',
                    headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
                    body: JSON.stringify([{
                        user_id: STATE.user.user_id,
                        device_id: STATE.user.device,
                        store_id: storeId,
                        contribution_type: 'supplement',
                        contribution_value: 1,
                        created_at: new Date().toISOString()
                    }])
                }
            );
        } catch (e) {
            console.warn('⚠️ 貢獻記錄同步失敗:', e.message);
        }
    }
    
    await addPoints(15, '補充資料完成');
    updateAchievementStat('supplement');
    checkPerfectFile(storeId);
    updateStreak();
    toast('✅ 全部資料補充完成！獲得 15 積分', 'green');
    closeModal();
    setTimeout(function() { return openStore(storeId); }, 500);
}

function checkPerfectFile(storeId) {
  var s = STORES.find(function(x) { return x.id === storeId; });
  if (!s) return;
  var hasAddress = s.address_detail && s.address_detail !== '';
  var hasSize = s.size && s.size !== '中';
  var hasStaff = s.has_staff !== undefined && s.has_staff !== null;
  var hasCoin = s.has_e_coin !== undefined && s.has_e_coin !== null;
  if (hasAddress && hasSize && hasStaff && hasCoin) {
    updateAchievementStat('perfect_file');
    toast('📝 完美檔案！這間店的資料已完整！+20 分', 'gold');
  }
}

// ============================================================
// 店鋪打卡功能
// ============================================================
function getTodayCheckins() {
    var today = todayKey();
    if (!STATE.checkins) STATE.checkins = {};
    if (!STATE.checkins[today]) STATE.checkins[today] = [];
    return STATE.checkins[today];
}

function hasCheckedInToday(storeId) {
    var checkins = getTodayCheckins();
    return checkins.indexOf(storeId) !== -1;
}

async function doStoreCheckin(storeId) {
    var s = STORES.find(function(x) { return x.id === storeId; });
    if (!s) { toast('找不到該店鋪', 'pink'); return; }
    
    if (hasCheckedInToday(storeId)) {
        toast('📍 今日已在「' + s.name + '」打卡，明天再來吧！', 'gold');
        return;
    }
    
    if (!gpsLat || !gpsLng) {
        toast('📍 請先開啟 GPS 定位', 'pink');
        return;
    }
    
    if (s.lat && s.lng) {
        var distance = calculateDistance(s.lat, s.lng, gpsLat, gpsLng);
        var distanceMeters = Math.round(distance * 1000);
        if (distance > 0.3) {
            toast('⚠️ 你距離該店鋪 ' + distanceMeters + ' 米，請在 300 米內打卡', 'pink');
            return;
        }
        toast('✅ 距離 ' + distanceMeters + ' 米，在 300 米範圍內', 'green');
    }
    
    var checkins = getTodayCheckins();
    checkins.push(storeId);
    save();
    
    await recordTaskCompletion('checkin');
    
    if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
        try {
            await fetch(
                SUPABASE_URL + "/rest/v1/store_checkins",
                {
                    method: 'POST',
                    headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
                    body: JSON.stringify([{
                        user_id: STATE.user.user_id,
                        device_id: STATE.user.device,
                        store_id: storeId,
                        store_name: s.name,
                        checkin_date: todayKey(),
                        lat: gpsLat,
                        lng: gpsLng,
                        created_at: new Date().toISOString()
                    }])
                }
            );
        } catch (e) {
            console.warn('⚠️ 打卡雲端同步失敗:', e.message);
        }
    }
    
    toast('✅ 在「' + s.name + '」打卡成功！+5 分', 'green');
    updateStoreContent(storeId);
}

// ============================================================
// 機台上架
// ============================================================
function openMachineForm(sid) {
  openModal(`
    <div class="flex items-center justify-between border-b border-neongreen/30 pb-3">
      <h2 class="font-black text-neongreen neon-green">➕ 共享此店機台</h2>
      <button onclick="closeModal()" class="text-2xl text-white/50">✕</button>
    </div>
    <div class="flex-1 overflow-y-auto mt-4 space-y-4">
      <div class="rounded-xl border border-neongreen/20 bg-neongreen/5 p-3">
        <p class="text-xs text-white/40">📸 現場拍攝機台照片，確保資訊真實性</p>
        <p class="text-xs text-neongreen mt-1">✅ 拍照後自動獲取 GPS 位置</p>
      </div>
      <div>
        <label class="text-xs font-bold text-gold">📷 強制現場現拍機台照 <span class="text-neonpink">（必填）</span></label>
        <div id="mf-camera-container" class="mt-2 rounded-xl border-2 border-dashed border-white/20 bg-zinc-900 p-3 text-center">
          <button id="mf-camera-btn" class="w-full rounded-lg bg-white/10 text-white/30 cursor-not-allowed" disabled>📸 開啟相機拍照</button>
          <img id="mf-preview" class="mt-2 hidden w-full rounded-lg" alt="預覽" />
        </div>
      </div>
      <div>
        <label class="text-xs font-bold text-gold">📍 GPS 定位 <span class="text-neonpink">（必填）</span></label>
        <div class="mt-2 rounded-xl border border-white/10 bg-zinc-900/50 p-3">
          <span id="mf-gps" class="text-yellow-400 text-xs">⏳ 請點擊「開啟相機拍照」獲取位置</span>
        </div>
      </div>
      <p class="mt-4 text-xs font-bold text-gold">台性標籤（多選）</p>
      <div id="mf-feats" class="mt-2 flex flex-wrap gap-2">` + FEATURE_TAGS.map(function(t) { 
        return '<button onclick="this.classList.toggle(\'chip-active-green\')" data-tag="' + t + '" class="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">' + t + '</button>'; 
      }).join('') + `</div>
      <p class="mt-4 text-xs font-bold text-gold">玩法（多選）</p>
      <div id="mf-plays" class="mt-2 flex flex-wrap gap-2">` + PLAY_TAGS.map(function(t) { 
        return '<button onclick="this.classList.toggle(\'chip-active-green\')" data-tag="' + t + '" class="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">' + t + '</button>'; 
      }).join('') + `</div>
    </div>
    <button onclick="submitMachine('` + sid + `')" id="mf-submit-btn" 
      class="mt-5 w-full rounded-2xl bg-white/10 py-3 font-black text-white/30 cursor-not-allowed">
      📷 請先拍照
    </button>
  `);
  
  function enableCameraButton() {
    var camBtn = document.getElementById('mf-camera-btn');
    if (camBtn) {
      camBtn.disabled = false;
      camBtn.className = 'w-full rounded-lg bg-neongreen/90 py-2.5 text-sm font-black text-black';
      camBtn.innerHTML = '📸 開啟相機拍照';
      camBtn.onclick = function() { openCamera('mf'); };
    } else {
      setTimeout(enableCameraButton, 200);
    }
  }
  setTimeout(enableCameraButton, 300);
  
  var checkInterval = setInterval(function() {
    var photoReady = window._camPreview && window._camPreview.mf;
    var btn = document.getElementById('mf-submit-btn');
    var gpsEl = document.getElementById('mf-gps');
    
    if (btn) {
      if (photoReady) {
        btn.className = 'w-full rounded-2xl bg-neongreen py-3 font-black text-black glow-green hover:scale-[1.02] active:scale-[0.98] transition-all';
        btn.disabled = false;
        btn.innerHTML = '✅ 提交機台情報';
      } else {
        btn.className = 'w-full rounded-2xl bg-white/10 py-3 font-black text-white/30 cursor-not-allowed';
        btn.disabled = true;
        btn.innerHTML = '📷 請先拍照';
      }
    }
    
    if (gpsEl) {
      if (gpsLat && gpsLng) {
        gpsEl.textContent = '📍 定位成功：' + gpsLat.toFixed(6) + ', ' + gpsLng.toFixed(6);
        gpsEl.className = 'text-neongreen text-xs';
      } else {
        gpsEl.textContent = '⏳ 請點擊「開啟相機拍照」獲取位置';
        gpsEl.className = 'text-yellow-400 text-xs';
      }
    }
  }, 500);
  setTimeout(function() { return clearInterval(checkInterval); }, 60000);
}

async function submitMachine(sid) {
  var photoBlob = window._cam?.mf;
  if (!photoBlob) return toast("請先拍照", "pink");
  
  if (!gpsLat || !gpsLng) {
    toast('📍 請先點擊「開啟相機拍照」以獲取位置', 'pink');
    return;
  }
  
  var photoUrl = window._camPreview?.mf || '';
  if (CLOUD_ON) {
    try {
      var file = new File([photoBlob], Date.now() + ".jpg", { type: 'image/jpeg' });
      photoUrl = await uploadImage(file, 'machines');
    } catch (e) { toast('圖片上傳失敗', 'pink'); return; }
  }
  
  var s = STORES.find(function(x) { return x.id === sid; });
  if (!s) { toast('找不到該店鋪', 'pink'); return; }
  
  if (s.lat && s.lng) {
    var distance = calculateDistance(s.lat, s.lng, gpsLat, gpsLng);
    if (distance > 0.2) {
      toast('⚠️ 你距離該店鋪 ' + (distance * 1000).toFixed(0) + ' 米，請在 200 米內上架機台', 'pink');
      return;
    }
  }
  
  var feats = document.querySelectorAll('#mf-feats .chip-active-green');
  var featsArray = [];
  feats.forEach(function(b) { return featsArray.push(b.dataset.tag); });
  if (!featsArray.length) return toast("請至少選一個台性標籤", "pink");
  
  var playsArray = [];
  document.querySelectorAll('#mf-plays .chip-active-green').forEach(function(b) { return playsArray.push(b.dataset.tag); });
  
  s.machines.unshift({ id: sid + "_u" + uid(), no: "新" + (s.machines.length + 1), feats: featsArray, plays: playsArray, prize: "台主自報", updated: now(), photo: photoUrl });
  cloudInsert("claw_machines", { store_id: sid, feats: featsArray, photo: photoUrl });
  toast("機台已上架", "green");
  
  await recordTaskCompletion('machine_checkin');
  
  if (CLOUD_ON && STATE.user.is_bound && STATE.user.user_id) {
    try {
      await fetch(
        SUPABASE_URL + "/rest/v1/user_contributions",
        {
          method: 'POST',
          headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
          body: JSON.stringify([{
            user_id: STATE.user.user_id,
            device_id: STATE.user.device,
            store_id: sid,
            contribution_type: 'machine',
            contribution_value: 1,
            created_at: new Date().toISOString()
          }])
        }
      );
    } catch (e) {
      console.warn('⚠️ 貢獻記錄同步失敗:', e.message);
    }
  }
  
  var followers = STATE.favStores.filter(function(storeId) { return storeId === sid; });
  if (followers.length > 0) {
    if (!STATE.notifications) STATE.notifications = [];
    STATE.notifications.unshift({ id: 'n' + Date.now(), type: 'machine_update', store_id: sid, store_name: s.name, message: '📢 ' + s.name + ' 有新的機台上架！', read: false, created_at: now() });
    save();
    toast('📢 已通知 ' + followers.length + ' 位收藏者', 'gold');
  }
  closeModal();
  openStore(sid);
}