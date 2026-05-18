// ShipMarkerCanvasLayer/index.js
import loongship from "loongship-web";
import ShipRenderer from "./drawer.js";
import EventHandler from "./event-handler.js";
import OverlayManager from "./overlay.js";
import DataManager from "./data-manager.js";
import CanvasManager from "./canvas-manager.js";
import AnimationManager from "./animation-manager.js";
import RenderPipeline from "./render-pipeline.js";
import config from "./config.js";
import { deepMerge } from "./utils.js";

class ShipCanvasLayer extends loongship.Layer {
  constructor(ships = [], options = {}) {
    super();
    this._finalConfig = deepMerge(config, options);
    this._overlayConfig = this._finalConfig.overlay || {};

    this._dataManager = new DataManager(this._finalConfig);
    this._dataManager.setShips(ships);

    this._map = null;
    this._canvasManager = null;
    this._animationManager = null;
    this._renderer = null;
    this._eventHandler = null;
    this._overlayManager = null;

    this._renderPipeline = new RenderPipeline(this);
    this.loongship = loongship;

    this._handleResize = this._handleResize.bind(this);
    // 🌟 移除 move 和 rotate 的绑定函数引用
    // this._handleMove = this._handleMove.bind(this);
    this._handleMoveEnd = this._handleMoveEnd.bind(this);
    this._handleZoomEnd = this._handleZoomEnd.bind(this);
  }

  onAdd(map) {
    this._map = map;

    this._canvasManager = new CanvasManager(map);
    this._renderer = new ShipRenderer(this);
    this._eventHandler = new EventHandler(this);
    this._eventHandler.bindEvents();

    this._overlayManager = new OverlayManager(this);
    this._overlayManager.init(this._overlayConfig, map);

    this._dataManager.processData(this._map.getZoom());

    this._animationManager = new AnimationManager(this._finalConfig);
    this._animationManager.start((state) => {
      this._renderPipeline.render(state, {
        map: this._map,
        canvasManager: this._canvasManager,
        dataManager: this._dataManager,
        renderer: this._renderer,
        overlayManager: this._overlayManager,
        eventHandler: this._eventHandler,
        config: this._finalConfig,
      });
    }, this._dataManager);

    this._map.on("resize", this._handleResize);

    // 🌟 核心修改：注释掉下面两行，拖动期间不进行全量重绘
    // this._map.on('move', this._handleMove);
    // this._map.on('rotate', this._handleMove);

    this._map.on("moveend", this._handleMoveEnd);
    this._map.on("zoomend", this._handleZoomEnd);
  }

  onRemove() {
    this._map.off("resize", this._handleResize);

    // 🌟 核心修改：同步移除
    // this._map.off('move', this._handleMove);
    // this._map.off('rotate', this._handleMove);

    this._map.off("moveend", this._handleMoveEnd);
    this._map.off("zoomend", this._handleZoomEnd);

    this._eventHandler.unbindEvents();

    this._animationManager.stop();
    this._canvasManager.destroy();
    this._overlayManager.clearOverlay();
    this._dataManager.clear();

    this._map = null;
    this._renderer = null;
    this._eventHandler = null;
    this._overlayManager = null;
    this._canvasManager = null;
    this._animationManager = null;
  }

  _handleResize() {
    this._canvasManager.resize();
    this._animationManager.setDirty();
  }

  // 🌟 该方法已弃用，可以删除或保留注释
  // _handleMove() {
  //     this._animationManager.setDirty();
  // }

  _handleMoveEnd() {
    this._animationManager.setDirty();
  }

  _handleZoomEnd() {
    this._dataManager.processData(this._map.getZoom());
    this._animationManager.setDirty();
  }

  _getMap() {
    return this._map;
  }
  _getCanvas() {
    return this._canvasManager?.getDynamicCanvas();
  }
  _getShips() {
    return this._dataManager.getRenderShips();
  }
  _getOverlayConfig() {
    return this._overlayConfig;
  }
  _getFinalConfig() {
    return this._finalConfig;
  }

  removeShips(mmsiList, isReDraw) {
    if (!Array.isArray(mmsiList) || mmsiList.length === 0) return;

    this._eventHandler?.handleShipsRemoved(mmsiList);
    this._overlayManager?.removeOverlaysByMmsiList(mmsiList);
    this._dataManager.removeShips(mmsiList);

    if (this._map) {
      this._dataManager.processData(this._map.getZoom());
    }
    isReDraw && this._animationManager?.setDirty();
  }

  updateShips(ships) {
    this._dataManager.setShips(ships);
    if (this._map) this._dataManager.processData(this._map.getZoom());
    this._animationManager?.setDirty();
  }

  updateShip(ship) {
    if (!ship?.mmsi) return;
    this._dataManager.updateShip(ship);
    if (this._map) this._dataManager.processData(this._map.getZoom());
    this._animationManager?.setDirty();
  }

  unSelectByMmsi(mmsi) {
    this._eventHandler?.unSelectByMmsi(mmsi);
  }

  selectByMmsi(mmsi) {
    this._eventHandler?.selectByMmsi(mmsi);
  }

  unSelectAll() {
    this._eventHandler?.unSelectAll();
  }

  getRenderShips() {
    return this._dataManager.getRenderShips();
  }

  updateSelectedMarkerPosition() {
    this._eventHandler?.updateSelectedMarkerPosition();
  }

  clearOverlay() {
    this._overlayManager?.clearOverlay();
  }

  updateOverlay() {
    this._overlayManager?.updateOverlay();
  }

  getSelected() {
    return this._eventHandler.getSelected();
  }
}

loongship.shipCanvasLayer = function (ships, options = {}) {
  return new ShipCanvasLayer(ships, options);
};

export default ShipCanvasLayer;
