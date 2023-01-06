import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

// This mechanically works, but I don't know how one is supposed to get rid
// of the Hidden effect once it is placed given the PF1 UI doesn't seem to show
// active effects.

export class StealthyDnd4e extends StealthyBaseEngine {

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

  isHidden(visionSource, hiddenEffect, target, config) {
    // Never gets called, neither do the patches for the v10 vision modes
    // dead in the water
    Stealthy.log('StealthyDnd4e', { visionSource, hidden: hiddenEffect, target, config });
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? (10 + actor.system.skills.stl.total);
    const spotEffect = this.findSpotEffect(source);
    const perception = spotEffect?.flags.stealthy?.spot ?? (10 + actor.system.skills.prc.total);

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${config.object.name}'s ${stealth}`);
      return true;
    }
    return false;
  }

  getHiddenFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.hidden ?? (10 + actor.system.skills.stl.total);
    return { flag: { hidden: value }, value };
  }

  async setHiddenValue(actor, effect, flag, value) {
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  getSpotFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.spot ?? (10 + actor.system.skills.prc.total);
    return { flag: { spot: value }, value };
  }

  async setSpotValue(actor, effect, flag, value) {
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  async rollPerception(message, options, id) {
    Stealthy.log('rollPerception', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    const label = game.i18n.localize("stealthy.spot.label");
    await this.updateOrCreateEffect({
      label,
      actor,
      flag: { spot: message.rolls[0].total },
      makeEffect: this.makeSpotEffect(label)
    });
  }

  async rollStealth(message, options, id) {
    Stealthy.log('rollStealth', { message, options, id });

    const token = canvas.tokens.get(message.speaker.token);
    const actor = token.actor;
    const label = game.i18n.localize("stealthy.hidden.label");
    await this.updateOrCreateEffect({
      label,
      actor,
      flag: { hidden: message.rolls[0].total },
      makeEffect: this.makeHiddenEffect(label)
    });
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('dnd4e', () => new StealthyDnd4e());
});
