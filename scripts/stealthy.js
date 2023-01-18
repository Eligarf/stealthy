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
        const engine = game.stealthy.engine;
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
        const engine = game.stealthy.engine;
        if (!engine.testStealth(visionSource, config.object)) return false;
        return engine.seeInvisibility(wrapped, visionSource, mode, config);
      },
      libWrapper.MIXED,
      { perf_mode: libWrapper.PERF_FAST }
    );

    // Secret door patching/hooks
    if (game.settings.get(Stealthy.MODULE_ID, 'spotSecretDoors')) {
      libWrapper.register(
        Stealthy.MODULE_ID,
        'Wall.prototype.createDoorControl',
        function (wrapped) {
          return Stealthy.WallCreateDoorControlSansGmCheck(this);
        },
        libWrapper.OVERRIDE
      );

      libWrapper.register(
        Stealthy.MODULE_ID,
        'DoorControl.prototype.isVisible',
        function (wrapped) {
          if (!Stealthy.CanDisplayDoorControl(this)) return false;
          return Stealthy.DoorControlIsVisibleSansGmCheck(this);
        },
        libWrapper.OVERRIDE
      );

      libWrapper.register(
        Stealthy.MODULE_ID,
        "WallConfig.prototype._updateObject",
        async function (wrapped, event, formData) {
          let result = await wrapped(event, formData);
          if (result) result = Stealthy.UpdateSecretDoorDc(this, formData);
          return result;
        },
        libWrapper.WRAPPER
      );

      libWrapper.register(
        Stealthy.MODULE_ID,
        "Wall.prototype._onModifyWall",
        async function (wrapped, doorChange) {
          return Stealthy.Wall_onModifyWallSansGmCheck(this, doorChange);
        },
        libWrapper.OVERRIDE
      );

      // Inject custom settings into the wall config diallog
      Hooks.on("renderWallConfig", Stealthy.RenderSpotDc);
    }
  }

  testStealth(visionSource, target) {
    const ignoreFriendlyStealth =
      game.settings.get(Stealthy.MODULE_ID, 'ignoreFriendlyStealth') &&
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
    await this.updateOrCreateEffect({
      label: this.spotLabel,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'spotSource'),
      makeEffect: this.makeSpotEffectMaker(this.spotLabel)
    });
  }

  async updateOrCreateHiddenEffect(actor, flag) {
    await this.updateOrCreateEffect({
      label: this.hiddenLabel,
      actor,
      flag,
      source: game.settings.get(Stealthy.MODULE_ID, 'hiddenSource'),
      makeEffect: this.makeHiddenEffectMaker(this.hiddenLabel)
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

  rollPerception() {
    canvas.perception.update({ initializeVision: true }, true);
  }

  doorIsSpotted(doorControl, tokens) {
    const dc = doorControl.wall.document.flags.stealthy.dc;
    const spotter = tokens[0].actor;
    const { value: perception } = this.getSpotFlagAndValue(spotter, this.findSpotEffect(spotter));
    return perception >= dc;
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

  static WallCreateDoorControlSansGmCheck(wall) {
    wall.doorControl = canvas.controls.doors.addChild(new DoorControl(wall));
    wall.doorControl.draw();
    return wall.doorControl;
  }

  static Wall_onModifyWallSansGmCheck(wall, doorChange) {
    const perceptionUpdate = {
      initializeLighting: true,
      initializeVision: true,
      initializeSounds: true,
      refreshTiles: true
    };

    // Re-draw door icons
    if (doorChange) {
      perceptionUpdate.forceUpdateFog = true;
      const dt = wall.document.door;
      const hasCtrl = (dt === CONST.WALL_DOOR_TYPES.DOOR) || (dt === CONST.WALL_DOOR_TYPES.SECRET);
      if (hasCtrl) {
        if (wall.doorControl) wall.doorControl.draw(); // Asynchronous
        else wall.createDoorControl();
      }
      else wall.clearDoorControl();
    }

    // Re-initialize perception
    canvas.perception.update(perceptionUpdate, true);
  }

  static DoorControlIsVisibleSansGmCheck(doorControl) {
    // Test two points which are perpendicular to the door midpoint
    const w = doorControl.wall;
    const ray = w.toRay();
    const [x, y] = w.midpoint;
    const [dx, dy] = [-ray.dy, ray.dx];
    const t = 3 / (Math.abs(dx) + Math.abs(dy)); // Approximate with Manhattan distance for speed
    const points = [
      { x: x + (t * dx), y: y + (t * dy) },
      { x: x - (t * dx), y: y - (t * dy) }
    ];

    // Test each point for visibility
    return points.some(p => {
      return canvas.effects.visibility.testVisibility(p, { object: doorControl, tolerance: 0 });
    });
  }

  static CanDisplayDoorControl(doorControl) {
    const wallDoc = doorControl.wall.document;
    if (wallDoc.door === CONST.WALL_DOOR_TYPES.SECRET) {

      // If the door doesn't have a stealthy flag, only GMs can see like Foundry wants
      const dc = wallDoc.flags.stealthy?.dc;
      if (dc === undefined || dc === null) {
        if (!game.user.isGM) return false;
      }

      // Otherwise, find the controlled tokens
      else {
        let tokens = canvas.tokens.controlled;
        if (!tokens.length) {
          if (!game.user.isGM) {
            tokens = canvas.scene.tokens.filter(t => {
              const userId = game.user.id;
              const ownership = t.actor.ownership[userId] ?? t.actor.ownership.default;
              return ownership >= 2;
            });
            if (!tokens.length) return false;
          }
        }

        // Players only see secret doors if they control one unit
        if (tokens.length === 1) {
          const engine = game.stealthy.engine;
          if (!engine.doorIsSpotted(doorControl, tokens)) return false;
        }
        else if (!game.user.isGM) return false;
      }
    }
    return true;
  }

  static async UpdateSecretDoorDc(wallConfig, formData) {
    if (!('spotDc' in formData)) return true;
    const updateData = { flags: { stealthy: { dc: formData.spotDc } } };
    let ids = wallConfig.editTargets;
    if (ids.length == 0) {
      ids = [wallConfig.object.id];
    }

    // Update all the edited walls
    const updateDataset = ids.map(id => { return { _id: id, ...updateData }; });
    return await canvas.scene.updateEmbeddedDocuments("Wall", updateDataset);
  }

  static RenderSpotDc(wallConfig, html, css) {
    if (css.document.door == 2) {
      const dcBlock = `
        <div class="form-group">
          <label for="spotDc">${game.i18n.localize("stealthy.door.dc")}</label>
          <input type="number" name="spotDc"/ value="${css.object.flags.stealthy?.dc}">
        </div>`;
      html.find(".form-group").last().after(dcBlock);

      // Force config window to resize
      wallConfig.setPosition({ height: "auto" });
    }
  }

}
