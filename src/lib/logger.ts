import {ILogLevels, ISender, IMessage} from './interfaces';

// helper for creating messages
/* istanbul ignore next */

/**
 * CreateMessage
 * @param {number} logLevel
 * @param {object} labels
 * @returns {message}
 */
export function createMessage(logLevel=DEFAULT_LOG_LEVELS.log, labels={}) : IMessage {
  return {
    logLevel,
    labels,
    value: '',
    timestamp: new Date()
  };
}

// standard log levels (corresponds to functions on console)
export const DEFAULT_LOG_LEVELS: ILogLevels = {
  debug: 10,
  log: 10,
  info: 30,
  warn: 40,
  error: 50,
};

// Logger Class
export default class Logger {
  /**
   * constructor
   * @param {object} sender - object contains send(msg: IMessage)
   * @param {object} logLevels - object containing (levelName:number)
   * @param {object} labels - default labels for the logger
   */
  constructor(
    private _sender: ISender,
    private _logLevels: ILogLevels=DEFAULT_LOG_LEVELS,
    private _labels = {}) {
    this.setLogLevels(_logLevels);
  }

  /**
   * setLogLevels - creates log functions on the logger that send messages
   *     with the speecified priority.
   * @param {object} logLevels
   */
  setLogLevels(logLevels: ILogLevels) {
    // remove old log levels
    Object.keys(this._logLevels).forEach((k) => { delete(this[k]); });
    Object.keys(logLevels).forEach((k) => {
      this[k] = (val: any, labels={}) => {
        const logLevel = logLevels[k];
        const appliedLabels = Object.assign({}, this._labels, labels);
        const message = createMessage(logLevel, appliedLabels);
        message.value = val;
        this._sender.send(message);
      }
    });
    this._logLevels = logLevels;
  }

  /**
   * getLogLevels - get the log levels used to create the logging functions
   * @returns {object}
   */
  getLogLevels() {
    return this._logLevels;
  }

  /**
   * setLabels - set the default labels for the logger
   * @param {Object} labels
   */
  setLabels(labels={}) {
    this._labels = labels;
  }

  /**
   * getLabels - the default labels for the logger
   * @returns {Object} labels
   */
  getLabels() {
    return this._labels;
  }

  /**
   * Create a new logging function
   * @param {number} logLevel - the log level this function will log at
   * @param {object} labels - the labels to automatically add to the logged message
   * @returns {function} logFn - the logging function
   */
  createLogFunction(logLevel: number, labels={}) {
    return (val: any) => {
      const message = createMessage(logLevel, labels);
      message.value = val;
      this._sender.send(message);
    };
  }
}
