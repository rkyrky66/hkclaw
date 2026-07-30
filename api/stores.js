export default async function handler(req, res) {
  const origin = req.headers.origin;

  // 1. 嚴格檢查：只允許從你的官方 GitHub Pages 發出的請求通過
  if (origin && origin !== "https://rkyrky66.github.io") {
    return res.status(403).json({ error: "Access Denied" });
  }

  // 2. 通過檢查後，在標頭中明確告訴瀏覽器：「這個網域是合法的，可以存取」
  res.setHeader('Access-Control-Allow-Origin', 'https://rkyrky66.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 安全地讀取環境變數去跟 Supabase 要資料
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
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}