window.customCards = window.customCards || [];
window.customCards.push({
  type: "dual-battery-flow-card",
  name: "dual battery flow card",
  description: "Compact grouped power flow card: Inputs, Batteries (two batteries + optional car) and ranked Devices as tiles with animated flow buses.",
  preview: false,
});

const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const COLORS = {
  solar: "#f6a623",
  import: "#ef6c00",
  export: "#43a047",
  charge: "#29b6f6",
  discharge: "#43a047",
  home: "#546e7a",
  individual: "#8e24aa",
  idle: "var(--disabled-text-color, #9e9e9e)",
};

class DualBatteryFlowCard extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .wrap {
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .title {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-text-color);
      }
      .home-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 12px;
        border-radius: 999px;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: 0 0 0 1.5px var(--home-color, #546e7a), var(--home-glow, 0 0 transparent);
      }
      .home-chip ha-icon {
        --mdc-icon-size: 18px;
        color: var(--home-color, #546e7a);
      }
      .home-value {
        font-size: 15px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        color: var(--primary-text-color);
      }
      .home-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--secondary-text-color);
      }
      .group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .group-head {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dot {
        flex: none;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent);
      }
      .dot.pulse {
        animation: dotpulse 1.6s ease-in-out infinite;
      }
      @keyframes dotpulse {
        0%,
        100% {
          opacity: 0.45;
        }
        50% {
          opacity: 1;
        }
      }
      .group-name {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: var(--secondary-text-color);
      }
      .bus {
        flex: 1;
        height: 2px;
        border-radius: 2px;
        background: repeating-linear-gradient(90deg, var(--accent) 0 5px, transparent 5px 12px);
        opacity: 0.18;
      }
      .bus.active {
        opacity: 0.85;
        animation: busflow 1.1s linear infinite;
      }
      .bus.reverse {
        animation-direction: reverse;
      }
      @keyframes busflow {
        to {
          background-position: 12px 0;
        }
      }
      .tiles {
        display: grid;
        gap: 8px;
      }
      .cols-1 {
        grid-template-columns: repeat(1, 1fr);
      }
      .cols-2 {
        grid-template-columns: repeat(2, 1fr);
      }
      .cols-3 {
        grid-template-columns: repeat(3, 1fr);
      }
      .cols-4 {
        grid-template-columns: repeat(4, 1fr);
      }
      @media (max-width: 520px) {
        .cols-4,
        .cols-3 {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      .tile {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 7px 9px 8px;
        border-radius: 10px;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: 0 0 0 1px var(--divider-color, rgba(0, 0, 0, 0.12));
        transition: box-shadow 0.2s, transform 0.2s;
        min-width: 0;
      }
      .tile[role="button"] {
        cursor: pointer;
      }
      .tile[role="button"]:hover,
      .tile[role="button"]:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 0 0 1px var(--ring-color), 0 3px 10px rgba(0, 0, 0, 0.25);
        outline: none;
      }
      .tile-top {
        display: flex;
        gap: 6px;
        align-items: center;
        min-width: 0;
      }
      .chip {
        flex: none;
        width: 24px;
        height: 24px;
        border-radius: 7px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--ring-color) 16%, transparent);
      }
      .tile.idle .chip {
        background: color-mix(in srgb, var(--disabled-text-color) 16%, transparent);
      }
      .chip ha-icon {
        --mdc-icon-size: 16px;
        color: var(--ring-color);
      }
      .name {
        font-size: 11px;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      .tile-bottom {
        display: flex;
        align-items: baseline;
        gap: 6px;
      }
      .value {
        font-size: 14px;
        font-weight: 650;
        font-variant-numeric: tabular-nums;
        color: var(--primary-text-color);
      }
      .tile.idle .value {
        color: var(--secondary-text-color);
      }
      .state {
        font-size: 10px;
        color: var(--secondary-text-color);
      }
      .flow {
        height: 2px;
        border-radius: 2px;
        margin-top: 1px;
        background: repeating-linear-gradient(90deg, var(--ring-color) 0 4px, transparent 4px 10px);
        opacity: 0.14;
      }
      .flow.active {
        opacity: 0.7;
        animation: tileflow 1.1s linear infinite;
      }
      .flow.reverse {
        animation-direction: reverse;
      }
      @keyframes tileflow {
        to {
          background-position: 10px 0;
        }
      }
    `;
  }

  setConfig(config) {
    if (!config.solar && !config.home && !config.grid) {
      throw new Error("dual-battery-flow-card: define at least solar, home or grid");
    }
    this.config = config;
  }

  getCardSize() {
    return 3;
  }

  _state(entityId) {
    return entityId ? this.hass.states[entityId] : undefined;
  }

  _num(entityId) {
    const state = this._state(entityId);
    if (!state) {
      return 0;
    }
    const value = parseFloat(state.state);
    return Number.isFinite(value) ? value : 0;
  }

  _fmt(watts) {
    const value = Number(watts) || 0;
    const abs = Math.abs(value);
    if (abs >= 1000) {
      return (value / 1000).toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1") + " kW";
    }
    return Math.round(value) + " W";
  }

  _battery(config, alt) {
    if (!config) {
      return null;
    }
    const state = this._state(config.entity);
    const soc = state ? parseFloat(state.state) : NaN;
    let charge = this._num(config.charge);
    let discharge = this._num(config.discharge);
    if (config.power) {
      const sign = config.invert ? -1 : 1;
      const value = sign * this._num(config.power);
      charge = value > 0 ? value : 0;
      discharge = value < 0 ? -value : 0;
    }
    return {
      config,
      alt,
      soc: Number.isFinite(soc) ? soc : null,
      charge,
      discharge,
    };
  }

  _batteryIcon(battery) {
    if (!battery) {
      return "mdi:battery";
    }
    const soc = battery.soc == null ? null : Math.floor(Math.min(100, Math.max(0, battery.soc)) / 10) * 10;
    const charging = battery.charge > 10 && battery.charge >= battery.discharge;
    if (charging) {
      if (soc == null || soc >= 100) {
        return "mdi:battery-charging";
      }
      if (soc <= 0) {
        return "mdi:battery-charging-outline";
      }
      return "mdi:battery-charging-" + soc;
    }
    if (soc == null || soc >= 100) {
      return "mdi:battery";
    }
    if (soc <= 0) {
      return "mdi:battery-outline";
    }
    return "mdi:battery-" + soc;
  }

  _batteryColor(battery) {
    if (!battery) {
      return COLORS.idle;
    }
    if (battery.charge > 10 && battery.charge >= battery.discharge) {
      return COLORS.charge;
    }
    if (battery.discharge > 10) {
      return COLORS.discharge;
    }
    return COLORS.idle;
  }

  _values() {
    const config = this.config;
    const gridImport = this._num(config.grid && config.grid.consumption);
    const gridExport = this._num(config.grid && config.grid.production);
    return {
      solar: this._num(config.solar),
      home: this._num(config.home),
      gridImport,
      gridExport,
      gridNet: gridImport - gridExport,
      batteries: [
        this._battery(config.battery, "House Battery"),
        this._battery(config.battery_2, "Garage Battery"),
      ].filter(Boolean),
      car: config.car ? this._battery(config.car, "Car") : null,
      individuals: (config.individual || []).map((item) => {
        const entity = typeof item === "string" ? item : item.entity;
        return {
          entity,
          name: (typeof item === "object" && item.name) || (this._state(entity) || {}).attributes?.friendly_name || entity,
          icon: (typeof item === "object" && item.icon) || "mdi:car-electric",
          threshold: typeof item === "object" && item.threshold != null ? Number(item.threshold) : null,
          value: this._num(entity),
        };
      }),
    };
  }

  _tileActivated = (ev) => {
    const tile = ev.currentTarget;
    const entityId = tile && tile.getAttribute("data-entity");
    if (entityId) {
      this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }));
    }
  };

  _tileKeydown = (ev) => {
    if (ev.key === "Enter" || ev.key === " " || ev.key === "Spacebar") {
      ev.preventDefault();
      this._tileActivated(ev);
    }
  };

  _tile(entity, icon, name, valueText, stateText, color, active, reverse) {
    const cls = "tile" + (active ? "" : " idle");
    const inner = html`
      <div class="tile-top">
        <div class="chip"><ha-icon icon="${icon}"></ha-icon></div>
        <div class="name">${name}</div>
      </div>
      <div class="tile-bottom">
        <div class="value">${valueText}</div>
        ${stateText ? html`<div class="state">${stateText}</div>` : ""}
      </div>
      <div class="flow ${active ? "active" : ""} ${reverse ? "reverse" : ""}"></div>
    `;
    if (entity) {
      return html`
        <div
          class="${cls}"
          style="--ring-color:${color}"
          role="button"
          tabindex="0"
          title="${name} — ${entity}"
          data-entity="${entity}"
          @click=${this._tileActivated}
          @keydown=${this._tileKeydown}
        >
          ${inner}
        </div>
      `;
    }
    return html`<div class="${cls}" style="--ring-color:${color}">${inner}</div>`;
  }

  _group(name, accent, active, cols, reverse, tiles) {
    return html`
      <div class="group">
        <div class="group-head" style="--accent:${accent}">
          <span class="dot ${active ? "pulse" : ""}"></span>
          <span class="group-name">${name}</span>
          <span class="bus ${active ? "active" : ""} ${reverse ? "reverse" : ""}"></span>
        </div>
        <div class="tiles cols-${cols}">${tiles}</div>
      </div>
    `;
  }

  render() {
    const config = this.config;
    const values = this._values();
    const threshold = 10;
    const solarActive = values.solar > threshold;
    const gridActive = Math.abs(values.gridNet) > threshold;
    const gridImport = values.gridNet >= 0;
    const gridColor = gridActive ? (gridImport ? COLORS.import : COLORS.export) : COLORS.idle;
    const homeActive = values.home > threshold;

    const members = values.car ? [...values.batteries, values.car] : values.batteries;
    const totalCharge = members.reduce((sum, b) => sum + b.charge, 0);
    const totalDischarge = members.reduce((sum, b) => sum + b.discharge, 0);
    const chargingDominant = totalCharge > totalDischarge;
    const batteriesActive = members.some((b) => b.charge > threshold || b.discharge > threshold);

    let individuals = values.individuals.filter((item) => item.threshold == null || item.value > item.threshold);
    const individualCount = config.individual_count != null ? Number(config.individual_count) : null;
    if (individualCount != null && Number.isFinite(individualCount) && individualCount > 0) {
      individuals = [...individuals].sort((a, b) => b.value - a.value).slice(0, individualCount);
    }
    individuals = individuals.slice(0, 4);
    const devicesActive = individuals.some((item) => item.value > threshold);

    const inputTiles = [];
    if (config.solar) {
      inputTiles.push(this._tile(config.solar, "mdi:weather-sunny", "Solar", this._fmt(values.solar), "", solarActive ? COLORS.solar : COLORS.idle, solarActive, false));
    }
    if (config.grid) {
      const gridEntity = config.grid.consumption || config.grid.production;
      inputTiles.push(
        this._tile(
          gridEntity,
          "mdi:transmission-tower",
          "Grid",
          this._fmt(Math.abs(values.gridNet)),
          gridActive ? (gridImport ? "import" : "export") : "idle",
          gridColor,
          gridActive,
          !gridImport
        )
      );
    }

    const batteryTiles = members.map((battery) => {
      const isCar = battery === values.car;
      const icon = isCar ? battery.config.icon || "mdi:car-electric" : this._batteryIcon(battery);
      const name = battery.config.name || (battery.config.entity ? this._state(battery.config.entity)?.attributes?.friendly_name : "") || battery.alt;
      const power = Math.max(battery.charge, battery.discharge);
      const stateText = battery.soc == null ? "" : Math.round(battery.soc) + "%";
      const active = battery.charge > threshold || battery.discharge > threshold;
      return this._tile(battery.config.entity, icon, name, this._fmt(power), stateText, this._batteryColor(battery), active, battery.charge > battery.discharge);
    });

    const deviceTiles = individuals.map((item) =>
      this._tile(item.entity, item.icon, item.name, this._fmt(item.value), "", item.value > threshold ? COLORS.individual : COLORS.idle, item.value > threshold, false)
    );

    return html`
      <ha-card>
        <div class="wrap">
          ${config.title || config.home
            ? html`
                <div class="head">
                  ${config.title ? html`<div class="title">${config.title}</div>` : ""}
                  ${config.home
                    ? html`
                        <div class="home-chip" style="--home-color:${COLORS.home}; --home-glow:${homeActive ? "0 0 10px " + COLORS.home + "55" : "0 0 transparent"}">
                          <ha-icon icon="mdi:home"></ha-icon>
                          <span class="home-value">${this._fmt(values.home)}</span>
                          <span class="home-label">Home</span>
                        </div>
                      `
                    : ""}
                </div>
              `
            : ""}
          ${inputTiles.length ? this._group("Inputs", COLORS.solar, solarActive || gridActive, inputTiles.length, false, inputTiles) : ""}
          ${batteryTiles.length ? this._group("Batteries", chargingDominant ? COLORS.charge : COLORS.discharge, batteriesActive, batteryTiles.length, chargingDominant, batteryTiles) : ""}
          ${deviceTiles.length ? this._group("Devices", COLORS.individual, devicesActive, Math.min(4, deviceTiles.length), false, deviceTiles) : ""}
        </div>
      </ha-card>
    `;
  }
}

customElements.define("dual-battery-flow-card", DualBatteryFlowCard);
