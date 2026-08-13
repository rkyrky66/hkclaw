// ============================================================
// js/map-functions.js
// 爪爪情報站 - 地圖功能
// ============================================================

// ============================================================
// 全域變數
// ============================================================
var map = null;
var markerCluster = null;
var userMarker = null;
var mapInitialized = false;
var mapFilter = 'all';
var isInitializingMap = false;
var ensureStoresTimeout = null;
var ensureStoresRetryCount = 0;
var MAX_ENSURE_RETRIES = 3;
var userLocation = null;
var gpsLat = null;
var gpsLng = null;

// ============================================================
// 地圖初始化
// ============================================================
function initMap(initialCenter, initialZoom) {
  if (isInitializingMap) return;
  var container = document.getElementById('map-container');
  if (!container) return;
  container.style.display = 'block';
  container.style.width = '100%';
  container.style.height = '100%';
  void container.offsetHeight;
  
  if (mapInitialized && map && map.getContainer()) {
    setTimeout(function() {
      if (map && CURRENT === 'map') {
        map.invalidateSize(true);
        if (userLocation) {
          map.setView([userLocation.lat, userLocation.lng], map.getZoom() || 15);
        }
        updateMapMarkers();
        updateMapList();
        updateRegionProgress();
        ensureStoresVisible();
      }
    }, 200);
    return;
  }
  
  if (map) {
    try { map.remove(); } catch (e) {}
    map = null;
    markerCluster = null;
    userMarker = null;
  }
  
  isInitializingMap = true;
  var center = initialCenter || { lat: HK_CENTER.lat, lng: HK_CENTER.lng };
  var zoom = initialZoom || 13;
  if (userLocation) {
    center = { lat: userLocation.lat, lng: userLocation.lng };
    zoom = 15;
  } else {
    var storesWithCoords = STORES.filter(function(s) { return s.lat && s.lng; });
    if (storesWithCoords.length > 0) {
      var avgLat = storesWithCoords.reduce(function(sum, s) { return sum + parseFloat(s.lat); }, 0) / storesWithCoords.length;
      var avgLng = storesWithCoords.reduce(function(sum, s) { return sum + parseFloat(s.lng); }, 0) / storesWithCoords.length;
      center = { lat: avgLat, lng: avgLng };
      zoom = 12;
    }
  }
  
  try {
    map = L.map('map-container', {
      center: [center.lat, center.lng],
      zoom: zoom,
      zoomControl: false,
      attributionControl: true
    });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
      maxZoom: 19
    }).addTo(map);
    
    // 添加 18 區 Polygon
    addRegionPolygons();
    
    map.on('moveend zoomend', function() {
      if (CURRENT === 'map') {
        updateMapList();
        updateRegionProgress();
        ensureStoresVisible();
      }
    });
    
    markerCluster = L.markerClusterGroup({
      iconCreateFunction: function(cluster) {
        var totalStores = 0;
        cluster.getAllChildMarkers().forEach(function(marker) {
          totalStores += (marker.options && marker.options.totalStores) ? marker.options.totalStores : 1;
        });
        if (totalStores <= 1) {
          return L.divIcon({ html: '', className: '', iconSize: L.point(0, 0) });
        }
        return L.divIcon({
          html: '<div class="marker-cluster-custom">' + totalStores + '</div>',
          className: '',
          iconSize: L.point(36, 36)
        });
      },
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });
    map.addLayer(markerCluster);
    
    if (userLocation) addUserMarker(userLocation.lat, userLocation.lng);
    updateMapMarkers();
    updateMapList();
    updateRegionProgress();
    if (CURRENT === 'map') {
      ensureStoresVisible();
    }
    mapInitialized = true;
    isInitializingMap = false;
    if (CURRENT === 'map') {
      setTimeout(function() {
        if (map) map.invalidateSize();
        updateRegionProgress();
        ensureStoresVisible();
      }, 500);
    }
  } catch (e) {
    toast('地圖載入失敗，請重新整理', 'pink');
    isInitializingMap = false;
  }
}

