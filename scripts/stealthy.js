export class StealthyBaseEngine {

  constructor() {
    // Hook the relevant skills to capture spot and hidden test
    // results into effects on the actor.

    // new implementations need to add something like the following
    // at file scope so that the Stealthy can find the engine during
    // setup

    // Hooks.once('init', () => {
    //   Stealthy.RegisterEngine('system-id', () => new StealthyNewSystem());
    // });

    this.warnedMissingCE = false;
    this.warnedMissingCUB = false;
    this.hiddenLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'hiddenLabel'));
    this.spotLabel = game.i18n.localize(game.settings.get(Stealthy.MODULE_ID, 'spotLabel'));
    Stealthy.log(`hiddenLabel='${this.hiddenLabel}', spotLabel='${this.spotLabel}'`);
  }

  patchFoundry() {
    // Detection mode patching
    libWrapper.register(
      Stealthy.MODULE_ID,
      'DetectionModeBasicSight.prototype.testVisibility',
      function (wrapped, visionSource, mode, config = {}) {
        const engine = stealthy.engine;
        if (!engine.testStealth(visionSource, config.object)) return false;
        return engine.basicVision(wrapped, visionSource, mode, config);
      },
      libWrapper.MIXED,
      { perf_mode: libWrapper.PERF_FAST }
    );

    libWrapper.register(
      Stealthy.MODULE_ID,
      'DetectionModeInvisibility.prototype.testVisibility',
      function (wrapped, visionSource, mode, config = {}) {
        const engine = stealthy.engine;
        if (!engine.testStealth(visionSource, config.object)) return false;
        return engine.seeInvisibility(wrapped, visionSource, mode, config);
      },
      libWrapper.MIXED,
      { perf_mode: libWrapper.PERF_FAST }
    );

    // Hidden door patching/hooks
    if (game.settings.get(Stealthy.MODULE_ID, 'spotSecretDoors')) {
      libWrapper.register(
        Stealthy.MODULE_ID,
        'DoorControl.prototype.isVisible',
        function (wrapped) {
          if (!wrapped()) return false;
          return Stealthy.CanDisplayDoorControl(this);
        },
        libWrapper.MIXED
      );

      libWrapper.register(
        Stealthy.MODULE_ID,
        "WallConfig.prototype._updateObject",
        async function (wrapped, event, formData) {
          let result = await wrapped(event, formData);
          if (result) result = Stealthy.UpdateHiddenDoor(this, formData);
          return result;
        },
        libWrapper.WRAPPER
      );

      // Inject custom settings into the wall config diallog
      Hooks.on("renderWallConfig", Stealthy.RenderHiddenDoor);
    }
  }

  testStealth(visionSource, target) {
    const friendlyStealth = game.settings.get(Stealthy.MODULE_ID, 'friendlyStealth');
    let ignoreFriendlyStealth = friendlyStealth === 'ignore' || !game.combat && friendlyStealth === 'inCombat';
    ignoreFriendlyStealth =
      ignoreFriendlyStealth &&
      target.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hiddenEffect = this.findHiddenEffect(target?.actor);
      if (hiddenEffect) {
        if (this.isHidden(visionSource, hiddenEffect, target)) return false;
      }
    }

    return true;
  }

  findHiddenEffect(actor) {
    return actor?.effects.find(e => e.label === this.hiddenLabel && !e.disabled);
  }

  findSpotEffect(actor) {
    return actor?.effects.find(e => e.label === this.spotLabel && !e.disabled);
  }

  isHidden(visionSource, hiddenEffect, target) {
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
        if (typeof ATLUpdate !== 'undefined') {
          hidden.changes.push({
            key: 'ATL.alpha',
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            value: '0.75'
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
    await this.updateOrCreateEffect({
      label: this.spotLabel,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'spotSource'),
      makeEffect: this.makeSpotEffectMaker(this.spotLabel)
    });
    canvas.perception.update({ initializeVision: true }, true);
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    await this.updateOrCreateEffect({
      label: this.hiddenLabel,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'hiddenSource'),
      makeEffect: this.makeHiddenEffectMaker(this.hiddenLabel)
    });
    stealthy.socket.executeForEveryone('RefreshPerception');
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
    stealthy.socket.executeForEveryone('RefreshPerception');
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
    canvas.perception.update({ initializeVision: true }, true);
  }

  rollPerception() {
    canvas.perception.update({ initializeVision: true }, true);
  }

  rollStealth() {
    stealthy.socket.executeForEveryone('RefreshPerception');
  }

  isHiddenDoorSpotted(doorControl, token) {
    const stealth = doorControl.wall.document.flags.stealthy.stealth;
    const actor = token.actor;
    const { value: perception } = this.getSpotFlagAndValue(actor, this.findSpotEffect(actor));
    return perception >= stealth;
  }
}

