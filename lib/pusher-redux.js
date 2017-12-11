'use strict';

var CONNECTED = 'PUSHER-REDUX/CONNECTED';
var DISCONNECTED = 'PUSHER-REDUX/DISCONNECTED';

// var Pusher = require('pusher-js');
// var PusherNative = require('pusher-js/react-native');
// on the one hand having global state is ugly, on the other it is easier to use it from anywhere
var config = {
  socket: null,
  store: null,
  apiKey: null,
  options: {},
  subscriptions: {},
  PusherClient: null
};

module.exports.setPusherClient = function (PusherClient) {
  config.PusherClient = PusherClient;
};

// create redux action
var pusherAction = function (options) {
  var result = {
    type: options.actionType
  };
  if (options.channelName) {
    result.channel = options.channelName
  }
  if (options.eventName) {
    result.event = options.eventName
  }
  if (options.data) {
    result.data = options.data
  }
  if (options.additionalParams) {
    result.additionalParams = options.additionalParams
  }
  return result;
};

// we need to wait before pusher connects until we can subscribe
// so gonna queue actions here
var pendingFunctions = [];
var isConnected = false;

var addToQueue = function (func) {
  pendingFunctions.push(func);
  runPending();
};

var successfullyConnected = function (data) {
  isConnected = true;
  config.store.dispatch(pusherAction({ actionType: CONNECTED, data: data }));
  runPending();
};

var disconnected = function () {
  isConnected = true;
  config.store.dispatch(pusherAction({ actionType: DISCONNECTED }));
};

var runPending = function () {
  // that's like a promise, but I don't want to depend on promises
  while (isConnected && pendingFunctions.length > 0) {
    pendingFunctions.shift()();
  }
};

module.exports.configurePusher = function (store, apiKey) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  config.socket = new config.PusherClient(apiKey, options);
  config.store = store;
  config.apiKey = apiKey;
  config.socket.connection.bind('connected', successfullyConnected);
  config.socket.connection.bind('disconnected', disconnected);
};

module.exports.delayConfiguration = function (store, apiKey) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  config.store = store;
  config.apiKey = apiKey;
  Object.assign(config.options, options);
};

module.exports.startConfiguration = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  config.socket = new config.PusherClient(config.apiKey, Object.assign({}, config.options, options));
  config.socket.connection.bind('connected', successfullyConnected);
  config.socket.connection.bind('disconnected', disconnected);
};

module.exports.subscribe = function (channelName, eventName, actionType, additionalParams) {
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
        config.store.dispatch(pusherAction({ actionType: actionType, channelName: channelName, eventName: eventName, data: data, additionalParams }));
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

module.exports.CONNECTED = CONNECTED;
module.exports.DISCONNECTED = DISCONNECTED;
