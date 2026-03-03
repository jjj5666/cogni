export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'] || '';
  const sessionToken = authHeader.replace('Bearer ', '');
  if (sessionToken !== process.env.SESSION_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  // Debug: log what we're sending
  const requestBody = JSON.stringify(req.body);

  const upstreamRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'HTTP-Referer': 'https://cogni-phi-one.vercel.app',
      'X-Title': 'Cogni'
    },
    body: requestBody
  });

  // If upstream error, forward it
  if (!upstreamRes.ok) {
    const errBody = await upstreamRes.text();
    return res.status(upstreamRes.status).send(errBody);
  }

  // Stream response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');

  const reader = upstreamRes.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
  } catch (e) {
    // client disconnected
  }
  res.end();
}
