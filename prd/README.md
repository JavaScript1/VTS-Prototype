# VTS Prototype PRD

本目录用于沉淀当前项目的产品需求文档。

这些文档基于当前代码中的真实入口、状态路由和后台菜单生成，适合用于：

- 快速理解系统功能边界
- 对照页面与代码结构梳理需求
- 后续补充接口、交互和验收标准

阅读顺序建议：

1. [01-product-overview.md](/Applications/VTS/VTS-Prototype/prd/01-product-overview.md)
2. [02-route-inventory.md](/Applications/VTS/VTS-Prototype/prd/02-route-inventory.md)
3. [03-main-workbench.md](/Applications/VTS/VTS-Prototype/prd/03-main-workbench.md)
4. [04-admin-console.md](/Applications/VTS/VTS-Prototype/prd/04-admin-console.md)
5. [05-warning-management.md](/Applications/VTS/VTS-Prototype/prd/05-warning-management.md)

说明：

- 当前项目不是传统的 URL 路由应用。
- 主页面、全屏回放、后台管理、后台子页签都主要通过前端状态切换驱动。
- 因此本文档中的“路由”包含：
  - 主工作台一级入口
  - 覆盖层入口
  - 后台内部菜单
  - 预警管理子页签
