'use strict';

var pushEvent = function(event) {
    if (window._paq) {
        window._paq.push(event);
    }
};

module.exports = {
    trackEvent: function (label, data, agency) {
        pushEvent(['trackEvent', label, data, agency]);
    },

    trackCategorization: function (label, category, total) {
        pushEvent(['trackEvent', label, category, total]);
    },

    trackSiteSearch: function (label, query, total) {
        query = query.toLowerCase();
        pushEvent(['trackSiteSearch', query, label, total]);
    },

    trackListingCreation: function(listingName, agency){
        pushEvent(['trackEvent', 'Listing Creation', listingName, agency]);
    },

    trackListingOrgApproval: function(listingName, agency){
        pushEvent(['trackEvent', 'Listing Org Approval', listingName, agency]);
    },
    trackListingApproval: function(listingName, agency){
        pushEvent(['trackEvent', 'Listing Approval', listingName, agency]);
    },

    trackListingReview: function(listingName, agency){
        pushEvent(['trackEvent', 'Listing Review', listingName, agency]);
    },

    trackListingReviewView: function(listingName, agency){
        pushEvent(['trackEvent', 'Listing Review View', listingName, agency]);
    },

    trackRecommender: function(type, application){
        window._paq.push(['trackEvent', type, application]);
    }
};
