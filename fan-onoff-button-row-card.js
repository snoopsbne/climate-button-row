window.customCards = window.customCards || [];
window.customCards.push({
  type: "fan-onoff-button-row",
  name: "fan on/off button row",
  description: "On/off button row for fans and switches that only support on/off.",
  preview: false,
});

const LitElement = customElements.get("ha-panel-lovelace") ? Object.getPrototypeOf(customElements.get("ha-panel-lovelace")) : Object.getPrototypeOf(customElements.get("hc-lovelace"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

class CustomFanOnOffRow extends LitElement {

	constructor() {
		super();
		this._config = {
			customTheme: false,
			reverseButtons: false,
			allowDisablingButtons: true,
			width: '30px',
			height: '30px',
			isOnColor: '#43A047',
			isOffColor: '#f44c09',
			buttonInactiveColor: '#759aaa',
			customOffText: 'OFF',
			customOnText: 'ON',
		};
	}

	static get properties() {
		return {
			hass: Object,
			_config: Object,
			_stateObj: Object,
			_width: String,
			_height: String,
			_leftColor: String,
			_rightColor: String,
			_leftText: String,
			_rightText: String,
			_leftName: String,
			_rightName: String,
			_leftState: Boolean,
			_rightState: Boolean,
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
		`;
	}

	render() {
		return html`
			<hui-generic-entity-row .hass="${this.hass}" .config="${this._config}">
				<div id='button-container' class='box'>
					<button
						class='percentage'
						style='${this._leftColor};min-width:${this._width};max-width:${this._width};height:${this._height}'
						name="${this._leftName}"
						@click=${this.setFanState}
						.disabled=${this._leftState}>${this._leftText}</button>
					<button
						class='percentage'
						style='${this._rightColor};min-width:${this._width};max-width:${this._width};height:${this._height}'
						name="${this._rightName}"
						@click=${this.setFanState}
						.disabled=${this._rightState}>${this._rightText}</button>
				</div>
			</hui-generic-entity-row>
		`;
	}

	firstUpdated() {
		super.firstUpdated();
		this.shadowRoot.getElementById('button-container').addEventListener('click', (ev) => ev.stopPropagation());
	}

	setConfig(config) {
		if (!config.entity) {
			throw new Error("You need to define an entity");
		}
		this._config = { ...this._config, ...config };
	}

	getCardSize() {
		return 1;
	}

	updated(changedProperties) {
		if (changedProperties.has("hass")) {
			this.hassChanged();
		}
	}

	hassChanged() {
		const config = this._config;
		const stateObj = this.hass.states[config.entity];
		const custTheme = config.customTheme;
		const allowDisable = config.allowDisablingButtons;
		const revButtons = config.reverseButtons;

		const isOn = stateObj ? stateObj.state === 'on' : false;
		const unavailable = !stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown';

		const styleOn = custTheme
			? 'background-color:' + config.isOnColor
			: 'background-color: var(--ha-switch-checked-background-color, var(--ha-color-fill-primary-normal-resting)); border-color: var(--ha-switch-checked-border-color, var(--ha-color-border-primary-loud))';
		const styleOff = custTheme
			? 'background-color:' + config.isOffColor
			: 'background-color: var(--ha-switch-background-color, var(--ha-color-fill-disabled-quiet-resting)); border-color: var(--ha-switch-border-color, var(--ha-color-border-neutral-normal))';
		const styleInactive = 'background-color:' + config.buttonInactiveColor;

		const onColor = isOn ? styleOn : styleInactive;
		const offColor = isOn ? styleInactive : styleOff;

		this._stateObj = stateObj;
		this._width = config.width;
		this._height = config.height;

		if (revButtons) {
			this._leftName = 'on';
			this._rightName = 'off';
			this._leftText = config.customOnText;
			this._rightText = config.customOffText;
			this._leftColor = onColor;
			this._rightColor = offColor;
			this._leftState = unavailable || (isOn && allowDisable);
			this._rightState = unavailable || (!isOn && allowDisable);
		} else {
			this._leftName = 'off';
			this._rightName = 'on';
			this._leftText = config.customOffText;
			this._rightText = config.customOnText;
			this._leftColor = offColor;
			this._rightColor = onColor;
			this._leftState = unavailable || (!isOn && allowDisable);
			this._rightState = unavailable || (isOn && allowDisable);
		}
	}

	setFanState(e) {
		const level = e.currentTarget.getAttribute('name');
		const entityId = this._config.entity;
		const domain = entityId.split('.')[0];
		const service = level === 'on' ? 'turn_on' : 'turn_off';
		this.hass.callService(domain, service, { entity_id: entityId });
	}
}

customElements.define('fan-onoff-button-row', CustomFanOnOffRow);
