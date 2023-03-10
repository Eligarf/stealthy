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