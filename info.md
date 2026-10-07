Custom Lovelace button rows for Home Assistant.

## climate-button-row

Control a climate entity in a button row: `-` `[setpoint]` `+` `AUTO` `ON` `OFF`.

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

`-`/`+` call `climate.set_temperature` (setpoint shown with one decimal), `AUTO` toggles `auto_entity` (switch or input_boolean), `ON`/`OFF` call `climate.turn_on`/`turn_off` (falling back to `set_hvac_mode`). Pressing `OFF` also turns off `auto_entity` if it is on. When `auto_entity` is on, `ON`/`OFF` are hidden; press `AUTO` to turn auto off.

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
