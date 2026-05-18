// event-handler.js
import selectSvg from "./assets/select.svg";
import { _throttle, isPointInShip } from "./utils.js";
import loongship from "loongship-web";

class EventHandler {
  constructor(layer) {
    this._layer = layer;
    this._map = layer._getMap();

    this.state = {
      isPointer: false,
      hoveredMmsi: null,
      selected: new Map(),
      tooltip: null,
      isMapDragging: false,
    };

    this._onMouseMove = _throttle(this._handleMouseMove.bind(this), 16);
    this._onMouseLeave = this._handleMouseLeave.bind(this);
    this._onClick = this._handleClick.bind(this);
    // 🌟 新增：绑定右键处理函数
    this._onContextMenu = this._handleContextMenu.bind(this);

    this._onMapMoveStart = () => {
      this.state.isMapDragging = true;
    };
    this._onMapMoveEnd = () => {
      this.state.isMapDragging = false;
    };
  }

  bindEvents() {
    if (!this._map) return;
    this._map.on("mousemove", this._onMouseMove);
    this._map.on("mouseout", this._onMouseLeave);
    this._map.on("click", this._onClick);
    // 🌟 新增：监听地图的右键事件
    this._map.on("contextmenu", this._onContextMenu);

    this._map.on("movestart", this._onMapMoveStart);
    this._map.on("moveend", this._onMapMoveEnd);
  }

  unbindEvents() {
    if (!this._map) return;
    this._map.off("mousemove", this._onMouseMove);
    this._map.off("mouseout", this._onMouseLeave);
    this._map.off("click", this._onClick);
    // 🌟 新增：解绑右键事件
    this._map.off("contextmenu", this._onContextMenu);

    this._map.off("movestart", this._onMapMoveStart);
    this._map.off("moveend", this._onMapMoveEnd);

    this._removeTooltip();
    this.state.selected.forEach((item) => {
      this._map.removeLayer(item.marker);
    });
    this.state.selected.clear();
  }

  _getShipCenterScreenPoint(ship) {
    if (!ship._screenPoint) return null;

    const mapBearing =
      (this._map && this._map.getBearing && this._map.getBearing()) || 0;
    const heading = Number(ship.heading) || 0;
    const angle = (heading + mapBearing) * (Math.PI / 180);

    const width = ship._renderWidth || 0;
    const length = ship._renderLength || 0;

    const bow = Number(ship.toBow) || 0;
    const stern = Number(ship.toStern) || 0;
    const port = Number(ship.toPort) || 0;
    const starboard = Number(ship.toStarboard) || 0;

    const shipLength = Number(ship.length) || bow + stern || 0;
    const shipWidth = Number(ship.width) || port + starboard || 0;

    let ratioX = 0;
    let ratioY = 0;

    if ((bow > 0 || stern > 0) && shipLength > 0) {
      if (bow > 0) ratioY = 0.5 - bow / shipLength;
      else if (stern > 0) ratioY = stern / shipLength - 0.5;
    }

    if ((port > 0 || starboard > 0) && shipWidth > 0) {
      if (port > 0) ratioX = 0.5 - port / shipWidth;
      else if (starboard > 0) ratioX = starboard / shipWidth - 0.5;
    }

    const offsetX = ratioX * width;
    const offsetY = ratioY * length;

    const rotatedOffsetX =
      offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    const rotatedOffsetY =
      offsetX * Math.sin(angle) + offsetY * Math.cos(angle);

    return {
      x: ship._screenPoint.x + rotatedOffsetX,
      y: ship._screenPoint.y + rotatedOffsetY,
    };
  }

  _getShipLatLng(ship) {
    return ship._latLng || loongship.latLng(ship.lat, ship.lng);
  }

  _getShipFromEvent(e) {
    if (!e.containerPoint) return null;

    const mouseX = e.containerPoint.x;
    const mouseY = e.containerPoint.y;

    const ships = this._layer._getShips();
    const finalConfig = this._layer._getFinalConfig();
    const mapBearing =
      (this._map && this._map.getBearing && this._map.getBearing()) || 0;
    const dprBuffer = 15 * (window.devicePixelRatio || 1);

    let hitShip = null;

    for (const ship of ships.values()) {
      const point = ship._screenPoint;
      if (!point) continue;

      const width = ship._renderWidth || 0;
      const length = ship._renderLength || 0;

      const maxDimension = Math.max(width, length);
      const dynamicAABBThreshold = maxDimension * 2 + 20;

      if (
        Math.abs(mouseX - point.x) > dynamicAABBThreshold ||
        Math.abs(mouseY - point.y) > dynamicAABBThreshold
      ) {
        continue;
      }

      const centerPoint = this._getShipCenterScreenPoint(ship);
      if (!centerPoint) continue;

      const safeRadius = maxDimension * 1.5 + dprBuffer;

      if (
        Math.abs(mouseX - centerPoint.x) > safeRadius ||
        Math.abs(mouseY - centerPoint.y) > safeRadius
      ) {
        continue;
      }

      if (isPointInShip(mouseX, mouseY, ship, point, finalConfig, mapBearing)) {
        hitShip = ship;
      }
    }
    return hitShip;
  }

