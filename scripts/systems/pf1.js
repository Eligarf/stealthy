import { Stealthy, StealthyBaseEngine } from '../stealthy.js';

// This mechanically works, but I don't know how one is supposed to get rid
// of the Hidden effect once it is placed given the PF1 UI doesn't seem to show
// active effects.

export class StealthyPF1 extends StealthyBaseEngine {

  constructor() {
    super();

    Hooks.on('pf1ActorRollSkill', async (actor, message, skill) => {
      if (skill === 'ste') {
        await this.rollStealth(actor, message);
      }
      else if (skill === 'per') {
        await this.rollPerception(actor, message);
      }
    });
  }

  isHidden(visionSource, hidden, target, config) {
    const source = visionSource.object?.actor;
    const stealth = hidden.flags.stealthy?.hidden ?? (10 + target.system.skills.ste.mod);
    const spot = source?.effects.find(e => e.label === game.i18n.localize("stealthy.spot.label") && !e.disabled);
    const perception = spot?.flags.stealthy?.spot ?? (10 + target.system.skills.per.mod);

    if (perception <= stealth) {
      Stealthy.log(`${visionSource.object.name}'s ${perception} can't see ${config.object.name}'s ${stealth}`);
      return true;
    }
    return false;
  }

  getHiddenFlagAndValue(effect) {
    const value = effect.flags.stealthy?.hidden ?? (10 + actor.system.skills.ste.value);
    return { flag: { hidden: value }, value };
  }

  async setHiddenValue(actor, effect, flag, value) {
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  getSpotFlagAndValue(effect) {
    const value = effect.flags.stealthy?.spot ?? (10 + actor.system.attributes.perception.value);
    return { flag: { spot: value }, value };
  }

  async setSpotValue(actor, effect, flag, value) {
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  async rollPerception(actor, message) {
    Stealthy.log('rollPerception', { actor, message });

    const label = game.i18n.localize("stealthy.spot.label");
    await this.updateOrCreateEffect({
      label,
      actor,
      flag: { spot: message.rolls[0].total },
      makeEffect: this.makeSpotEffect(label)
    });
  }

  async rollStealth(actor, message) {
    Stealthy.log('rollStealth', { actor, message });

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
  Stealthy.RegisterEngine('pf1', () => new StealthyPF1());
});
