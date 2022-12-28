<h1>Stealthy</h1>

A module for <a href="https://foundryvtt.com/">FoundryVTT</a> that adds perception vs stealth testing to visibility tests.

<h2>Purpose</h2>


<h2>Features</h2>

Hide any enemies with the 'Hidden' condition based on comparing Perception and Stealth rolls.

**Rolling Stealth checks apply the Hidden condition** - Rolling a Stealth skill check will apply the 'hidden' condition to the actor and record the result of the check in that condition for later comparisons, replace the stored result if the Hidden condition is already present. If using DFreds Convenient Effects, a custom Hidden effect will be created therein if no custom effect named Hidden can be found. This effect can be customized as you see fit, but it must stay named 'Hidden'.

**Rolling Perception checks apply the Spot condition** - Rolling a Perception check will add a 'Spot' condition to the actor which records the result of that perception check. The passive value for Perception is used if this condition isn't present on the actor. <i>The stored Perception result uses the passive value as a floor</i>

**Allow GM Stealth Override** - Once the 'Hidden' condition is applied, GMs will see a token button with an input box on the bottom right which will shows the rolled Stealth result, or show the passive Stealth value if the Hidden condition was added directly without rolling. Changing the value in this input box will alter the stored Stealth result for any future visibility tests.

**Umbral Sight affects darkvision** - Characters with Umbral Sight will no longer be visible to the Darkvision mode. They can still be seen if Basic Vision can see them.

**Invisible characters can still hide from See Invisibility** - An invisible actor that also has the 'Hidden' condition will check Perception vs Stealth before showing up in the 'See Invisibility' vision mode.

<h2>Install</h2>

<h2>ChangeLog</h2>

<h4>Version 1.2.0</h4>
<ul>
  <li>Check for Umbral Sight rather than Gloom Stalker subclass</li>
</ul>

<h4>Version 1.1.0</h4>
<ul>
  <li>Remove requirement to use Convenient Effects</li>
</ul>

<h4>Version 1.0.0</h4>
<ul>
  <li>Initial implementation</li>
</ul>