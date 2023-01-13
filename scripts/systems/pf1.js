import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

// This mechanically works, but I don't know how one is supposed to get rid
// of the Hidden effect once it is placed given the PF1 UI doesn't seem to show
// active effects.

export class StealthyPF1 extends StealthyBaseEngine {

  constructor() {
    super();

    game.settings.register(Stealthy.MODULE_ID, 'spotTake10', {
      name: game.i18n.localize("stealthy.pf1.spotTake10.name"),
      hint: game.i18n.localize("stealthy.pf1.spotTake10.hint"),
      scope: 'world',
      config: true,
      type: Boolean,
      default: false,
    });

    Hooks.on('pf1ActorRollSkill', async (actor, message, skill) => {
      if (skill === 'ste') {
        await this.rollStealth(actor, message);
      }
      else if (skill === 'per') {
        await this.rollPerception(actor, message);
      }
    });
  }

  isHidden(visionSource, hiddenEffect, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hiddenEffect.flags.stealthy?.hidden ?? (10 + target.system.skills.ste.mod);
    const spotEffect = this.findSpotEffect(source);
    const spotTake10 = game.settings.get(Stealthy.MODULE_ID, 'spotTake10');
    const perception = spotEffect?.flags.stealthy?.spot
      ?? (spotTake10 ? 10 + source.system.skills.per.mod : undefined);

    if (perception === undefined || perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${config.object.name}'s ${stealth}`);
      return true;
    }
    return false;
  }

  getHiddenFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy?.hidden ?? (10 + actor.system.skills.ste.value);
    return { flag: { hidden: value }, value };
  }

  getSpotFlagAndValue(actor, effect) {
    const value = effect.flags.stealthy.spot;
    return { flag: { spot: value }, value };
  }

  async rollPerception(actor, message) {
    Stealthy.log('rollPerception', { actor, message });

    await this.updateOrCreateSpotEffect(actor, { spot: message.rolls[0].total });
  }

  async rollStealth(actor, message) {
    Stealthy.log('rollStealth', { actor, message });

    await this.updateOrCreateHiddenEffect(actor, { hidden: message.rolls[0].total });
  }
}

Hooks.once('init', () => {
  Stealthy.RegisterEngine('pf1', () => new StealthyPF1());
});
