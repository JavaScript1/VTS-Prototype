# 02. 路由与入口清单

## 1. 路由说明

当前项目未使用 `react-router` 等 URL 路由方案，而是使用组件状态控制页面切换。

因此这里的“路由”分为：

- 主工作台入口
- 覆盖层入口
- 后台管理内部路由
- 预警管理子路由

## 2. 主工作台入口

来源：
[src/features/app/AppView.tsx](/Applications/VTS/VTS-Prototype/src/features/app/AppView.tsx)
[src/features/app/components/AppSidebar.tsx](/Applications/VTS/VTS-Prototype/src/features/app/components/AppSidebar.tsx)

| 入口ID | 展示名称 | 触发方式 | 对应实现 |
| --- | --- | --- | --- |
| `ship` | 船舶 | 主侧栏标签切换 | `HomeShipDetailPanel` |
| `vhf` | VHF | 主侧栏标签切换 | `VhfPanel` |
| `intent` | 意图 | 主侧栏标签切换 | `IntentListPanel` |
| `warning` | 预警 | 主侧栏标签切换 | `WarningListPanel` |
| `anchorage` | 锚地 | 主侧栏标签切换 | `AnchoragePanel` |

## 3. 覆盖层入口

| 状态入口 | 展示名称 | 触发方式 | 对应实现 |
| --- | --- | --- | --- |
| `isAdminView` | 后台管理 | 顶部打开后台 | `AdminPanel` |
| `dynamicPlaybackSession` | 动态轨迹回放 | 风险回放触发 | `DynamicPlaybackView` |

## 4. 后台管理内部路由

来源：
[src/features/admin/AdminPanel.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/AdminPanel.tsx)

| 菜单名 | 当前状态 | 对应页面 |
| --- | --- | --- |
| 个人信息 | 占位 | `PlaceholderRoute` |
| 角色管理 | 占位 | `PlaceholderRoute` |
| 权限管理 | 占位 | `PlaceholderRoute` |
| 账号管理 | 占位 | `PlaceholderRoute` |
| 区域设置 | 已实现 | `AreaSettingsRoute` |
| 船舶动态 | 已实现 | `VesselDynamicsRoute` |
| 字典管理 | 占位 | `PlaceholderRoute` |
| 语音设置 | 占位 | `PlaceholderRoute` |
| 显示设置 | 占位 | `PlaceholderRoute` |
| 业务统计 | 已实现 | `BusinessStatsRoute` |
| 预警管理 | 已实现 | `WarningManagementRoute` |
| 场景演示 | 已实现 | `ScenarioDemoRoute` |

## 5. 预警管理子路由

来源：
[src/features/admin/routes/WarningManagementRoute.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/WarningManagementRoute.tsx)

| 子路由ID | 展示名称 | 当前状态 | 对应实现 |
| --- | --- | --- | --- |
| `实时预警` | 预警策略 | 已实现 | `WarningStrategyTab` |
| `风险列表` | 风险列表 | 已实现 | `WarningRiskListTab` |
| `风险统计` | 风险看板 | 已实现 | `WarningDashboardTab` |
| `重点区域` | 重点区域 | 已实现 | `WarningKeyAreasTab` |

## 6. 关键跳转链路

### 6.1 主工作台 -> 后台管理

1. 用户点击顶栏后台入口。
2. `isAdminView` 置为 `true`。
3. 显示后台整屏视图。

### 6.2 风险列表 -> 动态回放

1. 用户在预警管理风险列表中点击“回放”。
2. 系统通过 `getRiskPlaybackSession` 生成回放会话。
3. `dynamicPlaybackSession` 生效，打开全屏回放。

### 6.3 船舶动态 -> 地图定位

1. 用户在后台“船舶动态”中点击“定位”。
2. 系统将船舶和事件对象传给地图联动状态。
3. 地图聚焦到目标位置。
