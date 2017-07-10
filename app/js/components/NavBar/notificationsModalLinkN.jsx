'use strict';

var React = require('react');
var Reflux = require('reflux');
var Modal = require('../Modal.jsx');
var { Navigation } = require('react-router');

var SystemStateMixin = require('../../mixins/SystemStateMixin');
var ProfileActions = require('../../actions/ProfileActions.js');
var NotificationActions = require('../../actions/NotificationActions.js');
var SelfActions = require('ozp-react-commons/actions/ProfileActions.js');
var { API_URL } = require('ozp-react-commons/OzoneConfig');


var marked = require('marked');
var renderer = new marked.Renderer();

// Disable heading tags
renderer.heading = function (text, level) {
  return '<span>' + text + '</span>';
};

renderer.link = function (href, title, text) {
  return `<a href="${href}" target="_blank">${text}</a>`;
};

var NotificationsModalInfo = React.createClass({
    mixins: [ Reflux.ListenerMixin ],

    getInitialState: function() {
      return {
        notificationList: [],
        activeNotification: 0,
      };
    },

    componentDidMount: function() {
        this.listenTo(NotificationActions.fetchOwnNotificationsCompleted, n => {
          this.setState({
            notificationList: n
          });
        });

        this.listenTo(SelfActions.dismissNotificationCompleted, () => {
          NotificationActions.fetchOwnNotifications();
        });
        NotificationActions.fetchOwnNotifications();

        $(this.getDOMNode())
            .one('shown.bs.modal', () => {
                if (this.props.onShown) {
                    this.props.onShown();
                }
            })
            .one('hidden.bs.modal', () => {
                if (this.props.onHidden) {
                    this.props.onHidden();
                }
            })
            .modal({
                backdrop: 'static',
                keyboard: false,
                show: true
            });
    },

    makeSidebar: function() {
      var notis = this.state.notificationList.slice(0);

      return notis.map((n, i) => {
        var date = new Date(n.createdDate);
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
        var formattedDate = months[date.getMonth()] + ' ' + date.getDate() + ', ' +  date.getFullYear();
        return (
          <li role="presentation" alt={`Notification ${i + 1} from ${(n.listing) ? n.listing.title : 'AppsMall'}`} tabIndex={i} onClick={() => {
              this.setState({
                activeNotification: i
              });
            }}>
            <a href="#" onClick={(e) => {e.preventDefault()}}>
              {(n.listing) ? n.listing.title : 'AppsMall'} <small>{formattedDate}</small>
            </a>
          </li>
        );
      });
    },

    makeNotification: function(n) {
      var createNotificationText = function() {
        return {__html: marked(n.message, { renderer: renderer })};
      };
      var date = new Date(n.createdDate);
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      var formattedDate = months[date.getMonth()] + ' ' + date.getDate() + ', ' +  date.getFullYear();
      return (
        <div>
          <div className="row" tabIndex={0}>
            <h4>{(n.listing) ? n.listing.title : 'AppsMall'} <small>{formattedDate}</small></h4>
            <div>

              { !(n.notificationType === "peer_bookmark") &&
                <span className="message small" dangerouslySetInnerHTML={createNotificationText()}></span>
              }
              { n.notificationType === "peer_bookmark" &&
                <div>
                  <p className="message small">{n.author.user.username} has shared a the folder <b>{n.peer.folderName}</b> with you.</p>
                  <p className="message small">{n.message}</p>
                  <div>
                    <button className="btn btn-default btn-sm" onClick={() => {
                      this.onDismiss(n);
                    }}>Ignore</button>
                    <button className="btn btn-success btn-sm" onClick={() => {
                        $.ajax({
                            type: 'POST',
                            dataType: 'json',
                            contentType: 'application/json',
                            url: API_URL + '/api/self/library/import_bookmarks/',
                            data: JSON.stringify({
                              "bookmark_notification_id": n.id
                            })
                        }).done(() => {
                          this.onDismiss(n);
                        });
                      }}>Add {n.peer.folderName}</button>
                  </div>
                </div>
              }
              <br /><br />
              <button className="btn btn-danger right" aria-label={`Remove notification from ${(n.listing) ? n.listing.title : 'AppsMall'}`} onClick={() => {
                  this.onDismiss(
                    this.state.notificationList[this.state.activeNotification]
                  );
                }}>
                Remove Notification
              </button>
            </div>
          </div>
        </div>
      );
    },

    onDismiss(notification) {
      SelfActions.dismissNotification(notification);
    },

    render: function () {
        return (
        <div className="notifications-info">
          <div className="row">
            <div className="modal-body">
              <div className="row">
                <div className="col-xs-4">
                  <ul className="nav nav-pills nav-inverse nav-stacked">
                    {this.makeSidebar()}
                  </ul>
                </div>
                <div className="col-xs-8">
                  { this.state.notificationList.length > 0 &&
                    <div>
                      {
                        this.makeNotification(
                          this.state.notificationList[this.state.activeNotification]
                        )
                      }
                    </div>
                  }

                  { !this.state.notificationList.length &&
                    <span>No notifications</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
        );
    }
});


var ContactsWindow = React.createClass({
    mixins: [Navigation],

    propTypes: {
        //the route that should be set when the window is closed.
        //Can also be a function that changes the route
        //(this allows "goBack" to be used instead of an explicit route)
        backRoute: React.PropTypes.oneOfType([
            React.PropTypes.string.isRequired,
            React.PropTypes.func.isRequired
        ])
    },

    render: function() {
        return (
            <Modal modalTitle="Notificationss" ref="modal"
                    className="contacts-window" size="large"
                    onCancel={this.close}>
                <NotificationsModalInfo/>
            </Modal>
        );
    },

    close: function() {
        var backRoute = this.props.backRoute;

        if (typeof backRoute === 'function') {
            backRoute();
        }
        else {
            this.transitionTo(this.props.backRoute);
        }
    }
});

module.exports = ContactsWindow;
