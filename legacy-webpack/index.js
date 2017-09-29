'use strict';

var Pusher = require('pusher-js/dist/web/pusher.js');
var pusherRedux = require('../lib/pusher-redux');
pusherRedux.setPusherClient(Pusher);
module.exports = pusherRedux;