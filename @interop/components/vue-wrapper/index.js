import { createApp, h as createElement } from 'vue';
import { toHandlerKey } from '@vue/shared';

import {
  toVNodes,
  camelize,
  hyphenate,
  callHooks,
  getInitialProps,
  createCustomEvent,
  convertAttributeValue,
} from './utils.js';


export default function wrap(Component) {
  const options = typeof Component === 'function'
    ? Component.options
    : Component;

  let isInitialized = false;

  let hyphenatedPropsList;
  let camelizedPropsList;
  let camelizedPropsMap;

  function initialize() {
    if (isInitialized) {
      return;
    }

    // extract props info
    const propsList = Array.isArray(options.props)
      ? options.props
      : Object.keys(options.props || {});
    hyphenatedPropsList = propsList.map(hyphenate);
    camelizedPropsList = propsList.map(camelize);
    const originalPropsAsObject = Array.isArray(options.props)
      ? {}
      : options.props || {};
    camelizedPropsMap = camelizedPropsList.reduce((map, key, i) => {
      map[key] = originalPropsAsObject[propsList[i]];
      return map;
    }, {});
    // proxy props as Element properties
    // TODO: here?
    camelizedPropsList.forEach(key => {
      Object.defineProperty(CustomElement.prototype, key, {
        get() {
          return this._props[key];
        },
        set(newVal) {
          this._props[key] = newVal;
        },
        enumerable: false,
        configurable: true,
      });
    });

    isInitialized = true;
  }


  class CustomElement extends HTMLElement {
    _wrapper;
    _component;

    _props = {};
    _slotChildren = [];
    _mounted;

    constructor() {
      super();

      const eventProxies = this.createEventProxies(options.emits);

      const self = this;
      this._wrapper = createApp({
        render() {
          const { dataVApp, ...props } = { // Discard dataVApp
            ...self._props,
            ...eventProxies,
          }
          return createElement(Component, props, self._slotChildren);
        },
        mounted() {
          self._mounted = true;
        },
        unmounted() {
          self._mounted = false;
        },
      });

      // Use MutationObserver to react to future attribute & slot content change
      const observer = new MutationObserver(mutations => {
        let hasChildrenChange = false;

        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];

          if (isInitialized && m.type === 'attributes' && m.target === this) {
            if (m.attributeName) {
              this.syncAttribute(m.attributeName);
            }
          } else {
            hasChildrenChange = true;
          }
        }
        if (hasChildrenChange) {
          // this.syncSlots(); // Not sure this is still necessary
        }
      });
      observer.observe(this, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }

    createEventProxies(eventNames) {
      if (!eventNames) return {};

      const entries = eventNames.map((name) => [
        toHandlerKey(camelize(name)),
        (...args) => this.dispatchEvent(createCustomEvent(name, args)),
      ]);

      return Object.fromEntries(entries);
    }

    syncSlots() {
      this._slotChildren = toVNodes(
        this.childNodes,
        createElement,
      );
    }

    syncAttribute(key) {
      const camelized = camelize(key);
      let value = undefined;

      if (this.hasOwnProperty(key)) { // TODO: Is this supposed to replace the defineProperty?
        value = this[key];
      } else if (this.hasAttribute(key)) {
        value = this.getAttribute(key);
      }
      this._props[camelized] = convertAttributeValue(value, key, camelizedPropsMap[camelized]);

      this._component?.$forceUpdate();
    }

    syncInitialAttributes() {
      this._props = getInitialProps(camelizedPropsList);
      hyphenatedPropsList.forEach(key => {
        this.syncAttribute(key);
      });
    }

    connectedCallback() {
      if (!this._component || !this._mounted) {
        if (isInitialized) {
          // initialize attributes
          this.syncInitialAttributes();
        }
        // initialize children
        this.syncSlots();

        // Mount the component
        this._component = this._wrapper.mount(this);
      } else {
        // Call mounted on re-insert
        callHooks(this._component, 'mounted');
      }
    }

    disconnectedCallback() {
      callHooks(this._component, 'unmounted');
    }
  }

  initialize();

  return CustomElement;
}