// ============================================================
// 用戶位置標記
// ============================================================
function addUserMarker(lat, lng) {
  if (!map) return;
  if (userMarker) { map.removeLayer(userMarker);
    userMarker = null; }
  userMarker = L.marker([lat, lng], {
    icon: L.divIcon({ className: 'custom-marker-user', iconSize: [18, 18], iconAnchor: [9, 9] }),
    zIndexOffset: 1000,
    interactive: false
  }).addTo(map);
}
// ============================================================
// 創建個人化店鋪標記 (添加到 map-functions.js)
// ============================================================
function createPersonalizedMarker(store) {
    var levelInfo = getMarkerLevelInfo(store.id);
    var isVerified = store.status === 'verified' || store.verified === 'verified';
    
    var baseColor = isVerified ? '#00CC66' : '#FFB800';
    var borderColor = isVerified ? '#00FF88' : '#FFD700';
    
    var glowStyle = '';
    var iconDisplay = '●';
    var levelClass = '';
    
    if (levelInfo.level === 1) {
        iconDisplay = '⭐';
        levelClass = 'marker-level-1';
    } else if (levelInfo.level === 2) {
        iconDisplay = '✨';
        glowStyle = 'box-shadow:0 0 20px rgba(212,175,55,0.6),0 0 40px rgba(212,175,55,0.3);';
        levelClass = 'marker-level-2';
    } else if (levelInfo.level === 3) {
        iconDisplay = '👑';
        glowStyle = 'box-shadow:0 0 30px rgba(255,215,0,0.5),0 0 60px rgba(255,215,0,0.25);';
        levelClass = 'marker-level-3';
    }
    
    var markerHtml = '<div class="' + levelClass + '" style="position:relative;width:36px;height:44px;background:' + baseColor + ';border:2px solid ' + borderColor + ';border-radius:50% 50% 50% 0;transform:rotate(-45deg);' + glowStyle + 'display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
        '<span style="transform:rotate(45deg);color:#fff;font-weight:900;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,0.5);line-height:1;z-index:2;">' + iconDisplay + '</span>' +
    '</div>';
    
    return L.divIcon({
        className: '',
        html: markerHtml,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -48]
    });
}

// ============================================================
// 獲取標記等級資訊 (添加到 map-functions.js)
// ============================================================
function getMarkerLevelInfo(storeId) {
    var contribution = getUserContribution(storeId);
    var levels = [
        { level: 0, label: '普通標記', icon: '●', color: '#666', requirement: '無貢獻' },
        { level: 1, label: '⭐ 一星標記', icon: '⭐', color: '#D4AF37', requirement: '貢獻值 1-2' },
        { level: 2, label: '✨ 光暈標記', icon: '✨', color: '#D4AF37', requirement: '貢獻值 3-4' },
        { level: 3, label: '👑 皇冠標記', icon: '👑', color: '#FFD700', requirement: '貢獻值 5+' }
    ];
    
    var currentLevel = levels[0];
    for (var i = levels.length - 1; i >= 0; i--) {
        if (contribution >= i) {
            currentLevel = levels[i];
            break;
        }
    }
    
    return {
        level: currentLevel.level,
        label: currentLevel.label,
        icon: currentLevel.icon,
        color: currentLevel.color,
        contribution: contribution,
        nextLevel: levels[currentLevel.level + 1] || null
    };
}

