'use strict';

var React = require('react');
var moment = require('moment');
var { Link, Navigation } = require('react-router');
var ActiveState = require('../../mixins/ActiveStateMixin');
var { UserRole } = require('ozp-react-commons/constants');
var deleted = './images/deleted_360.png';
var SelfStore = require('ozp-react-commons/stores/SelfStore');

var ActionMenu = React.createClass({

    mixins: [ Navigation, ActiveState ],

    render: function () {
        //TODO fill in hrefs
        var currentUser = SelfStore.getDefaultData().currentUser;
        var owners = this.props.listing.owners;

        var listing = this.props.listing,
            activeRoutePath = this.getActiveRoutePath(),
            overviewHref = this.makeHref(activeRoutePath, this.getParams(), {
                listing: listing.id,
                action: 'view',
                tab: 'overview'
            }),
            deleteHref = this.makeHref(activeRoutePath, this.getParams(), {
                listing: listing.id,
                action: 'delete'
            }),
            pendDeleteHref = this.makeHref(activeRoutePath, this.getParams(), {
                listing: listing.id,
                action: 'pending_deletion'
            }),
            feedbackHref = this.makeHref(activeRoutePath, this.getParams(), {
                listing: listing.id,
                action: 'feedback'
            }),
            undeleteHref = this.makeHref(activeRoutePath, this.getParams(), {
                listing: listing.id,
                action: 'undelete'
            }),
            linkParams = {listingId: listing.id},
            edit = <li key="edit"><Link to="edit" params={linkParams}>Edit</Link></li>,
            preview = <li key="preview"><a href={overviewHref}>Preview</a></li>,
            del = <li key="del"><a href={deleteHref}>Delete</a></li>,
            view = <li key="view"><a href={overviewHref}>View</a></li>,
            feedback = <li key="feedback"><a href={feedbackHref}>Read Feedback</a></li>,
            pendingDelete = <li key="penddelete"><a href={pendDeleteHref}>Pend for Deletion</a></li>,
            undelete  = <li key="undelete"><a href={undeleteHref}>Undelete</a></li>,
            links,
            approvalStatus = listing.approvalStatus;

        switch (approvalStatus) {
            case 'APPROVED':
                if(currentUser.isAdmin()){
                  links = [edit, view, del];
                }
                else{
                  links = [edit, view, pendingDelete];
                }
                break;
            case 'APPROVED_ORG':
                if(currentUser.isAdmin()){
                  links = [edit, view, del];
                }
                else{
                  links = [edit, view, pendingDelete];
                }
                break;
            case 'PENDING':
                if(currentUser.isAdmin()){
                  links = [edit, view, del];
                }
                else{
                  links = [edit, view, pendingDelete];
                }
                break;
            case 'REJECTED':
                if(currentUser.isAdmin()){
                  links = [edit, view, del];
                }
                else{
                  links = [edit, view, pendingDelete];
                }
                break;
            case 'DELETED':
                links = [];
                break;
            case 'PENDING_DELETION':
                if(currentUser.isAdmin()){
                  links = [edit, view, del];
                }
                else{
                  links = [view, edit,undelete];
                }
                break;
            case 'DRAFT':
                /* falls through */
            default:
                links = [edit, preview, del];
        }

        //use hidden checkbox to manage menu toggle state
        return (
            <label className="AdminOwnerListingTile__actionMenu">
                <input type="checkbox" />
                <span className="AdminOwnerListingTile__actionMenuButton" />
                <ul>{links}</ul>
            </label>
        );
    }
});

var ListingStatus = React.createClass({
    render: function () {
        return (
            <div className="approvalStatus"></div>
        );
    }
});

var PrivateListing = React.createClass({
    render: function () {
        var isPrivate = this.props.listing.isPrivate;

        var lockStyle = {
            position: 'absolute',
            left: '18px',
            top: '0'
        };

        return (
            <div style={lockStyle}>
                { isPrivate &&
                 <i className="icon-lock-blue"></i>
                }
            </div>
        );
    }
});

