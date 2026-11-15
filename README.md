# Custom Cards

Custom Lovelace cards for Home Assistant:

- `custom:climate-button-row` – control a climate entity: `-` `[temp]` `+` `AUTO` `ON` `OFF`.
- `custom:fan-light-button-row` – fan percent buttons (`HIGH` `MED` `LOW` `OFF`) with an optional paired light toggle (`LIGHT`), forked from [fan-percent-button-row](https://github.com/finity69x2/fan-percent-button-row).
- `custom:fan-onoff-button-row` – on/off buttons (`OFF` `ON`) for fans and switches that only support on/off.
- `custom:dual-battery-flow-card` – compact grouped power flow diagram in **three columns**: **Inputs** (solar top, grid bottom) on the left, **Batteries** (house + garage + optional car) in the middle column with the **Home** hub between house and garage, **Devices** (top-4 ranked) down the right column, with usage-scaled bubbles (every node's circle grows with its share of the biggest power flow; the house battery gets a larger floor than garage/car) and magnitude-weighted animated flow lines (the car flow is a curved bypass around the garage bubble) with direction chevrons riding each active flow, inspired by [power-flow-card-plus](https://github.com/flixlix/power-flow-card-plus).

## Installation

1. Install via [HACS](https://hacs.xyz/) (Lovelace > Custom repositories > add this repo), or copy the JS files to `/config/www/` and add them as module resources.
2. Add a card to a dashboard:

```yaml
type: custom:climate-button-row
entity: climate.bedroom
auto_entity: switch.bedroom_auto
step: 1
```

```yaml
type: custom:fan-light-button-row
entity: fan.kitchen
light_entity: light.kitchen_fan_light
```

```yaml
type: custom:dual-battery-flow-card
solar: sensor.total_dc_power
home: sensor.load_power
grid:
  consumption: sensor.import_power
  production: sensor.export_power
battery:
  entity: sensor.battery_level
  charge: sensor.battery_in
  discharge: sensor.battery_out
  name: House Battery
battery_2:
  entity: sensor.garagebtproxy_state_of_charge
  charge: sensor.garagebtproxy_smgii_charging_power
  discharge: sensor.garagebtproxy_smgii_discharging_power
  name: Garage Battery
individual:
  - entity: sensor.ev_charger_phase_a_power
    name: Car
```

## dual-battery-flow-card

| Option | Required | Description |
|---|---|---|
| `solar` | no | Solar generation power sensor (W) |
| `home` | no | House load power sensor (W) |
| `grid.consumption` / `grid.production` | no | Import / export power sensors (W); net direction drives the flow animation |
| `battery` / `battery_2` | no | Battery config: `entity` (SoC %), `charge`/`discharge` (W) or `power` (signed W, positive = charging, adapt with `invert`), `name` |
| `car` | no | Car battery config: `entity` (SoC %), `power` (signed W, positive = charging, adapt with `invert`), `name`, `icon` |
| `individual` | no | Extra consumers shown as ranked device tiles: `entity` (W), `name`, `icon`, optional `threshold` (tile hidden while power ≤ threshold) |
| `individual_count` | no | How many device tiles to show (ranked by power, hard cap 4) |
| `title` | no | Card title |

Compact **grouped flow diagram** laid out in **three columns**: the Home node (live house load, ring glows while consuming) sits in the **middle column** as the hub, between the house battery above and the garage battery below. Every node's ring contains its icon, power value and SoC/state line, with the node name below the ring. **Inputs** fill the left column (Solar on top, Grid at the bottom with an import/export/idle sub-label), **Batteries** fill the middle column top-down (house battery at the top, the Home hub, then the garage battery and the optional car at the bottom, each ring showing the battery/car icon, max charge/discharge power and SoC %; the car's flow is a curved bypass that bows out of the Home hub around the left edge of the garage bubble instead of daisy-chaining through it), and the top-4 consumers rank into the **Devices** cluster down the right column. Small uppercase group tags label each cluster. **Every bubble is sized by usage**: the node generating or consuming the most power gets the biggest circle and all the others scale down with the square root of their power ratio (diameter `clamp(34px, 8.2 + 7.4·√(W/maxW) cqw, 84px)`; battery/car nodes use a bigger floor — `clamp(48px, 11.5 + 4.1·√(W/maxW) cqw, 84px)` — so idle batteries still fill the middle column instead of sitting at the tiny minimum), so nodes at/below the activity threshold sit at their floor; the home hub is included in the scaling, and the icons and type inside each ring scale with its bubble. **Node ring colours identify the node class**: solar yellow `#fdd835`, grid red `#e53935`, batteries and car blue `#2196f3`, devices purple `#ab47bc`, home slate `#546e7a`; idle nodes simply dim. **Flow lines are semantic**: green `#43a047` = good (solar generation, battery/car charging or discharging, grid export, device feeds while the home is self-covered) vs red `#e53935` = bad (grid import, and device feeds while the home is importing). Animated dashed flow lines connect every node to the Home hub: the dashes run in the direction of the actual flow (reversed while exporting or charging) and each line's width scales with its power (1.5–6 px) so the biggest flows read at a glance. Active nodes glow, idle nodes and lines dim. The card keeps a compact 100/78 aspect ratio and scales with the card width. Tap a node (or focus it and press Enter/Space) to open the entity's more-info dialog. Use `-` instead of an entity if a value is unavailable.

## fan-light-button-row

All original fan-percent-button-row options work (`customSetpoints`, `reverseButtons`, `isTwoSpeedFan`, `hideOff`, `sendStateWithSpeed`, `allowDisablingButtons`, `offPercentage`/`lowPercentage`/`medPercentage`/`hiPercentage`, `width`/`height`, `customTheme` and colors, `customOffText`/`customLowText`/`customMedText`/`customHiText`). Extra options:

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | - | Fan entity to control |
| `light_entity` | no | - | Light entity toggled by the LIGHT button (button hidden if not set) |
| `hideLight` | no | false | Hide the LIGHT button |
| `customLightText` | no | LIGHT | LIGHT button label |
| `lightWidth` | no | width x 1.15 | LIGHT button width (CSS length) |
| `isLightOnColor` | no | #43A047 | LIGHT button color when on (with `customTheme: true`) |

The light button simply calls `light.turn_on` / `light.turn_off` on `light_entity`; it does not affect the fan.

## fan-onoff-button-row

On/off button row (`OFF` `ON`) for fans and switches that only support on/off. Works with `fan.*` and `switch.*` entities.

```yaml
type: custom:fan-onoff-button-row
entity: switch.alfrescoswitch_outdoor_lights_l4
```

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | - | `fan.*` or `switch.*` entity |
| `name` | no | entity name | Row label |
| `reverseButtons` | no | false | Show ON before OFF |
| `allowDisablingButtons` | no | true | Disable the button matching the current state |
| `width` / `height` | no | 30px / 30px | Button size (CSS length) |
| `customTheme` | no | false | Use the custom colors below instead of theme colors |
| `customOffText` / `customOnText` | no | OFF / ON | Button labels |
| `isOffColor` / `isOnColor` / `buttonInactiveColor` | no | #f44c09 / #43A047 / #759aaa | Button colors (with `customTheme: true`) |
| `auto_entity` | no | - | Entity toggled by the AUTO button (button hidden if not set) |
| `hideAuto` | no | false | Hide the AUTO button |
| `customAutoText` | no | AUTO | AUTO button label |
| `autoWidth` | no | width x 1.15 | AUTO button width (CSS length) |
| `isAutoOnColor` | no | #43A047 | AUTO button color when on (with `customTheme: true`) |

## climate-button-row

### Climate Configuration

| Option | Required | Default | Description |
|---|---|---|---|
| `entity` | yes | - | Climate entity to control |
| `auto_entity` | no | - | Switch/input_boolean toggled by the AUTO button (button hidden if not set) |
| `step` | no | 0.5 | Setpoint change per `-`/`+` press |
| `min_temp` / `max_temp` | no | entity attributes | Limits for `-`/`+` |
| `hide_auto` / `hide_off` | no | false | Hide the AUTO / OFF button |
| `default_hvac_mode` | no | heat | Mode used for ON if the entity has no `turn_on` |
| `customTheme` | no | false | Use custom colors instead of theme variables |
| `isOffColor` / `isOnColor` / `isAutoColor` / `buttonInactiveColor` | no | - | Button colors when `customTheme: true` |
| `width` / `height` | no | 30px | Button size |
| `customMinusText` / `customPlusText` / `customAutoText` / `customOnText` / `customOffText` | no | - / + / AUTO / ON / OFF | Button labels |

### Climate How it works

- The label shows the room temperature (`current_temperature`, one decimal); if the entity has no room temperature attribute, the setpoint is shown instead.
- The first `-` / `+` press shows the current setpoint for 3 seconds without changing it (accent colour + dotted underline); press again while it is showing to adjust by `step` (default 0.5) via `climate.set_temperature` — every press restarts the 3 seconds, then the label reverts to the room temperature.
- `AUTO` toggles the switch given by `auto_entity`.
- `ON` / `OFF` call `climate.turn_on` / `climate.turn_off`, falling back to `climate.set_hvac_mode` when those services are not supported.
- Pressing `OFF` also turns off `auto_entity` if it is on.
- When `auto_entity` is on, `ON`/`OFF` are hidden; press `AUTO` to turn auto off.
