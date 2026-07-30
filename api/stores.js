export default async function handler(req, res) {
  const origin = req.headers.origin;

  // 1. 允許的白名單網域清單（包含你的 GitHub Pages 正式網址）
  const allowedOrigins = [
    "https://rkyrky66.github.io",
    "https://hkclaw.vercel.app"
  ];

  // 2. 嚴格檢查：如果來源不在白名單內（且不是本地端測試），直接拒絕 (403)
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: "Access Denied" });
  }

  // 3. 動態設定 CORS 通行證（直接回傳當下的請求來源，完美匹配）
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 4. 處理瀏覽器的 OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 5. 讀取 Supabase 資料
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/claw_stores?select=*&order=created_at.desc`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      }
    });

    if (!response.ok) throw new Error("Supabase fetch failed");

    const data = await response.json();

    // 5. 成功回傳資料
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}