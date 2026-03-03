# Cogni - AI Chat Architecture

## Project Name
**Cogni** - 简单、好记、代表认知/思考

## Tech Stack
- **Vite** - 极速构建
- **React 18** - UI 框架
- **Tailwind CSS** - 样式
- **Lucide React** - 图标
- **LocalStorage** - 本地存储 API key 和设置

## Architecture

### 1. Model Configuration System
每个模型是一个配置对象，定义自己的参数转换逻辑：

```javascript
{
  id: "anthropic/claude-opus-4-6",
  name: "Claude Opus 4.6",
  provider: "anthropic",
  description: "最强推理能力",
  
  // 支持的 thinking 控制方式
  thinkingMode: "verbosity", // 或 "effort" 或 "max_tokens"
  
  // 转换函数：统一 effort → 模型特定参数
  mapThinkingParams: (effort) => {
    // 返回 { verbosity } 或 { reasoning: {...} }
  }
}
```

### 2. Parameter Mapping

| UI Effort | Claude 4.6 | Kimi K2.5 | Gemini 3 |
|-----------|------------|-----------|----------|
| minimal | - | effort: minimal | effort: minimal |
| low | verbosity: low | effort: low | effort: low |
| medium | verbosity: medium | effort: medium | effort: medium |
| high | verbosity: high | effort: high | effort: high |
| max | verbosity: max | max_tokens 估算 | effort: high |

### 3. File Structure
```
src/
  config/
    models.js          # 模型配置
  api/
    openrouter.js      # API 封装
    brave.js           # 搜索接口（预留）
  components/
    Chat.jsx           # 主聊天界面
    MessageList.jsx    # 消息列表
    MessageInput.jsx   # 输入框
    Settings.jsx       # 设置面板
    ModelSelector.jsx  # 模型选择器
    ThinkingSlider.jsx # Thinking level 选择
  hooks/
    useLocalStorage.js # localStorage hook
  utils/
    format.js          # 格式化工具
  App.jsx
  main.jsx
```

### 4. Key Features
- 流式响应 (SSE)
- 代码高亮
- 可折叠的 reasoning 显示
- 搜索开关（预留 Brave 接口）
- 对话历史（本地存储）
