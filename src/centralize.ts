import { ISender, IMessage } from './lib/interfaces';
import LoggerClass, { DEFAULT_LOG_LEVELS, createMessage } from './lib/logger';
import { Stream } from './lib/stream';

class MessageHub implements ISender{
  private _stream: Stream;
  constructor() {
    this._stream = new Stream();
  }

  get messages() {
    return this._stream;
  }

  send(msg: IMessage) {
    if (msg.timestamp === undefined) {
      msg.timestamp = new Date();
    }
    this._stream.send(msg);
  }
}

export const Hub = new MessageHub();
export { LoggerClass };
export { DEFAULT_LOG_LEVELS as LOG_LEVELS };
const defaultLogger = new LoggerClass(Hub, DEFAULT_LOG_LEVELS);
export {defaultLogger as Logger};
export {createMessage as CreateMessage};
export default defaultLogger;