// ============================================================
// 獲取用戶貢獻值 (添加到 map-functions.js)
// ============================================================
function getUserContribution(storeId) {
    var store = STORES.find(function(s) { return s.id === storeId; });
    if (!store) return 0;
    
    var device = STATE.user.device;
    var count = 0;
    
    if (store.submitted_by === device) count += 1;
    if (store._userVerified) count += 1;
    if (store._userSupplemented) count += 1;
    if (store.machines && store.machines.some(function(m) { return m.submitted_by === device; })) {
        count += 1;
    }
    
    return count;
}
// ============================================================
// 更新地圖標記
// ============================================================
function updateMapMarkers() {
  if (!map || !markerCluster) return;
  markerCluster.clearLayers();
  var inBounds = getStoresInBounds();
  var mallGroups = {};
  var standaloneStores = [];
  
  inBounds.forEach(function(s) {
    if (s.mall && s.mall.trim() !== '') {
      var key = s.mall;
      if (!mallGroups[key]) mallGroups[key] = { mallName: key, stores: [], lat: 0, lng: 0, totalStores: 0 };
      mallGroups[key].stores.push(s);
      mallGroups[key].totalStores++;
      mallGroups[key].lat += s.lat;
      mallGroups[key].lng += s.lng;
    } else {
      standaloneStores.push(s);
    }
  });
  
  Object.keys(mallGroups).forEach(function(key) {
    var group = mallGroups[key];
    group.lat = group.lat / group.stores.length;
    group.lng = group.lng / group.stores.length;
    group.stores.sort(function(a, b) { return (a.floor || '999').localeCompare(b.floor || '999', undefined, { numeric: true }); });
  });
  window._mallGroups = mallGroups;
  
  Object.keys(mallGroups).forEach(function(key) {
    var group = mallGroups[key];
    var count = group.totalStores;
    var isAllVerified = group.stores.every(function(s) { return s.verified === "verified"; });
    var bgColor = isAllVerified ? '#00CC66' : '#FFB800';
    var borderColor = isAllVerified ? '#00FF88' : '#FFD700';
    var textColor = isAllVerified ? '#fff' : '#1a1a1a';
    var marker = L.marker([group.lat, group.lng], {
      icon: L.divIcon({
        className: '',
        html: '<div style="position:relative;width:36px;height:44px;background:' + bgColor + ';border:2px solid ' + borderColor + ';border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 4px 12px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;">\n              <span style="transform:rotate(45deg);color:' + textColor + ';font-weight:900;font-size:13px;text-shadow:0 1px 4px rgba(0,0,0,0.3);line-height:1;z-index:2;">' + count + '</span>\n            </div>',
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -48]
      }),
      isMall: true,
      mallName: key,
      totalStores: count
    });
    var statusText = isAllVerified ? '✅ 已認證' : '⏳ 審核中';
    marker.bindPopup('\n          <div>\n            <div style="display:flex;align-items:center;gap:6px;">\n              <span style="color:#D4AF37;font-weight:700;font-size:14px;">🏬 ' + key + '</span>\n              <span style="font-size:10px;color:' + (isAllVerified ? '#00FF00' : '#FFB800') + ';">' + statusText + '</span>\n            </div>\n            <div style="color:#aaa;font-size:11px;margin-top:2px;">' + count + ' 間店鋪</div>\n            <button onclick="openMallModal(\'' + key.replace(/'/g, "\\'") + '\')" \n              style="background:#D4AF37;color:#000;font-weight:700;border:none;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;width:100%;margin-top:6px;">\n              📋 查看全部 ' + count + ' 間店鋪\n            </button>\n          </div>\n        ', { maxWidth: 260, minWidth: 200, className: 'custom-popup' });
    markerCluster.addLayer(marker);
  });
  
  standaloneStores.forEach(function(s) {
    var icon = createPersonalizedMarker(s);
    var marker = L.marker([s.lat, s.lng], {
      icon: icon,
      isMall: false,
      storeId: s.id
    });
    var isVerified = s.verified === "verified";
    var statusBadge = isVerified ? '<span class="status-badge verified">✅ 已認證</span>' : '<span class="status-badge pending">⏳ 審核中</span>';
    marker.bindPopup('\n          <div>\n            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">\n              <span style="color:#D4AF37;font-weight:700;font-size:14px;">' + s.name + '</span>\n              ' + statusBadge + '\n            </div>\n            <div style="color:#aaa;font-size:11px;margin-top:2px;">' + s.addr + '</div>\n            <button onclick="openStoreFromMap(\'' + s.id + '\')" style="background:#D4AF37;color:#000;font-weight:700;border:none;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;width:100%;margin-top:6px;">📍 查看詳情</button>\n          </div>\n        ', { maxWidth: 260, minWidth: 200, className: 'custom-popup' });
    markerCluster.addLayer(marker);
  });
  updateMapList();
}

// ============================================================
// 獲取當前地圖視圖內的店鋪
// ============================================================
function getStoresInBounds() {
  if (!map) return STORES.filter(function(s) { return s.lat && s.lng; });
  var bounds = map.getBounds();
  if (!bounds) return STORES.filter(function(s) { return s.lat && s.lng; });
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  return STORES.filter(function(s) {
    if (!s.lat || !s.lng) return false;
    return s.lat >= sw.lat && s.lat <= ne.lat && s.lng >= sw.lng && s.lng <= ne.lng;
  });
}

// ============================================================
// 更新地圖列表
// ============================================================
function updateMapList() {
  var listContainer = document.getElementById('map-store-list');
  if (!listContainer) return;
  listContainer.innerHTML = renderMapStoreList();
}

function renderMapStoreList() {
  var inBounds = getStoresInBounds();
  var filtered = inBounds;
  if (mapFilter === 'pending') {
    filtered = filtered.filter(function(s) { return s.verified !== 'verified'; });
  } else if (mapFilter === 'incomplete') {
    filtered = filtered.filter(function(s) {
      var hasAddress = s.address_detail && s.address_detail !== '';
      var hasSize = s.size && s.size !== '中';
      var hasStaff = s.has_staff !== undefined && s.has_staff !== null;
      var hasCoin = s.has_e_coin !== undefined && s.has_e_coin !== null;
      return !(hasAddress && hasSize && hasStaff && hasCoin);
    });
  }
  return renderMapStoreListWithData(filtered);
}

function renderMapStoreListWithData(inBounds) {
  if (!inBounds.length) {
    return '<p class="py-6 text-center text-sm text-white/40">' + (getFilteredStoresCount() > 0 ? '此區域暫無符合條件的店鋪' : '暫無店鋪資料') + '</p>';
  }
  
  var mallGroups = {};
  var standaloneStores = [];
  inBounds.forEach(function(s) {
    if (s.mall && s.mall.trim() !== '') {
      var key = s.mall;
      if (!mallGroups[key]) mallGroups[key] = { mallName: key, stores: [], totalStores: 0 };
      mallGroups[key].stores.push(s);
      mallGroups[key].totalStores++;
    } else {
      standaloneStores.push(s);
    }
  });
  
  var formatDist = function(s) {
    var dist = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng) : 9999;
    if (dist === 9999) return '📍 位置未知';
    if (dist < 1) return Math.round(dist * 1000) + "m";
    return dist.toFixed(1) + "km";
  };
  
  var renderStoreItem = function(s, index) {
    var isVerified = s.status === "verified" || s.verified === "verified";
    var dotColor = isVerified ? 'text-neongreen' : 'text-yellow-400';
    var statusLabel = isVerified ? '已認證' : '審核中';
    var distText = formatDist(s);
    
    return '<button onclick="openStoreFromMap(\'' + s.id + '\')" class="w-full rounded-xl border border-gold/20 bg-zinc-950/80 p-2.5 text-left transition-all hover:border-gold/50 active:scale-[0.98]">\n          <div class="flex items-center justify-between gap-2">\n            <div class="flex-1 min-w-0">\n              <div class="flex items-center gap-2">\n                <span class="text-gold font-bold text-sm min-w-[20px]">#' + (index + 1) + '</span>\n                <span class="' + dotColor + ' flex-shrink-0">●</span>\n                <span class="font-bold text-gold text-sm truncate">' + s.name + '</span>\n                <span class="text-[9px] text-white/30 whitespace-nowrap">' + statusLabel + '</span>\n              </div>\n              <p class="text-[11px] text-white/40 truncate pl-[20px]">' + s.region + ' · ' + s.addr + '</p>\n            </div>\n            <span class="text-xs text-neonpink whitespace-nowrap">📍 ' + distText + '</span>\n          </div>\n        </button>';
  };
  
  var renderMallGroup = function(group) {
    var isAllVerified = group.stores.every(function(s) { 
        return s.status === "verified" || s.verified === "verified"; 
    });
    var dotColor = isAllVerified ? 'text-neongreen' : 'text-yellow-400';
    var statusLabel = isAllVerified ? '全部已認證' : '部分審核中';
    var distText = formatDist(group.stores[0]);
    return '<button onclick="openMallModal(\'' + group.mallName.replace(/'/g, "\\'") + '\')" class="w-full rounded-xl border border-gold/30 bg-gold/5 p-2.5 text-left transition-all hover:border-gold/60 active:scale-[0.98]">\n          <div class="flex items-center justify-between gap-2">\n            <div class="flex-1 min-w-0">\n              <div class="flex items-center gap-2">\n                <span class="text-gold font-bold text-sm">🏬</span>\n                <span class="font-bold text-gold text-sm truncate">' + group.mallName + '</span>\n                <span class="text-[9px] text-white/30">' + group.totalStores + ' 間</span>\n                <span class="text-[9px] ' + dotColor + '">' + statusLabel + '</span>\n              </div>\n              <p class="text-[11px] text-white/40 truncate">' + (group.stores[0]?.region || '') + ' · 點擊查看全部店鋪</p>\n            </div>\n            <span class="text-xs text-neonpink whitespace-nowrap">📍 ' + distText + '</span>\n          </div>\n        </button>';
  };
  
  var mallList = Object.keys(mallGroups).map(function(key) { return mallGroups[key]; });
  mallList.sort(function(a, b) {
    var distA = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, a.stores[0].lat, a.stores[0].lng) : 9999;
    var distB = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, b.stores[0].lat, b.stores[0].lng) : 9999;
    return distA - distB;
  });
  standaloneStores.sort(function(a, b) {
    var distA = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) : 9999;
    var distB = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng) : 9999;
    return distA - distB;
  });
  
  var itemIndex = 0;
  var htmlParts = [];
  mallList.forEach(function(group) { htmlParts.push(renderMallGroup(group)); });
  standaloneStores.forEach(function(s) {
    htmlParts.push(renderStoreItem(s, itemIndex));
    itemIndex++;
  });
  
  var totalStores = inBounds.length;
  var totalMalls = Object.keys(mallGroups).length;
  var totalStandalone = standaloneStores.length;
  var headerHtml = '<div class="text-[10px] text-white/30 text-center py-1">' + totalMalls + ' 個商場合併 · ' + totalStandalone + ' 間獨立舖 · 共 ' + totalStores + ' 間店鋪</div>';
  return headerHtml + htmlParts.join('');
}

