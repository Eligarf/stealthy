# v4.0.0
* Big code changes, but games should have a seamless upgrade since no data migrations are required.
* Stealthy now allows the choice of banking stealth and perception rolls to tokens or actors via effects.
* Game setting defaults will bank perception rolls on the token and stealth rolls on an actor's effect.
* 'Active Spot' control title changed to 'Bank perception rolls' and the control icon has changed to a piggy bank.
* Token-banked rolls can be removed by clicking into the token HUD result and deleting its text. Actor-banked rolls are removed by deleting the effect. All banked perception rolls are still removed when toggling off the 'Bank perception rolls' token control.
* New text hasn't been properly localized yet - I put english placeholders in the language json files.
* Added client setting to add a lighting exposure icon to the token HUD.
* Added a data schema setting to allow future data migration
* Drop CUB support
* Dnd5e: The 'perception disadvantage' setting enables tokens with stealth to now use the scene's lighting state to determine if they should apply disadvantage to the opposing perception check rather than looking up dim/dark effects on its actor
* Dnd5e: Unless disabled, passive perception clamping of perception rolls now happens at time of roll rather than at comparison. This allows you to edit the banked perception roll to be less than the passive perception value if you choose.
* Dnd5e: added settings to allow custom skills to substitute for stealth or perception

# v3.18.1
* FINAL V10-compatible version. Only V11+ in the future.
* Update pt-BR.json (thanks Kharmans)

# v3.18.0
* Dnd5e: Kind of random but I Added an 'End Turn' key binding so I don't have to hunt for a button on screen. 

