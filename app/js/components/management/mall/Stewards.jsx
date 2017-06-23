'use strict';

require('script!w2ui');
w2utils.settings.dataType = 'RESTFULL';

var React = require('react');
var $ = require('jquery');
var t = require('tcomb-form');
var { Str, struct, subtype, enums, list } = t;
var Crud = require('../../shared/Crud.jsx');
var { API_URL } = require('ozp-react-commons/OzoneConfig');
var humps = require('humps');
var Stewards = React.createClass({

    mixins: [ require('../../../mixins/SystemStateMixin') ],

    getDefaultProps: function () {

        return {
            title: 'Steward',
            url: API_URL + '/api/profile/?role=ORG_STEWARD',
            getDisplayName: function (selectedRecord) {
                return selectedRecord.displayName;
            },
            getUsername: (data) => {
              return data.map((user)=> {
                user.username = user.user.username;
                return user;
              });
            },
            getStewardOrgs: (data) => {
              return data.map((user)=> {
                user.stewardedOrganizations = user.stewardedOrganizations.map((org) => {
                  return org.title;
                });
                return user;
              });
            },
            structStewardOrgs: (data) => {
              var dataArray = [];
              data.stewardedOrganizations.map((org) => {
                dataArray.push({
                  title: org
                });
              });
              var newData = {
                displayName: data.displayName,
                stewardedOrganizations: dataArray
              };
              return newData;
            },
            form: {
                fields: {
                    username: {
                        disabled: true
                    },
                    displayName: {
                        disabled: true
                    },
                    stewardedOrganizations: {
                        disableOrder: true
                    }
                }
            },
            grid: {
                toolbar: {
                    items: [
                        { type: 'button', id: 'demoteButton', caption: 'Demote', title: 'Demote a Steward', img: 'icon-delete' }
                    ],
                    onClick: function (target, data) {
                        data.onComplete = function(){
                            var newGrid = this.owner;
                            var userID = newGrid.getSelection()[0];
                            var userInfo = newGrid.get(userID)

                            try {
                                var username = userInfo.displayName;
                            }
                            catch (err) {
                                w2alert('Please select a Steward.');
                            }

                            //console.log(userInfo);

                            if (data.target === 'demoteButton') {
                                w2confirm('Are you sure you want to remove ' + username + ' from Stewards?')
                                    .yes(function () {
                                        //console.log('clicked YES');
                                        var newUserInfo = userInfo;
                                        newUserInfo.stewardedOrganizations = [];
                                        newUserInfo.user.groups[0] = {name: "USER"};

                                        //console.log(newUserInfo);
                                        //console.log(JSON.stringify(humps.decamelizeKeys(newUserInfo)));

                                        $.ajax({
                                            type: 'PUT',
                                            url: API_URL + `/api/profile/${userID}/`,
                                            data: JSON.stringify(humps.decamelizeKeys(newUserInfo))
                                        })
                                        //.done(newGrid.reload)
                                        //.fail(newGrid.handleError);
                                    });
                            }
                        }
                    }
                },
                columns: [
                    { field: 'displayName', caption: 'Display Name', size: '34%' },
                    { field: 'username', caption: 'Username', size: '33%' },
                    { field: 'stewardedOrganizations', caption: 'Steward Organizations', size: '33%'}
                ],
                show: {
                    toolbar: true,
                    toolbarAdd: false,
                    toolbarEdit: true,
                    toolbarDelete: false,
                    toolbarSearch: false,
                    toolbarReload: false,
                    toolbarColumns: false
                }
            }
        };
    },

    getSchema: function () {
        // Steward Schema
        var organizations = this.state.system.organizations
          .map(function (org) {
            return org.title;
          });
        return struct({
            displayName: subtype(Str, function (s) {
                return s.length <= 255;
            }),
            stewardedOrganizations: list(enums.of(organizations))
        });
    },

    render: function () {
        return <Crud {...this.props} Schema={this.getSchema()} />;
    }

});

module.exports = Stewards;
