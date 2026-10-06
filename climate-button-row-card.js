window.customCards = window.customCards || [];
window.customCards.push({
  type: "climate-button-row",
  name: "climate button row",
  description: "A plugin to display your climate controls in a button row.",
  preview: false,
});

const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class CustomClimateButtonRow extends LitElement {

	constructor() {
		super();
		this._config = {
			customTheme: false,
			step: 0.5,
			hideAuto: false,
			hideOff: false,
			allowDisablingButtons: true,
			width: '30px',
			height: '30px',
			isOffColor: '#f44c09',
			isOnColor: '#43A047',
			isAutoColor: '#43A047',
			buttonInactiveColor: '#759aaa',
			customMinusText: '-',
			customPlusText: '+',
			customAutoText: 'AUTO',
			customOnText: 'ON',
			customOffText: 'OFF',
		};
	}

	static get properties() {
		return {
			hass: Object,
			_config: Object,
			_stateObj: Object,
			_step: Number,
			_width: String,
			_height: String,
			_minusColor: String,
			_tempColor: String,
			_plusColor: String,
			_autoColor: String,
			_onColor: String,
			_offColor: String,
			_minusText: String,
			_tempText: String,
			_plusText: String,
			_autoText: String,
			_onText: String,
			_offText: String,
			_minusName: String,
			_autoName: String,
			_onName: String,
			_offName: String,
			_hideAuto: String,
			_hideOff: String,
			_minusState: Boolean,
			_plusState: Boolean,
			_autoState: Boolean,
			_onState: Boolean,
			_offState: Boolean,
		};
	}

	static get styles() {
		return css`
			:host {
				line-height: inherit;
			}
			.box {
				display: flex;
				flex-direction: row;
			}
			.percentage {
				margin-left: 2px;
				margin-right: 2px;
				background-color: #759aaa;
				border: 1px solid lightgrey;
				border-radius: 4px;
				font-size: 10px !important;
				color: inherit;
				text-align: center;
				float: left !important;
				padding: 1px;
				cursor: pointer;
			}
			.temp {
				margin-left: 2px;
				margin-right: 2px;
				background-color: #759aaa;
				border: 1px solid lightgrey;
				border-radius: 4px;
				font-size: 14px !important;
				color: inherit;
				text-align: center;
				float: left !important;
				padding: 1px;
				min-width: 44px;
				display: flex;
				align-items: center;
				justify-content: center;
			}
		`;
	}

	render() {
		return html`
			<hui-generic-entity-row .hass="${this.hass}" .config="${this._config}">
				<div id='button-container' class='box'>
					<button
						class='percentage'
						style='${this._minusColor};min-width:${this._width};max-width:${this._width};height:${this._height}'
						toggles name="${this._minusName}"
						@click=${this.handleButton}
						.disabled=${this._minusState}>${this._minusText}</button>
					<span class='temp' style='${this._tempColor};height:${this._height}'>${this._tempText}</span>
					<button
						class='percentage'
						style='${this._plusColor};min-width:${this._width};max-width:${this._width};height:${this._height}'
						toggles name="plus"
						@click=${this.handleButton}
						.disabled=${this._plusState}>${this._plusText}</button>
					<button
						class='percentage'
						style='${this._autoColor};min-width:${this._width};max-width:${this._width};height:${this._height};${this._hideAuto}'
						toggles name="${this._autoName}"
						@click=${this.handleButton}
						.disabled=${this._autoState}>${this._autoText}</button>
					<button
						class='percentage'
						style='${this._onColor};min-width:${this._width};max-width:${this._width};height:${this._height}'
						toggles name="${this._onName}"
						@click=${this.handleButton}
						.disabled=${this._onState}>${this._onText}</button>
					<button
						class='percentage'
						style='${this._offColor};min-width:${this._width};max-width:${this._width};height:${this._height};${this._hideOff}'
						toggles name="${this._offName}"
						@click=${this.handleButton}
						.disabled=${this._offState}>${this._offText}</button>
				</div>
			</hui-generic-entity-row>
		`;
	}

	firstUpdated() {
		super.firstUpdated();
		this.shadowRoot.getElementById('button-container').addEventListener('click', (ev) => ev.stopPropagation());
	}

	setConfig(config) {
		this._config = { ...this._config, ...config };
	}

	updated(changedProperties) {
		if (changedProperties.has("hass")) {
			this.hassChanged();
		}
	}

	hassChanged() {
		const config = this._config;
		const stateObj = this.hass.states[config.entity];
		const autoStateObj = config.auto_entity ? this.hass.states[config.auto_entity] : null;
		const custTheme = config.customTheme;
		const step = config.step;
		const buttonWidth = config.width;
		const buttonHeight = config.height;
		const OnClr = config.isOnColor;
		const AutoClr = config.isAutoColor;
		const OffClr = config.isOffColor;
		const buttonOffClr = config.buttonInactiveColor;
		const allowDisable = config.allowDisablingButtons;

		const current = stateObj && stateObj.attributes ? Number(stateObj.attributes.temperature) : null;
		const minTemp = config.min_temp ?? (stateObj && stateObj.attributes ? Number(stateObj.attributes.min_temp) : 0);
		const maxTemp = config.max_temp ?? (stateObj && stateObj.attributes ? Number(stateObj.attributes.max_temp) : 100);

		const climateOn = stateObj && stateObj.state !== 'off';
		const autoOn = autoStateObj && autoStateObj.state === 'on';
		const atMin = current !== null && current - step < minTemp;
		const atMax = current !== null && current + step > maxTemp;

		let inactiveStyle;
		let activeStyle;
		if (custTheme) {
			inactiveStyle = 'background-color:' + buttonOffClr;
			activeStyle = 'background-color:' + OnClr;
		} else {
			inactiveStyle = 'background-color: var(--ha-switch-background-color, var(--ha-color-fill-disabled-quiet-resting)); border-color: var(--ha-switch-border-color, var(--ha-color-border-neutral-normal))';
			activeStyle = 'background-color: var(--ha-switch-checked-background-color, var(--ha-color-fill-primary-normal-resting)); border-color: var(--ha-switch-checked-border-color, var(--ha-color-border-primary-loud))';
		}

		this._stateObj = stateObj;
		this._step = step;
		this._width = buttonWidth;
		this._height = buttonHeight;
		this._minusText = config.customMinusText;
		this._plusText = config.customPlusText;
		this._tempText = current !== null ? current.toFixed(1) : '--';
		this._autoText = config.customAutoText;
		this._onText = config.customOnText;
		this._offText = config.customOffText;
		this._minusName = 'minus';
		this._autoName = 'auto';
		this._onName = 'on';
		this._offName = 'off';
		this._hideAuto = config.hideAuto ? 'display:none' : 'display:block';
		this._hideOff = config.hideOff ? 'display:none' : 'display:block';

		this._minusColor = atMin ? 'background-color:' + buttonOffClr : inactiveStyle;
		this._plusColor = atMax ? 'background-color:' + buttonOffClr : inactiveStyle;
		this._tempColor = custTheme ? 'background-color:' + buttonOffClr : inactiveStyle;
		this._autoColor = autoOn ? (custTheme ? 'background-color:' + AutoClr : activeStyle) : inactiveStyle;
		this._onColor = climateOn ? (custTheme ? 'background-color:' + OnClr : activeStyle) : inactiveStyle;
		this._offColor = !climateOn ? (custTheme ? 'background-color:' + OffClr : activeStyle) : inactiveStyle;

		this._minusState = atMin && allowDisable;
		this._plusState = atMax && allowDisable;
		this._autoState = autoOn && allowDisable;
		this._onState = climateOn && allowDisable;
		this._offState = !climateOn && allowDisable;
	}

	handleButton(e) {
		const level = e.currentTarget.getAttribute('name');
		const config = this._config;
		const stateObj = this.hass.states[config.entity];
		if (!stateObj) return;

		if (level === 'minus' || level === 'plus') {
			const current = Number(stateObj.attributes.temperature);
			const minTemp = config.min_temp ?? (stateObj.attributes.min_temp ?? 0);
			const maxTemp = config.max_temp ?? (stateObj.attributes.max_temp ?? 100);
			const delta = level === 'minus' ? -this._step : this._step;
			let target = Math.round((current + delta) * 10) / 10;
			if (target < minTemp) target = minTemp;
			if (target > maxTemp) target = maxTemp;
			this.hass.callService('climate', 'set_temperature', { entity_id: config.entity, temperature: target });
		} else if (level === 'auto') {
			const domain = config.auto_entity.split('.')[0];
			this.hass.callService(domain, 'toggle', { entity_id: config.auto_entity });
		} else if (level === 'on') {
			if (this.hass.services.climate && this.hass.services.climate.turn_on) {
				this.hass.callService('climate', 'turn_on', { entity_id: config.entity });
			} else {
				this.hass.callService('climate', 'set_hvac_mode', { entity_id: config.entity, hvac_mode: config.default_hvac_mode || 'heat' });
			}
		} else if (level === 'off') {
			if (this.hass.services.climate && this.hass.services.climate.turn_off) {
				this.hass.callService('climate', 'turn_off', { entity_id: config.entity });
			} else {
				this.hass.callService('climate', 'set_hvac_mode', { entity_id: config.entity, hvac_mode: 'off' });
			}
		}
	}
}

customElements.define('climate-button-row', CustomClimateButtonRow);
