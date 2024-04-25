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
    // Never gets called, neither do the patches for the v10 vision modes
    // dead in the water
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? (10 + tgtToken.actor.system.skills.stl.total);
    const spotEffect = this.findSpotEffect(source);
    const perception = spotEffect?.flags.stealthy?.spot ?? (10 + source.system.skills.prc.total);

    return  perception > stealth;
  }

  getStealthValue(flag, actor) {
    return super.getStealthValue(flag, actor) ?? (10 + actor.system.skills.stl.total);
  }

  getPerceptionValue(flag, actor) {
    return super.getPerceptionValue(flag, actor) ?? (10 + actor.system.skills.prc.total);
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateSpotEffect(actor, { spot: message.rolls[0].total });

    super.rollPerception();
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    await this.updateOrCreateHiddenEffect(actor, { hidden: message.rolls[0].total });

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
