export const CANVAS_CONSTANTS = {
  STATE_RADIUS: 30,
  STATE_BORDER_WIDTH: 2.5,
  ARROW_HEAD_SIZE: 12,
  TRANSITION_CURVE_OFFSET: 30,
  GRID_SIZE: 20,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2,
  ZOOM_STEP: 0.1,
  DOUBLE_CLICK_THRESHOLD: 300, // ms
} as const;

export const CANVAS_COLORS = {
  state: {
    default: '#e3f2fd',
    initial: '#c8e6c9',
    accept: '#fff9c4',
    active: '#ef5350',
    hover: '#bbdefb',
    selected: '#64b5f6',
    border: '#1976d2',
    borderActive: '#d32f2f',
  },
  transition: {
    default: '#616161',
    hover: '#1976d2',
    selected: '#2196f3',
    arrow: '#424242',
  },
  canvas: {
    background: '#ffffff',
    grid: '#f0f0f0',
  },
  text: {
    state: '#000000',
    transition: '#212121',
  },
} as const;
