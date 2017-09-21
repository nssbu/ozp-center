'use strict';

var React = require('react');
var Reflux = require('reflux');
var { Navigation, CurrentPath } = require('react-router');

var ActiveState = require('../../mixins/ActiveStateMixin');
var State = require('../../mixins/ActiveStateMixin');
var _ = require('../../utils/_');

// component dependencies
var Modal = require('ozp-react-commons/components/Modal.jsx');
var Header = require('./Header.jsx');
var CurrentListingStore = require('../../stores/CurrentListingStore');

var ProfileSearchActions = require('../../actions/ProfileSearchActions');
var OverviewTab = require('./OverviewTab.jsx');
var ReviewsTab = require('./reviews/index.jsx');
var DetailsTab = require('./DetailsTab.jsx');
var ResourcesTab = require('./ResourcesTab.jsx');
var AdministrationTab = require('./AdministrationTab.jsx');
var NotificationsTab = require('./NotificationsTab.jsx');
var Recommendations = require('./Recommendations.jsx');

var tabs = {
    'overview': OverviewTab,
    'reviews': ReviewsTab,
    'details': DetailsTab,
    'resources': ResourcesTab,
    'administration': AdministrationTab,
    'notifications': NotificationsTab
};

/**
*
* Quickview Component.
* Displays listing info in a modal window.
*
**/
var Quickview = React.createClass({

    mixins: [
      Reflux.connect(CurrentListingStore),
      Navigation,
      CurrentPath,
      State
    ],

    propTypes: {
        listing: React.PropTypes.object
    },

    componentDidMount: function() {
      this.listenTo(ProfileSearchActions.goHome, () => {
        this.close();
      });
    },



    getDefaultProps: function () {
        return {
            tabs: [{
                to: 'overview',
                name: 'Overview'
            }, {
                to: 'details',
                name: 'Details'
            }, {
                to: 'resources',
                name: 'Resources'
            }]
        };
    },

    getInitialState: function () {
        return {shown: false};
    },

    render: function () {
        var currentUser = this.props.currentUser;
        var { shown, listing } = this.state;
        var ActiveRouteHandler = this.getActiveRouteHandler();
        var owners, tabs;
        if (listing) {
            tabs = _.cloneDeep(this.props.tabs);
            owners = listing.owners.map(function (owner) {
                return owner.username;
            });

            if (!this.props.preview) {
                tabs.splice(1, 0, {
                    to: 'reviews',
                    name: 'Reviews'
                });
                if (currentUser.isAdmin() || (_.contains(owners, currentUser.username) && currentUser.username !== "Masked Username") ||
                    _.contains(currentUser.stewardedOrganizations, listing.agencyShort)) {
                        tabs.push({
                            to: 'administration',
                            name: 'Administration'
                        });
                        tabs.push({
                            to: 'notifications',
                            name: 'Send Notifications'
                        });
                }
            }
        }



        var headerProps = {
            listing: listing,
            onCancel: this.close,
            onEdit: this.edit,
            currentUser: currentUser,
            preview: this.props.preview,
            allowEdit: CurrentListingStore.currentUserCanEdit()
          };

          var recommendationProps = {
              listing: listing,
              recommendations: listing ? listing.similar:[],
              preview: this.props.preview,
              currentUser: currentUser
          }
        return (
            <Modal ref="modal" className="quickview" onShown={this.onShown} onHidden={this.onHidden} tabIndex="0">
                {
                    !listing ?
                        <p>Loading...</p> :
                        [
                            <Header { ...headerProps }  key="header"></Header>,
                            <div className="tabs-container" key="tabs-container">
                            { this.renderTabs(tabs, listing.id) }
                                <div className="tab-content" >
                                    <ActiveRouteHandler currentUser={currentUser} listing={listing} shown ={shown} />
                                </div>
                            </div>
                        ]
                }
                { listing && listing.id && this.props.currentUser.isBetaUser && <Recommendations listing={listing} shown = {shown} key="recommendations" />}

            </Modal>
        );
    },

    getActiveRouteHandler: function () {
        var tab = tabs[this.props.tab];
        if (!tab) {
            throw new Error('Unknown tab.');
        }
        return tab;
    },

    renderTabs: function (links, id) {
        var me = this;

        var linkComponents = links.map(function (link) {
            var className = link.to === me.props.tab ? 'active' : '';
            var href = me.makeHref(me.getActiveRoutePath(), me.getParams(), {
                listing: id,
                action: me.props.preview ? 'preview' : 'view',
                tab: link.to
            });

            return (
                <li className={className} key={link.to} role={link.name}>
                    <a id={link.name} href={href}>{link.name}</a>
                </li>
            );
        });

        return (
            <ul className="nav nav-tabs" role="tablist">
                {linkComponents}
            </ul>
        );
    },

    componentWillMount: function () {
        if (!this.props.preview) {
            CurrentListingStore.loadListing(this.props.listingId);
        }
    },

    componentWillReceiveProps: function (newProps) {
        if (!this.props.preview && (this.props.listingId !== newProps.listingId)) {
            CurrentListingStore.loadListing(newProps.listingId);
        }
    },

    onShown: function () {
        // dont force focus causes infinite loop with overview tab's modal carousel
        $(document).off('focusin.bs.modal');
        this.setState({
            shown: true
        });
    },

    onHidden: function () {
        if(!this.state.toEdit) {
            // go back to the parent route
            this.transitionTo(this.getActiveRoutePath(), this.getParams());
        }
        var PubSub = require('browser-pubsub');
        var tourCh = new PubSub('tour');
        tourCh.publish({
          overviewLoaded: false,
          reviewsLoaded: false,
          detailsLoaded: false,
          resourcesLoaded: false
        });
    },

    close: function () {
        this.refs.modal.close();
    },

    edit: function () {
        var listing = this.state.listing;
        this.setState({toEdit: true});
        this.close();
        this.transitionTo('edit', {listingId: listing.id});
    }

});

module.exports = Quickview;
module.exports.OverviewTab = OverviewTab;
module.exports.ReviewsTab = ReviewsTab;
module.exports.DetailsTab = DetailsTab;
module.exports.ResourcesTab = ResourcesTab;
module.exports.AdministrationTab = AdministrationTab;
module.exports.NotificationsTab = NotificationsTab;
