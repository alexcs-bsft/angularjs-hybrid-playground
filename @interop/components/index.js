import _kebabCase from 'lodash/kebabCase';

import wrapReact from './react-custom-element-wrapper';
import wrapVue from './vue-wrapper';


/**
 * Wrap a given component in a native CustomElement and register it for use.
 * @param {React.ComponentClass} reactComponent - A react component constructor.
 *        Should implement propTypes to ensure reliable prop binding.
 * @param {string|boolean} [prefix='r'] - A string to prefix the component name with.
 *        Override the default with anything falsy to skip prefixing.
 */
export function defineReactCustomElement(reactComponent, prefix = 'r') {
  defineCustomElement(
    wrapReact(reactComponent),
    makeTagName(reactComponent.name, prefix),
  );
}

/**
 * Wrap a given component in a native CustomElement and register it for use.
 * @param {Vue.ComponentOptions} vueDefinition - A Vue component options object.
 * @param {string|boolean} [prefix='v'] - A string to prefix the component name with.
 *        Override the default with anything falsy to skip prefixing.
 */
export function defineVueCustomElement(vueDefinition, prefix = 'v') {
  defineCustomElement(
    wrapVue(vueDefinition),
    makeTagName(vueDefinition.name, prefix),
  );
}

/**
 * Make a given name safe to use as an html tag
 * @param {string} originalName - The original name.
 *        Can be any multi-word identifier case that isn't flat.
 *        https://en.wikipedia.org/wiki/Naming_convention_(programming)#Examples_of_multiple-word_identifier_formats
 * @param {string|boolean} [prefix] - optional prefix. If not provided,
 *        `originalName` *must* contain multiple recognizable words to avoid clashing with the html namespace.
 * @return {string}
 */
function makeTagName(originalName, prefix) {
  const kebabName = _kebabCase(originalName);
  return prefix ? `${prefix}-${kebabName}` : kebabName;
}

/**
 * Define a given custom element on the window
 * @param {CustomElementConstructor} elementClass - The constructor/class to define
 * @param {string} name - The tag name to define it with
 */
function defineCustomElement(elementClass, name) {
  if (window.customElements.get(name)) {
    // FIXME: I'm too lazy to figure out HMR right now
    window.location.reload();
  } else {
    console.debug('Registering', name, elementClass);
    window.customElements.define(name, elementClass);
  }
}