# v3.17.1
* PF2e: Abandonded Stealthy for PF2e. Use [PF2e Avoid Notice](https://foundryvtt.com/packages/pf2e-avoid-notice) and *Pf2e Perception* instead.

# v3.17.0
* PF2e: Perception and Stealth roll capturing works again, but still no changes to token visibility based on stealth
* PF2e: Hidden doors work again

# v3.16.1
* Fixed a merge error that turned off skill roll hooks after the first one

# v3.16.0
* Shuffled some code to use the `init` hook rather than the `setup` hook
* Unified Stealthy's handling of door controls with actor tokens
* Hidden doors that are open don't hide their door control
* DND4e: updated and working for 0.4.49
* PF1: updated and working for 9.6

# v3.15.1
* Fixed an issue where a setting was missing if TLC wasn't installed.

# v3.15.0
* GM can select the default Hidden and Spot effect icons in the game settings
* GM can choose to allow players to see their stealth and perception values in the Token HUD using the game settings.
* Dnd5e: Disadvantaged perception in dim lighting is only available if the `Token Light Condition` module is active
* Dnd5e: Removed `DimIsBright` optional setting
* Dnd5e: Disadvantaged perception roll is now hidden from DSN

# v3.14.4
* Fixed the mangled door import code

# v3.14.3
* Dnd5e: Forgot to add checks to `basicSight` in vision-5e

# v3.14.2
* Dnd5e: If vision-5e is enabled, add perception vs stealth checks to the following detection modes: `devilsSight`, `etherealSight`, `hearing`, `lightPerception`, `seeAll`, `seeInvisibility`, and `witchSight`
* Dnd5e: Updated pt-BR translations (thanks Kharmans)
* Dnd5e: Added both name and label fields to the language .json files for Dim/Dark
* PF1: Disabled Stealthy until I can figure out a better way to capture skill rolls
* Dnd4e: Disabled Stealthy until I can figure out a better way to capture skill rolls

# v3.14.1
* Dnd5e: Adding a setting to select old reliable way or new experimental way of hooking the visibility tests.
* PF2e: disabled for the time being, need a better way of hooking hide/seek actions.

# v3.14.0
* Dnd5e: Breaking change - Stealthy no longer does any Umbral Sight handling. Use Vision5e instead for this feature.
* Dnd5e: Stealthy's recorded stealth checks are now applied against both sight and sound detection modes.
* Dnd5e: Switched to _canDetect method for patching into visibility tests

# v3.13.2
* PF2e: Don't apply seek status when rolling initiative based on perception

# v3.13.1
* PF2e/Dnd4e: Localize the chat scraping functions

# v3.13.0
* PF2e: Update chat parsing to match changed text in hide and seek actions
* PF2e: Add an error notification if PF2e Workbench is missing

# v3.12.0
* Dnd5e: Added a setting to ignore the passive perception floor on a perception check when doing an active spot check
* Dnd5e: Removed deprecated 'Ignore Friendly Umbral Sight' checkbox

# v3.11.0
* Added French translation (thanks Tallon159)

# v3.10.1
* Handle v11 change in the door data ([#105](https://github.com/Eligarf/stealthy/issues/105))

# v3.10.0
* Fixed an inverted if/else branch when building effects for v10 vs v11. 
* PF2e: Stealthy ignores raw skill rolls and will only apply the Hidden condition as part of rolling initiative with stealth, or with an action like Hide or Sneak. The 'Seeking' effect is only applied when using the Seek action. Use of the Basic Action Macros in PF2e Workbench is highly recommended, but the relevant actions can be dragged onto your character sheet if you prefer.

# v3.9.2
* Fix differences between running locally and on forge

# v3.9.1
* Forgot to change the language json files for 3.9.0

# v3.9.0
* Fixed up v11 warnings and should still be v10 compatible.

# v3.8.0
* PF1: Spot/Hidden effects are now buffs.
* PF2e: Rolling stealth (including initiative) sets the hidden condition and tracks the check result internally in a flag. If the hidden condition is set via the token HUD, its value will default to the Stealth DC of the actor.
* PF2e: Rolling a perception check (excluding initiative) adds a 'Seeking' PF2e effect to the actor which tracks the check result.
* PF2e: Hidden/Seeking doesn't yet affect the canvas - this is a work-in-progress

# v3.7.0
* Add persistance to the active spot setting

# v3.6.1
* Handle the case where the source of vision in dnd5e doesn't have a perception skill for whatever reason.

# v3.6.0
* Add Foundry V11 support
* Small tweak of Friendly Spot behavior menu language

# v3.5.0
* Only add duration to default Spot effect if combat is active, allowing one to bank spot checks out-of-combat rather than just using the passive Spot value. Spot effects coming from CE or CUB are unaffected, taking whatever duration is specified in the supplied effect.

# v3.4.0
* If multiple controlled tokens are selected, hidden doors will display if at least one token would be able to perceive the hidden door.
* If no viewing token is selected, hidden doors will only display on the GM client.

# v3.3.0
* Add option to ignore stealth on friendly tokens until combat
* Adjust internal naming to make token and door visibility flow more similar
* Moved door and engine code into their own files

# v3.2.0
* BREAKING CHANGE! Replaced secret door detection with hidden door detection - turned out to be far easier to hide regular doors than to show secret ones. My apologies for not having figured out an automated migration path for existing findable Secret Doors. This does, however, take care of the non-responsive door icon problem.

# v3.1.3
* Updated dnd4e/dnd5e version compatibility

# v3.1.2
* Re-enable secret door detection with warning about the icon refresh bug
* Moved stealthy object from window.game to window

# v3.1.1
* Fix missing use of dimAsBright setting.

# v3.1.0
* Broadcast an update perception request after stealth is rolled
* Add API to access current hidden and spot values from the active effects

# v3.0.2
* Disabled secret door detection for now due to unintended interactions with displaying door icon changes.
* Tightened token stealth/perception input boxes to avoid overlaps (thanks LukasPrism)
* Added detection distance for secret doors

# v3.0.1
* Maintain player visibility of secret door control after interaction
* Initiate a vision refresh after changing or rolling Perception check.
* Added logging to show translated labels
* Fixed dark label localization key in settings

# v3.0.0
* Secret doors can be Stealthy too! GMs can enable Players to automatically spot secret doors by beating the door's perception DC.

# v2.4.0
* Add choice to match Foundry lighting or 5E rules for perception tests in dim lighting
* Added settings for changing localization keys for dim/dark
* PF1: Perception take-10 setting; an active Spot roll is required to reveal Hidden tokens if disabled.

# v2.3.0
* Spot and Hidden effects can have different sources.
* Spot and Hidden effect label can be customized.

# v2.2.0
* Added Brazilian Portuguese support (thanks lucaspicerni)
* Verify that CUB/CE still has the desired effect before trying to create one with them (#63). Falls back to default in these cases.

# v2.1.0
* Dnd4e supported
* Fixed bug in PF1 where it used the wrong actor source for the take-10 perception tests
* Organize keys in language file

# v2.0.0
* PF1 support - effect cleanup is macro based so buyer beware
* PF2e support parked due to active effect incompatibility
* Experimental: Converted Perception roll results into roll pairs for Spot, rolling an extra die if needed
* Experimental: Dim and Hidden conditions on viewed token applies disadvantage to Perception during visibility test

# v1.6.1
* Fixed error creating default spot effect

# v1.6.0
* Fixed issue where toggling active spot off deleted an effect from every actor
* Add token button for spot value overrides
* Spot effect can be customized like Hidden

# v1.5.2
* made a mess of publishing 1.5.1

# v1.5.1
* Fixed incorrect name use when toggling Spot

# v1.5.0
* Added socketlib as a required module
* Added token control for GM to toggle Spot effect generation across all clients
* Added optional Logging when objects are filtered out by Stealthy
* Better code organization
* Grouped related settings in the settings dialog
* Experimental: option for perception checks to be affected by Dim or Dark status conditions on the token. Only affect passive perception currently.

# v1.4.0
* Option to disable token effect on Hidden
* Ensure Spot effect isn't disabled after rolling Perception
* Use MIXED libwrappers

# v1.3.1
* Fix merge error

# v1.3.0
* Allow selection for source of Hidden effect
* Support CUB as possible Hidden source
* Handle disabled Hidden/Spot effects
* Tighten up logging function

# v1.2.4
* Added dubious feature GIFs to readme

# v1.2.3
* Added Logging method

# v1.2.2
* Fix stealthy.hidden and stealthy.spot flag access

# v1.2.0
* Check for Umbral Sight feature rather than Gloom Stalker subclass
* Localization support
* Dnd5e specific code guarded by game.system.id checks
* Github workflows support
* Use ATL 50% token alpha as fallback if no TokenMagicFX present

# v1.1.0
* DFreds Convenient Effects is now optional

# v1.0.0
* Initial implementation