import Bootstrap from "@ui5/webcomponents-base/src/Bootstrap.js";
import UI5Element from "@ui5/webcomponents-base/src/UI5Element.js";

import TokenizerRenderer from "./build/compiled/TokenizerRenderer.lit.js";
import ResizeHandler from "@ui5/webcomponents-base/src/delegate/ResizeHandler";
import ItemNavigation from "@ui5/webcomponents-base/src/delegate/ItemNavigation.js";

// Styles
import styles from "./themes/Tokenizer.css.js";

// all themes should work via the convenience import (inlined now, switch to json when elements can be imported individyally)
import "./ThemePropertiesProvider.js";
import Function from "@ui5/webcomponents-base/src/types/Function";
import TokenizerTemplateContext from "./TokenizerTemplateContext.js";

/**
 * @public
 */
const metadata = {
	tag: "ui5-tokenizer",
	defaultSlot: "description",
	slots: /** @lends sap.ui.webcomponents.main.Tokenizer.prototype */ {
		tokens: { 
			type: HTMLElement,
			multiple: true,
			listenFor: { include: ["*"] },
		},
	},
	defaultSlot: "tokens",
	properties: /** @lends sap.ui.webcomponents.main.Tokenizer.prototype */ {
		showMore: { type: Boolean },

		_openOverflowPopover: { type: Function },
		_tokenDelete: { type: Function },
		_tokenSelect: { type: Function },
		_hiddenTokens: { type: Object, multiple: true },
	},
	events: /** @lends sap.ui.webcomponents.main.Tokenizer.prototype */ {
		tokenDelete: {
			detail: {
				ref: { type: HTMLElement },
			}
		},

		showMoreItemsPress: {
			detail: {
				ref: { type: HTMLElement },
			}
		}
	},
};

/**
 * @class
 *
 * <h3 class="comment-api-title">Overview</h3>
 *
 * An entry posted on the timeline.
 *
 * @constructor
 * @author SAP SE
 * @alias sap.ui.webcomponents.main.Tokenizer
 * @extends UI5Element
 * @tagname ui5-timeline
 * @usestextcontent
 * @public
 */
class Tokenizer extends UI5Element {
	static get metadata() {
		return metadata;
	}

	static get renderer() {
		return TokenizerRenderer;
	}

	static get calculateTemplateContext() {
		return TokenizerTemplateContext.calculate;
	}

	static get styles() {
		return styles;
	}

	constructor() {
		super();

		this._itemsCount = 0;
		this._lastIndex = 0;

		this._handleResize = sizes => {
			const overflowTokens = this._getTokens(true);

			if (!overflowTokens.length) {
				this._hiddenTokens = [];
			}

			if (this._hiddenTokens.length !== overflowTokens.length) {
				this._hiddenTokens = overflowTokens;
			}
		}

		this._openOverflowPopover = () => {
			this.fireEvent("showMoreItemsPress");
		}

		this._tokenDelete = event => {
			if (event.detail && event.detail.backSpace) {
				this._deleteByBackspace();
			}

			this._updateAndFocus();
			this.fireEvent("tokenDelete", { ref: event.target });
		}

		this._tokenSelect = event => {
			const oldValue = event.target.selected;

			this.tokens.forEach(token => token.selected = false);

			event.target.selected = !oldValue;
		}

		this._itemNav = new ItemNavigation(this);

		this._itemNav.getItemsCallback = () => {
			return this._getTokens();
		};

		this._delegates.push(this._itemNav);
	}

	onBeforeRendering() {
		this._itemNav.init();
	}

	onAfterRendering() {
		requestAnimationFrame(() => {
			this._handleResize();
		}, 0);
	}

	onEnterDOM() {
		ResizeHandler.register(this.shadowRoot.querySelector(".ui5-tokenizer--content"), this._handleResize);
	}

	onExitDOM() {
		ResizeHandler.deregister(this.shadowRoot.querySelector(".ui5-tokenizer--content"), this._handleResize);
	}

	_getTokens(overflow) {
		const firstToken = this.shadowRoot.querySelector("#ui5-tokenizer-token-placeholder");

		if (!firstToken) {
			return [];
		}

		const firstTokenTop = firstToken.getBoundingClientRect().top;
		const tokens = [];

		if (firstToken && this.tokens.length > 1) {				
			this.tokens.forEach(token => {
				const tokenTop = token.getBoundingClientRect().top;
				const tokenOverflows = overflow && tokenTop > firstTokenTop;
				const tokenVisible = !overflow && tokenTop <= firstTokenTop;

				(tokenVisible || tokenOverflows) && tokens.push(token);
			});
		}

		return tokens;
	}

	/* Keyboard handling */

	_updateAndFocus() {
		if (this._getTokens().length) {
			this._itemNav.update();

			setTimeout(() => {
				this._itemNav.focusCurrent();
			}, 0);
		}
	}

	_deleteByBackspace() {
		const newIndex = this._itemNav.currentIndex - 1;

		if (newIndex < 0) {
			this._itemNav.currentIndex = 0;
		} else {
			this._itemNav.currentIndex = newIndex;
		}
	}

	static async define(...params) {
		await Promise.all([]);

		super.define(...params);
	}
}

Bootstrap.boot().then(_ => {
	Tokenizer.define();
});

export default Tokenizer;