// ============================================================
// 濾鏡功能
// ============================================================
function getFilteredStoresCount() {
  return getFilteredStores().length;
}

function getFilteredStores() {
  var stores = STORES;
  if (mapFilter === 'pending') {
    stores = stores.filter(function(s) { return s.verified !== 'verified'; });
  } else if (mapFilter === 'incomplete') {
    stores = stores.filter(function(s) {
      var hasAddress = s.address_detail && s.address_detail !== '';
      var hasSize = s.size && s.size !== '中';
      var hasStaff = s.has_staff !== undefined && s.has_staff !== null;
      var hasCoin = s.has_e_coin !== undefined && s.has_e_coin !== null;
      return !(hasAddress && hasSize && hasStaff && hasCoin);
    });
  }
  return stores;
}

function setMapFilter(filter) {
  mapFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.classList.remove('border-gold', 'bg-gold/20', 'text-gold', 'active');
    btn.classList.add('border-white/20', 'text-white/40');
  });
  var activeBtn = document.getElementById("filter-" + filter);
  if (activeBtn) {
    activeBtn.classList.remove('border-white/20', 'text-white/40');
    activeBtn.classList.add('border-gold', 'bg-gold/20', 'text-gold', 'active');
  }
  updateMapList();
  updateMapMarkers();
  updateFilterCount();
}

