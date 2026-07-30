export default async function handler(req, res) {
  // 1. 【選配防禦】檢查是不是從您的官方網站發過來的請求 (CORS 限制)
  const origin = req.headers.origin;
  // 替換成您的 GitHub Pages 正式網址，防止別人直接用其他網域偷打您的 API
  if (origin && origin !== "https://您的GitHub帳號.github.io") {
    return res.status(403).json({ error: "Access Denied" });
  }

  // 2. 從環境變數安全地讀取 Supabase 網址與高權限 Key
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // 3. 由後端伺服器出面，去跟 Supabase 拿資料
    const response = await fetch(`${supabaseUrl}/rest/v1/claw_stores?select=*&order=created_at.desc`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      }
    });

    if (!response.ok) throw new Error("Supabase fetch failed");

    const data = await response.json();

    // 4. 把資料乾淨地回傳給您的前端網頁
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
