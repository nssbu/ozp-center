'use strict';

if (!Object.assign) {
    Object.assign = require('object-assign');
}

require('./services');
require('console-polyfill');

var React = require('react');
var jQuery = require('jquery');
var Router = require('react-router');
require('bootstrap');
require('classification');
require('ism-u.config');
var _ = require('./utils/_');
var SelfStore = require('ozp-react-commons/stores/SelfStore');
var ProfileActions = require('ozp-react-commons/actions/ProfileActions');
var LoadError = require('ozp-react-commons/components/LoadError.jsx');
var {
  API_URL,
  APP_TITLE,
  IE_REDIRECT_URL,
  SYSTEM_HIGH_CLASSIFICATION
} = require('ozp-react-commons/OzoneConfig');
var redirectingToLogin = false;


window.jQuery = jQuery;
window.$ = jQuery;
window.React = React;

require('script!underscore');
require('script!ism');
require('script!bootstrap-classify');

window.moment = require('moment');
window.Tether = require('tether');

var getCookie = function(cookieName) {
    var cookieValue = null;

    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');

        $.each(cookies, function(index, cookie) {
            cookie = $.trim(cookie);

            // Does this cookie string begin with the cookieName we want?
            if (cookie.substring(0, cookieName.length + 1) === (cookieName + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(cookieName.length + 1));

                // Returning false breaks out of $.each
                return false;
            }
        });
    }

    return cookieValue;
};

// Enable withCredentials for all requests
$.ajaxPrefilter(function (options, originalOptions, jqXHR) {
    options.xhrFields = {
        withCredentials: true
    };

    var requestType = options['type'].toLowerCase();
    if (requestType === 'post' || requestType === 'delete') {
        jqXHR.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
    }
});

$(document).ajaxError(function (event, jqxhr, settings, thrownError ) {
    if (settings.url.indexOf('/api/') >= 0 && thrownError === 'FORBIDDEN') {
        window.location = API_URL + '/accounts/login/';
        redirectingToLogin = true;
    }
});

var Routes = require('./components/Routes.jsx'),
    routes = Routes();


/*
 * Render everything when we get our profile
 */
SelfStore.listen(_.once(function(profileData) {

    // Classification needs to run after the profileData is loaded
    $(function() {
        $(document).classification({
            level: SYSTEM_HIGH_CLASSIFICATION,
            colorBanners: true
        });
    });

    Router.run(routes, function (Handler) {
        if (!redirectingToLogin) {
            var main = document.getElementById('main'),
                component;

            if (profileData.currentUser) {
                component = <Handler />;
            }
            else if (profileData.currentUserError) {
                component = <LoadError error={profileData.currentUserError} />;
            }

            React.render(component, main);
        }
    });
}));

ProfileActions.fetchSelf();

require('tour');
require('./tour/tour.js');

//Configurable title
document.title = APP_TITLE;

//Disable bootstrap animations on Firefox
if(navigator.userAgent.toLowerCase().indexOf('firefox') > -1){
  $.support.transition = false;
}

function detectIE() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    // other browser
    return false;
}

if (detectIE() && detectIE() < 10) {
alert(`
This site is tested against the following browsers:
IE 11 +
FireFox 24+
Chrome 36+
We have detected that you are using an unsupported browser and some features may not function correctly
`);
window.open(IE_REDIRECT_URL);
}

if (!String.includes) {
  String.prototype.includes = function(value) {
    return this.valueOf().indexOf(value) > - 1;
  };
}
