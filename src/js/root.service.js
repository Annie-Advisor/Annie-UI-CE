rootApp.service('DataService', ['$http', function($http) {
  let contactURI = CONFIG.contactURI;
  let surveyURI = CONFIG.surveyURI;
  let messageURI = CONFIG.messageURI;
  let supportNeedURI = CONFIG.supportNeedURI;
  let contactsurveyURI = CONFIG.contactsurveyURI;
  let commentURI = CONFIG.commentURI;
  let codesURI = CONFIG.codesURI;
  let metadataURI = CONFIG.metadataURI;
  let sendsmsURI = CONFIG.sendsmsURI;
  let opintopolkuURI = CONFIG.opintopolkuURI;

  this.getContacts = function() {
    return $http.get(contactURI)
    .then(function(response) {
      return response.data;
    });
  }

  this.getSurveys = function() {
    return $http.get(surveyURI)
    .then(function(response) {
      return response.data;
    });
  }

  this.getMessages = function(id) {
    return $http.get(messageURI+id)
    .then(function(response) {
      return response.data;
    });
  }

  this.getSupportNeeds = function(category,status,survey,userrole,degree,group,location) {
    let paramURI = "?";
    for (let i=0;i<category.length;i++) { paramURI+="&category="+ category[i]; }
    for (let i=0;i<status.length;  i++) { paramURI+="&status="+   status[i]; }
    for (let i=0;i<survey.length;  i++) { paramURI+="&survey="+   survey[i]; }
    for (let i=0;i<userrole.length;i++) { paramURI+="&userrole="+ userrole[i]; }
    // nb! contactdata values degree, group and location are NOT handled via supportneed API even though for some reason they are passed to it
    for (let i=0;i<degree.length;  i++) { paramURI+="&degree="+   degree[i]; }
    for (let i=0;i<group.length;   i++) { paramURI+="&group="+    group[i]; }
    for (let i=0;i<location.length;i++) { paramURI+="&location="+ location[i]; }
    return $http.get(supportNeedURI+paramURI)
    .then(function(response) {
      return response.data;
    });
  }

  this.getSupportNeedHistory = function(id) {
    return $http.get(supportNeedURI+id+'/history')
    .then(function(response) {
      return response.data;
    });
  }

  this.putSupportNeed = function(id,data) {
    return $http({
      method: 'POST',
      url: supportNeedURI + id,
      data: data,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    })
    .then(function(response) {
      return response.data;
    })
    .catch(function(response) {
      console.log('post ERROR ' + response.status + ' ' + response.data);
    });
  };

  this.getContactsurvey = function(id) {
    return $http.get(contactsurveyURI+id)
    .then(function(response) {
      return response.data;
    });
  }

  this.getComments = function(id) {
    return $http.get(commentURI+id)
    .then(function(response) {
      return response.data;
    });
  }

  this.putComment = function(id,data) {
    return $http({
      method: 'POST',
      url: commentURI + id,
      data: data,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    })
    .then(function(response) {
      return response.data;
    })
    .catch(function(response) {
      console.log('post ERROR ' + response.status + ' ' + response.data);
    });
  };

  this.getCodes = function(codeset,code) {
    if (typeof codeset === 'undefined') {
      codeset = "";
      code = "";
    }
    if (typeof code === 'undefined') {
      code = "";
    }
    let separator = codeset+code ? '/' : '';
    return $http.get(codesURI+codeset+separator+code)
    .then(function(response) {
      return response.data;
    });
  }

  this.getMetadata = function() {
    return $http.get(metadataURI)
    .then(function(response) {
      return response.data;
    });
  }

  //

  this.postSendSMS = function(id,data) {
    return $http({
      method: 'POST',
      url: sendsmsURI + id,
      data: data,
      headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    })
    .then(function(response) {
      return response.data;
    })
    .catch(function(response) {
      console.log('post ERROR ' + response.status + ' ' + response.data);
    });
  };

  // Opintopolku
  this.getKoodistoKoodi = function(koodisto,koodi) {
    return $http.get(opintopolkuURI+koodisto+"_"+koodi)
    .then(function(response) {
      return response.data;
    });
  };
}]);
