// Health check & debug endpoint
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const hasKey = !!process.env.OPENROUTER_API_KEY;
  const hasSecret = !!process.env.SESSION_SECRET;
  const hasUser = !!process.env.COGNI_USERNAME;
  const hasPass = !!process.env.COGNI_PASSWORD;

  res.status(200).json({
    ok: true,
    env: {
      OPENROUTER_API_KEY: hasKey ? '✅ set' : '❌ missing',
      SESSION_SECRET: hasSecret ? '✅ set' : '❌ missing',
      COGNI_USERNAME: hasUser ? '✅ set' : '❌ missing',
      COGNI_PASSWORD: hasPass ? '✅ set' : '❌ missing'
    }
  });
}
