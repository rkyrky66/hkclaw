// ============================================================
// js/ui-functions.js (修正版)
// 爪爪情報站 - UI 相關函數 (視圖切換、模態框、Toast)
// ============================================================

// ============================================================
// 全域變數
// ============================================================
var AFTER = { map: null };
var CURRENT = "map";

// ============================================================
// 導航與視圖切換
// ============================================================
function showView(name) {
  var overlay = document.getElementById('page-overlay');
  var mapPage = document.getElementById('map-page-container');
  CURRENT = name;
  
  // 獲取對應的視圖函數
  var viewMap = {
    'map': window.viewMap,
    'find': window.viewFind,
    'task': window.viewTask,
    'live': window.viewLive,
    'me': window.viewMe
  };
  
  if (name === 'map') {
    if (mapPage) mapPage.style.display = 'flex';
    if (overlay) {
      overlay.style.display = 'none';
      overlay.innerHTML = '';
    }
    setTimeout(function() {
      if (map && mapInitialized) {
        map.invalidateSize(true);
        updateMapMarkers();
        updateMapList();
        updateFilterCount();
        updateRegionProgress();
      } else if (!mapInitialized) {
        initMap();
      }
    }, 200);
  } else {
    if (mapPage) mapPage.style.display = 'none';
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.pointerEvents = 'auto';
      var viewFn = viewMap[name] || function() { return '<p class="text-center text-white/40 py-10">頁面載入中...</p>'; };
      overlay.innerHTML = viewFn();
      overlay.scrollTop = 0;
      overlay.classList.add("view-enter");
    }
  }
  
  document.querySelectorAll(".nav-btn").forEach(function(b) {
    var on = b.getAttribute("data-nav") === name;
    b.classList.toggle("active", on);
    b.classList.remove("text-neongreen", "text-neonpink", "text-gold", "text-white/45");
    b.classList.add(on ? NAV_COLOR[name] : "text-white/45");
  });
  document.getElementById("page-subtitle").textContent = SUBTITLES[name] || "";
  if (AFTER[name] && name !== 'map') {
    setTimeout(function() { AFTER[name](); }, 100);
  }
}

function viewMap() {
  var mapPage = document.getElementById('map-page-container');
  var overlay = document.getElementById('page-overlay');
  if (mapPage) mapPage.style.display = 'flex';
  if (overlay) overlay.style.display = 'none';
  updateFilterCount();
  updateMapList();
  updateRegionProgress();
  if (!mapInitialized) {
    setTimeout(function() { return initMap(); }, 300);
  } else {
    setTimeout(function() {
      if (map) {
        map.invalidateSize(true);
        updateMapMarkers();
        updateMapList();
        updateRegionProgress();
      }
    }, 200);
  }
  return '';
}

// ============================================================
// 模態框
// ============================================================
function openModal(html) {
  var root = document.getElementById("modal-root");
  root.className = "fixed inset-0 z-50 mx-auto flex max-w-md items-end justify-center";
  root.innerHTML = '<div onclick="closeModal()" class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div><div class="no-scrollbar animate-pop relative w-full rounded-t-3xl border-t border-gold/40 bg-zinc-950 p-5 glow-gold" style="height:75vh; max-height:75vh; display:flex; flex-direction:column;">' + html + '</div>';
}

function closeModal() {
  var root = document.getElementById("modal-root");
  root.className = "pointer-events-none fixed inset-0 z-50";
  root.innerHTML = "";
}

// ============================================================
// Toast 通知
// ============================================================
function toast(msg, color) {
  if (color === void 0) color = "green";
  var root = document.getElementById("toast-root");
  var c = color === "pink" ? "border-neonpink text-neonpink glow-pink" : "border-neongreen text-neongreen glow-green";
  var el = document.createElement("div");
  el.className = "animate-pop pointer-events-auto rounded-full border " + c + " bg-black px-4 py-2 text-sm font-bold";
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(function() { return el.remove(); }, 2200);
}

