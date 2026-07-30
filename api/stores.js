export default async function handler(req, res) {
  // 無條件允許所有來源（先排除 403）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 直接回傳一個簡單的測試陣列，看前端能不能收到
  return res.status(200).json([
    { id: "test1", name: "測試雲端店鋪", region: "旺角", addr: "測試地址" }
  ]);
}