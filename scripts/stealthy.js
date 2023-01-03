export class StealthySystem {
  constructor() {
  }

  testStealth(visionSource, config) {
    const target = config.object?.actor;
    const ignoreFriendlyStealth =
      game.settings.get('stealthy', 'ignoreFriendlyStealth') &&
      config.object.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hidden = target?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden-label") && !e.disabled);
      if (hidden) {
        if (this.isHidden(visionSource, hidden, target, config)) return false;
      }
    }

    return true;
  }

  isHidden(visionSource, hidden, target, config) {
    return true;
  }

  basicVision(wrapped, visionSource, mode, config) {
    return wrapped(visionSource, mode, config);
  }

  seeInvisibility(wrapped, visionSource, mode, config) {
    return wrapped(visionSource, mode, config);
  }

  getHiddenFlagAndValue(hidden) {
    return { flag: { hidden: undefined }, value: undefined };
  }

  async setHiddenValue(actor, effect, flag, value) {
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  getSpotFlagAndValue(spot) {
    return { flag: { spot: undefined }, value: undefined };
  }

  async setSpotValue(actor, effect, flag, value) {
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }
}

export class Stealthy {

  static CONSOLE_COLORS = ['background: #222; color: #80ffff', 'color: #fff'];
  static socket;
  static enableSpot = true;
  static system;

  static log(format, ...args) {
    const level = game.settings.get('stealthy', 'logLevel');
    if (level !== 'none') {

      function colorizeOutput(format, ...args) {
        return [
          `%cstealthy %c|`,
          ...Stealthy.CONSOLE_COLORS,
          format,
          ...args,
        ];
      }

      if (level === 'debug')
        console.debug(...colorizeOutput(format, ...args));
      else if (level === 'log')
        console.log(...colorizeOutput(format, ...args));
    }
  }

  //########### Socket Functions ##############

  static async toggleSpotting(toggled) {
    Stealthy.enableSpot = toggled;

    if (!toggled && game.user.isGM) {
      const label = game.i18n.localize('stealthy-spot-label');
      for (let token of canvas.tokens.placeables) {
        const actor = token.actor;
        const spot = actor.effects.find(e => e.label === label);
        if (spot) {
          actor.deleteEmbeddedDocuments('ActiveEffect', [spot.id]);
        }
      }
    }
  }

  static async getSpotting() {
    return Stealthy.enableSpot;
  }

  static async UpdateOrCreateEffect({ label, actor, flag, makeEffect }) {
    let effect = actor.effects.find(e => e.label === label);

    if (!effect) {
      // See if we can source from outside
      const source = game.settings.get('stealthy', 'hiddenSource');
      if (source === 'ce') {
        await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
        effect = actor.effects.find(e => e.label === label);
      }
      else if (source === 'cub') {
        await game.cub.applyCondition(label, actor);
        effect = actor.effects.find(e => e.label === label);
      }

      // If we haven't found an ouside source, create the default one
      if (!effect) {
        effect = makeEffect(flag, source);
        await actor.createEmbeddedDocuments('ActiveEffect', [effect]);
        return;
      }
    }

    effect = duplicate(effect);
    effect.flags.stealthy = flag;
    effect.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

}
