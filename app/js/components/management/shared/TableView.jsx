'use strict';

var PaginatedListingsStore = require('../../../stores/PaginatedListingsStore');
var Listing = require('../../../webapi/Listing');
var ListingActions = require('../../../actions/ListingActions');

var React = require('react');
var Reflux = require('reflux');
var { PropTypes } = React;

var { Navigation } = require('react-router');
var ActiveState = require('../../../mixins/ActiveStateMixin');

var moment = require('moment');

var TableView = React.createClass({

    mixins: [
        Reflux.listenTo(PaginatedListingsStore, 'onStoreChanged'),
        Reflux.listenTo(ListingActions.listingChangeCompleted, 'onListingChangeCompleted'),
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
               console.log(event);
               result.total = data.count;
               event.xhr.responseText = result;
               thisTable.props.onCountsChanged(data.counts);
            }, //todo: replace url with route instead of hard code
            url: 'http://localhost:8001/api/listing/',

            /* eslint-disable no-unused-vars */
            onRequest: function(event){
                //todo: set the grid.postData object to the correct format as expected by the endpoint
                // the object should have limit, offset, search, ordering
                //consult the django rest documentation for what those filters can accept and pass the info in from the
                //existing grid.postData then assign the new object to grid.postData
                if(event.postData.sort && event.postData.sort[0].direction == "asc"){
                  var field = event.postData.sort[0].field;
                  event.postData.ordering = field;

                }
                if(event.postData.sort && event.postData.sort[0].direction == "desc"){
                  event.postData.ordering ="-"+event.postData.sort[0].field;
                }
                event.postData
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
                if (this.columns[event.column].field==="featured") {
                    if (target.type==='checkbox') {
                        if(thisTable.props.isAdmin && thisTable.props.isAdmin===true){
                            var listing = this.records.filter(
                                function (listing) {
                                    return parseInt(listing.recid) === parseInt(event.recid);
                                }
                            )[0];
                            ListingActions.setFeatured(target.checked, listing);
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
         securityMarking: listing.securityMarking
       };

    if(listing.approvalStatus !== 'DELETED'){
         result.enabled = listing.isEnabled ? "Enabled" : "Disabled";
         result.featured = listing.isFeatured;
    }
    else{
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
            { field: 'owners', caption: 'Owners', sortable: true, size: '10%',
                render: function (record) {
                    var owners = _.pluck(record.owners, 'displayName');
                    return owners.join('; ');
                }
            });

        if (this.props.showOrg===true) {
            columns.push({ field: 'agency', caption: 'Agency', sortable: true, size: '10%' });
        }

        columns.push(
            { field: 'private', caption: 'Private', size: '10%',
              render: function (record) {
                  if (record.private === true) {
                      return '<i class="icon-lock-blue"></i> Private';
                  } else if (record.private === false){
                      return 'Public';
                  } else return '';
              }
            },
            { field: 'comments', caption: 'Comments', size: '20%' },
            { field: 'status', caption: 'Status', sortable: true, size: '5%',
                render: function (record) {
                    return thisTable.convertStatus(record.status);
                }
            },
            { field: 'updated', caption: 'Updated', sortable: true, size: '5%',
                render: function (record) {
                    return moment(record.updated).format('MM/DD/YY');
                }
            },
            { field: 'enabled', caption: 'Enabled', sortable: true, size: '5%'},
            { field: 'featured', caption: 'Featured', sortable: true, size: '5%',
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

    getUnpaginatedList: function () {
        return PaginatedListingsStore.getListingsByFilter(this.props.filter);
    },

    fetchAllListingsIfEmpty: function () {
        var listings = this.getUnpaginatedList();
        if (!listings || listings==='undefined') {
            ListingActions.fetchAllListingsAtOnce(this.props.filter);
        }
        this.onStoreChanged();
    },

    onStoreChanged: function () {
        var unpaginatedList = this.getUnpaginatedList();

        if (!unpaginatedList) {
            return;
        }

        var {data, counts } = unpaginatedList;

        var records = data.map( function (listing) {
            if(listing.approvalStatus !== 'DELETED'){
              return {
                  recid: listing.id,
                  title: listing.title,
                  owners: listing.owners,
                  organization: listing.agency ? listing.agency : '',
                  comments: listing.whatIsNew ? listing.whatIsNew : '',
                  status: listing.approvalStatus,
                  updated: listing.editedDate,
                  enabled: listing.isEnabled ? "Enabled" : "Disabled",
                  featured: listing.isFeatured,
                  actions: null,
                  private: listing.isPrivate,
                  securityMarking: listing.securityMarking
              };
            }
            else{
              return {
                  recid: listing.id,
                  title: listing.title,
                  owners: listing.owners,
                  organization: listing.agency ? listing.agency : '',
                  comments: listing.whatIsNew ? listing.whatIsNew : '',
                  status: listing.approvalStatus,
                  updated: listing.editedDate,
                  enabled: null,
                  featured: null,
                  actions: null,
                  private: listing.isPrivate,
                  securityMarking: listing.securityMarking
              };
            }
        });

        if (this.grid) {
  //          this.grid.clear();
//            this.grid.refresh();
        }else{
            "warn";
        }

    },

    onListingChangeCompleted: function () {
        ListingActions.fetchAllListingsAtOnce(this.props.filter);
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
