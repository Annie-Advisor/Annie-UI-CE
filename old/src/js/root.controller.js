'use strict';

rootApp.controller('rootController',
['$scope','$http','$filter','$interval','$timeout','DataService'
,'basicFilter',
function($scope,$http,$filter,$interval,$timeout,Data
        ,basicFilter)
{
  // auth
  $scope.authentication = function() {
    if (typeof auth !== 'undefined') {
      return; //ok
    } else {
      location.href = "/"; // go away
      return; // stop here!
    }
  }
  $scope.authentication(); //test immediately
  $scope.auth = auth;//copy once
  $scope.impersonate = {
    uid: null
  };

  //
  // BACKEND / DATA
  //

  // for setting same kind of data to database
  // uses global auth!
  $scope.putInit = function(data) {
    data.updated=new Date().toISOString();
    data.updatedby=auth.firstname+' '+auth.lastname+' ('+auth.uid+')';
    return data;
  }

  // nb! what this function is really for is to populate
  //     degrees, groups and locations multiselects
  //     once at init.
  //     the contact data here is copied later (frequently) to supportneeds.
  $scope.getContacts = function() {
    $scope.debug && console.debug('getContacts');
    $scope.authentication();//test
    //$scope.loading = true;
    Data.getContacts()
    .then(function(data) {
      $scope.debug>2 && console.debug('getContacts',data);
      $scope.contacts = {};//key-based not direct copy of data
      //multiselects data
      angular.forEach(data,function(d,i){
        //contacts
        $scope.contacts[d.id] = d.contact;//key-based
        //NB! no language selection for degrees, groups and locations
        //degrees
        $scope.debug>2 && console.debug('getContacts','degrees',i,d);
        if (typeof d.contact.degree === 'undefined') {//missing altogether
          $scope.degrees[''] = '--';
        } else if (d.contact.degree=="") {
          $scope.degrees[''] = '--';
        } else if (!d.contact.degree) {//if null
          $scope.degrees[''] = '--';
        } else {
          $scope.degrees[d.contact.degree] = d.contact.degree;
        }
        //groups
        $scope.debug>2 && console.debug('getContacts','groups',i,d);
        if (typeof d.contact.group === 'undefined') {//missing altogether
          $scope.groups[''] = '--';
        } else if (d.contact.group=="") {
          $scope.groups[''] = '--';
        } else if (!d.contact.group) {//if null
          $scope.groups[''] = '--';
        } else {
          $scope.groups[d.contact.group] = d.contact.group;
        }
        //locations
        $scope.debug>2 && console.debug('getContacts','locations',i,d);
        if (typeof d.contact.location === 'undefined') {//missing altogether
          $scope.locations[''] = '--';
        } else if (d.contact.location=="") {
          $scope.locations[''] = '--';
        } else if (!d.contact.location) {//if null
          $scope.locations[''] = '--';
        } else {
          $scope.locations[d.contact.location] = d.contact.location;
        }
      });
      $scope.debug>1 && console.debug('getContacts',$scope.contacts.length,'degrees:',Object.keys($scope.degrees).length,'locations:',Object.keys($scope.locations).length);
      $scope.resetMultiselect();
      $scope.getSupportNeeds();//part of init
      //$scope.loading = false;
    });
  }

  $scope.getMessages = function(contact) {
    $scope.debug && console.debug('getMessages',contact);
    $scope.authentication();//test
    Data.getMessages(contact,$scope.impersonate.uid)
    .then(function(data) {
      $scope.debug>1 && console.debug('getMessages',contact,data);
      // to events (history)
      angular.forEach(data,function(v,k){
        let event = {};
        event.when = v.updated;
        event.who  = v.sender;
        event.what = $scope.i18n.booking.events.message[$scope.lang];
        event.with = v.body;
        $scope.events.push(event);
      });
      $scope.debug>1 && console.debug('getMessages','events',$scope.events);
    });
  }

  $scope.getSupportNeeds = function() {
    $scope.debug && console.debug('getSupportNeeds',$scope.choices.category,$scope.choices.status,$scope.choices.survey,$scope.choices.userrole,$scope.choices.degree,$scope.choices.group,$scope.choices.location);
    $scope.loading = true;
    $scope.authentication();//test
    // for events history
    // nb! contactdata values degree, group and location are NOT handled via supportneed API even though for some reason they are passed to it
    Data.getSupportNeeds($scope.choices.category,$scope.choices.status,$scope.choices.survey,$scope.choices.userrole,$scope.choices.degree,$scope.choices.group,$scope.choices.location,$scope.impersonate.uid)
    .then(function(data) {
      $scope.debug>1 && console.debug('getSupportNeeds',data);
      $scope.supportneeds = angular.copy(data);
      // copy contact data
      angular.forEach(data,function(da,di){
        // limit with contact related choices: degree, group, location
        let cod = $scope.contacts[da.contact];
        $scope.debug>2 && console.debug('getSupportNeeds',di,da.contact,cod.degree,cod.group,cod.location);
        // handle multiple select list choices aswell, so all choices must provide truthy value
        // assume true value but immediately change to false if any selection to regarding choice was made (and check match)
        let keepcodviadegree = true;
        if ($scope.choices.degree.length>0) {
          keepcodviadegree = false;
        }
        let keepcodviagroup = true;
        if ($scope.choices.group.length>0) {
          keepcodviagroup = false;
        }
        let keepcodvialocation = true;
        if ($scope.choices.location.length>0) {
          keepcodvialocation = false;
        }
        angular.forEach($scope.choices.degree,function(deg,di){
          if (typeof cod.degree !== 'undefined' && deg == cod.degree)
            keepcodviadegree = true;
          if (deg === "")//special case of missing (Puuttuu)
            if (typeof cod.degree === 'undefined' || !cod.degree)
              keepcodviadegree = true;
        });
        angular.forEach($scope.choices.group,function(grp,gi){
          if (typeof cod.group !== 'undefined' && grp == cod.group)
            keepcodviagroup = true;
          // special case of missing (Puuttuu)
          if (grp === "")//special case of missing (Puuttuu)
            if (typeof cod.group === 'undefined' || !cod.group)
              keepcodviagroup = true;
        });
        angular.forEach($scope.choices.location,function(loc,li){
          if (typeof cod.location !== 'undefined' && loc == cod.location)
            keepcodvialocation = true;
          if (loc === "")//special case of missing (Puuttuu)
            if (typeof cod.location === 'undefined' || !cod.location)
              keepcodvialocation = true;
        });
        if (!keepcodviadegree || !keepcodviagroup || !keepcodvialocation) {
          //remove from the scope copy (not looped data)
          angular.forEach($scope.supportneeds,function(sn,si){
            if (sn.contact == da.contact)
              $scope.supportneeds.splice(si,1);
          });
        } else {
          // copy to the scope copy (loop is for data)
          angular.forEach($scope.supportneeds,function(sn,si){
            if (sn.contact == da.contact)
              sn.contactdata = $scope.contacts[da.contact];
          });
        }
      });
      $scope.resetSupportneedsPage();//->paginationCounts
      $scope.getMetadata();
      $scope.loading = false;
    });
  }

  $scope.getSupportNeedHistory = function(contactid) {
    $scope.debug && console.debug('getSupportNeedHistory',contactid);
    $scope.authentication();//test
    // for events history
    Data.getSupportNeedHistory(contactid,$scope.impersonate.uid)
    .then(function(data) {
      $scope.debug>1 && console.debug('getSupportNeedHistory',contactid,data);
      // to history -- only
      // sort data by survey and updated to figure out what changed
      let dataOrdered = Object.keys(data).map(function(key) {
        return data[key];
      }).sort(
        (a,b) => (
          ((a.survey > b.survey) ? 1 :
            ((b.survey > a.survey) ? -1 :
              ((a.updated > b.updated) ? 1 :
              -1)
            )
          )
        )
      );
      let prevIssue=null;
      angular.forEach(dataOrdered,function(v,k){
        let event = {};
        event.when = v.updated;
        event.who  = v.updatedby;
        if ( // multiple scenarios for status event
           !prevIssue // first one
        || prevIssue.survey!=v.survey // different survey ~ new
        || prevIssue.status!=v.status // status change
        ) {
          event.what = $scope.i18n.booking.events.supportneed.status[v.status][$scope.lang];
        } else if (prevIssue.category!=v.category) {
          event.what = $scope.i18n.booking.events.supportneed.category[$scope.lang];
        } else if (prevIssue.userrole!=v.userrole) {
          event.what = $scope.i18n.booking.events.supportneed.userrole[$scope.lang];
        } else {
          event.what = $scope.i18n.booking.events.supportneed[$scope.lang];
        }
        event.with = $scope.format(v.category,'category');
        $scope.events.push(event);
        prevIssue=v; // remember previous
      });
      $scope.debug>1 && console.debug('getSupportNeedHistory',$scope.events);
    });
  }

  $scope.putSupportNeed = function(data) {
    $scope.debug && console.debug('putSupportNeed',data);
    $scope.authentication();//test
    data = $scope.putInit(data);
    Data.putSupportNeed(data.id,data)
    .then(function(response){
      $scope.debug>1 && console.debug('putSupportNeed','then',response);
      if (response && response.status=="OK") {
        if (!$scope.showSaveSuccess && !$scope.showSaveFailed) {//no insta repeat
          $scope.showSaveSuccess = true;
          // id changed, update
          $scope.selected.supportneed.id = response.id;
          data.id = response.id;
          $scope.showBooking(data.contact,$scope.selected.contact,data); // refresh immediately
          // immediate refresh table data as well (the same as in interval)
          $scope.getSupportNeeds(); //->resetSupportneedsPage->paginationCounts
        }
      } else {
        $scope.showSaveFailed = true;
      }
      $timeout(function () {
        $scope.debug>1 && console.debug('putSupportNeed','then','timeout');
        $scope.showSaveSuccess = false;
        $scope.showSaveFailed = false;
      }, CONFIG.timeout*1000);
    });
  }

  $scope.getContactsurvey = function(contactid) {
    $scope.debug && console.debug('getContactsurvey',contactid);
    $scope.authentication();//test
    $scope.selected.supportneed.surveystatus = '100';//default
    $scope.smsMessage = ""; //empty to be sure
    Data.getContactsurvey(contactid)
    .then(function(data) {
      $scope.debug>1 && console.debug('getContactsurvey',contactid,data);
      angular.forEach(data,function(v,k){
        $scope.selected.supportneed.surveystatus = v.status;
      });
      $scope.debug>1 && console.debug('getContactsurvey',contactid,$scope.selected.supportneed);
    });
  }

  $scope.getComments = function(supportneedid) {
    $scope.debug && console.debug('getComments',supportneedid);
    $scope.authentication();//test
    Data.getComments(supportneedid,$scope.impersonate.uid)
    .then(function(data) {
      $scope.debug>1 && console.debug('getComments',supportneedid,data);
      angular.forEach(data,function(v,k){
        let event = {};
        event.when = v.updated;
        event.who  = v.updatedby;
        event.what = $scope.i18n.booking.events.comment[$scope.lang];
        event.with = v.body;
        $scope.events.push(event);
      });
      $scope.debug>1 && console.debug('getComments','events',$scope.events);
    });
  }

  $scope.putComment = function(supportneed,newComment) {
    $scope.debug && console.debug('putComment',supportneed,newComment);
    $scope.authentication();//test
    //update status first, if applicable
    if (supportneed.status=='1') {
      supportneed.status = '2'; //replace-in-place status to 2
      $scope.putSupportNeed(supportneed); //nb! id changes
      supportneed.id = $scope.selected.supportneed.id;
    }
    let data = {
      "supportneed": supportneed.id,
      "body": newComment
    };
    data = $scope.putInit(data);
    $scope.debug>1 && console.debug('putComment',data);
    Data.putComment(data)
    .then(function(response){
      $scope.debug>1 && console.debug('putComment','then',response);
      if (response && response.status=="OK") {
        if (!$scope.showSaveSuccess && !$scope.showSaveFailed) {//no insta repeat
          $scope.showSaveSuccess = true;
          $scope.showBooking(supportneed.contact,$scope.selected.contact,supportneed); // refresh immediately
        }
      } else {
        $scope.showSaveFailed = true;
      }
      $timeout(function () {
        $scope.debug>1 && console.debug('putComment','then','timeout');
        $scope.showSaveSuccess = false;
        $scope.showSaveFailed = false;
      }, CONFIG.timeout*1000);
    });
  }

  $scope.getCodes = function(codeset,code) {
    $scope.debug && console.debug('getCodes',codeset,code);
    $scope.authentication();//test
    let codes = {};//convert list to a object
    Data.getSurveys()
    .then(function(data) {
      codes.survey = {};
      $scope.debug>1 && console.debug('getCodes','survey',data);
      angular.forEach(data,function(c,i){//at data list
        if (c.config) {
          if (c.config.title) {
            codes.survey[c.id] = c.config.title;
          }
        }
      });
      Data.getCodes(codeset,code)
      .then(function(data) {
        $scope.debug>1 && console.debug('getCodes',codeset,code,data);
        angular.forEach(data,function(c,i){//at data list
          angular.forEach(c,function(cs,k){//at codeset
            codes[k] = cs;
          });
        });
        $scope.debug>0 && console.debug('getCodes',codeset,code,codes);
        $scope.debug>1 && console.debug('getCodes',codeset,code,CONFIG.codes);
        // copy already here
        $scope.codes = jsonCopy(codes);
        $scope.resetArrays();//part of init
        $scope.getContacts();//part of init
      });
    });
    return codes;
  }

  // special api call for metadata
  $scope.getMetadata = function() {
    $scope.debug && console.debug('getMetadata');
    Data.getMetadata()
    .then(function(data) {
      $scope.debug>1 && console.debug('getMetada','then',data);
      $scope.counts.students = parseInt(data.contacts);
      $scope.counts.studentsok = parseInt(data.contacts) - parseInt(data.contactswithissue);
    });
  }
  //

  $scope.postSendSMS = function() {
    $scope.debug && console.debug('postSendSMS',$scope.selected.contact.phonenumber,$scope.smsMessage);
    $scope.authentication();//test
    //TO-DONE-ish check surveyStatus for this contact!
    let data = {
      "to": $scope.selected.contact.phonenumber,
      "body": $scope.smsMessage,
      "sender": auth.firstname+' '+auth.lastname,
      "contact": $scope.selected.supportneed.contact,
      "survey": $scope.selected.supportneed.survey,
      "context": "SUPPORTPROCESS"
    };
    $scope.debug>1 && console.debug('postSendSMS',data);
    Data.postSendSMS(data)
    .then(function(response){
      $scope.debug>1 && console.debug('postSendSMS','then',response);
      // indication of saving progress is shown via putSupportNeed but
      // here show status of message send
      if (response && response.status=="OK") {
        if (!$scope.smsSendSuccess && !$scope.smsSendFailed) {//no insta repeat
          // update supportneed status, if applicable
          if ($scope.selected.supportneed.status=='1') {
            $scope.selected.supportneed.status = '2'; //replace-in-place status to 2
            $scope.putSupportNeed($scope.selected.supportneed);
          }
          $scope.smsSendSuccess = true;
          $scope.smsMessage = ""; // clear out textarea
        }
      } else {
        $scope.smsSendFailed = true;
      }
      $timeout(function () {
        $scope.debug>1 && console.debug('postSendSMS','then','timeout');
        $scope.smsSendSuccess = false;
        $scope.smsSendFailed = false;
      }, CONFIG.timeout*1000);
    });
  }

  $scope.getKoodistoKoodi = function(koodisto,koodi) {
    $scope.debug && console.debug('getKoodistoKoodi',koodisto,koodi);
    if (!koodisto || !koodi) return;
    let ret = {
      koodiArvo: null,
      fi: null,
      en: null
    };
    Data.getKoodistoKoodi(koodisto,koodi)
    .then(function(data) {
      $scope.debug>1 && console.debug('getKoodistoKoodi',data);
      angular.forEach(data.metadata,function(d,k){
        ret.koodiArvo = data.koodiArvo;
        switch (d.kieli) {
          case 'FI':
            ret.fi = d.nimi;
            break;
          case 'EN':
            ret.en = d.nimi;
            break;
        }
      });
    });
    return ret;
  }

  //
  //
  //

  // UI function to unite two things: set effect and store choice
  $scope.setColumnOn = function(set,column,newOn) {
    column.on = newOn;
    let cookiekey = set+"."+column.a;
    $scope.setCookie(cookiekey,newOn);
  }

  // Credits: https://stackoverflow.com/a/38641281
  $scope.naturalCompare = function(a, b) {
    var collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
    return collator.compare(a.value, b.value);
  }
  $scope.whoCompare = function(a, b) {
    var aIsAnnie = a.value=='Annie'?1:-1;
    var bIsAnnie = b.value=='Annie'?1:-1;
    return aIsAnnie<bIsAnnie?-1:1;
  }
  $scope.changeOrder = function(newOrder) {
    $scope.debug && console.debug("changeOrder",newOrder);
    if ($scope.order[0] == newOrder) { //switch direction
      $scope.order.shift();//remove first
      $scope.order.unshift('-'+newOrder);//add first with reverse "-"
    } else {
      $scope.order.unshift(newOrder);
      $scope.order.pop();
    }
    $scope.setPage(1); //->resetSupportneedsPage->paginationCounts
    $scope.debug>1 && console.debug("changeOrder",newOrder,$scope.order);
  }

  // Pagination
  $scope.setPage = function(num) {
    $scope.debug && console.debug('setPage',num);
    $scope.currentPage = num;
    $scope.resetSupportneedsPage(); //->paginationCounts
  }
  $scope.setItemsPerPage = function(num) {
    $scope.debug && console.debug('setItemsPerPage',num);
    $scope.itemsPerPage = num;
    $scope.setCookie('itemsPerPage',num); //store it
    $scope.currentPage = 1; //reset to first page
    $scope.resetPagination(); //->getSupportNeeds & ->setPage(1) :: ->resetSupportneedsPage->paginationCounts
  }
  $scope.paginationCounts = function(itemCount) {
    //$scope.debug && console.debug('paginationCounts',itemCount);
    $scope.totalItems = itemCount; //pagination
    $scope.numPages = Math.ceil($scope.totalItems/$scope.itemsPerPage); //pagination
    $scope.debug>2 && console.debug('paginationCounts',itemCount,$scope.itemsPerPage,$scope.numPages);
  }

  $scope.format = function(value,type){
    $scope.debug>3 && console.debug('format',value,type);

    if (!value) return value;

    if (type=='text') {
      return value;
    }
    if (type=='number') {
      return value;
    }
    if ((type=='category' || type=='supportNeedStatus' || type=='userrole')
     && $scope.codes.hasOwnProperty(type) && $scope.codes[type].hasOwnProperty(value)) {
      return $scope.codes[type][value][$scope.lang];
    }
    if ((type=='survey')
     && $scope.codes.hasOwnProperty(type) && $scope.codes[type].hasOwnProperty(value)) {
      return $scope.codes[type][value];
    }
    if (type=='date' || type=='datetime') {
      // may be a number (excel value?)
      if (typeof value === 'string') {
        //OnTask hack: "midnight" to "00:00:00", "a.m." to "AM", "p.m." to "PM"
        value = value.replace("midnight","00:00:00");
        value = value.replace("a.m.","AM");
        value = value.replace("p.m.","PM");
        //Firefox hack: "Aug." -> "Aug"
        value = value.replace("Jan.","Jan");
        value = value.replace("Feb.","Feb");
        value = value.replace("Mar.","Mar");
        value = value.replace("Apr.","Apr");
        //value = value.replace("May.","May");
        value = value.replace("Jun.","Jun");
        value = value.replace("Jul.","Jul");
        value = value.replace("Aug.","Aug");
        value = value.replace("Sep.","Sep");
        value = value.replace("Oct.","Oct");
        value = value.replace("Nov.","Nov");
        value = value.replace("Dec.","Dec");
        //Firefox hack: ends "+03" -> "+03:00"
        if (value.match(/\+[0-9][0-9]$/)) {
          value = value+":00";
        }
        if (value.includes("-") && !value.includes("T")) {
          value = value.replace(/\s/g, 'T');
        }
        if (!Date.parse(value)) {
          // "25.3.2021" -> "2021-03-25"
          if (value.includes(".")) {
            let vv = value.split(".");
            if (vv && vv.length>2) {
              value =vv[2];
              value+="-"+(vv[1].length<2?"0":"")+vv[1];
              value+="-"+(vv[0].length<2?"0":"")+vv[0];
            }
          }
        }
      }
      let d = new Date(value);
      let dd = d.getDate();
      let dm = (d.getMonth()+1);
      let dy = d.getFullYear();
      if (type=='date') {
        return dd+"."+dm+"."+dy;
      }
      if (type=='datetime') {
        let dth = d.getHours();
        let dtm = d.getMinutes()<10?'0'+d.getMinutes():d.getMinutes();
        //let dts = d.getSeconds()<10?'0'+d.getSeconds():d.getSeconds();
        return dd+"."+dm+"."+dy+" "+dth+":"+dtm;
      }
    }
    if (type=='time') {
      return value;
    }
    if (type=='user') {
      // clear uid from user (updatedby) info
      return value.replace(/ *\(.*\)?/,'');
    }
    // unmatched type, return given
    return value;
  }

  $scope.showBooking = function(contact,contactdata,supportneed) {
    $scope.debug && console.debug('showBooking',contact,contactdata,supportneed);
    $scope.selected = {};
    $scope.selected.contact = angular.copy(contactdata); // copy, do not reference
    $scope.selected.supportneed = angular.copy(supportneed);
    // update models
    $scope.newCategory = $scope.selected.supportneed.category;
    $scope.newUserRole = $scope.selected.supportneed.userrole;

    $scope.events = [];//clear
    $scope.getMessages(contact);
    $scope.getSupportNeedHistory(contact);
    $scope.getComments(supportneed.id);
    // if survey is ongoing:
    $scope.smsMessage = $scope.i18n.booking.sms.unable.text[$scope.lang];
    $scope.getContactsurvey(contact);
  }

  $scope.changeCategory = function(oldCategory,newCategory) {
    $scope.debug && console.debug('changeCategory',oldCategory,newCategory,'current is',$scope.selected.supportneed.category);
    if (newCategory != $scope.selected.supportneed.category) {
      $scope.categoryChanged=true;//popup save button
    } else {
      $scope.categoryChanged=false;
    }
  }

  $scope.changeUserRole = function(oldUserRole,newUserRole) {
    $scope.debug && console.debug('changeUserRole',oldUserRole,newUserRole,'current is',$scope.selected.supportneed.userrole);
    if (newUserRole != $scope.selected.supportneed.userrole) {
      $scope.userRoleChanged=true;//popup save button
    } else {
      $scope.userRoleChanged=false;
    }
  }

  //
  // SETTINGS
  //

  $scope.debug = 0; //debug/develop

  $scope.Math = Math;

  $scope.contacts = {};//key-based, not list/array
  $scope.supportneeds = [];
  $scope.supportneedspage = [];
  $scope.counts = { //values will be numbers later on!
    students: '-',
    studentsok: '-'
  };

  $scope.choices = {
    survey: [],
    category: [],
    status: [],
    userrole: [],
    degree: [],
    group: [],
    location: []
  };
  $scope.search = "";

  $scope.events = [];

  // hard reset from config (private)
  $scope.resetConfigValues = function() {
    $scope.debug && console.debug("resetConfigValues");
    if (!$scope.lang) {
      $scope.lang = CONFIG.language||'fi';
    }
    $scope.debug && console.debug("resetConfigValues","LANG",$scope.lang);
    $scope.languages = jsonCopy(CONFIG.languages);
    $scope.columns = jsonCopy(CONFIG.columns);
    //$scope.codes = jsonCopy(CONFIG.codes);
    $scope.codesAsArr = {};
    $scope.codes = $scope.getCodes();// ->resetArrays & ->getContacts->...
    $scope.degrees = {}; //read from data
    $scope.groups = {}; //read from data
    $scope.locations = {}; //read from data (actual values)
    $scope.i18n = jsonCopy(CONFIG.i18n);
    $scope.order = jsonCopy(CONFIG.studentTableOrder);
    $scope.currentPage = 1;
    $scope.totalItems = 0; //with paginationCounts
    $scope.numPages = 0; //with paginationCounts
    $scope.itemsPerPage = CONFIG.itemsPerPage;
    $scope.updateInterval = CONFIG.updateInterval;
    $scope.smsSendEnabled = CONFIG.smsSendEnabled;
  }
  // make arrays of column objects for angular repeat
  // nb! after resetting config values or reading from cookies
  $scope.resetArrays = function() {
    $scope.debug && console.debug("resetArrays");
    // arrays for looping
    $scope.columns.contactArr = Object.keys($scope.columns.contact).map(function(key) {
      return $scope.columns.contact[key];
    });
    $scope.columns.supportneedArr = Object.keys($scope.columns.supportneed).map(function(key) {
      return $scope.columns.supportneed[key];
    });
    angular.forEach($scope.codes,function(cs,k){//at codeset
      $scope.codesAsArr[k] = [];
      angular.forEach(cs,function(text,l){//at code
        $scope.codesAsArr[k].push({'code':l,'text':text});
      });
    })
  }

  // get from store (cookies)
  $scope.getCookieConfig = function() {
    $scope.debug && console.debug("getCookieConfig");
    // use global function
    if (typeof getCookie !== 'undefined') {
      // numbers
      let cookievalue = getCookie('updateInterval');
      if (cookievalue) {
        $scope.updateInterval = parseInt(cookievalue);
      }
      cookievalue = getCookie('itemsPerPage');
      if (cookievalue) {
        $scope.itemsPerPage = parseInt(cookievalue);
      }
      angular.forEach($scope.columns,function(si,s){
        QueryString.debug>1 && console.debug("init","getCookie",s);
        angular.forEach($scope.columns[s],function(ci,c){
          let cookiekey = s+"."+c;
          cookievalue = getCookie(cookiekey);
          QueryString.debug>1 && console.debug("init","getCookie",s,c,cookievalue);
          if (cookievalue) {
            $scope.columns[s][c].on = (cookievalue==="true"); //will be converted to contactArr later on
            QueryString.debug>1 && console.debug("init","getCookie","done",$scope.columns[s][c]);
          }
        });
      });
      $scope.resetArrays();// just for safety reg. order of calls
    }
  }
  $scope.setCookie = function(key,value) {
    // use global function
    if (typeof setCookie !== 'undefined') {
      setCookie(key,value); //store it
    }
  }

  // for resetting config values via UI and to store cookies
  $scope.resetConfig = function() {
    $scope.resetConfigValues(); //hard reset from config
    // store to cookies as this was users choice
    $scope.setItemsPerPage($scope.itemsPerPage);
    $scope.setUpdateInterval($scope.updateInterval);
    angular.forEach($scope.columns,function(si,s){
      angular.forEach($scope.columns[s],function(ci,c){
        let cookiekey = s+"."+c;
        $scope.setCookie(cookiekey,$scope.columns[s][c].on);
      });
    });
    $scope.resetArrays();
  }

let subMultiselect = function(referenceId,text,objsArrOrdered,multioptions) {
    $scope.debug && console.debug('subMultiselect',referenceId);

    angular.element(referenceId).multiselect({
      inheritClass: true,
      disableIfEmpty: true,
      enableFiltering: true,
      enableCaseInsensitiveFiltering: true,
      filterBehavior: multioptions.filterBehavior,
      filterPlaceholder: ($scope.lang=='fi'?'Etsi arvoa...':($scope.lang=='sv'?'Sök med värdet...':($scope.lang=='gr'?'Αναζήτηση':'Search...'))),
      numberDisplayed: 1,
      nonSelectedText: ($scope.lang=='fi'?'Suodata ':($scope.lang=='sv'?'Filtrera ':($scope.lang=='gr'?'Φίλτρο ':'Filter '))),
      includeSelectAllOption: (multioptions.selectAll===false?false:true),
      allSelectedText: ($scope.lang=='fi'?'Kaikki valittu':($scope.lang=='sv'?'Alla valda':'All chosen')),
      selectAllText: ($scope.lang=='fi'?'Valitse kaikki':($scope.lang=='sv'?'Välj alla':($scope.lang=='gr'?'Επιλογή όλων':'Choose all'))),
      //---
      dropRight: multioptions.dropRight,
      // for lang, perhaps, callBacks...
      //optionLabel: function(element){return $(element).html() + ...}
      //---
      enableHTML: true,
      buttonText: function(options){
        if (options.length == 0) {
          return ($scope.lang=='fi'?'Suodata ':($scope.lang=='sv'?'Filtrera ':($scope.lang=='gr'?'Φίλτρο ':'Filter ')));//+text[$scope.lang];
        } else if (options.length > 1) {
          return options.length+' '+($scope.lang=='fi'?'valittu':($scope.lang=='sv'?'valda':($scope.lang=='gr'?'επιλεγμένα':'chosen')));
        } else {
          var labels = [];
          options.each(function() {
            if ($(this).attr('label') !== undefined) {
              labels.push($(this).attr('label'));
            }
            else {
              labels.push($(this).html());
            }
          });
          return labels.join('<br>') + '';
        }
      },
      // Credits: https://stackoverflow.com/q/44244576
      onChange: function(option, checked) {
        // Get selected options.
        var selectedOptions = jQuery('#multiselectAnnieuser option:selected');

        if (selectedOptions.length >= 1) {
          // Disable all other checkboxes.
          var nonSelectedOptions = jQuery('#multiselectAnnieuser option').filter(function() {
            return !jQuery(this).is(':selected');
          });

          nonSelectedOptions.each(function() {
            var input = jQuery('input[value="' + jQuery(this).val() + '"]');
            input.prop('disabled', true);
            input.parent('li').addClass('disabled');
          });
        }
        else {
          // Enable all checkboxes.
          jQuery('#multiselectAnnieuser option').each(function() {
            var input = jQuery('input[value="' + jQuery(this).val() + '"]');
            input.prop('disabled', false);
            input.parent('li').addClass('disabled');
          });
        }
      },
    });

    let options = [];
    // nb! no lang
    angular.forEach(objsArrOrdered,function(obj){
      // convert missing value indicator back to a value that will be found
      let optvalue = obj.code;
      if (obj.text=="--") {
        optvalue = "";
      }
      // nb! no language selection for degree, group or location, or annieuser
      if (referenceId=='#multiselectDegree'||referenceId=='#multiselectGroup'||referenceId=='#multiselectLocation'
        ||referenceId=='#multiselectAnnieuser'
        ||referenceId=='#multiselectSurvey'
      ) {
        options.push({label: obj.text, title: obj.code, value: optvalue, selected: false});
      } else {
        options.push({label: obj.text[$scope.lang], title: obj.code, value: optvalue, selected: false});
      }
    });
    angular.element(referenceId).multiselect('dataprovider', options);
    // must do but interferes with search!
    angular.element(referenceId).multiselect('rebuild');
    // if pre-selects:
    //angular.element(referenceId).multiselect('refresh');
  }

  $scope.resetMultiselect = function() {
    $scope.debug && console.debug('resetMultiselect');

    let objsArrOrdered = [];

    //contact
    //

    //degrees, nb! no lang
    objsArrOrdered = Object.keys($scope.degrees).map(function(key) {
      return {"code":key,"text":$scope.degrees[key]};
    }).sort( (a,b) =>  1 * ((a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0)) );
    subMultiselect('#multiselectDegree',{fi:'tutkinto',en:'degree'},objsArrOrdered,{filterBehavior:'text',dropRight:false});

    //groups, nb! no lang
    // nb! order alphabetically and REVERSED (hence "-1*" below)
    objsArrOrdered = Object.keys($scope.groups).map(function(key) {
      return {"code":key,"text":$scope.groups[key]};
    }).sort( (a,b) => -1 * ((a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0)) );
    subMultiselect('#multiselectGroup',{fi:'ryhmä',en:'group'},objsArrOrdered,{filterBehavior:'text',dropRight:false});

    //locations, nb! no lang
    objsArrOrdered = Object.keys($scope.locations).map(function(key) {
      return {"code":key,"text":$scope.locations[key]};
    }).sort( (a,b) =>  1 * ((a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0)) );
    subMultiselect('#multiselectLocation',{fi:'toimipaikka',en:'location'},objsArrOrdered,{filterBehavior:'text',dropRight:false});

    //supportneed
    //(sorting default: code value)

    //survey
    objsArrOrdered = Object.keys($scope.codes.survey).map(function(key) {
      return {"code":key,"text":$scope.codes.survey[key]};
    }).sort( (a,b) =>  1 * ((a.code > b.code) ? 1 : ((b.code > a.code) ? -1 : 0)) );
    subMultiselect('#multiselectSurvey',{fi:'kysely',en:'survey'},objsArrOrdered,{filterBehavior:'both',dropRight:false});

    // category
    objsArrOrdered = Object.keys($scope.codes.category).map(function(key) {
      return {"code":key,"text":$scope.codes.category[key]};
    }).sort( (a,b) =>  1 * ((a.code > b.code) ? 1 : ((b.code > a.code) ? -1 : 0)) );
    subMultiselect('#multiselectCategory',{fi:'ratkaistava asia',en:'category'},objsArrOrdered,{filterBehavior:'both',dropRight:true});

    // userrole
    objsArrOrdered = [];
    if ($scope.codes.userrole) {
      objsArrOrdered = Object.keys($scope.codes.userrole).map(function(key) {
        return {"code":key,"text":$scope.codes.userrole[key]};
      }).sort( (a,b) =>  1 * ((a.code > b.code) ? 1 : ((b.code > a.code) ? -1 : 0)) );
    }
    // append Missing as first one!
    objsArrOrdered.unshift({code:"","text":{"fi":"(Puuttuu)","en":"(Missing)"}});
    subMultiselect('#multiselectUserrole',{fi:'käyttäjäryhmä',en:'user role'},objsArrOrdered,{filterBehavior:'both',dropRight:true});

    // status :: options are more rich (icons) hence more code here
    objsArrOrdered = Object.keys($scope.codes.supportNeedStatus).map(function(key) {
      // add icons
      let optlabel = $scope.codes.supportNeedStatus[key];
      if (key=='1') {
        optlabel = {
          fi:'<i class="color3 fa fa-exclamation-circle"></i> '+optlabel.fi,
          en:'<i class="color3 fa fa-exclamation-circle"></i> '+optlabel.en,
          sv:'<i class="color3 fa fa-exclamation-circle"></i> '+optlabel.sv,
          gr:'<i class="color3 fa fa-exclamation-circle"></i> '+optlabel.gr,
          es:'<i class="color3 fa fa-exclamation-circle"></i> '+optlabel.es
        };
      }
      if (key=='2') {
        optlabel = {
          fi:'<i class="color5 fa fa-question-circle"></i> '+optlabel.fi,
          en:'<i class="color5 fa fa-question-circle"></i> '+optlabel.en,
          sv:'<i class="color5 fa fa-question-circle"></i> '+optlabel.sv,
          gr:'<i class="color5 fa fa-question-circle"></i> '+optlabel.gr,
          es:'<i class="color5 fa fa-question-circle"></i> '+optlabel.es
        };
      }
      if (key=='100') {
        optlabel = {
          fi:'<i class="color4 fa fa-check-circle"></i> '+optlabel.fi,
          en:'<i class="color4 fa fa-check-circle"></i> '+optlabel.en,
          sv:'<i class="color4 fa fa-check-circle"></i> '+optlabel.sv,
          gr:'<i class="color4 fa fa-check-circle"></i> '+optlabel.gr,
          es:'<i class="color4 fa fa-check-circle"></i> '+optlabel.es
        };
      }
      return {"code":key,"text":optlabel};
      //nb! sorting with integer converted values
    }).sort( (a,b) =>  1 * ((parseInt(a.code) > parseInt(b.code)) ? 1 : ((parseInt(b.code) > parseInt(a.code)) ? -1 : 0)) );
    subMultiselect('#multiselectStatus',{fi:'tila',en:'status'},objsArrOrdered,{filterBehavior:'both',dropRight:true});

    // status :: initially selected options
    $scope.choices.status = Object.keys($scope.codes.supportNeedStatus);
    // pre-selects:
    angular.forEach($scope.choices.status,function(v,i){
      angular.element('#multiselectStatus').multiselect('select', v);
    });

    // annieusers for impersonate
    objsArrOrdered = [];
    if ($scope.auth.superuser) {
      angular.forEach($scope.auth.annieusers,function(au,aui) {
        let auid=au.id;
        let auname="";
        if (au.meta && au.meta.firstname && au.meta.lastname) {
          auname = au.meta.firstname+" "+au.meta.lastname;
        }
        //console.debug("DEBUG","AU",auid,auname);
        objsArrOrdered.push({"code":auid,"text":auname});
      });
      objsArrOrdered = objsArrOrdered.sort( (a,b) =>  1 * ((a.text > b.text) ? 1 : ((b.text > a.text) ? -1 : 0)) );
    }
    subMultiselect('#multiselectAnnieuser',{fi:'annieuser',en:'annieuser'},objsArrOrdered,{filterBehavior:'both',dropRight:true,selectAll:false});
  }

  $scope.resetSupportneedsPage = function() {
    $scope.debug && console.debug('resetSupportneedsPage');
    // do some heavy lifting from original data
    // begin with full set, for efficiency:
    // - what is left over from filtering via db!
    // - sort (re-order) data and
    // - do basic text search to limit data in UI only
    //this is done elsewhere for other reasons: $scope.getSupportNeeds();
    let leftover = $scope.supportneeds; //$scope.contacts
    leftover = $filter('orderBy')(leftover, $scope.order, false, $scope.naturalCompare)
    leftover = basicFilter(leftover, $scope.search, $scope);

    let beginIndex = ($scope.currentPage-1)*$scope.itemsPerPage;
    let endIndex = ($scope.currentPage)*$scope.itemsPerPage;
    //$scope.supportneedspage = $scope.supportneeds.slice(beginIndex,endIndex);
    $scope.supportneedspage = leftover.slice(beginIndex,endIndex);
    $scope.paginationCounts(leftover.length);
    $scope.debug>1 && console.debug('resetSupportneedsPage',$scope.supportneeds.length,$scope.totalItems,leftover.length,beginIndex,endIndex);
    $scope.debug>2 && console.debug('resetSupportneedsPage',$scope.supportneedspage);
  }
  $scope.resetPagination = function() { // this is called from UI components!
    $scope.debug && console.debug('resetPagination');
    // a call to pagination means that we want to apply filters again
    // and since we fetch result from db, do:
    $scope.getSupportNeeds(); //->resetSupportneedsPage->paginationCounts
    $scope.setPage(1); //->resetSupportneedsPage->paginationCounts
  }

  let intervalOn;
  $scope.setUpdateInterval = function(sec) {
    $scope.updateInterval = sec;
    $scope.setCookie('updateInterval',sec); //store it
    if (angular.isDefined(intervalOn)) {
      $interval.cancel(intervalOn);
      intervalOn = undefined;
    }
    intervalOn = $interval(function() {
      $scope.debug>1 && console.debug('updateInterval',new Date().toISOString());
      $scope.getSupportNeeds(); //->resetSupportneedsPage->paginationCounts
    }, $scope.updateInterval*1000);
  }

  //
  // INIT
  // (+immediate auth test above)

  if (typeof QueryString !== 'undefined') {
    if (QueryString.lang) {
      if (QueryString.lang in CONFIG.languages) {
        $scope.lang = QueryString.lang;
      }
    }
    if (QueryString.debug) {
      $scope.debug = parseInt(QueryString.debug)||1;
    }
    if (QueryString.show) {
      $scope.show=QueryString.show;
    } else {
      $scope.show='select';
    }
  }//QueryString

  if ($scope.auth) {
    $scope.resetConfigValues(); //immediate load at init, may be overwritten on load
    // will load: getCodes->resetArrays & getContacts->getSupportNeeds->resetSupportneedsPage->paginationCounts

    $scope.getCookieConfig();// ->resetArrays
    $scope.debug && console.debug("init contactArr",$scope.columns.contactArr);
    $scope.debug && console.debug("init supportneedArr",$scope.columns.supportneedArr);

    // start loading data repeatedly
    $scope.setUpdateInterval($scope.updateInterval);
  }
}]);//-rootController
