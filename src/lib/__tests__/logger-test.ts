import Logger from '../logger';
import {IMessage} from '../interfaces';
declare var global: any;

const origDate = Date;
const staticDate = new Date();

describe('Logger', () => {
  beforeAll(() => {
    global.Date = class {
      constructor() {
        return staticDate;
      }
    }
  });

  afterAll(() => global.Date = origDate);
  describe('constructor' , () => {
    it ('creates a logger with my custom defined log levels', () => {
      const levels = {
        foo: 1,
        bar: 2
      };
      const mockfn = jest.fn();
      const msgReceiver = function(msg: IMessage) {
        mockfn(msg);
      };

      const sender = {
        send: msgReceiver
      };
      const l = new Logger(sender, levels);
      // custom log functions are defined
      expect(l.foo).toBeDefined();
      expect(l.bar).toBeDefined();
      expect(mockfn).not.toHaveBeenCalled();

      // call custom log functions
      l.foo('foo');
      expect(mockfn).toHaveBeenCalledWith({
        labels: {},
        logLevel: levels.foo,
        value: 'foo',
        timestamp: staticDate
      });

      mockfn.mockClear();
      l.bar('bar');
      expect(mockfn).toHaveBeenCalledWith({
        labels: {},
        logLevel: levels.bar,
        value: 'bar',
        timestamp: staticDate
      });
    });
  });

  describe('createLogFunction', () => {
    it ('creates a logging function that logs at a particular log level with specific labels', () => {
      const levels = { foo: 1, };
      const mockfn = jest.fn();
      const msgReceiver = function(msg: IMessage) {
        mockfn(msg);
      };
      const sender = {
        send: msgReceiver
      };
      const l = new Logger(sender, levels);
      const myLabels = { app: 'myApp', tag: 'awesome' };
      const myLoggingFn = l.createLogFunction(100, myLabels);
      expect(mockfn).not.toHaveBeenCalled();
      myLoggingFn('wow');
      expect(mockfn).toHaveBeenCalledWith({
        labels: myLabels,
        logLevel: 100,
        value: 'wow',
        timestamp: staticDate
      });
    });
  });
});
