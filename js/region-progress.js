// ============================================================
// js/region-progress.js
// 爪爪情報站 - 區域探索進度與 18 區多邊形
// ============================================================

// ============================================================
// 區域定義 (三大區)
// ============================================================
var REGION_KEYS = {
    hk: { label: '港島區', icon: '🏝️', districts: ['銅鑼灣', '天后', '北角', '中環', '金鐘', '上環', '灣仔', '鰂魚涌', '太古', '筲箕灣', '香港仔', '杏花邨', '黃竹坑'] },
    kl: { label: '九龍區', icon: '🏙️', districts: ['旺角', '尖沙咀', '觀塘', '深水埗', '紅磡', '藍田', '油麻地', '九龍城', '土瓜灣', '黃大仙', '牛頭角', '九龍灣', '秀茂坪', '油塘', '樂富', '啟德', '黃埔', '慈雲山', '大角咀', '荔枝角'] },
    nt: { label: '新界區', icon: '🌳', districts: ['屯門', '荃灣', '元朗', '葵芳', '將軍澳', '大埔', '葵興', '天水圍', '沙田', '大圍', '馬鞍山', '上水', '粉嶺', '青衣', '東涌', '昂坪', '坑口', '調景嶺', '日出康城', '西貢'] }
};

// ============================================================
// Polygon 顏色配置 (三大區)
// ============================================================
var REGION_POLYGON_COLORS = {
    hk: { fill: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)' },   // 藍色
    kl: { fill: 'rgba(239, 68, 68, 0.10)', border: 'rgba(239, 68, 68, 0.30)' },     // 紅色
    nt: { fill: 'rgba(34, 197, 94, 0.10)', border: 'rgba(34, 197, 94, 0.30)' }      // 綠色
};

// ============================================================
// 儲存 Polygon 引用
// ============================================================
window._regionPolygons = [];

// ============================================================
// 計算區域探索進度
// ============================================================
function calculateRegionProgress(regionKey) {
    var region = REGION_KEYS[regionKey];
    if (!region) return { total: 0, verified: 0, percentage: 0, isComplete: false };
    
    var districts = region.districts;
    var totalStores = STORES.filter(function(s) {
        return districts.indexOf(s.region) !== -1;
    });
    var verifiedStores = totalStores.filter(function(s) {
        return s.status === 'verified' || s.verified === 'verified';
    });
    
    return {
        total: totalStores.length,
        verified: verifiedStores.length,
        percentage: totalStores.length > 0 ? Math.round((verifiedStores.length / totalStores.length) * 100) : 0,
        isComplete: totalStores.length > 0 && verifiedStores.length >= totalStores.length
    };
}

// ============================================================
// 渲染區域探索進度 HTML (地圖左上角)
// ============================================================
function renderRegionProgress() {
    var html = '<div id="region-progress-container">' +
        '<div class="title">🌍 區域探索進度</div>';
    
    for (var key in REGION_KEYS) {
        var region = REGION_KEYS[key];
        var progress = calculateRegionProgress(key);
        var isComplete = progress.isComplete && progress.total > 0;
        var fillClass = isComplete ? 'done' : (progress.percentage > 0 ? 'partial' : '');
        var countClass = isComplete ? 'done' : '';
        
        html += '<div class="region-item">' +
            '<div class="region-row">' +
                '<span class="label">' + region.icon + ' ' + region.label + '</span>' +
                '<span class="count ' + countClass + '">' + progress.verified + '/' + progress.total + '</span>' +
            '</div>' +
            '<div class="region-bar">' +
                '<div class="fill ' + fillClass + '" style="width:' + progress.percentage + '%;"></div>' +
            '</div>' +
        '</div>';
    }
    
    html += '<div class="hint">💡 協助認證店鋪，推進區域進度！</div>';
    html += '</div>';
    
    return html;
}

