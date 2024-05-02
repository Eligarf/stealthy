import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

class Engine4e extends Engine {

  constructor() {
    super();

    Hooks.once('setup', () => {
      const usesStealth = `uses ${game.i18n.localize('DND4E.SkillStl')}.`;
      const usesPerception = `uses ${game.i18n.localize('DND4E.SkillPrc')}.`;
      Stealthy.log('Localized Chat Tags', { usesStealth, usesPerception });

      Hooks.on('createChatMessage', async (message, options, id) => {
        if (message.flavor.endsWith(usesStealth)) {
          await this.rollStealth(message, options, id);
        }
        else if (message.flavor.endsWith(usesPerception)) {
          await this.rollPerception(message, options, id);
        }
      });
    });
  }

  canDetectHidden(visionSource, tgtToken, detectionMode) {
    const stealthFlag = this.getStealthFlag(tgtToken);
    if (!stealthFlag) return true;

    const stealthValue = this.getStealthValue(stealthFlag);
    const perceptionFlag = this.getPerceptionFlag(visionSource.object);
    const perceptionValue = this.getPerceptionValue(perceptionFlag);

    return perceptionValue > stealthValue;
  }

  getStealthFlag(token) {
    let flag = super.getStealthFlag(token);
    if (flag && flag.stealth === undefined)
      flag.stealth = 10 + token.actor.system.skills.stl.total;
    return flag;
  }

  getPerceptionFlag(token) {
    const flag = super.getPerceptionFlag(token);
    if (flag) return flag;
    return {
      token,
      passive: true,
      perception: 10 + token.actor.system.skills.prc.total
    };
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });
    if (!stealthy.bankingPerception) return;

    const token = canvas.tokens.get(message.speaker.token);
    await this.bankPerception(token, message.rolls[0].total);

    super.rollPerception();
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    await this.bankStealth(token, message.rolls[0].total);

    super.rollStealth();
  }
}

Hooks.once('init', () => {
  if (game.system.id === 'dnd4e') {
    const systemEngine = new Engine4e();
    if (systemEngine) {
      window[Stealthy.MODULE_ID] = new Stealthy(systemEngine);
    }
  }
});
