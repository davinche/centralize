<h1 align="center">Centralize</h1>
<p align="center">
  A simple JS message hub
</p>
<p align="center">
  <img src="https://api.travis-ci.org/davinche/centralize.svg?branch=master" alt="build status"/>
</p>

## Installation

`npm install centralize-js --save`

## Messages

Messages have the following form:

```javascript
const message = {
  logLevel: 10,
  labels: {
    app: 'my-app',
    category: 'analytics',
    metric: 'load-time'
  },
  timestamp: new Date(),
  value: 10000 // in milliseconds
}
```

A message sent by the hub will be dispatched to all **receivers**.
To send a message, can use the library provided logger or manually create and
send a message.

## Sending Messages

### Using the logger

```javascript
import { Logger } from 'centralize-js';

Logger.info('this is an info log');
Logger.debug('this is a debug log');
```

### Manually

```javascript
import { Hub } from 'centralize-js';

const message = {
  logLevel: 1000000,
  labels: {},
  timestamp: new Date(),
  value: 'This is a very important message due to the high logLevel'
}

Hub.send(message);
```

## Receiving Messages

A receiver is any function that can receive a message.

To receive **all messages**, you can attach to the global stream:

```javascript
import { Hub, Logger } from 'centralize-js';

const myReceiver = function(message) {
  console.log(message.value);
};

Hub.messages.addReceiver(myReceiver);
Logger.info('this is an info log');
// console.log outputs 'this is an info log'
```

Any configuration to the global stream will apply to all messages. There are
certain scenarios where you would want to leave the global stream intact, but
add customizations while still receiving all messages (ie: set log levels but
not applied globally).

To do so, you can use the `matchAll()` function to create a new substream that
receives all of the messages from the global stream.
```
const stream = Hub.messages.matchAll().addReceiver(myreceiver);
```

### Filter received messages by labels

You can filter received messages for matching labels by doing the following:

```javascript
import { Hub, Logger } from 'centralize-js';

const myAppMessagesReceiver = function(message) {
  console.log(message.value);
};

Hub.messages.matchLabels({app: 'my-app'}).addReceiver(myAppMessagesReceiver);

Logger.debug('my-app debug message', {app: 'my-app'});
Logger.debug('my-other-app message', {app: 'not-my-app'});

// console.log only prints 'my-app debug message'
```

### Filtering received messages by match conditions

```javascript
import { Hub, Logger } from 'centralize-js';

// Scenario: 3 environments (development, staging, production)
// receiver should only be triggered for staging and production
const stagingAndProductionReceiver = function(message) {
  console.log(message.value);
};

Hub.messages
  .matchConditions('env', 'IN', ['staging', 'production'])
  .addReceiver(stagingAndProductionReceiver);
...

Logger.debug('my log in development', {env: 'development'});
Logger.debug('staging log', {env: 'staging'});
Logger.debug('production log', {env: 'production'});

// console.log only prints out 'staging log' and 'production log'
```
`matchConditions` accepts the following **operators**:
1. 'IN'
2. 'NOT_IN'
3. 'NOT'

## Log Levels

To set global log level for messages:

```javascript
import { Hub, LOG_LEVELS } from 'centralize-js';
Hub.messages.setLogLevel(LOG_LEVELS.error);

// only messages that are 'errors' and higher will be dispatched.
```

You can also set a loglevels for individually **matched** messages:

```javascript
import { Hub, LOG_LEVELS } from 'centralize-js';

const myAppReceiver = function(message) {
  console.log(message.value);
};

const messages = Hub.messages.matchLabels({app: 'my-app'});
messages.setLogLevel(LOG_LEVELS.error);
messages.addReceiver(myAppReceiver);
```

**Note**: that the global log level precedes everything, so setting a 'lower' log level for
matched messages will have no effect if the global log level is 'higher'.
