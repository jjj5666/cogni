// Vercel Serverless Function - 代理 OpenRouter API
// API Key 存在 Vercel 环境变量里，前端永远看不到

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // 验证登录 token
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader?.replace('Bearer ', '');

  if (!sessionToken || sessionToken !== process.env.SESSION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const body = req.body;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://cogni.app',
        'X-Title': 'Cogni'
      },
      body: JSON.stringify(body)
    });

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
