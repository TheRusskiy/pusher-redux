'use strict';

var Pusher = require('pusher-js/react-native');
var pusherRedux = require('../pusher-redux');
pusherRedux.setPusherClient(Pusher);
module.exports = pusherRedux;