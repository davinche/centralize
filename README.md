<h1 align="center">Centralize</h1>
<p align="center">
  A simple JS message hub
</p>
<p align="center">
  <img src="https://api.travis-ci.org/davinche/centralize.svg?branch=master" alt="build status"/>
</p>

<!-- vim-markdown-toc GFM -->

* [Installation](#installation)
* [Messages](#messages)
* [Creating Messages](#creating-messages)
* [Sending Messages](#sending-messages)
  * [Using the logger](#using-the-logger)
  * [Manually](#manually)
* [Receiving Messages](#receiving-messages)
  * [Filter received messages by labels](#filter-received-messages-by-labels)
  * [Filtering received messages by match conditions](#filtering-received-messages-by-match-conditions)
* [Interceptors](#interceptors)
  * [Adding an interceptor](#adding-an-interceptor)
  * [Removing an interceptor](#removing-an-interceptor)
* [Log Levels](#log-levels)

<!-- vim-markdown-toc -->

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
To send a message, you can use the library provided logger or manually create and
send a message.


## Creating Messages

You can use the utility function `CreateMessage` to create an empty message.

```javascript
import {CreateMessage} from 'centralize-js';
const myAnalyticsMessage = CreateMessage(10, {type: 'analytics'});
myAnalyticsMessage.value = 'val';
```

## Sending Messages

### Using the logger

```javascript
import Logger from 'centralize-js';

Logger.info('this is an info log');
Logger.debug('this is a debug log');
```

**Note**: The logger contains the `info()`, `debug()`, `warn()`... methods because it is created using the `DEFAULT_LOG_LEVELS`.


You can use your own custom methods by creating a new logger with your own log levels:

```javascript
import {Hub, LoggerClass} from 'centralize-js';
const myLogger = new LoggerClass(Hub, {foo: 10, bar: 20});
// myLogger.foo('my message');
// myLogger.bar('my other message');
```

Or you can change the log levels using the `setLogLevels()` method.

```javascript
import Logger from 'centralize-js';
Logger.setLogLevels({foo: 10, bar: 20});

// Logger.foo('my message');
// Logger.bar('my other message');
```

### Manually

```javascript
import { Hub } from 'centralize-js';

// Create the message manually
const message = {
  logLevel: 1000000,
  labels: {},
  timestamp: new Date(),
  value: 'This is a very important message due to the high logLevel'
}

// alternatively use the CreateMessage function
// const message = CreateMessage(1000000);
// message.value = 'This is a very important message due to the high logLevel';

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

Any configuration applied to the global stream will apply to all messages.
There may be scenarios where you want to set log levels for certain messages
and not at the global level.


To do this, you can use the `matchAll()` function to create a new substream that
receives all of the messages from the global stream. You can then apply the log
levels to the substream instead of the global stream.

```javascript
const stream = Hub.messages.matchAll()
  .setLogLevel(LOG_LEVELS.error).addReceiver(myreceiver);
```

### Filter received messages by labels

You can filter for specific messages by applying labels a message must match:

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


## Interceptors

Interceptors gives you the opportunity to change a message before it is passed
down the stream.

An interceptor must either return a message, or `null` to stop the message from
propogating further.

### Adding an interceptor

```javascript
const myInterceptor = (message) => {
  message.value = 'bar';
  return message;
};

const myReceiver = (message) => {
  console.log(message.value);
};

Hub.messages.addInterceptor(myInterceptor);
Hub.messages.addReceiver(myReceiver);


Hub.messages.send({
  value: 'foo';
});

// console.log outputs 'bar'
```

### Removing an interceptor

```javascript
const myInterceptor = (message) => {
// interceptor code
};

Hub.messages.removeInterceptor(myInterceptor);
```

## Log Levels

To set global log level for messages:

```javascript
import { Hub, LOG_LEVELS } from 'centralize-js';
Hub.messages.setLogLevel(LOG_LEVELS.error);

// only messages that are 'errors' and higher will be dispatched.
```

You can also set a loglevels for filtered messages:

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
