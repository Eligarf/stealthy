# Pending
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