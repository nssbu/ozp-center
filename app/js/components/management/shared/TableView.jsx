'use strict';

var PaginatedListingsStore = require('../../../stores/PaginatedListingsStore');
var GlobalListingStore = require('../../../stores/GlobalListingStore')
var Listing = require('../../../webapi/Listing');
var ListingActions = require('../../../actions/ListingActions');

var React = require('react');
var Reflux = require('reflux');
var { PropTypes } = React;

var { Navigation } = require('react-router');
var ActiveState = require('../../../mixins/ActiveStateMixin');

var moment = require('moment');
var API_WAIT = 1000;

var TableView = React.createClass({

    mixins: [
        Navigation,
        ActiveState
    ],

    propTypes: {
        filter: PropTypes.object.isRequired,
        onCountsChanged: PropTypes.func.isRequired,
        tableName: PropTypes.string.isRequired,
        isAdmin: PropTypes.bool,
        showOrg: PropTypes.bool
    },

    render: function () {
        return this.transferPropsTo(
            <div ref="grid"></div>
        );
    },

    componentWillUnmount: function () {
        this.grid.destroy();
    },

    componentDidMount: function () {
        var thisTable = this;
        this.grid = $(this.refs.grid.getDOMNode()).w2grid({
            name: 'grid',
            fixedBody: true,
            multiSelect : false,
            show: {
                toolbar: true,
                toolbarAdd: false,
                toolbarEdit: false,
                toolbarDelete: false,
                toolbarSearch: true,
                toolbarReload: false,
                toolbarColumns: true,
                toolbarSave: true
            },
            buttons: {
                save : {
                    caption: w2utils.lang('Export to csv'),
                    icon: 'icon-save-grayDark'
                }
            },
            columns: this.getColumns(),
            limit: 25,
            onLoad: function(event){
               var data = $.parseJSON(event.xhr.responseText);
              // var onCountsChanged = super.props.onCountsChanged;
               var result = {};
               //todo: map results fields to proper records fields
               result.records = thisTable.resultsMap(data)
               result.total = data.count;
               event.xhr.responseText = result;
               thisTable.props.onCountsChanged(data.counts);
            }, //todo: replace url with route instead of hard code
            url: 'http://localhost:8001/api/listing/',

            /* eslint-disable no-unused-vars */
            onRequest: function(event){

                var postData = event.postData;
                var sort = postData.sort;
                var searchValue = postData.searchValue;

                if(sort){
                    var field = sort[0].field;
                    var direction = sort[0].direction;
                    if (direction === 'asc')
                        postData.ordering = field;
                    if (direction === 'desc')
                        postData.ordering = '-' + field;
                    delete postData.sort;
                }
                if(searchValue){
                    postData.search = searchValue;
                    delete postData.searchValue;
                }

                //removing unnecessary parameters (null props get deleted in next step)
                postData.selected = null;
                postData.search = null;
                postData.searchLogic = null;

                //delete all parameters that are null so we don't filter on null fields like org or status
                for(var prop in postData){
                    if (postData.hasOwnProperty(prop) && postData[prop]===null) {
                        delete postData[prop];
                    }
                }

                event.postData = postData;
            },
            onSearch: function (event) {
                this.postData.searchValue = event.searchValue;
            },
            onSubmit: function (event) {
            /* eslint-enable no-unused-vars */
                var records = this.records.map( function (record) {
                    var owners = '';
                    record.owners.forEach( function (owner,index) {
                        if (index) {
                            owners += '; ';
                        }
                        owners += owner.displayName;
                    });
                    var updatedDate = moment(record.updated).format('MM/DD/YY');
                    return {
                        Id: record.recid,
                        Title: record.title,
                        Owners: owners,
                        Agency: record.organization,
                        Status: thisTable.convertStatus(record.status),
                        Updated: updatedDate,
                        Enabled: record.enabled,
                        Featured: record.featured,
                        Comments: record.comments
                    };
                });
                thisTable.JSONToCSVConvertor(records,thisTable.props.tableName, "false");
            },

            onClick: function (event) {
                event.preventDefault();
                event.stopPropagation();
                var target = event.originalEvent.target;
                if (this.columns[event.column].field==="is_featured") {
                    if (target.type==='checkbox') {
                        if(thisTable.props.isAdmin && thisTable.props.isAdmin===true){
                            var listing = this.records.filter(
                                function (listing) {
                                    return parseInt(listing.recid) === parseInt(event.recid);
                                }
                            )[0];
                            var counter = 0;
                            var apiTimer = setInterval(() => {
                                var updatedListing = GlobalListingStore.getById(listing.recid)

                                counter++;

                                if (updatedListing) {
                                  ListingActions.setFeatured(target.checked,updatedListing )
                                    clearInterval(apiTimer);
                                }
                            }, API_WAIT);
                            //ListingActions.setFeatured(target.checked,updatedListing );

                        }
                    }
                }
            }
        });
        //this.fetchAllListingsIfEmpty();
    },
    resultsMap: function(data){
      var results = {}
      results = data.results.map( function (listing) {
          listing = new Listing.Listing(listing);
      var result = {
         recid: listing.id,
         title: listing.title,
         owners: listing.owners,
         agency: listing.agency ? listing.agency : '',
         comments: listing.whatIsNew ? listing.whatIsNew : '',
         status: listing.approvalStatus,
         updated: listing.editedDate,
         actions: null,
         private: listing.isPrivate,
         securityMarking: listing.securityMarking,
         is_enabled: listing.isEnabled ? "Enabled" : "Disabled",
         featured: listing.isFeatured,
       };
    if(listing.approvalStatus === 'DELETED'){
         result.enabled = null;
         result.featured = null;
    }
    return result
     });
     return results;
   },

    getColumns: function () {
        var thisTable = this;

        var columns = [];

        columns.push(
            { field: 'securityMarking', caption: 'Security Marking', size: '15%',
              render: function (record) {
                  return record.securityMarking;
              }
            },
            { field: 'title', caption: 'Title', sortable: true, size: '10%',
                render: function (record) {
                    var overview = thisTable.makeHref(thisTable.getActiveRoutePath(), thisTable.getParams(), {
                        listing: record.recid,
                        action: 'view',
                        tab: 'overview'
                    });
                    var title = record.title;
                    if(record.status !== 'DELETED'){
                      return '<a href='+encodeURI(overview)+'>'+title+'</a>';
                    }
                    else{
                      return title;
                    }
                }
            },
            { field: 'owners__display_name', caption: 'Owners', sortable: true, size: '10%',
                render: function (record) {
                    var owners = _.pluck(record.owners, 'displayName');
                    return owners.sort().join('; ');
                }
            });

        if (this.props.showOrg===true) {
            columns.push({ field: 'agency', caption: 'Agency', sortable: true, size: '10%' });
        }

        columns.push(
            { field: 'is_private', caption: 'Private', size: '10%',sortable: true,
              render: function (record) {
                  if (record.private === true) {
                      return '<i class="icon-lock-blue"></i> Private';
                  } else if (record.private === false){
                      return 'Public';
                  } else return '';
              }
            },
            { field: 'comments', caption: 'Comments', size: '20%' },
            { field: 'approval_status', caption: 'Status', sortable: true, size: '5%',
                render: function (record) {
                    return thisTable.convertStatus(record.status);
                }
            },
            { field: 'updated', caption: 'Updated', sortable: true, size: '5%',
                render: function (record) {
                    return moment(record.updated).format('MM/DD/YY');
                }
            },
            { field: 'is_enabled', caption: 'Enabled', sortable: true, size: '5%'},
            { field: 'is_featured', caption: 'Featured', sortable: true, size: '5%',
                render: function (record) {
                    if (thisTable.props.isAdmin===true) {
                      if(record.featured !== null){
                        if (record.featured) {
                            return '<input type="checkbox" checked/>';
                        } else {
                            return '<input type="checkbox" />';
                        }
                    } else {
                        if (record.featured) {
                            return '<input type="checkbox" disabled="true" checked/>';
                        } else {
                            return '<input type="checkbox" disabled="false" />';
                        }
                    }
                  }
                  else{
                    return '<input type="checkbox" style= "display:none" disabled="true" checked/>';
                  }
                }

            },
            { field: 'actions', caption: 'Actions', size: '5%',
                render: function (record) {
                    var activeRoutePath = thisTable.getActiveRoutePath();
                    var editHref = "#/edit/" + record.recid,
                        overviewHref = thisTable.makeHref(activeRoutePath, thisTable.getParams(), {
                            listing: record.recid,
                            action: 'view',
                            tab: 'overview'
                        }),
                        deleteHref = thisTable.makeHref(activeRoutePath, thisTable.getParams(), {
                            listing: record.recid,
                            action: 'delete'
                        }),
                        feedbackHref = thisTable.makeHref(activeRoutePath, thisTable.getParams(), {
                            listing: record.recid,
                            action: 'feedback'
                        });

                    var status = record.status,

                        actions = '<label class="AdminOwnerListingTable__actionMenu">';

                    actions += '<a key="link" href="'+editHref+'" title="Edit"><i class="icon-pencil-12-blueDark"/></a>';
                    if(status !== 'DELETED'){
                    if (status === 'APPROVED') {
                        actions += '<a key="view" href="'+overviewHref+'" title="View"><i class="icon-eye-12-blueDark"/></a>';
                    } else {
                        actions += '<a key="prev" href="'+overviewHref+'" title="Preview"><i class="icon-eye-12-blueDark"/></a>';
                    }

                    if (status === 'REJECTED') {
                        actions += '<a key="feedback" href="'+feedbackHref+'" title="Feedback"><i class="icon-feedback-12-blueDark"/></a>';
                    }

                    actions += '<a key="del" href="'+deleteHref+'" title="Delete"><i class="icon-trash-12-blueDark"/></a>';
                    actions += '</label>';
                    return actions;
                    }
                    else{
                      return null;
                    }
                }
            }
        );
        return columns;
    },

    convertStatus: function (status) {
        var displayStatus="";
        if (status === "APPROVED") {
            displayStatus = "Published";
        } else if (status === "APPROVED_ORG") {
            displayStatus = "Org Approved";
        } else if (status === "PENDING") {
            displayStatus = "Pending, Org";
        } else if (status === "IN_PROGRESS") {
            displayStatus = "Draft";
        } else if (status === "REJECTED") {
            displayStatus = "Returned";
        }else if (status === "DELETED") {
            displayStatus = "Deleted";
        }
        return displayStatus;
    },



    JSONToCSVConvertor: function (JSONData, ReportTitle, ShowLabel) {

        var arrData = typeof JSONData !== 'object' ? JSON.parse(JSONData) : JSONData;

        var CSV = '',
            row = '';
        CSV += ReportTitle + '\r\n\n';

        if (ShowLabel) {
            row = "";
            for (var index in arrData[0]) {
                row += index + ',';
            }
            row = row.slice(0, -1);
            CSV += row + '\r\n';
        }

        arrData.forEach( function (data, i) {
            row = "";
            for (var index in arrData[i]) {
                row += '"' + arrData[i][index] + '",';
            }
            row.slice(0, row.length - 1);
            CSV += row + '\r\n';
        });

        if (CSV === '') {
            alert("Invalid data");
            return;
        }

        var fileName = "ListingReport_" + ReportTitle.replace(/ /g,"_");

        var uri = 'data:text/csv;charset=utf-8,' + escape(CSV);

        var link = document.createElement("a");
        link.href = uri;
        link.style.visibility = "hidden";
        link.download = fileName + ".csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

module.exports = TableView;
