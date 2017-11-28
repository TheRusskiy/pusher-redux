'use strict';

if (typeof document === 'undefined' && typeof navigator != 'undefined' && navigator.product == 'ReactNative') {
    // In react-native
    var Pusher = require('pusher-js/react-native');
}
else {
    var Pusher = require('pusher-js');
}

var pusherRedux = require('./lib/pusher-redux');
pusherRedux.setPusherClient(Pusher);
module.exports = pusherRedux;
var pusherRedux = require('./lib/pusher-redux');
pusherRedux.setPusherClient(Pusher);
module.exports = pusherRedux;
