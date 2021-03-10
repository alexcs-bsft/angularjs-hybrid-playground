import AngularJsInjections from '../../@interop/dependency-injection';
import UserItem from './user-item';

export default {
  name: 'user-list',
  template: `
  <div>
    <h3 style="border-left: 4px solid var(--c-vue); padding-left: 8px;">
      {{ heading }} <button @click="fetchUsers" :disabled="loading">Fetch Users</button>
    </h3>
    <user-item
      v-if="selectedUser"
      :user="selectedUser"
      selected
      unselectable
    ></user-item>
    <ul>
      <li v-for="user in users">
        <user-item
          :user="user"
          :selected="user.id === selectedId"
          @selectMe="onSelect"
        ></user-item>
      </li>
    </ul>
    <div ng-include="'home.html'"></div>
  </div>
  `,
  props: {
    heading: String,
  },
  components: {
    UserItem,
  },
  data() {
    const UserService = AngularJsInjections.get('UserService');
    return {
      UserService,
      users: [],
      selectedId: null,
      loading: false,
    };
  },
  computed: {
    selectedUser() {
      console.debug('re-calculating vue selectedUser');
      return this.users.find(u => u.id === this.selectedId) ?? null;
    },
  },
  watch: {
    users() {
      this.selectedId = null;
    },
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
      const response = await this.UserService.getUsers();
      this.loading = false;

      this.users = response.data || [];
      // this.selectedId = null;
    },
    onSelect($event) {
      this.selectedId = $event.id;
    },
  },
};
