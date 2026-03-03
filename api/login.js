// Login endpoint - 验证用户名密码，返回 session token

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { username, password } = req.body || {};

  const validUser = process.env.COGNI_USERNAME || 'jjj';
  const validPass = (process.env.COGNI_PASSWORD || '').trim();

  if (!validPass) return res.status(500).json({ error: 'Password not configured' });

  if (username === validUser && password === validPass) {
    // 返回 session secret 作为 token
    return res.status(200).json({
      ok: true,
      token: process.env.SESSION_SECRET,
      username: validUser
    });
  }

  return res.status(401).json({ error: '用户名或密码错误' });
}
