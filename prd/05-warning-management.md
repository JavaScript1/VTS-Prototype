# 05. 预警管理 PRD

## 1. 模块定位

预警管理是后台管理中的核心模块，负责承载预警规则管理、风险事件管理、风险统计看板和重点区域监控。

来源：
[src/features/admin/routes/WarningManagementRoute.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/WarningManagementRoute.tsx)

## 2. 模块目标

- 管理预警规则与生效区域
- 查看和筛选风险事件
- 对风险进行有效/无效等处置操作
- 查看风险趋势、分布、等级和重点对象
- 从风险事件直接进入动态回放

## 3. 子模块需求

### 3.1 预警策略

对应实现：
[src/features/admin/routes/warning/WarningStrategyTab.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/WarningStrategyTab.tsx)
[src/features/admin/routes/warning/WarningRuleConfigModal.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/WarningRuleConfigModal.tsx)

当前需求：

- 展示规则列表与启用状态
- 支持规则开关
- 支持打开规则配置弹层
- 支持编辑规则名称、预警类型、预警等级、描述
- 支持配置生效区域

### 3.2 风险列表

对应实现：
[src/features/admin/routes/warning/WarningRiskListTab.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/WarningRiskListTab.tsx)
[src/features/admin/routes/warning/warningRiskListData.ts](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/warningRiskListData.ts)

当前需求：

- 按时间、区域、预警类型、状态、误报、等级筛选
- 支持船名/MMSI 搜索
- 支持导出报表
- 以大表格形式显示风险记录
- 支持“回放 / 无效 / 有效”操作
- 支持分页

### 3.3 风险看板

对应实现：
[src/features/admin/routes/warning/WarningDashboardTab.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/WarningDashboardTab.tsx)
[src/features/admin/routes/warning/WarningDashboardFocusList.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/WarningDashboardFocusList.tsx)
[src/features/admin/routes/warning/warningDashboardData.ts](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/warningDashboardData.ts)

当前需求：

- 支持昨日/月度/年度分析切换
- 展示预警趋势
- 展示风险维度分布
- 展示船舶类型分布
- 展示预警等级占比
- 展示高频风险区域
- 展示高风险关注名单
- 名单支持分页

### 3.4 重点区域

对应实现：
[src/features/admin/routes/warning/WarningKeyAreasTab.tsx](/Applications/VTS/VTS-Prototype/src/features/admin/routes/warning/WarningKeyAreasTab.tsx)

当前需求：

- 展示重点监控区域概览卡片
- 展示区域风险趋势占位区
- 展示高频违章类型分布

## 4. 动态回放闭环

风险列表与场景演示都会进入动态回放。

对应实现：
[src/features/app/utils/playback.ts](/Applications/VTS/VTS-Prototype/src/features/app/utils/playback.ts)
[src/components/Panels/DynamicPlaybackView.tsx](/Applications/VTS/VTS-Prototype/src/components/Panels/DynamicPlaybackView.tsx)

当前需求：

- 由风险对象生成回放会话
- 显示顶部时间轴与倍速控制
- 显示左侧风险信息、船舶信息、动态信息、天气信息、关联辖区
- 在地图上显示轨迹、风险触发点和区域覆盖层

## 5. 数据依赖

当前主要依赖：

- `INITIAL_WARNING_RULES`
- `MOCK_RISK_STATS`
- `MOCK_AREAS`
- `AREA_CATEGORIES`

## 6. 验收建议

### 6.1 规则侧

- 规则可启停
- 规则配置弹层可正常打开和关闭
- 生效区域可勾选与重置

### 6.2 列表侧

- 筛选和搜索能影响结果集
- 分页可用
- 回放按钮能打开回放

### 6.3 看板侧

- 各统计区块展示完整
- 分析 tab 可切换

### 6.4 回放侧

- 从风险列表进入回放成功
- 时间轴、倍速、地图、左侧信息栏联动正常
