# VTS Prototype Project Structure Skill

本文件用于帮助模型快速理解仓库结构、入口关系和代码定位方式。

## 1. 快速定位

- 应用入口：`src/main.tsx`
- 根组件壳：`src/App.tsx`
- 主页面装配层：`src/features/app/AppView.tsx`
- 全局类型：`src/types.ts`
- mock 数据总出口：`src/mockData.ts`
- mock 数据拆分目录：`src/mock/`
- 通用工具：`src/utils/`
- 样式入口：`src/index.css`

## 2. 当前推荐阅读顺序

当需要理解项目时，优先按下面顺序阅读：

1. `AGENTS.md`
2. `PROJECT_STRUCTURE_SKILL.md`
3. `src/App.tsx`
4. `src/features/app/AppView.tsx`
5. 对应 `src/features/<feature>/index.ts`
6. 再进入 `src/components/` 或 feature 内部实现

## 3. 目录职责

### 根目录

- `AGENTS.md`
  项目级工作说明，包含技术栈、常用命令、约定。
- `README.md`
  项目基础介绍。
- `package.json`
  依赖与脚本入口。
- `vite.config.ts`
  Vite 构建配置。
- `tsconfig.json`
  TypeScript 配置。
- `dist/`
  构建产物，不作为业务源码阅读入口。

### `src/`

- `App.tsx`
  只作为应用入口壳，原则上不承载复杂业务逻辑。
- `main.tsx`
  React 挂载入口。
- `index.css`
  全局样式。
- `types.ts`
  共享类型定义。
- `mockData.ts`
  mock 数据聚合出口，实际数据按主题拆分在 `src/mock/`。
- `mock/`
  按业务主题拆分的模拟数据目录，避免数据文件继续膨胀。
- `utils/`
  非 UI 工具方法。
- `components/`
  可复用的 UI 组件和大型展示组件。
- `features/`
  按业务功能分组的 feature 入口，是主要阅读路径。

## 4. Feature 结构

### `src/features/app/`

- `AppView.tsx`
  主页面装配层。只保留页面状态、派生数据和 feature 拼装，不再承载大段内联 UI。
- `components/`
  首页壳层子组件，例如顶部栏、底部栏、侧栏装配、地图装配等。
  - `AppBottomBar.tsx`
  - `AppHomeMap.tsx`
  - `AppHomeWorkspace.tsx`
  - `AppModeRightRail.tsx`
  - `AppSidebar.tsx`
  - `AppTopBar.tsx`
  - `MarqueeText.tsx`
  - `MessagePushAvatar.tsx`
  - `MessagePushPanel.tsx`
- `utils/`
  首页相关工具函数，按锚地、船舶、VHF、回放等主题拆分。
  - `homeViewData.ts`
    首页常规模式和多模式工作台共用的数据派生逻辑。
  - `messagePushConfig.ts`
    智能值班消息推送的频率、权重模板和数字人状态映射。
- `viewModes.ts`
    主页面顶部模式路由定义，例如常规模式、智能值班模式、风险分析、执法力量、应急力量等。
- `index.ts`
  feature 对外统一出口。

### `src/features/map/`

- `index.ts`
  地图相关控制器和状态同步能力的统一出口。
- 实际实现当前复用 `src/components/Map/MapComponents.tsx`

### `src/features/sidebar/`

- `index.ts`
  侧边栏 feature 出口。
- 当前实际面板实现复用 `src/components/Sidebar/SidebarPanel.tsx`

### `src/features/vhf/`

- `index.ts`
  VHF 功能出口。
- 当前主要实现复用 `src/components/Panels/VhfPanel.tsx`

### `src/features/law-enforcement/`

- `LawEnforcementView.tsx`
  执法力量主页面，集成违法甄别、证据链分析与拦截规划功能。
- `index.ts`
  对外出口。

### `src/features/ship-detail/`

- `index.ts`
  船舶详情 feature 出口。
- 当前主要实现复用 `src/components/Panels/HomeShipDetailPanel.tsx`

### `src/features/warning/`

- `components/WarningListPanel.tsx`
  预警列表主面板。
- `index.ts`
  对外出口。

### `src/features/intent/`

- `components/IntentListPanel.tsx`
  意图列表主面板。
- `index.ts`
  对外出口。

### `src/features/anchorage/`

- `components/AnchoragePanel.tsx`
  锚地态势主面板装配层。
- `components/AnchorageShipCard.tsx`
  锚地船舶展开卡片。
- `components/AnchorageDistributions.tsx`
  锚地分布图表区块。
- `index.ts`
  对外出口。

### `src/features/admin/`

- `AdminPanel.tsx`
  后台管理主壳。
- `routes/`
  后台管理按路由拆分的页面实现，每个路由单独成文件。
- `routes/warning/`
  预警管理子目录，策略页、风险列表、风险看板、宏观态势及其局部子组件/静态数据都放在这里，例如 `warningDashboardData.ts`、`MacroTrendTab.tsx`。
- `index.ts`
  对外出口。

### `src/features/risk-analysis/`

- `RiskAnalysisView.tsx`
  风险分析模式主壳，负责左侧导航和子模块切换。
- `RiskMacroTrend.tsx`
  宏观态势主视图，承载热力地图、热点排行与时间轴回放。
- `RiskPlaybackCenter.tsx`
  风险分析模式下的回放中心，支持按普通预警与碰撞预警两种模式复用，右侧主内容区内直接嵌入回放。