  _createSelectedMarker(ship) {
    const latLng = this._getShipLatLng(ship);
    return loongship
      .marker(latLng, {
        icon: loongship.icon({
          iconUrl: selectSvg,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
      })
      .addTo(this._map);
  }

  _getTooltipContent(ship) {
    const shipName = ship.nameCn || ship.name || "";
    if (!shipName) return "";

    return `
            <div class="ship-tooltip-content">
                ${shipName}</div>
            </div>
        `;
  }

  _setCursorPointer() {
    if (this.state.isPointer) return;
    this._map.getContainer().style.cursor = "pointer";
    this.state.isPointer = true;
  }

  _resetCursor() {
    if (!this.state.isPointer) return;
    this._map.getContainer().style.cursor = "";
    this.state.isPointer = false;
  }

  _showTooltip(ship) {
    this._removeTooltip();

    const content = this._getTooltipContent(ship);
    if (!content) return;

    const latLng = this._getShipLatLng(ship);
    this.state.tooltip = loongship
      .tooltip({
        permanent: false,
        direction: "top",
        offset: [0, -8],
        opacity: 0.9,
        className: "ship-tooltip",
      })
      .setLatLng(latLng)
      .setContent(content)
      .addTo(this._map);
  }

  _removeTooltip() {
    if (this.state.tooltip) {
      this._map.removeLayer(this.state.tooltip);
      this.state.tooltip = null;
    }
  }

  _handleMouseMove(e) {
    if (this.state.isMapDragging) return;

    const targetShip = this._getShipFromEvent(e);
    const targetMmsi = targetShip?.mmsi;
    const finalConfig = this._layer._getFinalConfig();

    if (targetMmsi) {
      this._setCursorPointer();

      if (targetMmsi !== this.state.hoveredMmsi) {
        if (this.state.hoveredMmsi) {
          const prevShip = this._layer._getShips().get(this.state.hoveredMmsi);
          if (prevShip) {
            this._layer.fire("ship:mouseleave", { ship: prevShip });
          }
        }

        this.state.hoveredMmsi = targetMmsi;
        this._layer.fire("ship:mouseenter", { ship: targetShip });

        if (finalConfig.tooltip?.enable !== false) {
          this._showTooltip(targetShip);
        }
      }
    } else {
      this._resetCursor();

      if (this.state.hoveredMmsi) {
        const prevShip = this._layer._getShips().get(this.state.hoveredMmsi);

        this.state.hoveredMmsi = null;
        this._removeTooltip();

        if (prevShip) {
          this._layer.fire("ship:mouseleave", { ship: prevShip });
        }
      }
    }
  }

  _handleMouseLeave() {
    this._resetCursor();

    if (this.state.hoveredMmsi) {
      const prevShip = this._layer._getShips().get(this.state.hoveredMmsi);

      this.state.hoveredMmsi = null;
      this._removeTooltip();

      if (prevShip) {
        this._layer.fire("ship:mouseleave", { ship: prevShip });
      }
    }
  }

  _handleClick(e) {
    if (this.state.isMapDragging) return;

    const targetShip = this._getShipFromEvent(e);
    if (targetShip) {
      this.selectByMmsi(targetShip.mmsi);
    }
  }

  // 🌟 新增：处理右键点击事件
  _handleContextMenu(e) {
    if (this.state.isMapDragging) return;

    // 碰撞检测：看鼠标当前是不是在某艘船上
    const targetShip = this._getShipFromEvent(e);

    // 向外部派发自定义的 'ship:contextmenu' 事件
    this._layer.fire("ship:contextmenu", {
      ship: targetShip,
      originalEvent: e.originalEvent, // 原生 DOM 事件，方便获取 e.clientX/Y 定位自定义菜单
      latlng: e.latlng, // 点击位置的经纬度
    });
  }

  handleShipsRemoved(mmsiList) {
    if (!Array.isArray(mmsiList)) return;

    mmsiList.forEach((mmsi) => {
      if (this.state.hoveredMmsi === mmsi) {
        const prevShip = this._layer._getShips().get(mmsi);

        this._resetCursor();
        this._removeTooltip();
        this.state.hoveredMmsi = null;

        if (prevShip) {
          this._layer.fire("ship:mouseleave", { ship: prevShip });
        }
      }

      if (this.state.selected.has(mmsi)) {
        this.unSelectByMmsi(mmsi);
      }
    });
  }

  selectByMmsi(mmsi) {
    const ships = this._layer._getShips();
    const targetShip = ships.get(mmsi);

    if (!targetShip) {
      console.warn(
        `[EventHandler] selectByMmsi: 未找到 MMSI 为 ${mmsi} 的船舶`,
      );
      return false;
    }

    if (!this.state.selected.has(mmsi)) {
      const marker = this._createSelectedMarker(targetShip);

      this.state.selected.set(mmsi, {
        ship: targetShip,
        marker,
      });

      const markerEl = marker.getElement();
      if (markerEl) {
        markerEl.style.pointerEvents = "none";
      }
    }

    this._layer.fire("ship:select", {
      selected: Array.from(this.state.selected.keys()),
      ship: targetShip,
    });

    return true;
  }

  unSelectByMmsi(mmsi) {
    if (!this.state.selected.has(mmsi)) {
      return false;
    }
    const { marker } = this.state.selected.get(mmsi);
    this._map.removeLayer(marker);
    this.state.selected.delete(mmsi);
  }

  unSelectAll() {
    if (this.state.selected.size) {
      this.state.selected.forEach((item) => {
        this._map.removeLayer(item.marker);
      });
      this.state.selected.clear();
    }
  }

  updateSelectedMarkerPosition() {
    this.state.selected.forEach(({ marker }, mmsi) => {
      const newShip = this._layer._getShips().get(mmsi);
      if (newShip) {
        const latLng = this._getShipLatLng(newShip);
        marker.setLatLng(latLng);
      }
    });

    if (this.state.tooltip && this.state.hoveredMmsi) {
      const hoverShip = this._layer._getShips().get(this.state.hoveredMmsi);
      if (hoverShip) {
        const latLng = this._getShipLatLng(hoverShip);
        this.state.tooltip.setLatLng(latLng);
      }
    }
  }

  getSelected() {
    return this.state.selected;
  }
}

export default EventHandler;
