import {NeithIOC} from './core.js'
NeithIOC.import(
  class AuthService {
    auth() {
      console.log("this auth");
    }
  }
);
NeithIOC.import(
  class GreetService {
    greet() {
      console.log("hello");
    }
  }
);
