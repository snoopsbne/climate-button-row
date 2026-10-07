# Custom Cards

Custom Lovelace cards for Home Assistant:

- `custom:climate-button-row` – control a climate entity: `-` `[setpoint]` `+` `AUTO` `ON` `OFF`.
- `custom:fan-light-button-row` – fan percent buttons (`HIGH` `MED` `LOW` `OFF`) with an optional paired light toggle (`LIGHT`), forked from [fan-percent-button-row](https://github.com/finity69x2/fan-percent-button-row).
- `custom:dual-battery-flow-card` – solar/grid/home power flow with **two batteries** (SoC, charge/discharge per battery) and optional individual devices, inspired by [power-flow-card-plus](https://github.com/flixlix/power-flow-card-plus).

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
| `battery` / `battery_2` | no | Battery config: `entity` (SoC %), `charge` (W), `discharge` (W), `name` |
| `individual` | no | Extra consumers shown as small nodes, e.g. car charger: `entity` (W) and `name` |
| `title` | no | Card title |

Lines animate in the direction of the actual flow (import vs export, charge vs discharge); use `-` instead of an entity if a value is unavailable.

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

- `-` / `+` call `climate.set_temperature` with the current setpoint +/- `step` (default 0.5).
- The setpoint display shows one decimal (e.g. `21.5`).
- `AUTO` toggles the switch given by `auto_entity`.
- `ON` / `OFF` call `climate.turn_on` / `climate.turn_off`, falling back to `climate.set_hvac_mode` when those services are not supported.
- Pressing `OFF` also turns off `auto_entity` if it is on.
- When `auto_entity` is on, `ON`/`OFF` are hidden; press `AUTO` to turn auto off.
