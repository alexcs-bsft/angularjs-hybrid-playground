class HomeCtrl {
  constructor($scope, UserService) {
    "ngInject";

    this.name = "AngularJS";
    this.$Uservice = UserService;
    this.users = [];
    this.selectedId = null;
    this.$scope = $scope;
  }

  get selectedUser() {
    return this.users.find((u) => u.id === this.selectedId) ?? null;
  }

  onSelect($event) {
    console.log("onSelect", $event);
    const payload = Array.isArray($event?.detail)
      ? $event?.detail?.[0]
      : $event?.detail;
    this.selectedId = payload?.id ?? null;
    this.users.forEach(u => {
      u.selected = (u.id === this.selectedId);
    })
  }

  async getUsers() {
    this.users = await this.$Uservice.getUsers().then(res => res.data.slice(0,1));
    this.$scope.$applyAsync();
  }

  $onInit() {
    this.getUsers();
  }
}

export default HomeCtrl;
