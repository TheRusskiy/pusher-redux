'use strict';

var Pusher = require('pusher-js');
// on the one hand having global state is ugly, on the other it is easier to use it from anywhere
var config = {
    socket: null,
    store: null,
    apiKey: null,
    options: {},
    subscriptions: {}
};

// create redux action
var pusherAction = function pusherAction(_ref) {
    var actionType = _ref.actionType;
    var channelName = _ref.channelName;
    var eventName = _ref.eventName;
    var data = _ref.data;

    return {
        type: actionType,
        channel: channelName,
        event: eventName,
        data: data
    };
};

// we need to wait before pusher connects until we can subscribe
// so gonna queue actions here
var pendingFunctions = [];
var isConnected = false;

var addToQueue = function addToQueue(func) {
    pendingFunctions.push(func);
    runPending();
};

var successfullyConnected = function successfullyConnected() {
    isConnected = true;
    runPending();
};

var runPending = function runPending() {
    // that's like a promise, but I don't want to depend on promises
    while (isConnected && pendingFunctions.length > 0) {
        pendingFunctions.shift()();
    }
};

module.exports.configurePusher = function (store, apiKey) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    config.socket = new Pusher(apiKey, options);
    config.store = store;
    config.apiKey = apiKey;
    config.socket.connection.bind('connected', successfullyConnected);
};

module.exports.delayConfiguration = function (store, apiKey) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    config.store = store;
    config.apiKey = apiKey;
    Object.assign(config.options, options);
};

module.exports.startConfiguration = function () {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    config.socket = new Pusher(config.apiKey, Object.assign({}, config.options, options));
    config.socket.connection.bind('connected', successfullyConnected);
};

module.exports.subscribe = function (channelName, eventName, actionType) {
    addToQueue(function () {
        var channel = config.socket.channel(channelName) || config.socket.subscribe(channelName);
        if (!config.subscriptions[channelName]) {
            config.subscriptions[channelName] = {};
        }
        var channelSubs = config.subscriptions[channelName];
        if (!channelSubs[eventName]) {
            channelSubs[eventName] = {};
        }
        var eventSubs = channelSubs[eventName];
        if (!eventSubs[actionType]) {
            eventSubs[actionType] = function (data) {
                config.store.dispatch(pusherAction({ actionType: actionType, channelName: channelName, eventName: eventName, data: data }));
            };
            channel.bind(eventName, eventSubs[actionType]);
        }
    });
};

module.exports.unsubscribe = function (channelName, eventName, actionType) {
    addToQueue(function () {
        var channel = config.socket.channel(channelName);
        if (!channel) {
            console.log('Not subscribed to \'' + channelName + '\'');
            return;
        }
        var channelSubs = config.subscriptions[channelName];
        if (!channelSubs[eventName]) {
            console.log('Not subscribed event \'' + eventName + '\' from \'' + channelName + '\'');
            return;
        }
        var eventSubs = channelSubs[eventName];
        if (!eventSubs[actionType]) {
            console.log('Handler ' + actionType + ' not registered for event \'' + eventName + '\' from \'' + channelName + '\'');
            return;
        }
        channel.unbind(eventName, eventSubs[actionType]);
        delete eventSubs[actionType];
    });
};
