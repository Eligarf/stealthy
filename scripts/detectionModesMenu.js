import { Stealthy } from "./stealthy.js";

export class DetectionModesApplicationClass extends FormApplication {
  constructor(object, options = {}) {
    super(object, options);
  }
  get #detectionModes() {
    return foundry.utils
      .deepClone(game.settings.get(Stealthy.MODULE_ID, "allowedDetectionModes"));
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: "stealthy.detectionModesMenu.title",
      id: "stealthy-allowed-detection-modes",
      template: "modules/stealthy/templates/detectionModes.hbs",
      popOut: true,
      width: "auto",
      height: "auto",
      closeOnSubmit: true,
      submitOnClose: false,
      submitOnChange: false,
    });
  }

  getData() {
    const context = super.getData();
    const entries = Object.entries(this.#detectionModes)
      .filter(([k,v]) => k in CONFIG.Canvas.detectionModes && k !== 'undefined')
      .map(([k, v]) => [k, {
        label: CONFIG.Canvas.detectionModes[k].label,
        enabled: v
      }]);
    context.detectionModes = Object.fromEntries(entries);
    return context;
  }

  _updateObject(event, formData) {
    Stealthy.log('_updateObject', { event, formData });
    const original = game.settings.get(Stealthy.MODULE_ID, "allowedDetectionModes");
    const different = (JSON.stringify(formData) !== JSON.stringify(original));
    if (different) {
      ui.notifications.warn(game.i18n.localize("stealthy.detectionModesMenu.warning"));
      game.settings.set(Stealthy.MODULE_ID, 'allowedDetectionModes', formData);
    }
  }
}

