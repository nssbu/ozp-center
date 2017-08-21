var NotificationsModal = require('ozp-react-commons/components/notification/NotificationsModal.jsx');
var React = require('react');
var Reflux = require('reflux');

var ActiveStateMixin = require('../../mixins/ActiveStateMixin');

var { Navigation } = require('react-router');


/**
 * A simple wrapper around NotificationModal
 */
var NotificationWindow = React.createClass({
    mixins: [ActiveStateMixin, Navigation],

    getInitialState: function() {
        return {
            backRoute: (History.length > 1) ?
                this.goBack :
                this.getActiveRoutePath()
        };
    },

    render: function() {
        console.log('rendering window')
        return (
            <NotificationsModal backRoute={this.state.backRoute} />
        );
    }
});

module.exports = NotificationWindow;
