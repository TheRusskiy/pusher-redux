# pusher-redux

Integration of Pusher into Redux

## Installation

You can download this by executing

`npm install --save pusher-redux`

## Usage

#### Configure Pusher
```javascript
import { configurePusher } from 'pusher-redux';
...
const options = { // options are... optional
  authEndpoint: '/authenticate/me'
}
const store = configureStore(initialState);
configurePusher(store, API_KEY, options);
```

#### Use it in your component
```javascript
import { subscribe, unsubscribe } from 'pusher-redux';
import { NEW_ORDER } from '../pusher/constants';
...
export class MyPage extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.subscribe = this.subscribe.bind(this);
    this.unsubscribe = this.unsubscribe.bind(this);
  }

  componentWillMount() {
    this.subscribe();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  // upon receiving event 'some_event' for channel 'some_channel' pusher-redux is going to dispatch action NEW_ORDER
  // add additional params which will be merged into pusherAction and dispatched along with it
  // you can bind multiple actions for the same event and it's gonna dispatch all of them
  subscribe() {
    // your additionalParams
    const additionalParams = () => {}

    subscribe('some_channel', 'some_event', NEW_ORDER, additionalParams);

    // access it within the data object = {
    //  type: String,
    //  channel: String,
    //  event: String,
    //  data: Object,
    //  additionalParams: Any
    // }
  }

  unsubscribe() {
    unsubscribe('some_channel', 'some_event', NEW_ORDER);
  }
  ...
}
```

#### Change state in your reducer
```javascript
import { NEW_ORDER } from '../pusher/constants';
...
function orderReducer(state = initialState.orders, action) {
  ...
  case NEW_ORDER:
    return [...state, action.data.order];
  ...
}
```

#### Format of actions
Pusher-redux dispatches actions of the following format:
```javascript
    return {
        type: actionType,
        channel: channelName,
        event: eventName,
        data: data
    };
```

#### Get subscribed channels
```javascript
import { getChannel } from 'pusher-redux';
...
function emitClientEvent(eventName, eventData) {
  // gets the channel from the client
  var myChannel = getChannel('some-channel-name');

  // triggers a client event
  myChannel.trigger(eventName, eventData);
}
```

## Delayed Configuration
Sometimes you want to authenticate user for receiving pusher information, but you don't have user credentials yet.
In this case you can do the following:

```javascript
import { delayConfiguration } from 'pusher-redux';
...
const options = { // options are... optional
  authEndpoint: '/authenticate/me'
}
const store = configureStore(initialState);
delayConfiguration(store, API_KEY, options);
```

And once user information is available
```javascript
import { startConfiguration } from 'pusher-redux';
...
startConfiguration({ // pass options
  auth: {
    params: {
      auth_token: user.authToken
    }
  }
});
```

## Monitor Connection Status
Upon connection status pusher-redux emits actions. You can listed to them.

```javascript
import { CONNECTED, DISCONNECTED } from 'pusher-redux';
...
function connectionStateReducer(state = initialState, action) {
  ...
  case CONNECTED:
    return {...state, connected: true};
  case DISCONNECTED:
    return {...state, connected: false};
  ...
}
```

## React Native
If you want to use react-native then replace ALL imports of `pusher-redux` with `pusher-redux/react-native`
e.g.
```javascript
import { startConfiguration } from 'pusher-redux/react-native';
```

### Options

Pusher-redux accepts all the same options that [pusher-js](https://github.com/pusher/pusher-js#configuration) does

### Old Webpack

If your webpack version does not support [resolve.mainFields](https://webpack.js.org/configuration/resolve/#resolve-mainfields) and for some reason you can't specify `target: 'browser'` instead of using `import { configurePusher } from 'pusher-redux';` you can use `import { configurePusher } from 'pusher-redux/legacy-webpack';`
Beware that in this case if you compile your code for Node.JS environment it is going to fail.

### CHANGELOG

#### 0.3.2
 * Added legacy webpack support

#### 0.3.0
 * Migrated to pusher-js 4.X.X
 * Added CONNECTED and DISCONNECTED actions to monitor connected state

## Contributing
You are welcome to import more features from [pusher-js](https://github.com/pusher/pusher-js)

## License
This code is released under the [MIT License](http://www.opensource.org/licenses/MIT).
