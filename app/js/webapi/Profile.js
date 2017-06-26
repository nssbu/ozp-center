'use strict';

var $ = require('jquery');

var { API_URL } = require('ozp-react-commons/OzoneConfig');

var ProfileApi = {

    getStewards: function() {
        return $.getJSON(API_URL + '/api/profile?role=ORG_STEWARD');
    },

    demoteSteward: function() {
        $.ajax({
            type: 'PUT',
            url: API_URL + `/api/profile/${userID}/`,
            data: JSON.stringify(humps.decamelizeKeys(newUserInfo)),
            contentType: 'application/json'
        })
    }
};


module.exports = ProfileApi;
