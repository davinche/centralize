import {
  ILabel,
  IMessage,
  ISender,
  IReceiver,
} from './interfaces';

export class Stream {
  _receivers: Array<IReceiver> = [];
  _interceptors: Array<IReceiver> = [];
  _parentStream: Stream|null;
  _logLevel: number | undefined;

  constructor(parentStream: Stream|null = null) {
    this._parentStream = parentStream;
  }

  /**
   * MatchAll - creates a new stream that passes all messages
   * @returns {object} stream
   */
  matchAll() : Stream {
    return new MatchAllStream(this);
  }

  /**
   * MatchLabels - creates a new stream that filters for specified labels
   * @param {object} labels
   * @returns {object} stream
   */
  matchLabels(labels: ILabel) : Stream {
    return new MatchLabelsStream(this, labels);
  }

  /**
   * MatchCondition - creates a new stream that filters messages for the matching condition
   * @param {string} key - the name of the label
   * @param {string} operator - the conditional operator (IN | NOT_IN | NOT)
   * @param {any} value - the value to check against
   * @returns {object} stream
   */
  matchCondition(key: string, operator: string, value: any) : Stream {
    return new MatchConditionStream(this, {key, operator, value});
  }

  /**
   * SetLogLevel
   * @param {number} loglevel
   */
  setLogLevel(logLevel: number) {
    this._logLevel = logLevel;
    return this;
  }

  /**
   * AddReceiver - add a new consumer of the stream
   * @param {object} consumer
   */
  addReceiver(c: IReceiver) {
    this._receivers.push(c);
    return () => {
      this.removeReceiver(c);
    };
  }

  /**
   * RemoveReceiver - remove a consumer from the stream
   * @param {object} consumer
   */
  removeReceiver(c: IReceiver) {
    this._receivers = this._receivers.filter((consumer) => consumer !== c);
  }

  /**
   * AddInterceptor - add an interceptor for the stream
   * @param {object} inteceptor
   */
  addInterceptor(c: IReceiver) {
    this._interceptors.push(c);
    return (() => {
      this.removeInterceptor(c);
    });
  }

  /**
   * RemoveInterceptor - remove an interceptor from the stream
   * @param {object} consumer
   */
  removeInterceptor(c: IReceiver) {
    this._interceptors = this._interceptors.filter((consumer) => consumer !== c);
  }

  /**
   * Send - sends a message to all consumers
   * @param {object} Message
   */
  send(msg: IMessage) {
    if (typeof this._logLevel !== 'undefined' && msg.logLevel < (this._logLevel as number)) {
      return;
    }

    let m : IMessage | null = msg;
    if (this._interceptors.length) {
      m = this._interceptors.reduce((m, interceptor) : any => {
        return interceptor(m);
      }, m);
    }

    if (!m) {
      return;
    }

    this._receivers.forEach((consumer) => {
      consumer((m as IMessage));
    });
  }
}

// Abstract class for dealing with Message Filtering Streams
abstract class StreamFilter extends Stream {
  abstract rule(m: IMessage);
}

// Stream that matches all labels
class MatchAllStream extends StreamFilter {
  constructor(parentStream: Stream) {
    super(parentStream);
    this.rule = this.rule.bind(this);
    parentStream.addReceiver(this.rule);
  }

  rule(m: IMessage) {
    this.send(m);
  }
}

// Stream that ensures all labels from a message matches the labels for the stream
class MatchLabelsStream extends StreamFilter {
  /**
   * constructor
   * @param {object} parentStream
   * @param {object} labels - the labels to match messages with
   */
  constructor(parentStream: Stream, private _labels: ILabel={}) {
    super(parentStream);
    if (!Object.keys(this._labels).length) {
      throw new Error('No Labels were provided to the MatchLabelsStream');
    }
    this.rule = this.rule.bind(this);
    parentStream.addReceiver(this.rule);
  }

  /**
   * Rule - the label matching implementation
   * @param {object} message - the message with the labels to check against
   */
  rule(m: IMessage) {
      // Make sure the message matches all of our desired labels
      if (Object.keys(this._labels).every((k) => this._labels[k] === m.labels[k])) {
        this.send(m);
      }
  }

  removeReceiver(c: IReceiver) {
    super.removeReceiver(c);

    /* istanbul ignore next */
    if (!this._receivers.length && this._parentStream) {
      this._parentStream.removeReceiver(this.rule);
    }
  }
}

interface IMatchCondition {
  key: string;
  operator: string;
  value: any;
}

class MatchConditionStream extends StreamFilter {
  // used in matchCondition
  static operators = ['IN', 'NOT_IN', 'NOT'];
  /**
   * constructor
   * @param {object} parentStream
   * @param {object} condition - the condition to match against
   */
  constructor(parentStream: Stream, private _matchCondition: IMatchCondition) {
    super(parentStream);
    if (MatchConditionStream.operators.indexOf(this._matchCondition.operator.toUpperCase()) < 0) {
      throw new Error('Invalid operator for MatchConditionStream');
    }
    this.rule = this.rule.bind(this);
    this._matchCondition.operator = this._matchCondition.operator.toUpperCase();
    parentStream.addReceiver(this.rule);
  }

  rule(m: IMessage) {
    // make sure we're just dealing with an array for simplicity
    if (!(this._matchCondition.value instanceof Array)) {
      this._matchCondition.value = [this._matchCondition.value];
    }

    let shouldSend = false;
    const val = (this._matchCondition.value as Array<any>);

    switch(this._matchCondition.operator) {
      case 'IN':
        shouldSend = val.indexOf(m.labels[this._matchCondition.key]) >= 0;
        break;
      case 'NOT_IN':
        shouldSend = val.indexOf(m.labels[this._matchCondition.key]) < 0;
        break;
      case 'NOT':
        shouldSend = m.labels[this._matchCondition.key] !== val[0];
        break;
    }

    if (shouldSend) {
      this.send(m);
    }
  }
}

