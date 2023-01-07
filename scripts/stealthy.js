export class StealthyBaseEngine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.

    // new implementations need to add something like the following
    // at file scope so that the Stealthy can find the engine during
    // setup

    // Hooks.once('init', () => {
    //   Stealthy.engines['game-system-id'] = () => new StealthyGameSystem();
    // });

    this.warnedMissingCE = false;
    this.warnedMissingCUB = false;
  }

  testStealth(visionSource, config) {
    const target = config.object?.actor;
    const ignoreFriendlyStealth =
      game.settings.get(Stealthy.MODULE_ID, 'ignoreFriendlyStealth') &&
      config.object.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hiddenEffect = this.findHiddenEffect(target);
      if (hiddenEffect) {
        if (this.isHidden(visionSource, hiddenEffect, target, config)) return false;
      }
    }

    return true;
  }

  findHiddenEffect(actor) {
    return actor?.effects.find(e => e.label === game.i18n.localize("stealthy.hidden.label") && !e.disabled);
  }

  findSpotEffect(actor) {
    return actor?.effects.find(e => e.label === game.i18n.localize("stealthy.spot.label") && !e.disabled);
  }

  isHidden(visionSource, hiddenEffect, target, config) {
    // Implement your system's method for testing spot data vs hidden data
    // This should would in the absence of a spot effect on the viewer, using
    // a passive or default value as necessary
    return false;
  }

  basicVision(wrapped, visionSource, mode, config) {
    // Any special filtering beyond stealth testing is handled here, like being invisible to darkvision/etc.
    return wrapped(visionSource, mode, config);
  }

  seeInvisibility(wrapped, visionSource, mode, config) {
    // Any special filtering beyond stealth testing is handled here.
    return wrapped(visionSource, mode, config);
  }

  makeHiddenEffectMaker(label) {
    return (flag, source) => {
      let hidden = {
        label,
        icon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
        changes: [],
        flags: {
          convenientDescription: game.i18n.localize("stealthy.hidden.description"),
          stealthy: flag,
          core: { statusId: '1' },
        },
      };
      if (source === 'ae') {
        if (typeof TokenMagic !== 'undefined') {
          hidden.changes.push({
            key: 'macro.tokenMagic',
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 'fog'
          });
        }
        else if (typeof ATLUpdate !== 'undefined') {
          hidden.changes.push({
            key: 'ATL.alpha',
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: '0.5'
          });
        }
      }
      return hidden;
    };
  }

  makeSpotEffectMaker(label) {
    return (flag, source) => ({
      label,
      icon: 'icons/commodities/biological/eye-blue.webp',
      flags: {
        convenientDescription: game.i18n.localize("stealthy.spot.description"),
        stealthy: flag,
        core: { statusId: '1' },
      },
    });
  }

  async updateOrCreateEffect({ label, actor, flag, source, makeEffect }) {
    let effect = actor.effects.find(e => e.label === label);

    if (!effect) {
      // See if we can source from outside
      if (source === 'ce') {
        if (game.dfreds?.effectInterface?.findEffectByName(label)) {
          await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
          effect = actor.effects.find(e => e.label === label);
        }
        if (!effect && !this.warnedMissingCE) {
          this.warnedMissingCE = true;
          if (game.user.isGM)
            ui.notifications.warn(
              `${game.i18n.localize('stealthy.source.ce.beforeLabel')} '${label}' ${game.i18n.localize('stealthy.source.ce.afterLabel')}`);
          console.error(`stealthy | Convenient Effects couldn't find the '${label}' effect so Stealthy will use the default one. Add your customized effect to CE or select a different effect source in Game Settings`);
        }
      }
      else if (source === 'cub') {
        if (game.cub?.getCondition(label)) {
          await game.cub.applyCondition(label, actor);
          effect = actor.effects.find(e => e.label === label);
        }
        if (!effect && !this.warnedMissingCUB) {
          this.warnedMissingCUB = true;
          if (game.user.isGM)
            ui.notifications.warn(
              `${game.i18n.localize('stealthy.source.cub.beforeLabel')} '${label}' ${game.i18n.localize('stealthy.source.cub.afterLabel')}`);
          console.error(`stealthy | Combat Utility Belt couldn't find the '${label}' effect so Stealthy will use the default one. Add your customized effect to CUB or select a different effect source in Game Settings`);
        }
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

  async updateOrCreateSpotEffect(actor, flag) {
    const label = game.i18n.localize("stealthy.spot.label");
    await this.updateOrCreateEffect({
      label,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'spotSource'),
      makeEffect: this.makeSpotEffectMaker(label)
    });
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    const label = game.i18n.localize("stealthy.hidden.label");
    await this.updateOrCreateEffect({
      label,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'hiddenSource'),
      makeEffect: this.makeHiddenEffectMaker(label)
    });
  }
  getHiddenFlagAndValue(actor, effect) {
    // Return the data necessary for storing data about hidden, and the
    // value that should be shown on the token button input
    return { flag: { hidden: undefined }, value: undefined };
  }

  async setHiddenValue(actor, effect, flag, value) {
    // If the hidden value was changed, do what you need to store it
    flag.hidden = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }

  getSpotFlagAndValue(actor, effect) {
    // Return the data necessary for storing data about spot, and the
    // value that should be shown on the token button input
    return { flag: { spot: undefined }, value: undefined };
  }

  async setSpotValue(actor, effect, flag, value) {
    // If the spot value was changed, do what you need to store it
    flag.spot = value;
    effect.flags.stealthy = flag;
    await actor.updateEmbeddedDocuments('ActiveEffect', [effect]);
  }
}

export class Stealthy {

  static MODULE_ID = 'stealthy';
  
  constructor(makeEngine) {
    this.engine = makeEngine();
    this.activeSpot = true;
    this.socket = null;
    this.socket = socketlib.registerModule(Stealthy.MODULE_ID);
    this.socket.register('ToggleActiveSpot', Stealthy.ToggleActiveSpot);
    this.socket.register('GetActiveSpot', Stealthy.GetActiveSpot);
  }

  static async ToggleActiveSpot(toggled) {
    Stealthy.log(`ToggleActiveSpot <= ${toggled}`);
    game.stealthy.activeSpot = toggled;

    if (!toggled && game.user.isGM) {
      const label = game.i18n.localize('stealthy.spot.label');
      for (let token of canvas.tokens.placeables) {
        const actor = token.actor;
        const spot = actor.effects.find(e => e.label === label);
        if (spot) {
          actor.deleteEmbeddedDocuments('ActiveEffect', [spot.id]);
        }
      }
    }
  }

  static async GetActiveSpot() {
    Stealthy.log(`GetActiveSpot => ${game.stealthy.activeSpot}`);
    return game.stealthy.activeSpot;
  }

  static CONSOLE_COLORS = ['background: #222; color: #80ffff', 'color: #fff'];
  static engines = {};

  static RegisterEngine(id, makeEngine) {
    if (id !== game.system.id) return;
    console.log(`stealthy | Registering Stealth engine for '${id}'`);
    Stealthy.engines[id] = makeEngine;
  }

  static log(format, ...args) {
    const level = game.settings.get(Stealthy.MODULE_ID, 'logLevel');
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

}
