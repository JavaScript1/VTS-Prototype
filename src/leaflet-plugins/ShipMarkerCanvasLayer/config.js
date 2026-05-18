export default {
  tooltip: {
    enable: true,
  },
  ship: {
    iconSize: [12, 34],
    minIconSize: [6, 12],
    isRealShip: true,
    shape: "default",
    fillColor: "rgba(9,181,18,1)",
    strokeWidth: 2,
    strokeColor: "rgba(9,181,18,1)",
  },

  blink: {
    frequency: 2,
    activeColor: "rgba(255, 0, 0, 1)",
    inactiveColor: "rgba(255, 0, 0, .3)",
    mode: "whole",
  },

  shipOutline: {
    enable: true,
    lineWidth: 0.5,
    color: "rgba(0,0,0,0.2)",
  },

  predictionLine: {
    show: false,
    minZoom: 14,
    minSpeed: 0,
    timeMinutes: 2,
    pointCount: 100,
    color: "rgba(9,181,18,1)",
    dashArray: [4, 0],
    lineWidth: 1.5,
    maxRot: 360,
  },

  lod: {
    enable: true,
    levels: [
      { maxZoom: 10, shape: "dot", forceSize: [4, 4], simplifyBlink: true },
      { maxZoom: 12, shape: "dot", forceSize: [4, 4], simplifyBlink: true },
      { maxZoom: Infinity },
    ],
  },

  shapeTemplates: {},
};