export class Stealthy {

  static MODULE_ID = 'stealthy';

  constructor(makeEngine) {
    this.engine = makeEngine();
    this.engine.patchFoundry();
    this.activeSpot = true;
    this.socket = null;
    this.socket = socketlib.registerModule(Stealthy.MODULE_ID);
    this.socket.register('ToggleActiveSpot', Stealthy.ToggleActiveSpot);
    this.socket.register('GetActiveSpot', Stealthy.GetActiveSpot);
    this.socket.register('RefreshPerception', Stealthy.RefreshPerception);
  }

  getSpotValue(actor) {
    const effect = this.engine.findSpotEffect(actor);
    const { value } = this.engine.getSpotFlagAndValue(actor, effect);
    return value;
  }

  getHiddenValue(actor) {
    const effect = this.engine.findHiddenEffect(actor);
    const { value } = this.engine.getHiddenFlagAndValue(actor, effect);
    return value;
  }

  static async ToggleActiveSpot(toggled) {
    Stealthy.log(`ToggleActiveSpot <= ${toggled}`);
    stealthy.activeSpot = toggled;

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

  static RefreshPerception() {
    Stealthy.log(`RefreshPerception`);
    canvas.perception.update({ initializeVision: true }, true);
  }

  static async GetActiveSpot() {
    Stealthy.log(`GetActiveSpot => ${stealthy.activeSpot}`);
    return stealthy.activeSpot;
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

  static CanDisplayDoorControl(doorControl) {
    const wallDoc = doorControl.wall.document;
    if (wallDoc.door === CONST.WALL_DOOR_TYPES.DOOR) {
      let tokens = canvas.tokens.controlled;
      if (tokens.length === 1) {
        const token = tokens[0];
        const maxRange = doorControl.wall.document.flags.stealthy?.maxRange ?? Infinity;
        const ray = new Ray(doorControl.center, token.center);
        const distance = canvas.grid.measureDistances([{ ray }])[0];
        if (distance > maxRange) return false;

        // If the door doesn't have a stealthy flag, everybody sees it
        const stealth = wallDoc.flags.stealthy?.stealth;
        if (stealth === undefined || stealth === null) return true;
        const engine = stealthy.engine;
        return engine.isHiddenDoorSpotted(doorControl, token);
      }
    }
    return true;
  }

  static async UpdateHiddenDoor(wallConfig, formData) {
    let update = false;
    const updateData = { flags: { stealthy: {} } };
    if (formData.stealth !== undefined) {
      updateData.flags.stealthy.stealth = formData.stealth;
      update = true;
    }
    if (formData.maxRange !== undefined) {
      updateData.flags.stealthy.maxRange = formData.maxRange;
      update = true;
    }
    if (!update) return true;

    // Update all the edited walls
    let ids = wallConfig.editTargets;
    if (ids.length == 0) {
      ids = [wallConfig.object.id];
    }
    const updateDataset = ids.map(id => { return { _id: id, ...updateData }; });
    return await canvas.scene.updateEmbeddedDocuments("Wall", updateDataset);
  }

  static RenderHiddenDoor(wallConfig, html, css) {
    Stealthy.log('RenderHiddenDoor', { wallConfig, html, css });
    if (css.document.door == 1) {
      const hiddenDoorBlock = `
      <fieldset>
        <legend>Stealthy</legend>
        <div class="form-group">
          <label for="stealth">${game.i18n.localize("stealthy.door.stealth")}</label>
          <input type="number" name="stealth"/ value="${css.object.flags.stealthy?.stealth}">
        </div>
        <div class="form-group">
          <label for="maxRange">${game.i18n.localize("stealthy.door.maxRange")}</label>
          <input type="number" name="maxRange"/ value="${css.object.flags.stealthy?.maxRange}">
        </div>
      </fieldset>`;
      html.find(".form-group").last().after(hiddenDoorBlock);

      // Force config window to resize
      wallConfig.setPosition({ height: "auto" });
    }
  }

}
