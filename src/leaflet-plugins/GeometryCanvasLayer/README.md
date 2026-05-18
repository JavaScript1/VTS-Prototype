# GeometryCanvasLayer 高性能几何动效图层

基于 Canvas 2D API 与 `requestAnimationFrame` 打造的 Leaflet 高性能几何图形渲染引擎。专为海量轨迹线、大型预警面渲染以及高频动态闪烁（如雷达探测、禁航区报警）场景设计。

## ✨ 核心特性

- **动静分离渲染架构**：底层采用双层 Canvas 画布。静态图形零消耗渲染（休眠），动态图形单层高频重绘，互不干扰。
- **千图千闪（独立频率）**：图形刷新率(FPS)与动画速度完全解耦。基于绝对时间的数学正弦波推算，支持为每个图形独立设置“呼吸”频率，1万个多边形也能各自以不同频率流畅呼吸。
- **显卡级印章缓存**：内置 `Path2D` 路径印章缓存技术。彻底无视顶点数量，图形渲染复杂度降至 $O(1)$，超长复杂轨迹平移缩放绝不掉帧。
- **局部状态更新 (Upsert)**：支持类似数据库的局部字段覆盖更新。仅修改图形颜色或闪烁状态时，无需重传坐标集合。

------

## 🚀 1. 图层初始化

在实例化图层时，可以传入全局兜底配置项。

JavaScript

```
import GeometryCanvasLayer from './index-geometry.js';

// 初始化图层，设定全局默认“呼吸”频率为 1 次/秒
const effectLayer = new GeometryCanvasLayer({
    frequency: 1 
});

// 添加到地图实例
effectLayer.addTo(map);
```

------

## 🎨 2. 图形数据配置项 (Item Options)

在使用 `addGeometry` 时传入的数据结构。

JavaScript

```
effectLayer.addGeometry({
    id: 'danger_zone_01',
    type: 'polygon',
    latLngs: [[30.1, 120.1], [30.2, 120.1], [30.2, 120.2]],
    style: {
        fillColor: 'rgba(255, 0, 0, 0.4)',
        strokeColor: '#FF0000',
        strokeWidth: 2,
        dashArray: [5, 5]
    },
    isBlink: true,
    frequency: 5 // 独立配置：该区域每秒呼吸5次
});
```

### 基础属性

| **参数名**  | **类型**  | **必填** | **默认值** | **说明**                                                     |
| ----------- | --------- | -------- | ---------- | ------------------------------------------------------------ |
| `id`        | `String`  | 否       | 自动生成   | 图形的唯一标识。若不传，底层将自动生成并返回唯一 ID。后续更新/删除强依赖此 ID。 |
| `type`      | `String`  | **是**   | -          | 图形类型。支持 `'polygon'` (闭合多边形/面) 或 `'polyline'` (折线/轨迹)。 |
| `latLngs`   | `Array`   | **是**   | -          | 经纬度点集合。支持格式：`[[lat, lng], ...]` 或 `[{lat, lng}, ...]`。 |
| `isBlink`   | `Boolean` | 否       | `false`    | **核心状态**。设为 `true` 开启呼吸动效（升至动态层）；设为 `false` 变为静态图形（降至静态层）。 |
| `frequency` | `Number`  | 否       | 全局配置   | **独立频率**。为当前图形单独指定呼吸频率（次/秒）。不传则使用初始化时的全局频率。 |

### 样式属性 (style)

| **参数名**    | **类型** | **默认值** | **说明**                                                     |
| ------------- | -------- | ---------- | ------------------------------------------------------------ |
| `fillColor`   | `String` | 无         | 内部填充色（仅 `polygon` 生效）。支持 `rgba`, `hex`, 颜色名。 |
| `strokeColor` | `String` | `'red'`    | 边框/线条颜色。                                              |
| `strokeWidth` | `Number` | `2`        | 边框/线条的像素宽度。                                        |
| `dashArray`   | `Array`  | 无         | 虚线配置。如 `[5, 5]` 表示 5px 实线交替 5px 空白。           |

------

## 🛠️ 3. API 接口文档

### `addGeometry(data)`

创建并添加一个新的图形到地图上。

- **参数**: `data` (Object) - 图形数据配置。
- **返回值**: `String` - 成功创建的图形唯一 `id`。

JavaScript

```
const trackId = effectLayer.addGeometry({ type: 'polyline', latLngs: [...] });
```

### `updateGeometry(id, partialData)`

**高性能局部更新。** 通过 ID 更新特定图形的属性，支持仅更新状态，自动保留其他未修改的字段。

- **参数**:
    - `id` (String) - 目标图形的 ID。
    - `partialData` (Object) - 需要覆盖的属性对象。

JavaScript

```
// 示例：警报解除，关闭区域的闪烁，并将边框改回绿色（原有的坐标点和线宽将自动保留）
effectLayer.updateGeometry('danger_zone_01', {
    isBlink: false,
    style: { strokeColor: 'green' }
});
```

### `removeGeometry(id)`

从地图上彻底销毁指定的图形，释放内存。

- **参数**: `id` (String) - 目标图形 ID。

### `clearGeometries()`

一键清空当前图层上的所有图形。适用于路由跳转、页面切换或模块重置