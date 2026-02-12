export const CANVAS_CONSTANTS = {
  STATE_RADIUS: 30,
  STATE_BORDER_WIDTH: 2,
  ARROW_HEAD_SIZE: 10,
  TRANSITION_CURVE_OFFSET: 30,
  GRID_SIZE: 20,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2,
  ZOOM_STEP: 0.1,
  DOUBLE_CLICK_THRESHOLD: 300, // ms
} as const;

export const CANVAS_COLORS = {
  state: {
    default: '#90caf9',
    initial: '#4caf50',
    accept: '#ffd54f',
    active: '#ff6b6b',
    hover: '#64b5f6',
    selected: '#42a5f5',
    border: '#1976d2',
  },
  transition: {
    default: '#424242',
    hover: '#1976d2',
    selected: '#2196f3',
  },
  canvas: {
    background: '#fafafa',
    grid: '#e0e0e0',
  },
} as const;