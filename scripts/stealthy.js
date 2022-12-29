export class Stealthy {

  static moduleName = 'stealthy';
  static ignoreFriendlyStealth = 'ignoreFriendlyStealth';
  static ignoreFriendlyUmbralSight = 'ignoreFriendlyUmbralSight';
  static hiddenSource = 'hiddenSource';

  static loglevel = 'loglevel';
  static CONSOLE_COLORS = ['background: #222; color: #ff80ff', 'color: #fff'];

  static log(format, ...args) {
    const level = game.settings.get(Stealthy.moduleName, Stealthy.loglevel);
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

  static testVisionStealth(visionSource, config) {
    const target = config.object?.actor;
    const ignoreFriendlyStealth =
      game.settings.get(Stealthy.moduleName, Stealthy.ignoreFriendlyStealth) &&
      config.object.document?.disposition === visionSource.object.document?.disposition;

    if (!ignoreFriendlyStealth) {
      const hidden = target?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden") && !e.disabled);
      if (hidden) {
        const source = visionSource.object?.actor;
        if (game.system.id === 'dnd5e') {
          let stealth = hidden.flags.stealthy?.hidden ?? target.system.skills.ste.passive;
          const spot = source?.effects.find(e => e.label === game.i18n.localize("stealthy-spot") && !e.disabled);

          // active perception loses ties, passive perception wins ties to simulate the
          // idea that active skills need to win outright to change the status quo. Passive
          // perception means that stealth is being the active skill.
          let perception = spot?.flags.stealthy?.spot ?? (source.system.skills.prc.passive + 1);
          if (perception <= stealth) {
            return false;
          }
        }
      }
    }

    return true;
  }

  static makeHiddenEffect() {
    const hidden = {
      label: game.i18n.localize("stealthy-hidden"),
      icon: 'icons/magic/perception/shadow-stealth-eyes-purple.webp',
      changes: [],
      flags: { convenientDescription: game.i18n.localize("stealthy-hidden-description") },
    };

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

    return hidden;
  }
}

Hooks.once('setup', () => {
  libWrapper.register(
    Stealthy.moduleName,
    "DetectionModeBasicSight.prototype.testVisibility",
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;

      const target = config.object?.actor;
      let noDarkvision = false;
      const ignoreFriendlyUmbralSight =
        game.settings.get(Stealthy.moduleName, Stealthy.ignoreFriendlyUmbralSight) &&
        config.object.document?.disposition === visionSource.object.document?.disposition;
      if (!ignoreFriendlyUmbralSight && visionSource.visionMode?.id === 'darkvision') {
        const umbralSight = target?.itemTypes?.feat?.find(f => f.name === game.i18n.localize('Umbral Sight'));
        if (umbralSight) noDarkvision = true;
      }

      if (noDarkvision) {
        let ourMode = duplicate(mode);
        ourMode.range = 0;
        return wrapped(visionSource, ourMode, config);
      }

      return wrapped(visionSource, mode, config);
    },
    libWrapper.WRAPPER,
    { perf_mode: libWrapper.PERF_FAST }
  );

  libWrapper.register(
    Stealthy.moduleName,
    "DetectionModeInvisibility.prototype.testVisibility",
    (wrapped, visionSource, mode, config = {}) => {
      if (!Stealthy.testVisionStealth(visionSource, config)) return false;
      return wrapped(visionSource, mode, config);
    },
    libWrapper.WRAPPER,
    { perf_mode: libWrapper.PERF_FAST }
  );
});

Hooks.on('dnd5e.rollSkill', async (actor, roll, skill) => {
  if (skill === 'ste') {
    const label = game.i18n.localize("stealthy-hidden");
    let hidden = actor.effects.find(e => e.label === label);

    if (!hidden) {
      const source = game.settings.get(Stealthy.moduleName, Stealthy.hiddenSource);
      if (source === 'ce') {
        await game.dfreds.effectInterface.addEffect({ effectName: label, uuid: actor.uuid });
      }
      else if (source === 'cub') {
        await game.cub.applyCondition(label, actor);
      }
      else {
        hidden = Stealthy.makeHiddenEffect();
        hidden.disabled = false;
        hidden.flags['stealthy.hidden'] = roll.total;
        hidden.flags['core.statusId'] = '1';
        await actor.createEmbeddedDocuments('ActiveEffect', [hidden]);
        return;
      }
      hidden = actor.effects.find(e => e.label === label);
      if (!hidden) return ui.notifications.error(game.i18n.localize("stealthy-hidden-error"));
    }

    let activeHide = duplicate(hidden);
    activeHide.flags['stealthy.hidden'] = roll.total;
    activeHide.disabled = false;
    await actor.updateEmbeddedDocuments('ActiveEffect', [activeHide]);
  }

  else if (skill === 'prc') {
    const label = game.i18n.localize("stealthy-spot");
    let spot = actor.effects.find(e => e.label === label);
    if (!spot) {
      const newEffect = [{
        label,
        icon: 'icons/magic/perception/eye-ringed-green.webp',
        duration: { turns: 1 },
        flags: {
          convenientDescription: game.i18n.localize("stealthy-spot-description"),
          'stealthy.spot': Math.max(roll.total, actor.system.skills.prc.passive),
        },
      }];
      await actor.createEmbeddedDocuments('ActiveEffect', newEffect);
    }
    else {
      let activeSpot = duplicate(spot);
      activeSpot.flags['stealthy.spot'] = Math.max(roll.total, actor.system.skills.prc.passive);
      await actor.updateEmbeddedDocuments('ActiveEffect', [activeSpot]);
    }
  }
});

Hooks.on("renderTokenHUD", (tokenHUD, html, app) => {
  if (game.user.isGM == true) {
    const token = tokenHUD.object;
    const actor = token?.actor;
    const hidden = actor?.effects.find(e => e.label === game.i18n.localize("stealthy-hidden") && !e.disabled);
    if (hidden) {
      if (game.system.id === 'dnd5e') {
        const stealth = hidden.flags.stealthy?.hidden ?? actor.system.skills.ste.passive;
        const stealthBox = $(
          `<input id="ste_val_inp_box" title="${game.i18n.localize("stealthy-inputBox-title")}" type="text" name="stealth_value_inp_box" value="${stealth}"></input>`
        );
        html.find(".right").append(stealthBox);
        stealthBox.change(async (inputbox) => {
          if (token === undefined) return;
          let activeHide = duplicate(hidden);
          activeHide.flags['stealthy.hidden'] = Number(inputbox.target.value);
          await actor.updateEmbeddedDocuments('ActiveEffect', [activeHide]);
        });
      }
    }
  }
});
