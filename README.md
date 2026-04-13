<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# VTS 监管系统（VTS Prototype）

本项目是一个基于 **React + TypeScript + Vite** 的 VTS 监管系统前端原型，后续由 **GPT-5.3-Codex（OpenAI）** 协助维护。

## 项目结构

```text
.
├─ src/
│  ├─ components/
│  │  ├─ Map/                 # 地图及海事要素组件
│  │  ├─ Panels/              # 业务面板（管理、冲突、建议、动态回放等）
│  │  └─ Sidebar/             # 侧边栏
│  ├─ App.tsx                 # 应用入口组件
│  ├─ main.tsx                # 渲染入口
│  ├─ index.css               # 全局样式
│  └─ types.ts                # 类型定义
├─ index.html                 # 页面模板
├─ package.json               # 依赖与脚本
├─ tsconfig.json              # TypeScript 配置
└─ vite.config.ts             # Vite 配置
```

## 本地运行

**前置条件：** Node.js

1. 安装依赖：
   `npm install`
2. 在项目根目录创建 `.env.local`，并设置：
   `GEMINI_API_KEY=<你的 Gemini API Key>`
3. 启动开发环境：
   `npm run dev`
