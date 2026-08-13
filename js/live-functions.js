// ============================================================
// js/live-functions.js
// 爪爪情報站 - 實時貼文功能
// ============================================================

// ============================================================
// 全域變數
// ============================================================
var liveTrack = "player";
var _loLinkPlan = null;

// ============================================================
// 載入貼文
// ============================================================
async function loadLivePosts() {
  if (!CLOUD_ON) {
    return STATE.livePosts || [];
  }
  
  try {
    const now = Date.now();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/live_posts?select=*&expire=gt.${now}&order=ts.desc&limit=100`,
      {
        headers: getSupabaseHeaders()
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const posts = await response.json();
    
    STATE.livePosts = posts;
    save();
    return posts;
  } catch (e) {
    console.warn('⚠️ 載入雲端貼文失敗，使用本地快取:', e.message);
    return STATE.livePosts || [];
  }
}

async function syncLivePost(post) {
  if (!CLOUD_ON) return false;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/live_posts`, {
      method: 'POST',
      headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
      body: JSON.stringify([{
        id: post.id,
        track: post.track,
        store_id: post.store_id,
        store_name: post.store_name || '',
        content: post.content || '',
        photo: post.photo || '',
        author: post.author || STATE.user.name,
        author_device: STATE.user.device,
        author_user_id: STATE.user.user_id || null,
        ts: post.ts,
        expire: post.expire,
        likes: post.likes || [],
        is_linked: post.is_linked || false,
        link_days: post.link_days || 0
      }])
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log('✅ 貼文已同步到雲端:', post.id);
    return true;
  } catch (e) {
    console.warn('⚠️ 貼文雲端同步失敗:', e.message);
    if (!STATE._pendingPosts) STATE._pendingPosts = [];
    STATE._pendingPosts.push(post);
    save();
    return false;
  }
}

async function syncLikeToCloud(postId, likes) {
  if (!CLOUD_ON) return false;
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/live_posts?id=eq.${postId}`,
      {
        method: 'PATCH',
        headers: getSupabaseHeaders({ 'Prefer': 'return=minimal' }),
        body: JSON.stringify({ 
          likes: likes,
          updated_at: new Date().toISOString()
        })
      }
    );
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    console.log('✅ 按讚已同步到雲端:', postId);
    return true;
  } catch (e) {
    console.warn('⚠️ 按讚雲端同步失敗:', e.message);
    return false;
  }
}

async function processPendingPosts() {
  if (!CLOUD_ON || !STATE._pendingPosts || STATE._pendingPosts.length === 0) return;
  
  const pending = STATE._pendingPosts.slice();
  let syncedCount = 0;
  
  for (const post of pending) {
    const success = await syncLivePost(post);
    if (success) {
      syncedCount++;
      STATE._pendingPosts = STATE._pendingPosts.filter(p => p.id !== post.id);
    }
  }
  
  if (syncedCount > 0) {
    save();
    console.log(`✅ 已同步 ${syncedCount} 篇待同步貼文`);
  }
}

// ============================================================
// 實時頁面
// ============================================================
function viewLive() {
  var allPosts = STATE.livePosts || [];
  var validPosts = allPosts.filter(function(p) { return p.expire > now(); });
  
  if (CLOUD_ON && allPosts.length < 5) {
    setTimeout(function() {
      loadLivePosts().then(function() {
        if (CURRENT === 'live') {
          var overlay = document.getElementById('page-overlay');
          if (overlay) {
            overlay.innerHTML = viewLive();
            overlay.scrollTop = 0;
            overlay.classList.add("view-enter");
          }
        }
      });
    }, 100);
  }
  
  var html = '';
  var filteredPosts = validPosts.filter(function(x) { return x.track === liveTrack; });
  
  html += '<div class="flex gap-2">';
  html += '<button onclick="setLiveTrack(\'player\')" class="flex-1 rounded-xl border py-2 text-sm font-black ' + (liveTrack === "player" ? "border-neongreen text-neongreen glow-green" : "border-white/20 text-white/45") + '">🎯 夾客</button>';
  html += '<button onclick="setLiveTrack(\'owner\')" class="flex-1 rounded-xl border py-2 text-sm font-black ' + (liveTrack === "owner" ? "border-neonpink text-neonpink glow-pink" : "border-white/20 text-white/45") + '">🏬 台主</button>';
  html += '</div>';
  
  html += '<div class="mt-3 rounded-xl border ' + (liveTrack === "player" ? "border-neongreen/30" : "border-neonpink/30") + ' bg-zinc-950 p-3 text-[11px] text-white/60">';
  html += (liveTrack === "player" ? "🎯 分享你的夾娃娃戰果！拍照上傳，讓大家羨慕一下！+5 分" : "🏬 台主專屬宣傳區！上傳海報/活動照，吸引更多夾客！+5 分");
  html += '</div>';
  
  html += '<button onclick="' + (liveTrack === "player" ? "openPlayerPost()" : "openOwnerPost()") + '" class="mt-3 w-full rounded-2xl py-3 font-black ' + (liveTrack === "player" ? "bg-neongreen text-black glow-green" : "bg-neonpink text-black glow-pink") + '">';
  html += (liveTrack === "player" ? "🎯 發布出貨戰報" : "🏬 發布台主宣傳");
  html += '</button>';
  
  html += '<div class="mt-4 space-y-3">';
  
  if (filteredPosts.length > 0) {
    html += filteredPosts.map(function(p) {
      var hasLiked = p.likes && p.likes.includes(STATE.user.device);
      var isOwner = p.author_device === STATE.user.device;
      var storeName = p.store_name ? '📍 ' + p.store_name : '';
      var daysLeft = Math.ceil((p.expire - now()) / DAY);
      
      return '<div class="rounded-2xl border border-' + (p.track === "player" ? 'neongreen' : 'neonpink') + '/30 bg-zinc-950 p-3">' +
        (p.photo ? '<img src="' + p.photo + '" class="h-48 w-full rounded-lg object-cover" alt="貼文照片" />' : '<div class="flex h-28 items-center justify-center rounded-lg bg-black/50 text-4xl">' + (p.track === "player" ? "🎉" : "🖼️") + '</div>') +
        '<div class="mt-2 flex items-start justify-between">' +
          '<div>' +
            '<p class="text-sm text-white/80">' + (p.content || p.prize || '無內容') + '</p>' +
            (storeName ? '<p class="text-xs text-gold/60 mt-1">' + storeName + '</p>' : '') +
            (p.is_linked ? '<span class="text-[9px] text-neongreen">🔗 已連結機台 (' + daysLeft + '天)</span>' : '') +
            (isOwner ? '<span class="text-[9px] text-neonpink ml-1">👑 我的貼文</span>' : '') +
          '</div>' +
          '<span class="text-[10px] text-white/30 whitespace-nowrap ml-2">' + timeAgo(p.ts) + '</span>' +
        '</div>' +
        '<div class="mt-1 flex items-center gap-3 text-[10px] text-white/30">' +
          '<span>👤 ' + (p.author || '匿名') + '</span>' +
          '<button onclick="toggleLike(\'' + p.id + '\')" class="flex items-center gap-1 ' + (hasLiked ? 'text-neonpink' : 'text-white/30') + '">' + (hasLiked ? '❤️' : '🤍') + ' ' + (p.likes ? p.likes.length : 0) + '</button>' +
        '</div>' +
      '</div>';
    }).join('');
  } else {
    html += '<p class="text-center text-sm text-white/40 py-6">暫無戰報，快來發布第一個！</p>';
  }
  
  html += '</div>';
  return html;
}

function setLiveTrack(track) { liveTrack = track; showView('live'); }

// ============================================================
// 發布戰報 (夾客)
// ============================================================
async function submitPlayerPost() {
    var storeId = document.getElementById('lp-store-id')?.value;
    if (!storeId) { toast('請選擇店鋪', 'pink'); return; }
    
    var photoBlob = window._cam?.lp;
    if (!photoBlob) { toast('請先拍照', 'pink'); return; }
    
    var store = STORES.find(function(s) { return s.id === storeId; });
    if (!store) { toast('找不到該店鋪', 'pink'); return; }
    
    toast('📍 已選擇：' + store.name + ' (' + store.region + ')', 'gold');
    
    if (!gpsLat || !gpsLng) {
        toast('📍 請先開啟 GPS 定位，以確保實況資訊的真實性', 'pink');
        return;
    }
    
    if (store.lat && store.lng) {
        var distance = calculateDistance(store.lat, store.lng, gpsLat, gpsLng);
        var distanceMeters = Math.round(distance * 1000);
        if (distance > 0.5) {
            toast('⚠️ 你距離該店鋪 ' + distanceMeters + ' 米，請在 500 米內發布戰報\n\n實況資訊的真實性是我們的核心價值', 'pink');
            return;
        }
        toast('✅ 距離 ' + distanceMeters + ' 米，在 500 米範圍內，可以發布', 'green');
    } else {
        toast('⚠️ 該店鋪尚無 GPS 座標，將記錄您的發布位置', 'gold');
    }
    
    var selectedTags = [];
    document.querySelectorAll('[data-tag].chip-active-gold').forEach(function(btn) {
        selectedTags.push(btn.dataset.tag);
    });
    
    var photoUrl = '';
    if (CLOUD_ON) {
        try {
            var file = new File([photoBlob], "post_" + Date.now() + ".jpg", { type: 'image/jpeg' });
            photoUrl = await uploadImage(file, 'posts');
        } catch (e) {
            toast('圖片上傳失敗: ' + e.message, 'pink');
            return;
        }
    } else {
        photoUrl = window._camPreview?.lp || '';
    }
    
    var content = selectedTags.length > 0 ? selectedTags.join(' · ') : '🎉 出貨成功！';
    var post = {
        id: 'p' + Date.now() + '_' + uid(),
        track: 'player',
        store_id: storeId,
        store_name: store ? store.name : '',
        store_region: store ? store.region : '',
        content: content,
        tags: selectedTags,
        photo: photoUrl,
        author: STATE.user.name,
        author_device: STATE.user.device,
        ts: now(),
        expire: now() + DAY,
        likes: [],
        likeCount: 0,
        is_linked: false,
        gps_lat: gpsLat,
        gps_lng: gpsLng
    };
    
    if (!STATE.livePosts) STATE.livePosts = [];
    STATE.livePosts.unshift(post);
    save();
    
    await syncLivePost(post);
    await addPoints(5, '發布出貨戰報');
    updateStreak();
    
    await recordTaskCompletion('share');
    
    toast('✅ 戰報發布成功！+5 分', 'green');
    closeModal();
    showView('live');
}

// ============================================================
// 發布台主宣傳
// ============================================================
async function submitOwnerPost() {
    var storeId = document.getElementById('lo-store-id')?.value;
    if (!storeId) { toast('請選擇店鋪', 'pink'); return; }
    
    var photoBlob = window._cam?.lo;
    if (!photoBlob) { toast('請先拍照', 'pink'); return; }
    
    var store = STORES.find(function(s) { return s.id === storeId; });
    if (!store) { toast('找不到該店鋪', 'pink'); return; }
    
    toast('📍 已選擇：' + store.name + ' (' + store.region + ')', 'gold');
    
    if (!gpsLat || !gpsLng) {
        toast('📍 請先開啟 GPS 定位，以確保宣傳資訊的真實性', 'pink');
        return;
    }
    
    if (store.lat && store.lng) {
        var distance = calculateDistance(store.lat, store.lng, gpsLat, gpsLng);
        var distanceMeters = Math.round(distance * 1000);
        if (distance > 0.5) {
            toast('⚠️ 你距離該店鋪 ' + distanceMeters + ' 米，請在 500 米內發布宣傳\n\n實況資訊的真實性是我們的核心價值', 'pink');
            return;
        }
        toast('✅ 距離 ' + distanceMeters + ' 米，在 500 米範圍內，可以發布', 'green');
    } else {
        toast('⚠️ 該店鋪尚無 GPS 座標，將記錄您的發布位置', 'gold');
    }
    
    var content = document.getElementById('lo-content')?.value.trim() || '🏬 新機台上架！';
    var plan = window._loLinkPlan || null;
    
    if (plan && STATE.points < plan.cost) {
        toast('積分不足 ' + plan.cost + '，無法使用連結功能', 'pink');
        return;
    }
    
    var photoUrl = '';
    if (CLOUD_ON) {
        try {
            var file = new File([photoBlob], "post_" + Date.now() + ".jpg", { type: 'image/jpeg' });
            photoUrl = await uploadImage(file, 'posts');
        } catch (e) {
            toast('圖片上傳失敗', 'pink');
            return;
        }
    }
    
    if (plan) {
        await addPoints(-plan.cost, '連結機台宣傳 (' + plan.days + '天)');
    }
    
    var post = {
        id: 'p' + Date.now() + '_' + uid(),
        track: 'owner',
        store_id: storeId,
        store_name: store ? store.name : '',
        store_region: store ? store.region : '',
        content: content,
        photo: photoUrl,
        author: STATE.user.name,
        author_device: STATE.user.device,
        ts: now(),
        expire: plan ? now() + DAY * plan.days : now() + DAY,
        is_linked: !!plan,
        link_days: plan ? plan.days : 0,
        likes: [],
        likeCount: 0,
        gps_lat: gpsLat,
        gps_lng: gpsLng
    };
    
    if (!STATE.livePosts) STATE.livePosts = [];
    STATE.livePosts.unshift(post);
    save();
    
    await syncLivePost(post);
    
    if (!plan) {
        await addPoints(5, '發布台主宣傳');
    }
    
    updateStreak();
    
    await recordTaskCompletion('share');
    
    toast(plan ? '✅ 宣傳發布成功！連結已啟用 (' + plan.days + '天)' : '✅ 宣傳發布成功！+5 分', 'green');
    closeModal();
    showView('live');
}

async function toggleLike(postId) {
  var post = STATE.livePosts.find(function(p) { return p.id === postId; });
  if (!post) return;
  
  var userDevice = STATE.user.device;
  if (!post.likes) post.likes = [];
  
  var idx = post.likes.indexOf(userDevice);
  if (idx >= 0) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(userDevice);
  }
  
  save();
  await syncLikeToCloud(postId, post.likes);
  
  if (CURRENT === 'live') {
    var overlay = document.getElementById('page-overlay');
    if (overlay) {
      overlay.innerHTML = viewLive();  // ✅ 修正：VIEWS.live() → viewLive()
      overlay.scrollTop = 0;
      overlay.classList.add("view-enter");
    }
  }
}

// ============================================================
// 發布貼文 UI
// ============================================================
function openPlayerPost() {
  var tagCategories = [
    { name: '出貨方式', tags: ['出貨', '夾送', '刮中', '推幣'] },
    { name: '結果評價', tags: ['大LAM', 'LAM', '小LAM', '平手', '小損', '損', '大損'] },
    { name: '獎品類型', tags: ['一番賞', '景品', '盒玩', '布偶', '吊飾', '扭蛋'] },
    { name: '難度評價', tags: ['佛心台', '標準台', '技術台', '山崩台'] }
  ];
  var tagsHtml = tagCategories.map(function(cat) {
    return '\n    <div class="mt-3">\n      <p class="text-[10px] text-white/40 mb-1">' + cat.name + '</p>\n      <div class="flex flex-wrap gap-1.5">\n        ' + cat.tags.map(function(t) {
      return '\n          <button onclick="this.classList.toggle(\'chip-active-gold\')" \n            data-tag="' + t + '" \n            class="rounded-full border border-gold/40 px-2.5 py-1 text-[10px] text-gold hover:border-gold/60 transition-all">\n            ' + t + '\n          </button>\n        ';
    }).join('') + '\n      </div>\n    </div>\n  ';
  }).join('');
  
  openModal('\n    <div class="flex items-center justify-between border-b border-neongreen/30 pb-3 flex-shrink-0">\n      <h2 class="font-black text-neongreen neon-green">🎯 發布出貨戰報</h2>\n      <button onclick="closeModal()" class="text-2xl text-white/50 hover:text-white transition-colors">✕</button>\n    </div>\n    <div class="flex-1 overflow-y-auto mt-4 space-y-4">\n      <div class="rounded-xl border border-neongreen/20 bg-neongreen/5 p-3">\n        <p class="text-xs text-white/40">分享你的夾娃娃戰果！</p>\n        <p class="text-xs text-neongreen mt-1">📸 拍照 + 🏷️ 選擇標籤 = +5 分</p>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">🏪 選擇店鋪 <span class="text-neonpink">（必填）</span></label>\n        <div style="display:flex; gap:6px;">\n          <input id="lp-store-search" placeholder="輸入店名搜尋..." \n            class="flex-1 rounded-lg border border-gold/40 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold" \n            autocomplete="off" oninput="filterStoreSuggestions(\'lp\')" onfocus="filterStoreSuggestions(\'lp\')" />\n          <button onclick="selectStoreFromMap(\'lp\')" \n            class="rounded-lg border border-gold/40 px-3 py-2.5 text-sm text-gold hover:bg-gold/10 transition-all whitespace-nowrap">\n            🗺️ 地圖選\n          </button>\n        </div>\n        <div id="lp-store-suggestions" class="hidden mt-1 rounded-lg border border-gold/30 bg-zinc-900 overflow-hidden max-h-40 overflow-y-auto"></div>\n        <input type="hidden" id="lp-store-id" value="" />\n        <div id="lp-selected-store" class="hidden mt-2 text-xs text-gold">✅ 已選擇：<span id="lp-selected-store-name"></span></div>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">🏷️ 戰報標籤 <span class="text-white/40">（選填，可多選）</span></label>\n        ' + tagsHtml + '\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">📷 戰果照片 <span class="text-neonpink">（必填）</span></label>\n        <div id="lp-camera-container" class="mt-2 rounded-xl border-2 border-dashed border-neongreen/60 bg-zinc-900 p-3 text-center">\n          <button onclick="openCamera(\'lp\')" class="w-full rounded-lg bg-neongreen/90 py-2.5 text-sm font-black text-black">📸 開啟相機拍照</button>\n          <img id="lp-preview" class="mt-2 hidden w-full rounded-lg" alt="預覽" />\n        </div>\n      </div>\n    </div>\n    <div class="flex-shrink-0 mt-4 pt-3 border-t border-white/10">\n      <button onclick="submitPlayerPost()" id="lp-submit-btn" class="w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed">請選擇店鋪並拍照</button>\n    </div>\n  ');
  
  var checkInterval = setInterval(function() {
    var storeId = document.getElementById('lp-store-id')?.value;
    var photoReady = window._camPreview && window._camPreview.lp;
    var btn = document.getElementById('lp-submit-btn');
    if (btn) {
      if (storeId && photoReady) {
        btn.className = 'w-full rounded-2xl bg-neongreen py-3.5 text-base font-black text-black glow-green transition-all hover:scale-[1.02] active:scale-[0.98]';
        btn.disabled = false;
        btn.innerHTML = '✅ 發布戰報（+5 分）';
      } else {
        btn.className = 'w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed';
        btn.disabled = true;
        btn.innerHTML = photoReady ? (storeId ? '✅ 可以發布' : '🏪 請選擇店鋪') : '📷 請先拍照';
      }
    }
  }, 300);
  setTimeout(function() { return clearInterval(checkInterval); }, 30000);
}

function openOwnerPost() {
  var myStores = STORES.filter(function(s) { return s.submitted_by === STATE.user.device; });
  if (myStores.length === 0) { toast('你還沒有提交過店鋪，無法使用台主宣傳功能', 'gold'); return; }
  
  openModal('\n    <div class="flex items-center justify-between border-b border-neonpink/30 pb-3 flex-shrink-0">\n      <h2 class="font-black text-neonpink neon-pink">🏬 發布台主宣傳</h2>\n      <button onclick="closeModal()" class="text-2xl text-white/50 hover:text-white transition-colors">✕</button>\n    </div>\n    <div class="flex-1 overflow-y-auto mt-4 space-y-4">\n      <div class="rounded-xl border border-neonpink/20 bg-neonpink/5 p-3">\n        <p class="text-xs text-white/40">宣傳你的店鋪和機台，吸引更多夾客！</p>\n        <p class="text-xs text-neonpink mt-1">📸 強制拍照 + 🏷️ 選擇店鋪 = +5 分</p>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">🏪 選擇店鋪 <span class="text-neonpink">（必填）</span></label>\n        <input id="lo-store-search" placeholder="輸入店名搜尋..." class="mt-1 w-full rounded-lg border border-gold/40 bg-zinc-900 px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-gold" autocomplete="off" oninput="filterStoreSuggestions(\'lo\')" onfocus="filterStoreSuggestions(\'lo\')" />\n        <div id="lo-store-suggestions" class="hidden mt-1 rounded-lg border border-gold/30 bg-zinc-900 overflow-hidden max-h-40 overflow-y-auto"></div>\n        <input type="hidden" id="lo-store-id" value="" />\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">📝 宣傳內容 <span class="text-white/40">（選填）</span></label>\n        <textarea id="lo-content" placeholder="例如：全新 chiikawa 系列登場！" class="mt-1 w-full rounded-lg border border-gold/40 bg-zinc-900 px-3 py-2.5 text-sm placeholder-zinc-600 focus:outline-none focus:border-gold resize-none" rows="2"></textarea>\n      </div>\n      <div>\n        <label class="text-xs font-bold text-gold">📷 宣傳照片 <span class="text-neonpink">（必填）</span></label>\n        <div id="lo-camera-container" class="mt-2 rounded-xl border-2 border-dashed border-neonpink/60 bg-zinc-900 p-3 text-center">\n          <button onclick="openCamera(\'lo\')" class="w-full rounded-lg bg-neonpink/90 py-2.5 text-sm font-black text-black">📸 開啟相機拍照</button>\n          <img id="lo-preview" class="mt-2 hidden w-full rounded-lg" alt="預覽" />\n        </div>\n      </div>\n      <div class="rounded-xl border border-gold/30 bg-gold/5 p-3">\n        <label class="text-xs font-bold text-gold flex items-center gap-2">🔗 連結機台資料 <span class="text-[9px] text-white/30">（宣傳將顯示在店鋪頁面及機台頁面）</span></label>\n        <div class="mt-2 grid grid-cols-3 gap-2">\n          <button onclick="selectLinkPlan(3, 50)" class="link-plan-btn rounded-lg border border-white/20 p-2 text-center text-xs text-white/40 hover:border-gold/40 transition-all">🌱 3天<br><span class="text-gold">50分</span></button>\n          <button onclick="selectLinkPlan(5, 70)" class="link-plan-btn rounded-lg border border-white/20 p-2 text-center text-xs text-white/40 hover:border-gold/40 transition-all">🌿 5天<br><span class="text-gold">70分</span></button>\n          <button onclick="selectLinkPlan(7, 80)" class="link-plan-btn rounded-lg border border-white/20 p-2 text-center text-xs text-white/40 hover:border-gold/40 transition-all">🌳 7天<br><span class="text-gold">80分</span></button>\n        </div>\n        <p id="link-plan-info" class="text-[10px] text-white/30 mt-2">💡 選擇方案後，貼文將在指定天數內顯示在機台頁面</p>\n      </div>\n    </div>\n    <div class="flex-shrink-0 mt-4 pt-3 border-t border-white/10">\n      <button onclick="submitOwnerPost()" id="lo-submit-btn" class="w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed">請搜尋並選擇店鋪</button>\n    </div>\n  ');
  
  setTimeout(function() {
    var input = document.getElementById('lo-store-search');
    if (input) { input.focus(); filterStoreSuggestions('lo'); }
  }, 100);
  
  window._loLinkPlan = null;
  var checkInterval = setInterval(function() {
    var storeId = document.getElementById('lo-store-id')?.value;
    var photoReady = window._camPreview && window._camPreview.lo;
    var btn = document.getElementById('lo-submit-btn');
    if (btn) {
      if (storeId && photoReady) {
        btn.className = 'w-full rounded-2xl bg-neonpink py-3.5 text-base font-black text-black glow-pink transition-all hover:scale-[1.02] active:scale-[0.98]';
        btn.disabled = false;
        var plan = window._loLinkPlan;
        btn.innerHTML = plan ? '✅ 發布宣傳（' + plan.days + '天 · -' + plan.cost + '分）' : '✅ 發布宣傳（+5 分）';
      } else {
        btn.className = 'w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed';
        btn.disabled = true;
        btn.innerHTML = photoReady ? (storeId ? '✅ 可以發布' : '🏪 請選擇店鋪') : '📷 請先拍照';
      }
    }
  }, 300);
  setTimeout(function() { return clearInterval(checkInterval); }, 30000);
}

function selectLinkPlan(days, cost) {
  window._loLinkPlan = { days: days, cost: cost };
  document.querySelectorAll('.link-plan-btn').forEach(function(el) {
    var isActive = el.textContent.includes(days + "天");
    el.classList.toggle('border-gold', isActive);
    el.classList.toggle('bg-gold/20', isActive);
    el.classList.toggle('text-gold', isActive);
    el.classList.toggle('text-white/40', !isActive);
  });
  document.getElementById('link-plan-info').textContent = '✅ 選中 ' + days + ' 天方案，將扣除 ' + cost + ' 積分，貼文顯示在機台頁面';
  var btn = document.getElementById('lo-submit-btn');
  if (btn && !btn.disabled) btn.innerHTML = '✅ 發布宣傳（' + days + '天 · -' + cost + '分）';
}

function selectStoreFromMap(prefix) {
  closeModal();
  if (CURRENT !== 'map') {
    showView('map');
  }
  toast('🗺️ 請點擊地圖上的圖釘選擇店鋪', 'gold');
  if (markerCluster) {
    markerCluster.on('click', function(e) {
      var layer = e.layer;
      if (layer.options && layer.options.storeId) {
        var store = STORES.find(function(s) { return s.id === layer.options.storeId; });
        if (store) {
          markerCluster.off('click');
          setTimeout(function() {
            openPlayerPostWithStore(prefix, store);
          }, 300);
        }
      } else if (layer.options && layer.options.mallName) {
        toast('🏬 請選擇商場內的具體店鋪', 'gold');
        openMallModal(layer.options.mallName);
      }
    });
  }
}

function openPlayerPostWithStore(prefix, store) {
  openPlayerPost();
  setTimeout(function() {
    var input = document.getElementById(prefix + "-store-search");
    var hidden = document.getElementById(prefix + "-store-id");
    var display = document.getElementById(prefix + "-selected-store");
    var nameDisplay = document.getElementById(prefix + "-selected-store-name");
    if (input) input.value = store.name;
    if (hidden) hidden.value = store.id;
    if (display) display.classList.remove('hidden');
    if (nameDisplay) nameDisplay.textContent = store.name;
    var container = document.getElementById(prefix + "-store-suggestions");
    if (container) container.classList.add('hidden');
    checkPostForm(prefix);
    toast('✅ 已選擇「' + store.name + '」', 'green');
  }, 500);
}

function checkPostForm(prefix) {
  var hiddenInput = document.getElementById(prefix + "-store-id");
  var photoReady = window._camPreview && window._camPreview[prefix];
  var btn = document.getElementById(prefix + "-submit-btn");
  if (btn) {
    if (hiddenInput && hiddenInput.value && photoReady) {
      btn.className = 'w-full rounded-2xl bg-neongreen py-3.5 text-base font-black text-black glow-green transition-all hover:scale-[1.02] active:scale-[0.98]';
      btn.disabled = false;
      btn.innerHTML = '✅ 發布戰報（+5 分）';
    } else {
      btn.className = 'w-full rounded-2xl bg-white/10 py-3.5 text-base font-black text-white/30 cursor-not-allowed';
      btn.disabled = true;
      btn.innerHTML = photoReady ? (hiddenInput && hiddenInput.value ? '✅ 可以發布' : '🏪 請選擇店鋪') : '📷 請先拍照';
    }
  }
}

function filterStoreSuggestions(prefix) {
  var input = document.getElementById(prefix + "-store-search");
  var container = document.getElementById(prefix + "-store-suggestions");
  if (!input || !container) return;
  var query = input.value.trim().toLowerCase();
  var filtered = STORES;
  if (query) filtered = STORES.filter(function(s) { return s.name.toLowerCase().includes(query) || s.region.toLowerCase().includes(query); });
  filtered = filtered.slice(0, 10);
  if (filtered.length === 0) { container.classList.add('hidden'); return; }
  container.classList.remove('hidden');
  container.innerHTML = filtered.map(function(s) {
    return '<button onclick="selectStoreSuggestion(\'' + prefix + '\', \'' + s.id + '\', \'' + s.name.replace(/'/g, "\\'") + '\')" class="block w-full text-left px-3 py-2 hover:bg-gold/20 text-sm text-white/80 border-b border-white/10 last:border-0 transition-colors">\n      <span class="text-gold">' + s.name + '</span>\n      <span class="text-[10px] text-white/40 ml-2">' + s.region + '</span>\n    </button>';
  }).join('');
  setTimeout(function() {
    document.addEventListener('click', function closeSuggestions(e) {
      if (!container.contains(e.target) && e.target !== input) {
        container.classList.add('hidden');
        document.removeEventListener('click', closeSuggestions);
      }
    });
  }, 100);
}

function selectStoreSuggestion(prefix, storeId, storeName) {
  var input = document.getElementById(prefix + "-store-search");
  var container = document.getElementById(prefix + "-store-suggestions");
  var hiddenInput = document.getElementById(prefix + "-store-id");
  if (input) input.value = storeName;
  if (hiddenInput) hiddenInput.value = storeId;
  if (container) container.classList.add('hidden');
  checkPostForm(prefix);
}