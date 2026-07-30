export default async function handler(req, res) {
  const origin = req.headers.origin || '*';

  // 允許來自你的 GitHub Pages 或任何來源（開發階段先用 '*' 測試最保險）
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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