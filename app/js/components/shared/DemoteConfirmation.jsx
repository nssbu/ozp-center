'use strict';

var React = require('react');
var Reflux = require('reflux');
var Modal = require('ozp-react-commons/components/Modal.jsx');
var Router = require('react-router');
var Navigation = Router.Navigation;
var AjaxMixin = require('../../mixins/AjaxMixin');
var ActiveStateMixin = require('../../mixins/ActiveStateMixin');

var GlobalListingStore = require('../../stores/GlobalListingStore');
var ListingActions = require('../../actions/ListingActions');

var _ = require('../../utils/_');

var DemoteConfirmation = React.createClass({
    propTypes: {
        errorMessage: React.PropTypes.string,
        onHidden: React.PropTypes.func,
        onDemote: React.PropTypes.func.isRequired
    },

    getDefaultProps: function () {
      console.log("afgsdf");
        return {
            onHidden: _.noop
        };
    },

    getInitialState: function () {
      console.log("asdf");
        return {};
    },

    render: function () {
        console.log('HEREEEE');
        var kind = this.props.kind,
            title = this.props.title,
            onDemote = this.props.onDemote,
            errorMessage = this.props.errorMessage;
            console.log("HERE");
        return (
            <Modal ref="modal" className="DemoteConfirmation" size="small" onHidden={this.props.onHidden}>
                <button className="close corner" data-dismiss="modal"><i className="icon-cross-16"></i></button>
                {
                    errorMessage && <div className="alert alert-danger">{errorMessage}</div>
                }
                <strong>
                    Are you sure that you would like to demote the {kind} &quot;{title}&quot;?
                </strong>
                <button className="btn btn-default" data-dismiss="modal">Cancel</button>
                <button className="btn btn-danger" onClick={onDemote}>Demote</button>
            </Modal>
        );
    },

    close: function () {
        this.refs.modal.close();
    }
});

module.exports = DemoteConfirmation;
