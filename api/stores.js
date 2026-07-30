import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // 1. 無條件允許來自任何地方的跨域請求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 2. 連線 Supabase 並抓取資料
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let { data, error } = await supabase.from('stores').select('*');

    if (error) {
      throw error;
    }

    // 3. 順利回傳資料
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}