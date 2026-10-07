window.customCards = window.customCards || [];
window.customCards.push({
  type: "dual-battery-flow-card",
  name: "dual battery flow card",
  description: "Power flow card with solar, grid, home and two batteries.",
  preview: false,
});

const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

const POSITIONS = {
  solar: [50, 10],
  grid: [14, 47],
  home: [50, 47],
  battery: [50, 84],
  battery_2: [20, 84],
  individual: [[86, 84], [86, 67], [86, 50], [86, 33], [86, 16]],
};

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
      .container {
        position: relative;
        width: 100%;
        aspect-ratio: 4 / 3.4;
        min-height: 320px;
        max-height: 460px;
      }
      .lines {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
      }
      .lines path.track {
        fill: none;
        stroke: var(--divider-color, #9e9e9e);
        stroke-width: 1.2;
        opacity: 0.25;
        stroke-linecap: round;
      }
      .lines path.flow {
        fill: none;
        stroke-width: 1;
        stroke-linecap: round;
        stroke-dasharray: 4 6;
        opacity: 0.15;
      }
      .lines path.flow.active {
        opacity: 1;
        animation: flow 1.1s linear infinite;
      }
      .lines path.flow.reverse {
        animation-direction: reverse;
      }
      @keyframes flow {
        from {
          stroke-dashoffset: 0;
        }
        to {
          stroke-dashoffset: -12;
        }
      }
      .node {
        position: absolute;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .node.individual .circle {
        width: 54px;
        height: 54px;
      }
      .circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: var(--ha-card-background, var(--card-background-color, #fff));
        box-shadow: 0 0 0 2px var(--ring-color, var(--divider-color, #e0e0e0)), 0 2px 6px rgba(0, 0, 0, 0.25);
        color: var(--primary-text-color);
        transition: box-shadow 0.3s;
      }
      .circle ha-icon {
        --mdc-icon-size: 20px;
        color: var(--ring-color, var(--secondary-text-color));
      }
      .value {
        font-size: 12px;
        font-weight: 600;
        line-height: 1.1;
        margin-top: 2px;
      }
      .state {
        font-size: 9px;
        color: var(--secondary-text-color);
        line-height: 1;
      }
      .label {
        font-size: 11px;
        color: var(--primary-text-color);
        text-align: center;
        line-height: 1.1;
        max-width: 110px;
      }
      .title {
        font-size: 14px;
        font-weight: 500;
        padding: 0 0 4px 4px;
        color: var(--primary-text-color);
      }
      @media (max-width: 480px) {
        .circle {
          width: 60px;
          height: 60px;
        }
        .circle ha-icon {
          --mdc-icon-size: 16px;
        }
        .node.individual .circle {
          width: 40px;
          height: 40px;
        }
        .node.individual .circle ha-icon {
          --mdc-icon-size: 13px;
        }
        .value {
          font-size: 11px;
        }
        .node.individual .value {
          font-size: 9px;
        }
        .label {
          font-size: 10px;
        }
        .node.individual .label {
          font-size: 8px;
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
    return 5;
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

  _node(key, position, icon, value, stateText, label, color) {
    const kind = key.startsWith("individual") ? "individual" : key;
    return html`
      <div class="node ${kind}" style="left:${position[0]}%;top:${position[1]}%">
        <div class="circle" style="--ring-color:${color}">
          <ha-icon icon="${icon}"></ha-icon>
          <div class="value">${value}</div>
          ${stateText ? html`<div class="state">${stateText}</div>` : ""}
        </div>
        <div class="label">${label}</div>
      </div>
    `;
  }

  _d(from, to) {
    if (!from || !to) {
      return "";
    }
    return "M" + from[0] + "," + from[1] + " L" + to[0] + "," + to[1];
  }

  render() {
    const config = this.config;
    const values = this._values();
    const threshold = 10;
    const solarActive = values.solar > threshold;
    const gridActive = Math.abs(values.gridNet) > threshold;
    const gridImport = values.gridNet >= 0;
    const gridColor = gridImport ? COLORS.import : COLORS.export;

    const batteryNodes = [];
    values.batteries.forEach((battery, index) => {
      const key = index === 0 ? "battery" : "battery_2";
      const position = POSITIONS[key];
      const power = battery.charge >= battery.discharge ? battery.charge : battery.discharge;
      const stateText = battery.soc == null ? "" : Math.round(battery.soc) + "%";
      const label = battery.config.name || (battery.config.entity ? this._state(battery.config.entity)?.attributes?.friendly_name : "") || battery.alt;
      batteryNodes.push(this._node(key, position, this._batteryIcon(battery), this._fmt(power), stateText, label, this._batteryColor(battery)));
    });

    let individuals = values.individuals.filter((item) => item.threshold == null || item.value > item.threshold);
    const individualCount = config.individual_count != null ? Number(config.individual_count) : null;
    if (individualCount != null && Number.isFinite(individualCount) && individualCount > 0) {
      individuals = [...individuals].sort((a, b) => b.value - a.value).slice(0, individualCount);
    }
    individuals = individuals.slice(0, POSITIONS.individual.length);

    const individualNodes = [];
    individuals.forEach((item, index) => {
      const position = POSITIONS.individual[index];
      individualNodes.push(
        this._node("individual" + index, position, item.icon, this._fmt(item.value), "", item.name, item.value > threshold ? COLORS.individual : COLORS.idle)
      );
    });

    const batteryRows = [0, 1].map((index) => {
      const battery = values.batteries[index];
      const position = POSITIONS[index === 0 ? "battery" : "battery_2"];
      const charging = battery && battery.charge > threshold && battery.charge >= battery.discharge;
      const discharging = battery && battery.discharge > threshold;
      return {
        d: battery ? this._d(position, POSITIONS.home) : "",
        active: charging || discharging,
        reverse: charging,
        color: charging ? COLORS.charge : COLORS.discharge,
      };
    });

    const individualRows = POSITIONS.individual.map((position, index) => {
      const item = individuals[index];
      return {
        d: item ? this._d(position, POSITIONS.home) : "",
        active: !!(item && item.value > threshold),
        reverse: true,
        color: COLORS.individual,
      };
    });

    return html`
      <ha-card>
        ${config.title ? html`<div class="title">${config.title}</div>` : ""}
        <div class="container">
          <svg class="lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path class="track" d="${this._d(POSITIONS.solar, POSITIONS.home)}"></path>
            <path class="flow ${solarActive ? "active" : ""}" style="stroke:${COLORS.solar}" d="${this._d(POSITIONS.solar, POSITIONS.home)}"></path>
            <path class="track" d="${this._d(POSITIONS.grid, POSITIONS.home)}"></path>
            <path class="flow ${gridActive ? "active" : ""} ${gridImport ? "" : "reverse"}" style="stroke:${gridColor}" d="${this._d(POSITIONS.grid, POSITIONS.home)}"></path>
            <path class="track" d="${batteryRows[0].d}"></path>
            <path class="flow ${batteryRows[0].active ? "active" : ""} ${batteryRows[0].reverse ? "reverse" : ""}" style="stroke:${batteryRows[0].color}" d="${batteryRows[0].d}"></path>
            <path class="track" d="${batteryRows[1].d}"></path>
            <path class="flow ${batteryRows[1].active ? "active" : ""} ${batteryRows[1].reverse ? "reverse" : ""}" style="stroke:${batteryRows[1].color}" d="${batteryRows[1].d}"></path>
            <path class="track" d="${individualRows[0].d}"></path>
            <path class="flow ${individualRows[0].active ? "active" : ""} ${individualRows[0].reverse ? "reverse" : ""}" style="stroke:${individualRows[0].color}" d="${individualRows[0].d}"></path>
            <path class="track" d="${individualRows[1].d}"></path>
            <path class="flow ${individualRows[1].active ? "active" : ""} ${individualRows[1].reverse ? "reverse" : ""}" style="stroke:${individualRows[1].color}" d="${individualRows[1].d}"></path>
            <path class="track" d="${individualRows[2].d}"></path>
            <path class="flow ${individualRows[2].active ? "active" : ""} ${individualRows[2].reverse ? "reverse" : ""}" style="stroke:${individualRows[2].color}" d="${individualRows[2].d}"></path>
            <path class="track" d="${individualRows[3].d}"></path>
            <path class="flow ${individualRows[3].active ? "active" : ""} ${individualRows[3].reverse ? "reverse" : ""}" style="stroke:${individualRows[3].color}" d="${individualRows[3].d}"></path>
            <path class="track" d="${individualRows[4].d}"></path>
            <path class="flow ${individualRows[4].active ? "active" : ""} ${individualRows[4].reverse ? "reverse" : ""}" style="stroke:${individualRows[4].color}" d="${individualRows[4].d}"></path>
          </svg>
          ${this._node("solar", POSITIONS.solar, "mdi:weather-sunny", this._fmt(values.solar), "", "Solar", solarActive ? COLORS.solar : COLORS.idle)}
          ${this._node("grid", POSITIONS.grid, "mdi:transmission-tower", this._fmt(Math.abs(values.gridNet)), gridActive ? (gridImport ? "import" : "export") : "idle", "Grid", gridActive ? gridColor : COLORS.idle)}
          ${this._node("home", POSITIONS.home, "mdi:home", this._fmt(values.home), "", "Home", COLORS.home)}
          ${batteryNodes}
          ${individualNodes}
        </div>
      </ha-card>
    `;
  }
}

customElements.define("dual-battery-flow-card", DualBatteryFlowCard);
