import angular from "angular";
import "@uirouter/angularjs";

// Import your app stylesheets
import "./style.css";

import "./_components";

// Import your app functionality
import "./home";

// Create and bootstrap application
const requires = ["ui.router", "home", "about"];

window.app = angular.module("app", requires);

angular.bootstrap(document.getElementById("app"), ["app"]);
