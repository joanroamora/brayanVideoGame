/**
 * World 1-2: TransMilenio Hora Pico (Bogotá) — ~52s Ride Blueprint & Event Schedule.
 * Replicable level data file matching the World 1-1 modular stage pattern.
 */
export const WORLD_1_2_CONFIG = {
  duration: 52.0, // Sustained ~52 second ride inside packed TransMilenio
  arrivalBrakeStart: 49.0,
  stopMilestones: [0, 12, 24, 37, 49.5], // Maps to I18N.w2Stops (5 stations -> Calle 26)
  brayanBaseX: 480,
  floorY: 516
};

export function getWorld1_2Difficulty(hard) {
  return {
    maxHp: hard ? 3 : 5,
    snatchWindow: hard ? 1.15 : 1.65,
    cosquilleroWindow: hard ? 1.25 : 1.78,
    gasWindow: hard ? 1.65 : 2.30,
    snatchPenalty: hard ? 200 : 150,
    cosquilleroPenalty: hard ? 300 : 200,
    minGap: hard ? 1.95 : 2.65,
    maxGap: hard ? 2.75 : 3.55
  };
}

/**
 * Generates a balanced, sustained ~52-second sequence of TransMilenio rush-hour events:
 * - Phase 1 (3.0s - 14.5s): Clear onboarding of all 3 mechanics (Celular, Cosquillero, Gas Verde)
 * - Phase 2 (14.5s - 34.0s): Lively rush-hour mix across Las Nieves & San Diego
 * - Phase 3 (34.0s - 48.0s): Peak rush-hour climax approaching Estación Calle 26 (with occasional
 *   exciting Gas + Celular / Gas + Cosquillero overlap!)
 */
export function buildTransmiSchedule(hard) {
  const diff = getWorld1_2Difficulty(hard);
  const events = [];

  // Phase 1: Guaranteed intro of all 3 core mechanics cleanly spaced
  events.push({ time: 3.2, type: 'snatch', side: 'left' });
  events.push({ time: 7.4, type: 'cosquillero', side: 'right' });
  events.push({ time: 11.6, type: 'gas', side: 'left' });

  // Phase 2 & 3: Sustained ~50s stream up to t = 47.6s
  const types = ['snatch', 'cosquillero', 'gas'];
  let curT = hard ? 14.6 : 15.6;
  let lastType = 'gas';
  let idx = 0;

  while (curT < 47.2) {
    // Pick next mechanic avoiding triple repeats
    let candidates = types.filter((tp) => tp !== lastType);
    const chosen = candidates[(idx + Math.floor(Math.random() * candidates.length)) % candidates.length];
    const side = (idx % 2 === 0) ? (Math.random() < 0.5 ? 'left' : 'right') : (Math.random() < 0.5 ? 'right' : 'left');

    events.push({ time: Number(curT.toFixed(2)), type: chosen, side });
    lastType = chosen;
    idx++;

    // In Phase 3 (climax after 33s), occasionally add a fair dual-pressure gas cloud alongside a snatch/cosquillero
    const inClimax = curT >= 33.0;
    if (inClimax && chosen !== 'gas' && idx % 3 === 0 && curT + 1.0 < 46.8) {
      events.push({
        time: Number((curT + (hard ? 0.65 : 0.95)).toFixed(2)),
        type: 'gas',
        side: side === 'left' ? 'right' : 'left'
      });
      curT += hard ? 2.6 : 3.25;
    } else {
      const paceFactor = inClimax ? 0.86 : 1.0;
      const gap = (diff.minGap + Math.random() * (diff.maxGap - diff.minGap)) * paceFactor;
      curT += gap;
    }
  }

  events.sort((a, b) => a.time - b.time);
  return events;
}
