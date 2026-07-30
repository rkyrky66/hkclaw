import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. 允許所有域名（GitHub Pages 需要明確允許）
  const allowedOrigins = [
    'https://rkyrky66.github.io',
    'https://hkclaw.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500', // 本地開發
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    // 如果有 origin 但不在允許清單，仍允許但記錄
    console.log('⚠️ 來自未允許的 origin:', origin);
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

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
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    // 詳細檢查環境變數
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ 環境變數缺失');
      return res.status(500).json({ 
        error: '伺服器設定錯誤',
        details: '缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY',
        env: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey,
          nodeEnv: process.env.NODE_ENV
        }
      });
    }

    console.log('✅ 環境變數檢查通過');
    console.log(`📡 Supabase URL: ${supabaseUrl.substring(0, 20)}...`);
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('📊 正在查詢 Supabase stores 資料表...');
    const { data, error, count } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: false })
      .limit(200);

    if (error) {
      console.error('❌ Supabase 查詢錯誤:', error);
      return res.status(500).json({ 
        error: '資料庫查詢失敗',
        message: error.message,
        details: error.details || '無詳細資訊'
      });
    }

    console.log(`✅ 成功取得 ${data?.length || 0} 筆店鋪資料`);
    
    // 如果沒有資料，回傳空陣列
    return res.status(200).json(data || []);
    
  } catch (err) {
    console.error('❌ 伺服器錯誤:', err);
    return res.status(500).json({ 
      error: '伺服器內部錯誤',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}