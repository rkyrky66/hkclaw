export default async function handler(req, res) {
  const origin = req.headers.origin;

  // 1. 如果有來源網域，且不是您的官方網站，直接拒絕 (403)
  if (origin && origin !== "https://rkyrky66.github.io") {
    return res.status(403).json({ error: "Access Denied" });
  }

  // 2. 核心防護：明確告訴瀏覽器，允許來自您的 GitHub 網域的請求
  res.setHeader('Access-Control-Allow-Origin', 'https://rkyrky66.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 3. 處理瀏覽器的 OPTIONS 預檢請求，讓它直接順利通過
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 4. 安全地從環境變數讀取 Supabase 金鑰與網址
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