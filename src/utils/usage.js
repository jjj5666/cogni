// Usage tracking - 记录每次 API 调用的 token 用量

const STORAGE_KEY = 'cogni-usage';

export function getUsageData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

export function recordUsage({ model, inputTokens, outputTokens, cached }) {
  const data = getUsageData();
  data.push({
    ts: Date.now(),
    model,
    input: inputTokens || 0,
    output: outputTokens || 0,
    cached: cached || 0
  });
  // 只保留最近 90 天
  const cutoff = Date.now() - 90 * 86400000;
  const trimmed = data.filter(d => d.ts > cutoff);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

// 按天聚合
export function getDailyStats(days = 30) {
  const data = getUsageData();
  const cutoff = Date.now() - days * 86400000;
  const filtered = data.filter(d => d.ts > cutoff);

  const byDay = {};
  for (const d of filtered) {
    const date = new Date(d.ts).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    if (!byDay[date]) byDay[date] = { date, queries: 0, input: 0, output: 0, models: {} };
    byDay[date].queries++;
    byDay[date].input += d.input;
    byDay[date].output += d.output;
    byDay[date].models[d.model] = (byDay[date].models[d.model] || 0) + 1;
  }

  // 填充空日期
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(Date.now() - i * 86400000);
    const date = dt.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    result.push(byDay[date] || { date, queries: 0, input: 0, output: 0, models: {} });
  }
  return result;
}

// 总计统计
export function getTotalStats() {
  const data = getUsageData();
  const today = new Date().toDateString();
  const todayData = data.filter(d => new Date(d.ts).toDateString() === today);
  const weekAgo = Date.now() - 7 * 86400000;
  const weekData = data.filter(d => d.ts > weekAgo);

  return {
    today: {
      queries: todayData.length,
      input: todayData.reduce((s, d) => s + d.input, 0),
      output: todayData.reduce((s, d) => s + d.output, 0)
    },
    week: {
      queries: weekData.length,
      input: weekData.reduce((s, d) => s + d.input, 0),
      output: weekData.reduce((s, d) => s + d.output, 0)
    },
    all: {
      queries: data.length,
      input: data.reduce((s, d) => s + d.input, 0),
      output: data.reduce((s, d) => s + d.output, 0)
    },
    // 模型分布
    modelBreakdown: data.reduce((acc, d) => {
      const name = d.model.split('/').pop();
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {})
  };
}
