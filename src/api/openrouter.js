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

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err.error?.message || err.error || `API Error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

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
        yield JSON.parse(data);
      } catch {}
    }
  }
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
