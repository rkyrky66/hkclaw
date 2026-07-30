export default async function handler(req, res) {
  const origin = req.headers.origin;

  // 1. 【第一步】不管三七二十一，先把 CORS 通行證貼上去，確保任何回應都帶有權限
  res.setHeader('Access-Control-Allow-Origin', 'https://rkyrky66.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. 【第二步】如果是瀏覽器的 OPTIONS 預檢探針，直接讓它 200 順利過關
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. 【第三步】安全防禦：檢查是不是從你的官方網站發過來的
  if (origin && origin !== "https://rkyrky66.github.io") {
    return res.status(403).json({ error: "Access Denied" });
  }

  // 4. 【第四步】安全地從環境變數讀取 Supabase 金鑰與網址
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