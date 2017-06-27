'use strict';

var React = require('react');
var Reflux = require('reflux');

var SelfStore = require('ozp-react-commons/stores/SelfStore');

var ListingActions = require('../actions/ListingActions');

var Modal = require('ozp-react-commons/components/Modal.jsx');

function getState(profileData) {
    var profile = profileData.currentUser,
        launchInWebtop = profile ? profile.launchInWebtop : false;

    return {launchInWebtop: launchInWebtop, onHidden: true, launchModal: false};
}

/**
 * A link for launching applications.  Depending on the user's preference,
 * this will either launch into webtop (in a new tab) or just in a new tab
 */
var CenterLaunchLink = React.createClass({
    mixins: [Reflux.listenTo(SelfStore, 'onStoreUpdate')],

    propTypes: {
        listing: React.PropTypes.object.isRequired
    },

    getInitialState: function() {
        return getState(SelfStore.getDefaultData());
    },

    onStoreUpdate: function(profileData) {
        this.setState(getState(profileData));
    },

    componentDidMount: function(){
      $(this.refs.tooltipped.getDOMNode()).tooltip({
        delay: 400
      });
    },

    launchClick: function(){
        var listingLaunchFn = ListingActions.launch.bind(null, this.props.listing)
        listingLaunchFn();

        var me = this;
        me.setState({'launchModal': true});

        setTimeout(function(){
            me.setState({'launchModal': false});
        }, 10000);
    },

    modalConfimation: function(){
        this.setState({'launchModal': false});
    },

    render: function() {
        var { className, ...otherProps } = this.props,
            linkClassName = className ? className + ' btn' : 'btn';

        var launchWarning = this.state.launchModal;
        var requirements = this.props.listing.requirements;
        var launchModal = requirements != '' && requirements.toLowerCase() != 'none'
            ? (<Modal ref="modal" className="LaunchConfirmation" size="small" title="Launch Requirements Notice" onCancel={this.modalConfimation}>
                  <strong>
                      <p>Please review the requirements below if you have problems launching <b>{this.props.listing.title}</b></p>
                      <br/>
                      <p>{this.props.listing.requirements}</p>
                      <br/>
                      <p>This dialog box will close automatically after 10 seconds</p>
                  </strong>
                  <button className="btn btn-danger" onClick={this.modalConfimation}>OK</button>
              </Modal>)
          : null;

        return (
            <div style={{float: 'left'}}>
                <button ref="tooltipped" data-toggle="tooltip" data-placement="top" alt="Click to launch this app" title="Launch" { ...otherProps } className={linkClassName}
                        onClick={this.launchClick}>
                    <i className="icon-open-grayDark" /><span className="hidden-span">Launch</span>
                </button>
                {launchWarning ? launchModal : null}
            </div>
        );
    }
});

module.exports = CenterLaunchLink;
