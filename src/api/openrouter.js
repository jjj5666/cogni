// OpenRouter API - 通过 Vercel Serverless 代理调用
// API Key 安全存储在服务端，前端只需 session token

function getApiBase() {
  // 本地开发时直连 OpenRouter（需要在 .env 配置 key）
  // 生产环境通过 /api/chat 代理
  if (import.meta.env.DEV && import.meta.env.VITE_OPENROUTER_KEY) {
    return { direct: true, base: 'https://openrouter.ai/api/v1' };
  }
  return { direct: false, base: '/api' };
}

export async function* streamChat(modelId, messages, sessionToken, options = {}) {
  const { thinkingParams = {}, enableSearch = false } = options;
  const { direct, base } = getApiBase();

  const body = {
    model: modelId,
    messages,
    stream: true,
    ...thinkingParams
  };

  if (enableSearch) {
    body.plugins = [{ id: "web_search" }];
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  let url;
  if (direct) {
    // 本地开发：直连 OpenRouter
    url = `${base}/chat/completions`;
    headers['Authorization'] = `Bearer ${import.meta.env.VITE_OPENROUTER_KEY}`;
    headers['HTTP-Referer'] = window.location.href;
    headers['X-Title'] = 'Cogni';
  } else {
    // 生产环境：通过代理
    url = `${base}/chat`;
    headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  console.log('[Cogni] sending to:', url, 'model:', modelId, 'direct:', direct);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
  } catch (fetchErr) {
    console.error('[Cogni] fetch failed:', fetchErr);
    throw new Error('网络请求失败: ' + fetchErr.message);
  }

  console.log('[Cogni] response status:', response.status);

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('[Cogni] API error:', response.status, errText);
    let msg = `API Error ${response.status}`;
    try { const j = JSON.parse(errText); msg = j.error?.message || j.error || msg; } catch {}
    throw new Error(msg);
  }

  if (!response.body) {
    // 非流式 fallback
    const data = await response.json();
    console.log('[Cogni] non-stream response:', data);
    if (data.choices?.[0]?.message) {
      yield { choices: [{ delta: data.choices[0].message }] };
    }
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let chunkCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        chunkCount++;
        yield parsed;
      } catch {}
    }
  }
  console.log('[Cogni] stream done, chunks:', chunkCount);
}

export async function login(username, password) {
  // 本地开发模式：跳过服务端验证
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_MODE) {
    return { ok: true, token: 'dev-token', username };
  }

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '登录失败');
  return data;
}
