import { STATE } from './gameState.js';
import { transitionWithCurtain, applySharedLocalization } from './ui.js';

/**
 * Replicable Stage Manager.
 * Each stage (Title, Cutscene, World 1-1, future World 1-2...) implements:
 *   enter(params), exit(), update(dt), render(ctx),
 *   onKeyDown(key, event), onKeyUp(key, event), onLocalize(), onPointerControl(action, pressed)
 */
class StageManager {
  constructor() {
    this.stages = new Map();
    this.activeName = null;
    this.activeStage = null;
  }

  register(name, stageImpl) {
    this.stages.set(name, stageImpl);
  }

  goTo(name, { transition = true, params = {} } = {}) {
    const nextStage = this.stages.get(name);
    if (!nextStage) {
      throw new Error(`Stage "${name}" is not registered.`);
    }

    const doSwitch = () => {
      if (this.activeStage && typeof this.activeStage.exit === 'function') {
        this.activeStage.exit();
      }
      this.activeName = name;
      this.activeStage = nextStage;
      STATE.screen = name;
      if (typeof nextStage.enter === 'function') {
        nextStage.enter(params);
      }
      this.localize();
    };

    if (transition) {
      transitionWithCurtain(doSwitch);
    } else {
      doSwitch();
    }
  }

  update(dt) {
    if (this.activeStage && typeof this.activeStage.update === 'function') {
      this.activeStage.update(dt);
    }
  }

  render(ctx) {
    if (this.activeStage && typeof this.activeStage.render === 'function') {
      this.activeStage.render(ctx);
    }
  }

  handleKeyDown(key, event) {
    if (this.activeStage && typeof this.activeStage.onKeyDown === 'function') {
      this.activeStage.onKeyDown(key, event);
    }
  }

  handleKeyUp(key, event) {
    if (this.activeStage && typeof this.activeStage.onKeyUp === 'function') {
      this.activeStage.onKeyUp(key, event);
    }
  }

  handleControl(control, pressed) {
    if (this.activeStage && typeof this.activeStage.onControl === 'function') {
      this.activeStage.onControl(control, pressed);
    }
  }

  handleAction(action) {
    if (this.activeStage && typeof this.activeStage.onAction === 'function') {
      this.activeStage.onAction(action);
    }
  }

  localize() {
    applySharedLocalization();
    if (this.activeStage && typeof this.activeStage.onLocalize === 'function') {
      this.activeStage.onLocalize();
    }
  }
}

export const stageManager = new StageManager();
