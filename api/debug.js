// Debug: test OpenRouter connection from Vercel serverless
export default async function handler(req, res) {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();

  try {
    const r = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': 'Bearer ' + apiKey
      }
    });
    const data = await r.text();
    res.status(200).json({
      status: r.status,
      keyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : 'MISSING',
      response: data.substring(0, 200)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
