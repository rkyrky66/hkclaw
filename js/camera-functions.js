// ============================================================
// js/camera-functions.js
// 爪爪情報站 - 相機功能
// ============================================================

// ============================================================
// 全域變數
// ============================================================
window._cam = {};
window._camPreview = {};
window._camStreams = {};

// ============================================================
// 開啟相機
// ============================================================
function openCamera(key) {
  var container = document.getElementById(key + "-camera-container");
  if (!container) return;
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
      isGpsReady = true;
      if (document.getElementById('nt-gps')) {
        var el = document.getElementById('nt-gps');
        el.textContent = '📍 定位成功：' + gpsLat.toFixed(2) + ', ' + gpsLng.toFixed(2);
        el.className = 'text-neongreen text-xs';
      }
      if (document.getElementById('vf-gps')) {
        var el = document.getElementById('vf-gps');
        el.textContent = '📍 定位成功：' + gpsLat.toFixed(2) + ', ' + gpsLng.toFixed(2);
        el.className = 'text-neongreen text-xs';
        _vfGpsReady = true;
        _vfGpsLat = gpsLat;
        _vfGpsLng = gpsLng;
      }
      updateFormState();
    }, function() { console.log('⚠️ 拍照時定位失敗，使用上次位置'); }, { enableHighAccuracy: true, timeout: 5000 });
  }
  
  if (window._camPreview && window._camPreview[key]) {
    container.innerHTML = '<div class="relative"><img src="' + window._camPreview[key] + '" class="w-full rounded-lg" alt="店鋪照片" /><div class="mt-2 flex gap-2"><button onclick="reopenCamera(\'' + key + '\')" class="flex-1 rounded-lg border border-gold/40 py-2 text-sm text-gold hover:bg-gold/10 transition-all">🔄 重新拍攝</button><button onclick="clearPhoto(\'' + key + '\')" class="flex-1 rounded-lg border border-white/20 py-2 text-sm text-white/40 hover:bg-white/5 transition-all">✕ 移除</button></div></div>';
    return;
  }
  
  container.innerHTML = '<video id="' + key + '-video" autoplay playsinline class="w-full rounded-lg bg-black" style="max-height:300px;"></video><div class="mt-2 flex gap-2"><button onclick="capturePhoto(\'' + key + '\')" class="flex-1 rounded-lg bg-neongreen py-2.5 text-sm font-black text-black">📸 拍照</button><button onclick="closeCamera(\'' + key + '\')" class="flex-1 rounded-lg border border-white/30 py-2.5 text-xs text-white/60">取消</button></div>';
  
  var videoEl = document.getElementById(key + "-video");
  if (!videoEl) return;
  
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(function(stream) { videoEl.srcObject = stream; videoEl.play(); window._camStreams[key] = stream; })
    .catch(function(err) { handleCameraError(err, key); });
}

// ============================================================
// 處理相機錯誤
// ============================================================
function handleCameraError(err, key) {
  var container = document.getElementById(key + "-camera-container");
  if (!container) return;
  var errorTitle = '❌ 無法開啟相機', errorMsg = '', guideSteps = [];
  
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    errorTitle = '📱 相機權限被拒絕';
    errorMsg = '為了確保店鋪情報的真實性，需要拍攝現場照片。';
    guideSteps = ['1️⃣ 開啟手機「設定」應用程式', '2️⃣ 點選「隱私權」或「應用程式管理」', '3️⃣ 點選「相機」', '4️⃣ 找到「Chrome」或「Safari」等瀏覽器', '5️⃣ 將相機權限改為「允許」', '6️⃣ 返回此頁面，點擊下方「重新嘗試」'];
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    errorTitle = '📷 找不到相機裝置';
    errorMsg = '請確認你的裝置有後置鏡頭，且未被其他應用程式佔用。';
    guideSteps = ['1️⃣ 確認手機有後置鏡頭', '2️⃣ 關閉其他使用相機的 App（如 Instagram、WhatsApp）', '3️⃣ 重新啟動手機後再試', '4️⃣ 如果仍無法使用，可嘗試使用其他瀏覽器'];
  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    errorTitle = '🔒 相機被其他 App 佔用';
    errorMsg = '相機可能正在被其他應用程式使用。';
    guideSteps = ['1️⃣ 關閉所有使用相機的應用程式', '2️⃣ 重新啟動瀏覽器', '3️⃣ 再次點擊「開啟相機拍照」'];
  } else {
    errorTitle = '⚠️ 相機開啟失敗';
    errorMsg = '發生未知錯誤，請嘗試以下步驟：';
    guideSteps = ['1️⃣ 重新整理頁面（按 F5 或下拉重整）', '2️⃣ 重新啟動手機', '3️⃣ 嘗試使用其他瀏覽器（Chrome 或 Safari）', '4️⃣ 如果持續失敗，可先提交其他情報'];
  }
  
  container.innerHTML = '<div class="rounded-xl border border-neonpink/50 bg-neonpink/5 p-4 text-left"><div class="flex items-start gap-2"><span class="text-2xl">' + errorTitle.split(' ')[0] + '</span><div class="flex-1"><p class="font-bold text-neonpink">' + errorTitle + '</p><p class="text-xs text-white/60 mt-1">' + errorMsg + '</p></div></div><div class="mt-3 rounded-lg bg-black/40 p-3"><p class="text-[10px] font-bold text-gold/70 mb-1">📋 解決步驟：</p>' + guideSteps.map(function(step) { return '<p class="text-[10px] text-white/50 leading-relaxed">' + step + '</p>'; }).join('') + '</div><div class="mt-3 flex gap-2"><button onclick="openCamera(\'' + key + '\')" class="flex-1 rounded-lg bg-neongreen/80 py-2 text-sm font-black text-black">🔄 重新嘗試</button><button onclick="closeCamera(\'' + key + '\')" class="flex-1 rounded-lg border border-white/20 py-2 text-xs text-white/50">暫時跳過</button></div><p class="text-[8px] text-white/30 mt-2 text-center">💡 提示：拍照是為了確保情報真實性，建立社群信任</p></div>';
}

