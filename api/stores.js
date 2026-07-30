import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. CORS 設定（允許所有來源）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // 處理 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 GET 請求
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('🔍 正在連線 Supabase...');
    
    // 環境變數名稱修正
    const supabaseUrl = process.env.SUPABASE_URL;  // 注意拼寫
    const supabaseKey = process.env.SUPABASE_ANON_KEY;  // 注意拼寫
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 環境變數缺失');
      return res.status(500).json({ 
        error: '伺服器設定錯誤',
        details: '缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    console.log('✅ 環境變數檢查通過');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🔥 重點：改用 claw_stores 而不是 stores
    console.log('📊 正在查詢 Supabase claw_stores 資料表...');
    const { data, error } = await supabase
      .from('claw_stores')  // ← 這裡改成 claw_stores
      .select('*')
      .limit(200);

    if (error) {
      console.error('❌ Supabase 查詢錯誤:', error);
      return res.status(500).json({ 
        error: '資料庫查詢失敗',
        message: error.message,
        details: error.details
      });
    }

    console.log(`✅ 成功取得 ${data?.length || 0} 筆店鋪資料`);
    return res.status(200).json(data || []);
    
  } catch (err) {
    console.error('❌ 伺服器錯誤:', err);
    return res.status(500).json({ 
      error: '伺服器內部錯誤',
      message: err.message
    });
  }
}