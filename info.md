Custom Lovelace cards for Home Assistant.

## dual-battery-flow-card

Compact **grouped flow diagram** in **three columns**: the **Home** node (live house load, ring glows while consuming) is the hub in the **middle column**, between the house battery above and the garage battery below; each node's ring holds its icon, power value and SoC/state line with the name below. **Inputs** (solar on top, grid at the bottom, with import/export/idle) fill the left column, **Batteries** (house, garage and the optional car, SoC and max charge/discharge power per member) fill the middle column top-down — the car sits at the bottom and is **charge-only** (no V2L: its curved bypass bowing around the garage bubble animates only while charging, home→car; negative power is the vehicle's own loads, rendered as a dim idle node at `0 W`, never a car→home flow) — and the top-6 consumers rank into the **Devices** 2×3 grid on the right (rank 1 top-left, rank 2 top-right, rank 3 middle-left, rank 4 middle-right, rank 5 bottom-left, rank 6 bottom-right — biggest consumers on the top row; the inner column keeps straight feeds while the outer column gets arcs: over the top row, a needle between the top and middle inner bubbles, and under the bottom row). **Every bubble is sized by usage**: the biggest producer/consumer gets the largest circle, the rest scale with the square root of their power ratio (clamped min–max, idle at minimum) — home hub included — while battery/car nodes get a bigger floor (≈11.5cqw idle vs 8.2cqw for the others, cap 84px) so the middle column doesn't waste space — the **house battery is enlarged further** (≈14cqw idle floor, cap 96px) so it reads as the biggest blue bubble; the icons and type inside each ring scale with the bubble. **The house and garage bubbles wear a VERTICAL 4-bar SoC battery glyph** (pure CSS — terminal nub on top, four horizontal bars 25% each stacked bottom-to-top) instead of a battery icon: the glyph carries the state colour — **green charging, red discharging, blue idle** — while the bubble ring stays battery blue; idle or discharging it shows SoC quartiles as statically lit bars (all dim if SoC is unknown); **while charging, the frontier bar loops filling left→right in its row** so the charge fills bottom-to-top, and at 100% charge (or SoC unknown while charging) all four bars pulse in a gentle shimmer. The car keeps its mdi icon — its charging is already shown by the home→car flow. **Ring colours identify the node class** — solar yellow, grid red, batteries/car blue, devices purple, home slate — and **flow lines are semantic**: green = good (solar, charging/discharging batteries, export, self-covered devices), red = bad (grid import and device feeds while importing). Small uppercase group tags label the clusters. Animated dashed flow lines run node→hub (the car curve runs hub→car) in the direction of the actual flow (reversed on export/charging) and their stroke width scales with power for at-a-glance reading; **direction chevrons ride each active flow** (CSS motion-path, two per line, reversed with the flow polarity so they always point where the electrons go) and vanish under the bubbles at the ends; active nodes glow, idle nodes dim. Tap a node (or Enter/Space) to open its more-info dialog. Inspired by [power-flow-card-plus](https://github.com/flixlix/power-flow-card-plus).

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

| Option | Required | Description |
|---|---|---|
| `solar` | no | Solar generation power sensor (W) |
| `home` | no | House load power sensor (W) |
| `grid.consumption` / `grid.production` | no | Import / export power sensors (W) |
| `battery` / `battery_2` | no | Battery config: `entity` (SoC %), `charge`/`discharge` (W) or `power` (signed W, positive = charging, adapt with `invert`), `name` |
| `car` | no | Car battery config, **charge-only** (no V2L/car→home flow): `entity` (SoC %), `power` (signed W; positive = charging, negative = vehicle-side load shown idle at `0 W`), `name`, `icon` |
| `individual` | no | Extra consumers shown as ranked device tiles: `entity` (W), `name`, `icon`, optional `threshold` |
| `individual_count` | no | Number of device tiles to show (ranked by power, cap 6) |
| `title` | no | Card title |

## climate-button-row

Control a climate entity in a button row: `-` `[temp]` `+` `AUTO` `ON` `OFF`.

```yaml
type: custom:climate-button-row
entity: climate.bedroom
auto_entity: switch.bedroom_auto
step: 1
```

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

The label shows the room temperature by default (setpoint instead when the entity has no `current_temperature`). The first `-`/`+` press shows the current setpoint for 3 seconds (accent colour + dotted underline) without changing it; press again while it is showing to adjust it via `climate.set_temperature` (one decimal; every press restarts the 3 seconds, then the label reverts to the room temp). `AUTO` toggles `auto_entity` (switch or input_boolean), `ON`/`OFF` call `climate.turn_on`/`turn_off` (falling back to `set_hvac_mode`). Pressing `OFF` also turns off `auto_entity` if it is on. When `auto_entity` is on, `ON`/`OFF` are hidden; press `AUTO` to turn auto off.

## fan-light-button-row

Fan percent buttons (`HIGH` `MED` `LOW` `OFF`) with an optional paired light toggle (`LIGHT`), forked from [fan-percent-button-row](https://github.com/finity69x2/fan-percent-button-row).

```yaml
type: custom:fan-light-button-row
entity: fan.kitchen
light_entity: light.kitchen_fan_light
```

All original fan-percent-button-row options work. Extra options:

| Option | Required | Default | Description |
|---|---|---|---|
| `light_entity` | no | - | Light entity toggled by the LIGHT button (button hidden if not set) |
| `hideLight` | no | false | Hide the LIGHT button |
| `customLightText` | no | LIGHT | LIGHT button label |
| `lightWidth` | no | width x 1.15 | LIGHT button width (CSS length) |
| `isLightOnColor` | no | #43A047 | LIGHT button color when on (with `customTheme: true`) |

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
