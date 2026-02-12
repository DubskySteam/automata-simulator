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

// Function to get current theme colors
export function getCanvasColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  
  return {
    state: {
      default: isDark ? '#1e293b' : '#e3f2fd',
      initial: isDark ? '#1e3a28' : '#c8e6c9',
      accept: isDark ? '#3a3520' : '#fff9c4',
      active: '#ef5350',
      hover: isDark ? '#334155' : '#bbdefb',
      selected: isDark ? '#475569' : '#64b5f6',
      border: isDark ? '#60a5fa' : '#1976d2',
      borderActive: '#d32f2f',
    },
    transition: {
      default: isDark ? '#f1f5f9' : '#616161', // White in dark mode
      hover: isDark ? '#60a5fa' : '#1976d2',
      selected: isDark ? '#3b82f6' : '#2196f3',
      arrow: isDark ? '#f1f5f9' : '#424242', // White in dark mode
    },
    canvas: {
      background: isDark ? '#0f172a' : '#ffffff',
      grid: isDark ? '#1e293b' : '#f0f0f0',
    },
    text: {
      state: isDark ? '#f1f5f9' : '#000000',
      transition: isDark ? '#f1f5f9' : '#212121', // White in dark mode
    },
  };
}

export const CANVAS_COLORS = getCanvasColors();