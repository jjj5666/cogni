// Model Registry

export const MODEL_REGISTRY = [
  {
    id: "anthropic/claude-opus-4.6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    description: "最强推理，深度分析",
    icon: "🟣",
    defaultEnabled: true,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      return { verbosity: level };
    }
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    description: "平衡速度与质量",
    icon: "🔵",
    defaultEnabled: true,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      return { verbosity: level };
    }
  },
  {
    id: "moonshotai/kimi-k2.5",
    name: "Kimi K2.5",
    provider: "Moonshot",
    description: "高效中文对话，性价比高",
    icon: "🟢",
    defaultEnabled: true,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      const map = { low: "low", medium: "medium", high: "high", max: "high" };
      return { reasoning: { effort: map[level] || "medium", enabled: true } };
    }
  },
  {
    id: "minimax/minimax-m2.5",
    name: "MiniMax M2.5",
    provider: "MiniMax",
    description: "高速推理模型",
    icon: "⚡",
    defaultEnabled: false,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      const map = { low: "low", medium: "medium", high: "high", max: "high" };
      return { reasoning: { effort: map[level] || "medium", enabled: true } };
    }
  },
  {
    id: "google/gemini-3-flash-preview",
    name: "Gemini 3 Flash",
    provider: "Google",
    description: "极速响应，低成本",
    icon: "⚡",
    defaultEnabled: false,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      const map = { low: "low", medium: "medium", high: "high", max: "high" };
      return { reasoning: { effort: map[level] || "medium", enabled: true } };
    }
  },
  {
    id: "google/gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro",
    provider: "Google",
    description: "Google 最强推理模型",
    icon: "🔴",
    defaultEnabled: false,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      const map = { low: "low", medium: "medium", high: "high", max: "high" };
      return { reasoning: { effort: map[level] || "medium", enabled: true } };
    }
  },
  {
    id: "google/gemini-3.1-flash-image-preview",
    name: "Gemini 3.1 Flash Image",
    provider: "Google",
    description: "图片生成与理解",
    icon: "🎨",
    defaultEnabled: false,
    supportsThinking: false,
    supportsSearch: false,
    supportsImages: true,
    mapThinkingParams: () => ({})
  },
  {
    id: "x-ai/grok-4.1-fast",
    name: "Grok 4.1 Fast",
    provider: "xAI",
    description: "极速推理，实时信息",
    icon: "✖️",
    defaultEnabled: false,
    supportsThinking: false,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: () => ({})
  },
  {
    id: "openai/gpt-5.2-pro",
    name: "GPT-5.2 Pro",
    provider: "OpenAI",
    description: "OpenAI 最新旗舰",
    icon: "⚫",
    defaultEnabled: false,
    supportsThinking: true,
    supportsSearch: true,
    supportsImages: true,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      const map = { low: "low", medium: "medium", high: "high", max: "high" };
      return { reasoning: { effort: map[level] || "medium", enabled: true } };
    }
  },
  {
    id: "deepseek/deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    description: "开源推理模型",
    icon: "🟡",
    defaultEnabled: false,
    supportsThinking: true,
    supportsSearch: false,
    supportsImages: false,
    mapThinkingParams: (level) => {
      if (!level || level === "off") return {};
      const map = { low: "low", medium: "medium", high: "high", max: "high" };
      return { reasoning: { effort: map[level] || "medium", enabled: true } };
    }
  }
];

export const THINKING_LEVELS = [
  { value: "off", label: "关闭" },
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
  { value: "max", label: "最大" }
];

export const DEFAULT_MODEL = "anthropic/claude-opus-4.6";

// 访问密码 hash（SHA-256 of your password）
// 默认密码: cogni2026  → 改密码时更新这个 hash
// 生成: echo -n "你的密码" | shasum -a 256
export const ACCESS_PASSWORD_HASH = null; // null = 不需要密码。部署时设置

export function getModel(id) {
  return MODEL_REGISTRY.find(m => m.id === id);
}

export function getEnabledModels(enabledIds) {
  return MODEL_REGISTRY.filter(m => enabledIds.includes(m.id));
}
