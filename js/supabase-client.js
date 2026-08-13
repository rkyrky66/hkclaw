// ============================================================
// js/supabase-client.js
// 爪爪情報站 - Supabase 客戶端與輔助函數
// ============================================================

// ============================================================
// Supabase 客戶端初始化
// ============================================================
var supabaseClientInstance = null;

function initSupabaseClient() {
  try {
    if (typeof supabase !== 'undefined' && supabase.createClient) {
      supabaseClientInstance = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else if (typeof window.supabaseJs !== 'undefined') {
      supabaseClientInstance = window.supabaseJs.createClient(SUPABASE_URL, SUPABASE_KEY);
    } else {
      import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2').then(function(module) {
        supabaseClientInstance = module.createClient(SUPABASE_URL, SUPABASE_KEY);
      }).catch(function(err) {
        createFallbackClient();
      });
      return;
    }
  } catch (e) {
    createFallbackClient();
  }
}

function createFallbackClient() {
  supabaseClientInstance = {
    auth: {
      signInWithOAuth: async function() {
        toast('Auth 服務不可用，請檢查網絡或重新載入頁面', 'pink');
        return { data: null, error: new Error('Auth 服務不可用') };
      },
      signOut: async function() { return { error: null }; },
      getUser: async function() { return { data: { user: null }, error: new Error('Auth 不可用') }; },
      setSession: async function() { return { data: null, error: new Error('Auth 不可用') }; },
      getSession: async function() { return { data: { session: null }, error: null }; }
    },
    from: function(table) {
      return {
        select: function(columns) {
          return {
            eq: function(col, val) {
              return { maybeSingle: async function() { return { data: null, error: null }; } };
            },
            order: function(col, opts) {
              return { then: function(cb) { cb([]); } };
            }
          };
        },
        insert: function(data) {
          return { then: function(cb) { cb({ error: null }); } };
        },
        update: function(data) {
          return { eq: function(col, val) {
            return { then: function(cb) { cb({ error: null }); } };
          } };
        },
        upsert: function(data, opts) {
          return { then: function(cb) { cb({ error: null }); } };
        }
      };
    }
  };
}

// ============================================================
// 檢查 Supabase 是否就緒
// ============================================================
function isSupabaseReady() {
  if (!supabaseClientInstance) { return false; }
  if (typeof supabaseClientInstance.auth === 'undefined') { return false; }
  if (typeof supabaseClientInstance.auth.signInWithOAuth !== 'function') { return false; }
  return true;
}

// ============================================================
// 獲取 Supabase 請求頭
// ============================================================
function getSupabaseHeaders(extra) {
  return Object.assign({
    'apikey': SUPABASE_KEY,
    'Authorization': 'Bearer ' + SUPABASE_KEY,
    'Content-Type': 'application/json'
  }, extra || {});
}

// ============================================================
// Supabase Fetch 封裝
// ============================================================
async function sbFetch(path, opts) {
  if (opts === void 0) opts = {};
  if (!CLOUD_ON) return null;
  var res = await fetch(SUPABASE_URL + "/rest/v1/" + path, Object.assign({}, opts, {
    headers: Object.assign({
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal"
    }, opts.headers || {})
  }));
  if (!res.ok) throw new Error("Supabase " + res.status);
  return res.status === 204 ? null : res.json();
}

// ============================================================
// 雲端插入
// ============================================================
async function cloudInsert(table, row) {
  if (!CLOUD_ON) return;
  try {
    let processedRow = { ...row };
    if (table === 'claw_stores' && processedRow.id) {
      processedRow.id = String(processedRow.id);
    }
    if (table === 'user_achievements' && processedRow.user_id) {
      if (typeof processedRow.user_id === 'string' && !processedRow.user_id.includes('-')) {
        processedRow.user_id = null;
      }
    }
    await sbFetch(table, {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify([processedRow])
    });
  } catch (e) { 
    console.log("[v0] cloudInsert 失敗:", e.message); 
  }
}

// ============================================================
// 圖片上傳
// ============================================================
async function uploadImage(file, folder) {
  if (folder === void 0) folder = 'stores';
  if (!CLOUD_ON) {
    return new Promise(function(resolve) {
      var reader = new FileReader();
      reader.onload = function(e) { return resolve(e.target.result); };
      reader.readAsDataURL(file);
    });
  }
  var BUCKET = 'claw-stores-images';
  var fileName = folder + "/" + Date.now() + "_" + uid() + ".jpg";
  var path = "storage/v1/object/" + BUCKET + "/" + fileName;
  var uploadRes = await fetch(SUPABASE_URL + "/" + path, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      'Content-Type': file.type || 'image/jpeg'
    },
    body: file
  });
  if (!uploadRes.ok) {
    var errText = await uploadRes.text();
    console.error('上傳失敗:', errText);
    throw new Error("上傳失敗: " + errText);
  }
  return SUPABASE_URL + "/storage/v1/object/public/" + BUCKET + "/" + fileName;
}

// ============================================================
// DOM 載入時初始化
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  initSupabaseClient();
});