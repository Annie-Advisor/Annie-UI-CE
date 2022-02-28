'use strict';

let rootApp = angular.module('rootApp', []);

angular.module("rootApp").directive("layoutTable",function() {
  return({templateUrl: "annie-table.html"});
});
angular.module("rootApp").directive("layoutBooking",function() {
  return({templateUrl: "annie-booking.html"});
});
angular.module("rootApp").directive("layoutHeader",function() {
  return({templateUrl: "annie-header.html"});
});

// Credits: https://stackoverflow.com/a/8430501
rootApp.filter('keylength', function(){
  return function(input){
    if(!angular.isObject(input)){
      throw Error("Usage of non-objects with keylength filter!!")
    }
    return Object.keys(input).length;
  }
});
//..and.. for Object.keys to be available as Utils.keys
rootApp.run(function($rootScope){
  //Just add a reference to some utility methods in rootscope.
  $rootScope.Utils = {
    keys : Object.keys
  }
});

// ADDITIONAL

// Credits: http://stackoverflow.com/a/979995
var QueryString = function () {
  // This function is anonymous, is executed immediately and
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = decodeURIComponent(pair[1]);
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(decodeURIComponent(pair[1]));
    }
  }
  return query_string;
}();

function getCookie(cname) {
  QueryString.debug>1 && console.debug("getCookie",cname,document.cookie);
  let cookies = {};
  document.cookie.split(";").forEach(function(c){
    let ca = c.trim().split("=");
    if (ca.length==2) {
      cookies[ca[0].trim()] = decodeURIComponent(ca[1]).trim();
    }
  });
  QueryString.debug>1 && console.debug("getCookie",cname,cookies);
  QueryString.debug && console.debug("getCookie",cname,cookies[cname]);
  return cookies[cname];
}
function setCookie(cname,value) {
  QueryString.debug && console.debug("setCookie",cname,value);
  document.cookie = cname+"="+encodeURIComponent(value)+";max-age=31536000"; //max-age a year
}

// force refresh on version change
let version=getCookie("version");
if (typeof version === 'undefined') {
  version = ""; // this is shown if no cookie or build file is found
}

// Credits: https://stackoverflow.com/a/53213713
let file = new XMLHttpRequest();
file.onreadystatechange = function() {
  if (file.readyState === XMLHttpRequest.DONE && file.status === 200) {
    QueryString.debug && console.debug("version",version,file.responseText);
    let filejson = JSON.parse(file.responseText);
    if (version != filejson.version) {
      QueryString.debug && console.debug("version","REFRESH");
      location.reload(true);
    }
    version = filejson.version;
    setCookie("version",version); //store
  }
}
file.open("GET", "/api/"+"?"+Math.random(), true);
file.send(null);

// Credits: https://medium.com/better-programming/3-ways-to-clone-objects-in-javascript-f752d148054d
function jsonCopy(src) {
  return JSON.parse(JSON.stringify(src));
}
