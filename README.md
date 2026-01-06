# OpenMind 🧠

OpenMind 是一个现代化的、基于 AI 驱动的**视觉化头脑风暴工具**。它将你的思维导图与大语言模型（LLM）相结合，帮助你发现看似无关概念之间的隐秘联系，激发无限创意。

![OpenMind Banner](public/openmind.svg){: width="150px" }

## ✨ 主要功能 (Features)

- **♾️ 无限画布**: 基于 D3.js 构建的动态力导向图，支持无限缩放、平移和节点拖拽。
- **🤖 多模型支持**:
  - **Google Gemini**: 强大的免费/付费模型支持。
  - **DeepSeek**: 高性价比的中文语境强者。
  - **Local LLM**: 支持通过 Ollama/LMStudio 连接本地模型 (如 Qwen, Llama 3)，数据更隐私。
- **🔗 上下文联想 (Contextual Brainstorming)**:
  - 选择多个节点（右键多选），AI 会根据你选中的所有关键词作为**背景上下文**，生成具有关联性的新灵感。
  - 支持“桥接”概念：选中“艺术”和“科技”，AI 将尝试生成连接这两者的词汇。
- **🎨 极简美学**: 采用 Glassmorphism（毛玻璃）设计风格，配合流畅的动画效果。
- **🌏 双语模式**: 支持一键切换 中文/英文 显示，或中英对照模式。
- **📂 数据导出**: 支持将头脑风暴的结果导出为结构清晰的 JSON 文件。

## 🛠️ 技术栈 (Tech Stack)

- **Frontend**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Visualization**: D3.js (Force Simulation)
- **Styling**: Modern CSS3 (Variables, Backdrop-filter)

## 🚀 快速开始 (Getting Started)

### 前置要求

- Node.js (v16+)
- npm

### 安装

1.  克隆仓库:

    ```bash
    git clone https://github.com/alanhaskey/OpenMind.git
    cd OpenMind
    ```

2.  安装依赖:

    ```bash
    npm install
    ```

3.  启动开发服务器:
    ```bash
    npm run dev
    ```
4.  打开浏览器访问 `http://localhost:5173`。

## 📖 使用指南 (Usage)

1.  **配置 API**: 点击右下角 **API 设置** (齿轮图标)，输入你的 API Key (Gemini 或 DeepSeek)，或者配置本地模型地址。
2.  **开始风暴**:
    - 在底部输入框输入一个**核心词**（如 "未来"）。
    - **左键点击**节点：AI 自动展开相关的联想词。
    - **右键点击**节点：选中节点（变绿）。支持多选。
    - **上下文生成**：选中多个节点后，点击其中一个节点展开，AI 会结合所有选中节点的含义进行发散。
3.  **管理**:
    - **A/文**: 切换显示语言。
    - **导出**: 点击下载图标保存你的灵感图谱。
    - **重置**: 点击垃圾桶图标清空画布。

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！如果你有更好的 Prompt 或交互建议，请随时分享。

## 📄 License

MIT License
