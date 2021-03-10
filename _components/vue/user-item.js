export default {
  name: 'user-item',
  template: `
    <div v-if="user" class="user" :class="{ selected: selected }">
    <span>Id: {{ user.id }}</span> - <span>{{ user.name }}</span>
    <button v-if="!unselectable" @click="$emit('selectMe', user)" :disabled="selected">
      <slot>{{ btnText }}</slot>
    </button>
    </div>
  `,
  emits:['selectMe'],
  props: {
    unselectable: Boolean,
    selected: Boolean,
    user: Object,
    btnText: {
      type: String,
      default: 'select',
    },
  },
};
