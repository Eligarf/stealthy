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

  canDetectHidden(visionSource, hiddenEffect, tgtToken) {
    const target = tgtToken?.actor;
    const stealthFlag = this.getStealthFlag({ effect: hiddenEffect, actor: target });
    const stealth = this.getStealthValue(stealthFlag);

    const source = visionSource.object?.actor;
    const spotEffect = this.findSpotEffect(source);
    const perceptionFlag = this.getPerceptionFlag({ effect: spotEffect, actor: source });
    const perception = this.getPerceptionValue(perceptionFlag);

    return  perception > stealth;
  }

  getStealthValue(flag) {
    return super.getStealthValue(flag) ?? (10 + flag?.actor.system.skills.stl.total);
  }

  getPerceptionValue(flag) {
    return super.getPerceptionValue(flag) ?? (10 + flag?.actor.system.skills.prc.total);
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateSpotEffect(actor, { perception: message.rolls[0].total });

    super.rollPerception();
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateHiddenEffect(actor, { stealth: message.rolls[0].total });

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
