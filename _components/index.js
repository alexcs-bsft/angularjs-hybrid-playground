import {
  defineVueCustomElement,
} from '../@interop/components';

import vueComponents from './vue';


Object.values(vueComponents).forEach((component) => {
  defineVueCustomElement(component);
});
