'use strict';

var React = require('react');
var _Date = require('../../../shared/Date.jsx');
var Time = require('../../../shared/Time.jsx');
var NotificationActions = require('../../../../actions/NotificationActions.js');

var ActiveNotification = React.createClass({
    mixins: [React.addons.PureRenderMixin],

    statics: {
        fromArray: function (notifications) {
            if (notifications) {
                return notifications.map(function (notification) {
                    return <ActiveNotification key={notification.id} notification={notification}/>;
                });
            }
        }
    },

    onStopClick() {
        NotificationActions.expire(this.props.notification);
    },

    render() {
        var { expiresDate, message } = this.props.notification;

        return (
            <div className="ActiveNotification">
                <div className="ActiveNotification__Header">
                    <h5 style={{margin: 0, fontWeight: 400}}>Marketplace System</h5>
                    <em>Expires: <_Date date={expiresDate} /> at <Time date={expiresDate} /></em>
                    <button className="btn btn-link"><i className="fa fa-ban" onClick={this.onStopClick}></i></button>
                </div>
                <p>{ message }</p>
            </div>
        );
    }
});

module.exports = ActiveNotification;