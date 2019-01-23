import Logger from '../logger';
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
      const sender = {
        send: mockfn
      };
      const l = new Logger(sender, levels) as any;
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
      const sender = {
        send: mockfn
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

  describe('setLogLevel', () => {
    it ('creates log functions on the logger that sends messages at the specified priorities', () => {
      const levels = { foo: 1, bar: 2};
      const mockfn = jest.fn();
      const sender = {
        send: mockfn
      };
      const l = new Logger(sender) as any;
      expect(l.foo).toBeUndefined();
      expect(l.bar).toBeUndefined();
      l.setLogLevels(levels);
      expect(l.foo).toBeDefined();
      expect(l.bar).toBeDefined();
      l.foo();
      l.bar();
      expect(mockfn).toHaveBeenCalled();
      expect(mockfn.mock.calls.length).toBe(2);
      expect(mockfn.mock.calls[0][0].logLevel).toBe(1);
      expect(mockfn.mock.calls[1][0].logLevel).toBe(2);
    });
  });

  describe('getLogLevels', () => {
    it ('returns the log levels for the logger', () => {
      const levels = { foo: 1, bar: 2};
      const sender = { send: function() {} };
      const l = new Logger(sender, levels);
      expect(l.getLogLevels()).toEqual(levels);
    });
  });

  describe('setLabels', () => {
    it ('applies the defined labels to all sent messages', () => {
      const levels = { foo: 1};
      const sender = { send: jest.fn()};
      const l = new Logger(sender, levels);
      l.setLabels({app: 'awesome'});
      (l as any).foo('message');
      expect(sender.send).toHaveBeenCalled();
      expect(sender.send.mock.calls[0][0].labels['app']).toBe('awesome');
    });
  });

  describe('getLabels', () => {
    it ('returns the default labels on the logger', () => {
      const levels = { foo: 1};
      const sender = { send: function() {}};
      const labels = { app: 'awesome' };
      const l = new Logger(sender, levels);
      l.setLabels(labels);
      expect(l.getLabels()).toEqual(labels);
    });
  });
});