- `riskMacroTrendData.ts`
  宏观态势的假数据、热区配置与时间帧序列。
- `RiskWarningManagement.tsx`
  风险分析模式下的预警管理子页。
- `RiskAdminConsole.tsx`
  风险分析模式下的后台管理子页。

当前后台路由文件包括：

- `AreaSettingsRoute.tsx`
- `VesselDynamicsRoute.tsx`
- `BusinessStatsRoute.tsx`
- `WarningManagementRoute.tsx`
- `ScenarioDemoRoute.tsx`
- `PlaceholderRoute.tsx`

## 5. Components 结构

### `src/components/Map/`

- `MapComponents.tsx`
  地图控制器、地图同步、地图交互相关实现。

### `src/components/Sidebar/`

- `SidebarPanel.tsx`
  左侧导航和主侧栏 UI。

### `src/components/Panels/`

该目录放置仍然被多个 feature 复用的业务面板组件，页面级逻辑应继续向 `src/features/` 下沉。

当前可见的关键文件：

- `DynamicPlaybackView.tsx`
- `playback/PlaybackMapHelpers.tsx`
- `playback/collisionPlayback.ts`
- `playback/PlaybackAreaSelector.tsx`
- `playback/PlaybackInfoSidebar.tsx`
- `playback/PlaybackStatusSidebar.tsx`
- `FloatingPanels.tsx`
- `HomeShipDetailPanel.tsx`
- `VhfPanel.tsx`
- `IntentConflictPanel.tsx`
- `SystemSuggestionPanel.tsx`
- `CrewApplicationPanel.tsx`

说明：

- 后台管理旧版大文件 `components/Panels/AdminPanel.tsx` 已移除，当前统一使用 `src/features/admin/`。
- 若需要继续重构，优先把 `components/Panels` 中仍然偏业务型的大组件继续下沉到 `src/features/`。
- `DynamicPlaybackView.tsx` 的地图辅助逻辑已拆到 `playback/PlaybackMapHelpers.tsx`，碰撞回放态势假数据与预警多边形计算放在 `playback/collisionPlayback.ts`。
- `components/` 更适合放通用展示组件，不适合继续堆叠页面级业务逻辑。

## 6. 代码定位规则

模型在处理需求时，按以下规则定位文件：

- 修改应用入口或挂载行为：看 `src/main.tsx`、`src/App.tsx`
- 修改首页或总装配逻辑：看 `src/features/app/AppView.tsx`
- 修改地图交互：先看 `src/features/map/`，再看 `src/components/Map/MapComponents.tsx`
- 修改侧边栏：先看 `src/features/sidebar/`
- 修改 VHF：先看 `src/features/vhf/`
- 修改船舶详情：先看 `src/features/ship-detail/`
- 修改预警列表：先看 `src/features/warning/`
- 修改意图列表：先看 `src/features/intent/`
- 修改锚地态势：先看 `src/features/anchorage/`
- 修改后台管理：先看 `src/features/admin/`，具体页面再看 `routes/`
- 修改类型：看 `src/types.ts`
- 修改静态模拟数据：先看 `src/mockData.ts`，再进入 `src/mock/` 对应主题文件
- 修改 VHF 会话聚合工具：看 `src/utils/vhfConversation.ts`

## 7. 当前架构约束

- `App.tsx` 应保持为薄入口文件，不承担复杂业务实现。
- 新增业务能力时，优先进入 `src/features/`，不要继续把页面级逻辑堆回 `App.tsx`。
- 单个源码文件应尽量控制在 500 行以内，优先通过 feature 子组件、hooks、utils 继续拆分。
- 后台管理按路由拆分，每个路由一个独立文件。
- 新的复杂业务面板，优先归入对应 feature 文件夹，而不是直接塞进 `src/components/Panels/`。
- 共享类型放 `src/types.ts`；若后续增长明显，可再拆成 feature types。
- `src/mockData.ts` 仅作为 barrel 文件，实际大块 mock 数据继续拆在 `src/mock/`。

## 8. 模型工作建议

当任务是“继续拆分结构”时，优先采用以下策略：

1. 先从 `src/features/app/AppView.tsx` 找出页面级内联组件。
2. 将该组件迁移到 `src/features/<feature>/` 或 `src/components/` 的明确子目录。
3. 为该 feature 保留 `index.ts` 作为统一出口。
4. 再回到 `AppView.tsx`，只保留装配、状态流转和少量页面级协调逻辑。

当任务是“改某个功能”时：

1. 优先改 feature 出口后的实现文件。
2. 避免直接在根入口做大改。
3. 改完后检查是否可以顺手继续消除跨 feature 的耦合。

## 9. 一个简化后的树

```text
.
├── AGENTS.md
├── PROJECT_STRUCTURE_SKILL.md
├── package.json
├── vite.config.ts
└── src
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types.ts
    ├── mock
    ├── mockData.ts
    ├── utils
    │   └── vhfConversation.ts
    ├── components
    │   ├── Map
    │   ├── Panels
    │   └── Sidebar
    └── features
        ├── app
        │   ├── components
        │   └── utils
        ├── admin
        │   └── routes
        ├── anchorage
        │   └── components
        ├── intent
        ├── map
        ├── ship-detail
        ├── sidebar
        ├── vhf
        └── warning
```

## 10. 一句话总结

这个项目当前应按“`App.tsx` 入口壳 -> `features/app/AppView.tsx` 装配层 -> feature 子组件/工具 -> 通用 components/utils/types`”的路径来理解和修改。
