# Stealthy

A module for <a href="https://foundryvtt.com/">FoundryVTT</a> that adds perception vs stealth testing to Foundry's visibility tests.

## Purpose

Don't display any enemies with the 'Hidden' condition if the viewing Perception roll (or passive) failed to beat the Stealth roll.

## Features

### **Rolling Stealth checks applies the Hidden condition**
Rolling a Stealth skill check will apply the 'hidden' condition to the actor and record the result of the check in that condition for later comparisons, replacing the stored result if the Hidden condition is already present. If using DFreds Convenient Effects, a custom Hidden effect will be created therein if no custom effect named Hidden can be found. This effect can be customized as you see fit, but it must remain named 'Hidden'.

### **Rolling Perception checks applies the Spot condition**
Rolling a Perception check will add a 'Spot' condition to the actor which records the result of that perception check. The passive value for Perception is used if this condition isn't present on the actor. *The stored Perception result uses the passive value as a floor*

### **GM Stealth Override**
Once the 'Hidden' condition is applied, GMs will see a token button with an input box on the bottom right which will shows the rolled Stealth result, or show the passive Stealth value if the Hidden condition was added directly without rolling. Changing the value in this input box will alter the stored Stealth result for any future visibility tests.

### **Umbral Sight affects darkvision**
Characters with Umbral Sight will no longer be visible to the Darkvision mode. They can still be seen if Basic Vision can see them.

### **Invisible characters can hide from See Invisibility**
An invisible actor that also has the 'Hidden' condition will check Perception vs Stealth before showing up in the 'See Invisibility' vision mode.

## Required modules
* libwrapper
## Optional modules
* DFreds Convenient Effects
* Token Magic FX