// ============================================================
// 關閉相機
// ============================================================
function closeCamera(key) {
  var stream = window._camStreams?.[key];
  if (stream) { stream.getTracks().forEach(function(t) { return t.stop(); }); delete window._camStreams[key]; }
  var container = document.getElementById(key + "-camera-container");
  if (container) container.innerHTML = '<button onclick="openCamera(\'' + key + '\')" class="w-full rounded-lg bg-neongreen/90 py-2.5 text-sm font-black text-black">📸 開啟相機拍照</button>';
}

// ============================================================
// 拍照
// ============================================================
async function capturePhoto(key) {
  var videoEl = document.getElementById(key + "-video");
  if (!videoEl) return toast('請先開啟相機', 'pink');
  var canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 800;
  canvas.height = videoEl.videoHeight || 600;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  var dataUrl = canvas.toDataURL('image/jpeg', 0.8);
  var img = document.getElementById(key + "-preview");
  if (img) { img.src = dataUrl; img.classList.remove('hidden'); img.style.display = 'block'; }
  var blob = await new Promise(function(resolve) { return canvas.toBlob(resolve, 'image/jpeg', 0.8); });
  window._cam[key] = blob;
  window._camPreview[key] = dataUrl;
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
      isGpsReady = true;
      if (document.getElementById('nt-gps')) {
        var el = document.getElementById('nt-gps');
        el.textContent = '📍 定位成功：' + gpsLat.toFixed(2) + ', ' + gpsLng.toFixed(2);
        el.className = 'text-neongreen text-xs';
      }
      if (document.getElementById('vf-gps')) {
        var el = document.getElementById('vf-gps');
        el.textContent = '📍 定位成功：' + gpsLat.toFixed(2) + ', ' + gpsLng.toFixed(2);
        el.className = 'text-neongreen text-xs';
        _vfGpsReady = true;
        _vfGpsLat = gpsLat;
        _vfGpsLng = gpsLng;
      }
      updateFormState();
    }, function() { console.log('⚠️ 拍照完成時定位失敗，使用上次位置'); }, { enableHighAccuracy: true, timeout: 3000 });
  }
  
  closeCamera(key);
  var container = document.getElementById(key + "-camera-container");
  if (container) {
    container.innerHTML = '<div class="relative"><img src="' + dataUrl + '" class="w-full rounded-lg" alt="店鋪照片" /><div class="mt-2 flex gap-2"><button onclick="reopenCamera(\'' + key + '\')" class="flex-1 rounded-lg border border-gold/40 py-2 text-sm text-gold hover:bg-gold/10 transition-all">🔄 重新拍攝</button><button onclick="clearPhoto(\'' + key + '\')" class="flex-1 rounded-lg border border-white/20 py-2 text-sm text-white/40 hover:bg-white/5 transition-all">✕ 移除</button></div></div>';
  }
  
  if (typeof checkPostForm === 'function') {
    var prefix = key === 'lp' ? 'lp' : key === 'lo' ? 'lo' : null;
    if (prefix) checkPostForm(prefix);
  }
  toast('✅ 已拍照！', 'green');
}

// ============================================================
// 重新拍照 / 清除照片
// ============================================================
function reopenCamera(key) { window._cam[key] = null; window._camPreview[key] = null; openCamera(key); }

function clearPhoto(key) {
  window._cam[key] = null;
  window._camPreview[key] = null;
  var container = document.getElementById(key + "-camera-container");
  if (container) container.innerHTML = '<button onclick="openCamera(\'' + key + '\')" class="w-full rounded-lg bg-neongreen/90 py-2.5 text-sm font-black text-black">📸 開啟相機拍照</button>';
  var img = document.getElementById(key + "-preview");
  if (img) { img.classList.add('hidden'); img.style.display = 'none'; }
  toast('已移除照片', 'pink');
}