function updateFilterCount() {
  var count = getFilteredStoresCount();
  var el = document.getElementById('filter-count-number');
  if (el) el.textContent = count;
}

// ============================================================
// 確保店鋪可見
// ============================================================
function ensureStoresVisible() {
  if (CURRENT !== 'map') return;
  if (!map) return;
  if (ensureStoresTimeout) {
    clearTimeout(ensureStoresTimeout);
    ensureStoresTimeout = null;
  }
  if (ensureStoresRetryCount > MAX_ENSURE_RETRIES) {
    ensureStoresRetryCount = 0;
    return;
  }
  var allStores = STORES.filter(function(s) { return s.lat && s.lng; });
  if (allStores.length === 0) return;
  if (!map.getContainer()) {
    ensureStoresTimeout = setTimeout(ensureStoresVisible, 500);
    return;
  }
  try {
    var bounds = map.getBounds();
    if (!bounds) return;
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    var latRange = ne.lat - sw.lat;
    var lngRange = ne.lng - sw.lng;
    if (latRange < 0.0001 || lngRange < 0.0001) {
      ensureStoresRetryCount++;
      if (allStores.length > 0 && CURRENT === 'map') {
        var avgLat = allStores.reduce(function(sum, s) { return sum + parseFloat(s.lat); }, 0) / allStores.length;
        var avgLng = allStores.reduce(function(sum, s) { return sum + parseFloat(s.lng); }, 0) / allStores.length;
        map.setView([avgLat, avgLng], 12);
      }
      ensureStoresTimeout = setTimeout(ensureStoresVisible, 500);
      return;
    }
    ensureStoresRetryCount = 0;
    var visibleStores = allStores.filter(function(s) {
      return s.lat >= sw.lat && s.lat <= ne.lat && s.lng >= sw.lng && s.lng <= ne.lng;
    });
    var currentZoom = Math.round(map.getZoom());
    if (visibleStores.length === 0 && currentZoom <= 11 && CURRENT === 'map') {
      var avgLat_1 = allStores.reduce(function(sum, s) { return sum + parseFloat(s.lat); }, 0) / allStores.length;
      var avgLng_1 = allStores.reduce(function(sum, s) { return sum + parseFloat(s.lng); }, 0) / allStores.length;
      map.setView([avgLat_1, avgLng_1], 12);
      setTimeout(function() {
        if (CURRENT === 'map') {
          updateMapMarkers();
          updateMapList();
          updateRegionProgress();
        }
      }, 300);
    }
    if (visibleStores.length > 0 && CURRENT === 'map') {
      updateMapMarkers();
      updateMapList();
      updateRegionProgress();
    }
  } catch (e) {
    ensureStoresRetryCount++;
    if (ensureStoresRetryCount <= MAX_ENSURE_RETRIES) {
      ensureStoresTimeout = setTimeout(ensureStoresVisible, 1000);
    }
  }
}

// ============================================================
// 計算距離
// ============================================================
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = (lat2 - lat1) * Math.PI / 180;
  var dLon = (lon2 - lon1) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}