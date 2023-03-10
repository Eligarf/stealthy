import { Stealthy } from '../stealthy.js';
import Engine from '../engine.js';

// This mechanically works, but I don't know how one is supposed to get rid
// of the Hidden effect once it is placed given the PF1 UI doesn't seem to show
// active effects.

class Engine4e extends Engine {

  constructor() {
    super();

    Hooks.on('createChatMessage', async (message, options, id) => {
      if (message.flavor.endsWith('uses Stealth.')) {
        await this.rollStealth(message, options, id);
      }
      else if (message.flavor.endsWith('uses Perception.')) {
        await this.rollPerception(message, options, id);
      }
    });
  }

  canSpotTarget(visionSource, hiddenEffect, target) {
    // Never gets called, neither do the patches for the v10 vision modes
    // dead in the water
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? (10 + target.actor.system.skills.stl.total);
    const spotEffect = this.findSpotEffect(source);
    const perception = spotEffect?.flags.stealthy?.spot ?? (10 + source.system.skills.prc.total);

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${target.name}'s ${stealth}`);
      return false;
    }
    return true;
  }

  getHiddenFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.hidden ?? (10 + actor.system.skills.stl.total);
    return { flag: { hidden: value }, value };
  }

  getSpotFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.spot ?? (10 + actor.system.skills.prc.total);
    return { flag: { spot: value }, value };
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
  Stealthy.RegisterEngine('dnd4e', () => new Engine4e());
});
