import { Stealthy } from "./stealthy.js";
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const MODULE_ID = 'stealthy';

export class DetectionModesApplicationClass extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(object, options = {}) {
    super(object, options);
  }
  get #detectionModes() {
    return foundry.utils
      .deepClone(game.settings.get(Stealthy.MODULE_ID, Stealthy.ALLOWED_DETECTION_MODES));
  }

  static DEFAULT_OPTIONS = {
    id: `${MODULE_ID}-allowed-detection-modes`,
    tag: 'form',
    form: {
      handler: DetectionModesApplicationClass.#onSubmit,
      submitOnChange: false,
      closeOnSubmit: true,
    },
    window: {
      icon: "fas fa-gear",
      title: `${MODULE_ID}.detectionModesMenu.label`,
    }
  };

  get title() {
    return game.i18n.localize(this.options.window.title);
  }

  static PARTS = {
    form: {
      template: `modules/${MODULE_ID}/templates/detectionModes.hbs`,
    }
  };

  async _prepareContext() {
    const context = await super._prepareContext();
    const entries = Object.entries(this.#detectionModes)
      .filter(([k, v]) => k in CONFIG.Canvas.detectionModes && k !== 'undefined')
      .map(([k, v]) => [k, {
        label: CONFIG.Canvas.detectionModes[k].label,
        ...v,
      }])
      .sort((a, b) => game.i18n.localize(a[1].label).localeCompare(game.i18n.localize(b[1].label)));
    context.detectionModes = Object.fromEntries(entries);
    if ('lightBased' in entries[0][1])
      context.lightBased = true;
    return context;
  }

  static async #onSubmit(event, form, formData) {
    const object = formData.object;
    const original = game.settings.get(Stealthy.MODULE_ID, Stealthy.ALLOWED_DETECTION_MODES);
    let modes = {};
    for (const [key, value] of Object.entries(object)) {
      const [mode, property] = key.split('-');
      if (!(mode in modes)) modes[mode] = {};
      modes[mode][property] = value;
    }

    if (JSON.stringify(object) !== JSON.stringify(original)) {
      ui.notifications.warn(game.i18n.localize(`${Stealthy.MODULE_ID}.detectionModesMenu.warning`));
      Stealthy.log('new setting', modes);
      game.settings.set(Stealthy.MODULE_ID, Stealthy.ALLOWED_DETECTION_MODES, modes);
    }
  }
}