var EditedDate = React.createClass({
    render: function () {
        var editedDate = this.props.listing.editedDate,
            editedDateString = moment(editedDate).format('MM/DD/YY');

        return (
            <div className="editedDate">{editedDateString}</div>
        );
    }
});

var InfoBar = React.createClass({
    render: function () {
        var listing = this.props.listing;

        return (
            <h5 className="AdminOwnerListingTile__infoBar">
                <ListingStatus listing={listing} />
                <PrivateListing listing={listing} />
                <p className="title">{listing.title}</p>
                <EditedDate listing={listing} />
            </h5>
        );
    }
});

var AdminOwnerListingTile = React.createClass({
    propTypes: {
        role: React.PropTypes.oneOf([UserRole.APPS_MALL_STEWARD, UserRole.ORG_STEWARD, null]),
        listing: React.PropTypes.object
    },

    mixins: [ Navigation, ActiveState ],

    statics: {
        fromArray: function (array, role) {
            return array.map((listing) =>
                <AdminOwnerListingTile listing={listing} key={listing.id} role={role} />
            );
        }
    },

    _getApprovalStatusClass: function () {
        var {listing, role} = this.props;
        var approvalStatus = listing.approvalStatus;
        var approvalStatusClasses;

        if (role === UserRole.APPS_MALL_STEWARD) {
            approvalStatusClasses = {
                'draft': approvalStatus === 'IN_PROGRESS',
                'pending': approvalStatus === 'PENDING',
                'needs-action': approvalStatus === 'APPROVED_ORG',
                'published': approvalStatus === 'APPROVED',
                'rejected': approvalStatus === 'REJECTED',
                'deleted': approvalStatus === 'DELETED',
                'pending-delete': approvalStatus === 'PENDING_DELETION',
                'AdminOwnerListingTile': true
            };
        }
        else if (role === UserRole.ORG_STEWARD) {
            approvalStatusClasses = {
                'draft': approvalStatus === 'IN_PROGRESS',
                'pending': approvalStatus === 'APPROVED_ORG',
                'needs-action': approvalStatus === 'PENDING',
                'published': approvalStatus === 'APPROVED',
                'rejected': approvalStatus === 'REJECTED',
                'deleted': approvalStatus === 'DELETED',
                'pending-delete': approvalStatus === 'PENDING_DELETION',
                'AdminOwnerListingTile': true
            };
        }
        else {
            approvalStatusClasses = {
                'draft': approvalStatus === 'IN_PROGRESS',
                'pending': approvalStatus === 'PENDING' || approvalStatus === 'APPROVED_ORG',
                'needs-action': approvalStatus === 'REJECTED',
                'published': approvalStatus === 'APPROVED',
                'deleted': approvalStatus === 'DELETED',
                'pending-delete': approvalStatus === 'PENDING_DELETION',
                'AdminOwnerListingTile': true
            };
        }
        return approvalStatusClasses;
    },

    render: function () {
      var { listing } = this.props;

      var overview = this.makeHref(this.getActiveRoutePath(), this.getParams(), {
          listing: listing.id,
          action: 'view',
          tab: 'overview'
      });
      var classSet = React.addons.classSet(this._getApprovalStatusClass());
      var imageLargeUrl = listing.imageLargeUrl;
      if(this.props.listing.approvalStatus !== 'DELETED'){
          return (
              <li className={classSet}>
                { (this.props.listing.approvalStatus !== "DELETED")  &&
                    <ActionMenu listing={listing} />
                }
                <a href={overview}>
                  <img alt={`Click to manage ${listing.title}`} className="AdminOwnerListingTile__img" src={(this.props.listing.approvalStatus !== "DELETED") ? imageLargeUrl : deleted} />
                    <span className="hidden-span">{listing.title}</span>
                </a>
                <InfoBar listing={listing} />
                </li>
          );
      }
      else{
        return (
            <li className={classSet}>
              <a >
                <img className="AdminOwnerListingTile__img" src={deleted} />
                  <span className="hidden-span">{listing.title}</span>
              </a>
              <InfoBar listing={listing} />
              </li>
            );
          }
      }
      });

module.exports = AdminOwnerListingTile;
