import * as React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';


class ReactCustomElement extends HTMLElement {
  constructor() {
    super();
    this.observer = new MutationObserver(() => this.update());
    this.observer.observe(this, { attributes: true });
  }

  connectedCallback() {
    this._innerHTML = this.innerHTML;
    this.mount();
  }

  disconnectedCallback() {
    this.unmount();
    this.observer.disconnect();
  }

  update() {
    this.unmount();
    this.mount();
  }

  // Must be implemented in children
  // render(props) {
  // }

  mount() {
    const props = {
      ...this.getProps(this.attributes),
      ...this.getEvents(),
      children: this.parseHtmlToReact(this.innerHTML),
    };
    this.render(props);
  }

  unmount() {
    unmountComponentAtNode(this);
  }

  parseHtmlToReact(html) {
    return html;
  }

  getProps(attributes) {
    return [...attributes]
      .filter(attr => attr.name !== 'style')
      .map(attr => this.convert(attr.name, attr.value))
      .reduce((props, prop) => ({ ...props, [prop.name]: prop.value }
      ), {});
  }

  getEvents() {
    return Object.values(this.attributes)
      .filter(key => /on([a-z].*)/.exec(key.name))
      .reduce(
        (events, ev) => ({
            ...events,
            [ev.name]: this.getEventCallback(ev.name),
          }
        ),
        {},
      );
  }

  getEventCallback(eventName) {
    return payload => this.dispatchEvent(
      new CustomEvent(eventName, {
        detail: { ...payload },
      })
    );
  }

  convert(attrName, attrValue) {
    let value = attrValue;
    if (attrValue === 'true' || attrValue === 'false') {
      value = attrValue === 'true';
    } else if (!isNaN(attrValue) && attrValue !== '') {
      value = +attrValue;
    } else if (/^{.*}/.exec(attrValue)) value = JSON.parse(attrValue);
    return {
      name: attrName,
      value: value,
    };
  }
}

/**
 * Split an object into two based on whether a given predicate returns truthy.
 * @template Value
 * @param {Object<string, Value>} obj
 * @param {function(value:Value, key?:string, index?: number): boolean} predicate
 *
 * @return {string[][]} an array of two arrays of strings,
 *          where the first is the subset of the original for which the predicate evaluated to truthy,
 *          and the second is the remainder.
 */
function partitionKeys(obj, predicate) {
  const truthy = [];
  const falsy = [];

  Object.entries(obj).forEach(([key, value], index) => {
    const result = predicate(value, key, index);
    const bucket = Boolean(result) ? truthy : falsy;

    bucket.push(key);
  });

  return [truthy, falsy];
}

/***
 * lowercase the first character
 * @param {string} str
 * @return {string}
 */
function decapitalize(str) {
  if (str && str.length) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }
}

export default function wrap(ReactComponent) {
  return class CustomElement extends ReactCustomElement {

    getPropTypes() {
      if (!ReactComponent.hasOwnProperty('propTypes')) return [];

      const [functionPropNames, propertyPropNames] = partitionKeys(
        ReactComponent.propTypes,
        (propType) => (propType === PropTypes.func)
      );


      // Create accessors
      const el = this;
      const propertyAccessors = propertyPropNames.map((propName) => {
        const accessor = {
          get() {
            return el[propName];
          },
          set (value) {
            el[propName] = value;
          }
        }

        return [propName, accessor];
      });

      const functionAccessors = functionPropNames.map((propName) => {
        // normalize event name
        const eventName = decapitalize(propName.replace(/^on/, ''));

        return [propName, {
          get() {
            return el.getEventCallback(eventName);
          },
        }];
      });

      return Object.defineProperties({}, Object.fromEntries([
        ...propertyAccessors,
        ...functionAccessors,
      ]));
    }

    render(props) {
      render(React.createElement(ReactComponent, props), this);
    }
  };
}
