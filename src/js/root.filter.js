'use strict';

// basic text filter
rootApp.filter('basic', function() {
  return function(haystack, needle, scope) {
    // clear unusables (null, empty strings, ...)
    if(typeof needle === 'undefined' || !needle) return haystack;
    // else... start finding matches
    // get searchable fields
    let allcolumns = {};
    angular.forEach(scope.columns,function(codeset,j){
      angular.forEach(codeset,function(column,k){
        allcolumns[column.a] = needle;
      });
    });
    // hard-coded or manually added (if not in scope.columns, which may be the case)!
    allcolumns.degree = needle;
    allcolumns.location = needle;

    scope.debug>2 && console.debug("basicFilter",haystack.length,needle,allcolumns);
    let found = [];
    for(let i=0; i<haystack.length; i++){
      let addit=false;//see if any column give ok
      angular.forEach(allcolumns,function(needless,column){//needless=needle
        scope.debug>3 && console.debug("basicFilter",i,column,needle);
        let fortest;
        if (column in haystack[i].contactdata) {
          fortest = haystack[i].contactdata[column];
        } else {
          fortest = haystack[i][column];//nb! basically only code values!
        }
        if (typeof fortest !== 'undefined' && fortest) {
          // "contains"
          if (fortest.toLowerCase().indexOf(needle.toLowerCase()) !== -1) {//if even one says yes..
            addit = true;//..it's a yes!
          }
        }
      });
      if (addit) {
        found.push(haystack[i]);
      }
    }
    return found;
  };
});
