export const SHIP_SHAPE_TEMPLATES = {
  yacht: {
    label: "高速船",
    order: 10,
    body: {
      outerPath: [
        ["M", -0.5, 0.35],
        ["L", -0.5, -0.35],
        ["Q", -0.5, -0.5, 0, -0.5],
        ["Q", 0.5, -0.5, 0.5, -0.35],
        ["L", 0.5, 0.35],
        ["Q", 0.5, 0.5, 0, 0.5],
        ["Q", -0.5, 0.5, -0.5, 0.35],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [],
  },
  fishing: {
    label: "渔船",
    order: 20,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["Q", -0.5, -0.5, 0, -0.5],
        ["Q", 0.5, -0.5, 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      cutouts: [
        {
          path: [
            ["M", -0.5, -0.2],
            ["L", 0.5, -0.2],
            ["L", 0.5, 0.5],
            ["L", -0.5, 0.5],
            ["Z"],
          ],
        },
      ],
      paintMode: "fill",
      fillRule: "evenodd",
    },
    decorations: [
      {
        type: "path",
        paintMode: "stroke",
        path: [
          ["M", -0.5, 0.5],
          ["L", -0.5, -0.2],
          ["Q", -0.5, -0.5, 0, -0.5],
          ["Q", 0.5, -0.5, 0.5, -0.2],
          ["L", 0.5, 0.5],
          ["Z"],
        ],
      },
    ],
  },
  tugboat: {
    label: "拖船",
    order: 30,
    body: {
      outerPath: [
        ["M", 0, -0.5],
        ["Q", -0.7, -0.3, 0, -0.1],
        ["Q", 0.7, -0.3, 0, -0.5],
        ["M", 0, -0.1],
        ["Q", -0.3, -0.1, -0.5, 0.1],
        ["L", -0.5, 0.5],
        ["L", 0.5, 0.5],
        ["L", 0.5, 0.1],
        ["Q", 0.3, -0.1, 0, -0.1],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [],
  },
  dredger: {
    label: "疏浚作业船",
    order: 40,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["L", 0, -0.5],
        ["L", 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [
      {
        type: "path",
        paintMode: "stroke",
        strokeWidth: 0.5,
        path: [
          ["M", -0.2, -0.3],
          ["L", -0.2, 0.5],
          ["M", 0, -0.5],
          ["L", 0, 0.5],
          ["M", 0.2, -0.3],
          ["L", 0.2, 0.5],
        ],
      },
    ],
  },
  military: {
    label: "军事船",
    order: 50,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["Q", 0, -0.8, 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [
      {
        type: "path",
        paintMode: "stroke",
        strokeWidth: 1,
        path: [
          ["M", 0, -0.5],
          ["L", 0, 0.5],
        ],
      },
    ],
  },
  sailing: {
    label: "帆船",
    order: 60,
    body: {
      outerPath: [
        ["M", -0.5, 0.35],
        ["L", -0.5, -0.35],
        ["Q", -0.5, -0.5, 0, -0.5],
        ["Q", 0.5, -0.5, 0.5, -0.35],
        ["L", 0.5, 0.5],
        ["L", -0.5, 0.5],
        ["L", -0.5, 0.35],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [
      {
        type: "path",
        paintMode: "stroke",
        strokeWidth: 1,
        path: [
          ["M", 0, -0.5],
          ["L", 0, 0.5],
        ],
      },
      {
        type: "path",
        paintMode: "stroke",
        strokeWidth: 1,
        path: [
          ["M", -0.5, 0],
          ["L", 0.5, 0],
        ],
      },
    ],
  },
  pilot: {
    label: "引航船",
    order: 70,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["Q", -0.5, -0.5, 0, -0.5],
        ["Q", 0.5, -0.5, 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      cutouts: [
        {
          path: [
            ["M", 0, -0.5],
            ["Q", -0.5, -0.5, -0.5, -0.2],
            ["L", -0.5, 0.2],
            ["L", 0.5, 0.2],
            ["L", 0.5, -0.2],
            ["Q", 0.5, -0.5, 0, -0.5],
            ["Z"],
          ],
        },
      ],
      paintMode: "fill",
      fillRule: "evenodd",
    },
    decorations: [],
  },
  sar: {
    label: "搜救船",
    order: 80,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["Q", 0, -0.8, 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [
      {
        type: "path",
        paintMode: "stroke",
        strokeWidth: 1,
        path: [
          ["M", -0.408, -0.3],
          ["L", 0.408, -0.3],
          ["M", -0.5, -0.1],
          ["L", 0.5, -0.1],
          ["M", -0.5, 0.1],
          ["L", 0.5, 0.1],
          ["M", -0.5, 0.3],
          ["L", 0.5, 0.3],
        ],
      },
    ],
  },
  tug: {
    label: "拖带船",
    order: 90,
    body: {
      outerPath: [
        ["M", 0, -0.5],
        ["Q", -1.0, 0, 0, 0.5],
        ["Q", 1.0, 0, 0, -0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [],
  },
  passenger: {
    label: "客船",
    order: 100,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["Q", 0, -0.8, 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [],
  },
  cargo: {
    label: "货船",
    order: 110,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.3],
        ["Q", 0, -0.7, 0.5, -0.3],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      cutouts: [
        {
          path: [
            ["M", -0.4, -0.05],
            ["L", -0.4, 0.25],
            ["L", 0.4, 0.25],
            ["L", 0.4, -0.05],
            ["Z"],
          ],
        },
      ],
      paintMode: "fill",
      fillRule: "evenodd",
      strokeWidth: 0,
    },
    decorations: [],
  },
  tanker: {
    label: "油轮",
    order: 120,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["Q", 0, -0.8, 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [
      {
        type: "dynamicCircles",
        paintMode: "stroke",
        strokeWidth: 1.5,
        dynamicCircles: {
          radiusRatio: 0.28,
          startYRatio: -0.4,
          endYRatio: 0.45,
          gapRatio: 0.3,
        },
      },
    ],
  },
  default: {
    label: "默认",
    order: 130,
    body: {
      outerPath: [
        ["M", -0.5, 0.5],
        ["L", -0.5, -0.2],
        ["L", 0, -0.5],
        ["L", 0.5, -0.2],
        ["L", 0.5, 0.5],
        ["Z"],
      ],
      paintMode: "stroke",
    },
    decorations: [],
  },
  triangle: {
    label: "三角",
    order: 140,
    body: {
      outerPath: [["M", 0, -0.5], ["L", -0.5, 0.5], ["L", 0.5, 0.5], ["Z"]],
      paintMode: "fill",
    },
    decorations: [],
  },
  dot: {
    label: "圆点",
    order: 999,
    selectable: false,
    body: {
      outerPath: [
        ["M", -0.5, -0.5],
        ["L", 0.5, -0.5],
        ["L", 0.5, 0.5],
        ["L", -0.5, 0.5],
        ["Z"],
      ],
      paintMode: "fill",
    },
    decorations: [],
  },
};
