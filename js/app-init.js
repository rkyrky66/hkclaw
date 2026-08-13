// ============================================================
// js/app-init.js
// 爪爪情報站 - 應用啟動與全域初始化
// ============================================================

// ============================================================
// 全域變數 (跨檔案共享)
// ============================================================
var _storeContext = null;
var _currentMallData = null;
var _currentMallFloor = null;
var _currentHighlightId = null;
var _vfGpsReady = false;
var _vfGpsLat = null;
var _vfGpsLng = null;
var _loLinkPlan = null;
var _sfSelections = {};
var intelMoreOpenMap = { hk: false, kl: false, nt: false };
var currentTab = 'hk';
var selectedRegion = '';
var selectedType = '';
var selectedMall = '';
var selectedFloor = '';
var isGpsReady = false;
var gpsAccuracy = null;
var mallSelectionMode = 'button';
var mallInputValue = '';
var findState = { region: "全部", group: "kl" };
var currentPage = 0;
var PAGE_SIZE = 20;
var allFilteredStores = [];
var pullStartY = 0;
var pullMoveY = 0;
var isPulling = false;
var isRefreshing = false;
var ensureStoresTimeout = null;
var ensureStoresRetryCount = 0;
var MAX_ENSURE_RETRIES = 3;

// ============================================================
// 下拉刷新
// ============================================================
function initPullToRefresh() {
  var container = document.getElementById('main');
  var indicator = document.getElementById('pull-indicator');
  if (!container || !indicator) return;
  
  container.addEventListener('touchstart', function(e) {
    if (container.scrollTop === 0) {
      pullStartY = e.touches[0].clientY;
      isPulling = true;
      pullMoveY = 0;
    }
  }, { passive: true });
  
  container.addEventListener('touchmove', function(e) {
    if (!isPulling || isRefreshing) return;
    var deltaY = e.touches[0].clientY - pullStartY;
    if (deltaY > 0 && container.scrollTop === 0) {
      pullMoveY = Math.min(deltaY, 80);
      indicator.style.top = Math.min(pullMoveY - 60, 0) + "px";
      var text = indicator.querySelector('.text');
      if (text) text.textContent = pullMoveY > 60 ? '🔄 鬆手同步資料' : '⬇️ 下拉同步最新資料';
      indicator.classList.toggle('active', pullMoveY > 60);
    }
  }, { passive: true });
  
  container.addEventListener('touchend', function() {
    if (isPulling && pullMoveY > 60 && !isRefreshing) {
      isRefreshing = true;
      if (indicator) {
        indicator.classList.add('loading');
        indicator.style.top = '0px';
        var text = indicator.querySelector('.text');
        if (text) text.textContent = '🔄 同步中...';
      }
      refreshAllData().catch(function(e) {
        toast('同步失敗: ' + e.message, 'pink');
      }).finally(function() {
        if (indicator) {
          indicator.classList.remove('loading', 'active');
          indicator.style.top = '-60px';
          var text = indicator.querySelector('.text');
          if (text) text.textContent = '⬇️ 下拉同步最新資料';
        }
        isRefreshing = false;
      });
    }
    isPulling = false;
    pullMoveY = 0;
  }, { passive: true });
}

// ============================================================
// 刷新所有數據
// ============================================================
async function refreshAllData() {
  toast('🔄 正在同步最新資料...', 'green');
  await loadCloud();
  await loadMalls();
  await loadLivePosts();
  await processPendingPosts();
  await processOfflineReports();
  await loadTaskProgressFromCloud();
  
  if (CURRENT === 'map') {
    if (mapInitialized) { 
      updateMapMarkers(); 
      updateMapList(); 
      updateRegionProgress(); 
      ensureStoresVisible(); 
    } else { 
      initMap(); 
    }
  } else { 
    showView(CURRENT); 
  }
  toast('✅ 已更新至最新資料', 'green');
}

// ============================================================
// 用戶關注 (UserFocus)
// ============================================================
const UserFocus = {
  getFavorites() { return STATE.favStores || []; },
  getCurrentViewing() { return STATE._currentViewingStore || null; },
  getFavoriteMachines() { return STATE.favMachines || []; },
  setCurrentViewing(storeId) { STATE._currentViewingStore = storeId; save(); },
  clearCurrentViewing() { STATE._currentViewingStore = null; save(); },
  isInterested(storeId) {
    const favorites = this.getFavorites();
    const current = this.getCurrentViewing();
    return favorites.includes(storeId) || current === storeId;
  }
};

// ============================================================
// Manifest 注入
// ============================================================
function injectManifest() {
  var icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='512' height='512'%3E%3Crect width='512' height='512' rx='96' fill='%23000000'/%3E%3Ctext x='50%25' y='55%25' font-size='260' text-anchor='middle' dominant-baseline='middle'%3E🕹️%3C/text%3E%3C/svg%3E";
  var manifest = { 
    name: "爪爪情報站", 
    short_name: "爪爪情報", 
    description: "香港夾娃娃店實時情報", 
    start_url: ".", 
    display: "standalone", 
    background_color: "#000000", 
    theme_color: "#000000", 
    orientation: "portrait", 
    icons: [
      { src: icon, sizes: "192x192", type: "image/svg+xml", purpose: "any maskable" },
      { src: icon, sizes: "512x512", type: "image/svg+xml", purpose: "any maskable" }
    ] 
  };
  document.getElementById("manifest-placeholder").setAttribute("href", 
    URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: "application/json" }))
  );
}

// ============================================================
// 🚀 啟動應用
// ============================================================
(async function initApp() {
  console.log('🚀 爪爪情報站啟動中...');
  
  // 載入所有數據
  await loadCloud();
  await loadMalls();
  await loadLivePosts();
  await processPendingPosts();
  await processOfflineReports();
  await CheckinManager.syncFromCloud();
  await loadTaskProgressFromCloud();
  
  // 簽到提醒
  setTimeout(() => {
    CheckinManager.checkAndShowReminder();
  }, 2000);
  
  // 定時同步待處理資料 (每5分鐘)
  setInterval(async function() {
    await processPendingPosts();
    await processOfflineReports();
  }, 300000);
  
  // 初始化地圖
  const mapPage = document.getElementById('map-page-container');
  const overlay = document.getElementById('page-overlay');
  if (mapPage) mapPage.style.display = 'flex';
  if (overlay) overlay.style.display = 'none';
  
  setTimeout(() => { initMap(); }, 300);
  setTimeout(() => { updateMapList(); updateRegionProgress(); }, 500);
  setTimeout(initPullToRefresh, 500);
  
  // GPS 定位
  if (navigator.geolocation) {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      console.log('📱 iOS 裝置：定位需要用戶點擊觸發');
      setTimeout(() => {
        toast('📍 請點擊「重新定位」按鈕獲取位置', 'gold');
      }, 1500);
    } else {
      navigator.geolocation.getCurrentPosition(
        function(pos) {
          userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          gpsLat = userLocation.lat;
          gpsLng = userLocation.lng;
          console.log('✅ 自動定位成功:', userLocation);
          if (map && mapInitialized) {
            map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1.2 });
            addUserMarker(userLocation.lat, userLocation.lng);
            updateMapMarkers();
            updateMapList();
            updateRegionProgress();
          }
        },
        function(err) {
          console.log('⚠️ 自動定位失敗:', err.message);
          toast('📍 請點擊「重新定位」按鈕獲取位置', 'gold');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  } else {
    console.log('⚠️ 此裝置不支援 GPS 定位');
  }
  
  // 注入 Manifest
  injectManifest();
  
  console.log('🚀 爪爪情報站啟動完成！');
})();