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
const Auth = NeithIOC.inject("AuthService");
class Person {
  constructor(name) {
    this.name = name;
  }
}
let stat = "huh";
let num = 0;
function submit() {
  console.log(stat);
}
Auth.auth();
const element0 = document.getElementById("4b48b2be519f94497b1aac0e5d99f2ad0f806b1d");
element0.addEventListener("input", (event) => {
  stat = event.target.value;
});
const element1 = document.getElementById("9e4aba234dea5476ea133ef4c7cb46f9f48e1a2e");
element1.text = stat;
const element2 = document.getElementById("2428036b31eafc714b5d3c54276d149381e6f529");
element2.addEventListener("click", () => {
  submit();
});