// ============================================================
// 更新區域探索進度 (在地圖上)
// ============================================================
function updateRegionProgress() {
    var container = document.getElementById('region-progress-container');
    if (!container) {
        var wrapper = document.getElementById('map-wrapper');
        if (wrapper) {
            var newContainer = document.createElement('div');
            newContainer.id = 'region-progress-container';
            newContainer.innerHTML = renderRegionProgress();
            wrapper.appendChild(newContainer);
        }
        return;
    }
    container.innerHTML = renderRegionProgress();
}

// ============================================================
// 添加 18 區 Polygon 到地圖
// ============================================================
function addRegionPolygons() {
    // 清除舊的 polygon
    if (window._regionPolygons.length > 0) {
        window._regionPolygons.forEach(function(p) {
            if (map) map.removeLayer(p);
        });
        window._regionPolygons = [];
    }
    
    if (!map) return;
    if (!HK_DISTRICTS_GEOJSON) {
        console.warn('⚠️ HK_DISTRICTS_GEOJSON 未載入，請確認 data/hong-kong-districts.js 已加載');
        return;
    }
    
    // 獲取所有 features
    var features = HK_DISTRICTS_GEOJSON.features || [];
    
    features.forEach(function(feature) {
        var props = feature.properties || {};
        var districtCode = props['地區號碼'] || '';
        var districtName = props['地區'] || districtCode || '未知區域';
        
        // 判斷屬於哪個大區
        var regionKey = getRegionKeyByDistrict(districtName);
        var colors = REGION_POLYGON_COLORS[regionKey] || REGION_POLYGON_COLORS.kl;
        
        // 創建 polygon
        var polygon = L.geoJSON(feature, {
            style: {
                color: colors.border,
                weight: 1.5,
                opacity: 0.7,
                fillColor: colors.fill,
                fillOpacity: 1,
                interactive: false,
                smoothFactor: 1,
                className: 'region-polygon'
            }
        }).addTo(map);
        
        window._regionPolygons.push(polygon);
        
        // 計算中心點並添加標籤
        var center = getFeatureCenter(feature);
        if (center) {
            var label = L.divIcon({
                className: 'region-label',
                html: '<div style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.45);text-shadow:0 0 12px rgba(0,0,0,0.9),0 0 24px rgba(0,0,0,0.8);letter-spacing:1px;pointer-events:none;">' + districtName + '</div>',
                iconSize: [60, 20],
                iconAnchor: [30, 10]
            });
            var labelMarker = L.marker([center.lat, center.lng], {
                icon: label,
                interactive: false,
                keyboard: false
            }).addTo(map);
            window._regionPolygons.push(labelMarker);
        }
    });
    
    console.log('✅ 已添加 ' + features.length + ' 個區域多邊形');
}

// ============================================================
// 根據區域名稱獲取大區 Key
// ============================================================
function getRegionKeyByDistrict(districtName) {
    var mapping = {
        '中西區': 'hk', '灣仔': 'hk', '東區': 'hk', '南區': 'hk',
        '油尖旺': 'kl', '深水埗': 'kl', '九龍城': 'kl', '黃大仙': 'kl', '觀塘': 'kl',
        '荃灣': 'nt', '屯門': 'nt', '元朗': 'nt', '北區': 'nt', '大埔': 'nt',
        '西貢': 'nt', '沙田': 'nt', '葵青': 'nt', '離島': 'nt'
    };
    return mapping[districtName] || 'kl';
}

// ============================================================
// 計算 Feature 中心點
// ============================================================
function getFeatureCenter(feature) {
    var coords = feature.geometry?.coordinates;
    if (!coords || coords.length === 0) return null;
    
    // 處理 Polygon 類型
    var points = coords[0] || coords;
    if (!points || points.length === 0) return null;
    
    var latSum = 0, lngSum = 0, count = 0;
    for (var i = 0; i < points.length; i++) {
        var pt = points[i];
        if (Array.isArray(pt) && pt.length >= 2) {
            latSum += pt[1];
            lngSum += pt[0];
            count++;
        }
    }
    
    if (count === 0) return null;
    return { lat: latSum / count, lng: lngSum / count };
}