// ============================================================
// 時間格式
// ============================================================
function timeAgo(ts) {
  var diff = now() - ts;
  if (diff < HOUR) return Math.max(1, Math.floor(diff / 60000)) + " 分鐘前";
  if (diff < DAY) return Math.floor(diff / HOUR) + " 小時前";
  return Math.floor(diff / DAY) + " 天前";
}

// ============================================================
// 快速操作
// ============================================================
function quickAction(action, storeId) {
  var store = STORES.find(function(s) { return s.id === storeId; });
  if (!store) { toast('找不到該店鋪', 'pink'); return; }
  switch (action) {
    case 'checkin':
      doCheckin();
      break;
    case 'update':
      showView('map');
      setTimeout(function() {
        if (map && store.lat && store.lng) {
          map.flyTo([store.lat, store.lng], 16, { duration: 1 });
          setTimeout(function() {
            openStore(storeId);
            toast('📍 前往「' + store.name + '」更新資訊', 'green');
          }, 800);
        } else {
          openStore(storeId);
        }
      }, 300);
      break;
    case 'post':
      showView('live');
      setTimeout(function() {
        openPlayerPostWithStore('lp', store);
        toast('📢 為「' + store.name + '」發布戰報', 'green');
      }, 400);
      break;
    default:
      toast('未知操作', 'pink');
  }
}

// ============================================================
// 快速任務跳轉
// ============================================================
function quickTaskAction(taskType) {
    var actionMap = {
        'submit_store': function() { openIntelForm(); },
        'verify_store': function() { openVerifyTask(); },
        'supplement': function() { openSupplementTask(); },
        'checkin': function() { quickTaskCheckin(); },
        'machine_checkin': function() { quickTaskMachine(); },
        'share': function() { quickTaskShare(); }
    };
    if (actionMap[taskType]) {
        actionMap[taskType]();
    }
}

function quickTaskCheckin() {
    showView('map');
    toast('📍 請在地圖上點擊店鋪進行打卡', 'gold');
    setTimeout(function() {
        var guide = document.createElement('div');
        guide.id = 'task-guide';
        guide.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:12px 20px;z-index:100;font-size:13px;color:#D4AF37;text-align:center;max-width:280px;pointer-events:none;';
        guide.textContent = '📍 點擊地圖上的店鋪圖釘進行打卡';
        document.getElementById('map-wrapper').appendChild(guide);
        setTimeout(function() { if (guide.parentNode) guide.remove(); }, 5000);
    }, 300);
}

function quickTaskMachine() {
    showView('map');
    toast('🎰 請在地圖上點擊店鋪，進入機台頁面打卡', 'gold');
    setTimeout(function() {
        var guide = document.createElement('div');
        guide.id = 'task-guide';
        guide.style.cssText = 'position:absolute;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.9);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:12px 20px;z-index:100;font-size:13px;color:#D4AF37;text-align:center;max-width:280px;pointer-events:none;';
        guide.textContent = '🎰 點擊店鋪後，在機台區打卡';
        document.getElementById('map-wrapper').appendChild(guide);
        setTimeout(function() { if (guide.parentNode) guide.remove(); }, 5000);
    }, 300);
}

function quickTaskShare() {
    showView('live');
    setTimeout(function() {
        var container = document.getElementById('page-overlay');
        if (container) {
            var guide = document.createElement('div');
            guide.id = 'task-guide';
            guide.style.cssText = 'position:sticky;top:60px;z-index:50;background:rgba(0,0,0,0.9);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:10px 16px;font-size:12px;color:#D4AF37;text-align:center;margin-bottom:12px;';
            guide.textContent = '📢 點擊「發布出貨戰報」按鈕完成任務';
            container.prepend(guide);
            setTimeout(function() { if (guide.parentNode) guide.remove(); }, 5000);
        }
    }, 300);
}