
class UserService {
  
  constructor($http) {
    'ngInject';
    this.$http = $http;
  }

  getUsers() {
    return this.$http.get('https://jsonplaceholder.typicode.com/users');
  }
  
}

export default UserService;