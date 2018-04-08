import { ISender, IMessage } from './lib/interfaces';
import LoggerClass, { DEFAULT_LOG_LEVELS } from './lib/logger';
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
export const Logger = new LoggerClass(Hub, DEFAULT_LOG_LEVELS);
export { DEFAULT_LOG_LEVELS as LOG_LEVELS };
