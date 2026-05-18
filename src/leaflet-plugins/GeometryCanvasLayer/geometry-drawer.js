// geometry-drawer.js
export default class GeometryDrawer {

    // 绘制多边形（区域面）
    drawPolygon(ctx, geo, globalAlpha = 1) {
        if (!geo._path2d) return;

        ctx.save();
        ctx.globalAlpha = globalAlpha;
        const style = geo.style || {};

        if (style.fillColor) {
            ctx.fillStyle = style.fillColor;
            // 🌟 拿着印章直接填色
            ctx.fill(geo._path2d);
        }

        if (style.strokeColor && style.strokeWidth) {
            ctx.strokeStyle = style.strokeColor;
            ctx.lineWidth = style.strokeWidth;
            if (style.dashArray) ctx.setLineDash(style.dashArray);
            // 🌟 拿着印章直接描边
            ctx.stroke(geo._path2d);
        }

        ctx.restore();
    }

    // 绘制折线（轨迹线）
    drawPolyline(ctx, geo, globalAlpha = 1) {
        if (!geo._path2d) return;

        ctx.save();
        ctx.globalAlpha = globalAlpha;
        const style = geo.style || {};

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = style.strokeColor || 'red';
        ctx.lineWidth = style.strokeWidth || 2;
        if (style.dashArray) ctx.setLineDash(style.dashArray);

        // 🌟 拿着印章直接画线，无视点位数量
        ctx.stroke(geo._path2d);

        ctx.restore();
    }
}