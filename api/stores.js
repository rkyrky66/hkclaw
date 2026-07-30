import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. 加入更詳細的 CORS 標頭
  const allowedOrigins = [
    'https://hkclaw.vercel.app',
    'https://hkclaw-h81pn8or3-rkyrky66-9802s-projects.vercel.app',
    'http://localhost:3000', // 開發環境
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24小時快取 CORS 預檢

  // 處理 OPTIONS 請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 正在連線 Supabase...');
    
    // 2. 檢查環境變數
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 環境變數缺失:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseKey 
      });
      return res.status(500).json({ 
        error: '伺服器設定錯誤：缺少 Supabase 環境變數',
        details: '請檢查 Vercel 環境變數設定'
      });
    }

    console.log('✅ 環境變數檢查通過');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 正在查詢 Supabase stores 資料表...');
    let { data, error } = await supabase
      .from('stores')
      .select('*')
      .limit(100); // 限制回傳筆數避免超時

    if (error) {
      console.error('❌ Supabase 查詢錯誤:', error);
      throw error;
    }

    console.log(`✅ 成功取得 ${data?.length || 0} 筆店鋪資料`);
    
    // 3. 回傳資料
    return res.status(200).json(data || []);
    
  } catch (err) {
    console.error('❌ API 錯誤:', err.message);
    return res.status(500).json({ 
      error: '資料庫查詢失敗',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
}