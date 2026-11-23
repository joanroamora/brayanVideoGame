/**
 * Shared global game state across all stages.
 */
export const STATE = {
  screen: 'TITLE', // Active stage key ('TITLE' | 'INTRO_CUTSCENE' | 'WORLD_1_1' | 'WORLD_1_2')
  lang: 'es',
  mode: 'light',   // 'light' | 'heavy'
  startStage: 'INTRO_CUTSCENE', // 'INTRO_CUTSCENE' (1-1 flow) | 'WORLD_1_2'
  isMobile: /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth < 768
};
