import { Stream } from '../stream';
import { ILabel, IMessage } from '../interfaces';
import { DEFAULT_LOG_LEVELS } from '../logger';



describe('Stream', () => {
  const mockfn = jest.fn();
  const receiver = (m: IMessage) => {
    mockfn(m);
  };

  let stream: Stream;
  beforeEach(() => {
    mockfn.mockClear();
    stream = new Stream();
  });

  it ('should send a receiver of the stream all messages sent to stream', () => {
    stream.addReceiver(receiver);
    const message: IMessage = {
      logLevel: DEFAULT_LOG_LEVELS.debug,
      labels: {},
      value: 'foo'
    };

    const message2: IMessage = {
      logLevel: DEFAULT_LOG_LEVELS.error,
      labels: {},
      value: 'bar'
    };

    stream.send(message);
    expect(mockfn).toHaveBeenCalledWith(message);

    stream.send(message2);
    expect(mockfn).toHaveBeenCalledWith(message2);
  });

  describe('removeReceiver', () => {
    it ('should not send a receiver any more messages after it is removed', () => {
      stream.addReceiver(receiver);
      const message: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };

      stream.send(message);
      expect(mockfn).toHaveBeenCalled();
      mockfn.mockClear();

      stream.removeReceiver(receiver);
      stream.send(message);
      expect(mockfn).not.toHaveBeenCalled();
    });
  });

  describe('addInterceptor', () => {
    it ('should call my interceptor', () => {
      const mockfn = jest.fn();
      const interceptor = (m) =>  {
        mockfn();
        return m;
      };

      stream.addInterceptor(interceptor);
      const message = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };
      stream.send(message);
      expect(mockfn).toHaveBeenCalled();
    });

    it ('allows an interceptor to augment a message', () => {
      stream.addReceiver(receiver);
      const interceptor = (m) =>  {
        m.value = 'bar';
        return  m;
      };

      stream.addInterceptor(interceptor);
      const message = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };
      stream.send(message);
      expect(message.value).toBe('bar');
      expect(mockfn).toHaveBeenCalledWith(message);
    });

    it ('does not call message receivers if interceptor returns null', () => {
      stream.addReceiver(receiver);
      const interceptor = (m) =>  {
        return null;
      };

      stream.addInterceptor(interceptor);
      const message = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };
      stream.send(message);
      expect(mockfn).not.toHaveBeenCalled();

    });
  });

  describe('removeInterceptor', () => {
    it('removes my interceptor', () => {
      const mockfn = jest.fn();
      const interceptor = (m) =>  {
        mockfn(m);
        return m;
      };

      stream.addInterceptor(interceptor);
      const message = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };
      stream.send(message);
      expect(mockfn).toHaveBeenCalled();
      mockfn.mockClear();
      expect(mockfn).not.toHaveBeenCalled();
      stream.removeInterceptor(interceptor);
      expect(mockfn).not.toHaveBeenCalled();
      stream.send(message);
      expect(mockfn).not.toHaveBeenCalled();
    });
  });

  describe('setLogLevel', () => {
    it ('should set the loglevel such that certain messages are not received', () => {
      stream.addReceiver(receiver);
      const message: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };

      const message2: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.error,
        labels: {},
        value: 'bar'
      };

      stream.setLogLevel(DEFAULT_LOG_LEVELS.error);
      stream.send(message);
      expect(mockfn).not.toHaveBeenCalled();

      stream.send(message2);
      expect(mockfn).toHaveBeenCalledWith(message2);
    });
  });

  describe('matchAll', () => {
    it ('sends all messages to the stream', () => {
      stream.matchAll().addReceiver(receiver);
      const message: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };

      const message2: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.error,
        labels: {app: 'foo'},
        value: 'bar'
      };

      stream.send(message);
      expect(mockfn).toHaveBeenCalledWith(message);

      stream.send(message2);
      expect(mockfn).toHaveBeenCalledWith(message2);
    });
  });

  describe('matchLabels', () => {
    it ('only sends messages to receivers when message labels match the labels specified in matchLabels', () => {
      const labels: ILabel = {
        app: 'my-app'
      };

      // Labels
      const matching: ILabel = {
        app: 'my-app',
        foo: 'bar'
      };

      const notMatching: ILabel = {
        app: 'another-app',
        foo: 'bar'
      };

      // Messages
      const messageWithoutLabels: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: {},
        value: 'foo'
      };

      const messageWithoutMatchingLabels: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: notMatching,
        value: 'foo'
      };

      const messageWithMatchingLabels: IMessage = {
        logLevel: DEFAULT_LOG_LEVELS.debug,
        labels: matching,
        value: 'foo'
      };

      let unsub = stream.matchLabels(labels).addReceiver(receiver);

      // Test non-matching labels
      stream.send(messageWithoutLabels);
      expect(mockfn).not.toHaveBeenCalled();
      mockfn.mockClear();
      stream.send(messageWithoutMatchingLabels);
      expect(mockfn).not.toHaveBeenCalled();
      mockfn.mockClear();

      // test matching labels
      stream.send(messageWithMatchingLabels);
      expect(mockfn).toHaveBeenCalledWith(messageWithMatchingLabels);
      mockfn.mockClear();

      // unsub
      unsub();
      stream.send(messageWithMatchingLabels);
      expect(mockfn).not.toHaveBeenCalledWith();

      // test setLogLevel
      stream.matchLabels(labels).setLogLevel(DEFAULT_LOG_LEVELS.error).addReceiver(receiver);
      stream.send(messageWithMatchingLabels);
      expect(mockfn).not.toHaveBeenCalled();
      mockfn.mockClear();
    });

    it ('throws when no labels are provided', () => {
      const shouldThrow = () => {
        stream.matchLabels();
      };
      expect(shouldThrow).toThrow();
    });
  });

  describe('matchCondition', () => {
    describe('IN condition', () => {
      it ('sends receivers messages only if the value for a specific label is within a given set of values', () => {
        const l1: ILabel = {
          app: 'my-app'
        };

        const l2: ILabel = {
          app: 'other-app'
        };

        const l3: ILabel = {
          app: 'not-specified'
        };


        // Messages
        const m1: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l1
          value: 'foo'
        };

        const m2: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l2,
          value: 'foo'
        };

        const m3: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l3,
          value: 'foo'
        };

        // Messages only for 'my-app' and 'other-app' should be received
        stream.matchCondition('app', 'IN', ['my-app', 'other-app']).addReceiver(receiver);
        stream.send(m1);
        expect(mockfn).toHaveBeenCalledWith(m1);
        mockfn.mockClear();

        stream.matchCondition('app', 'IN', ['my-app', 'other-app']).addReceiver(receiver);
        stream.send(m2);
        expect(mockfn).toHaveBeenCalledWith(m2);
        mockfn.mockClear();

        stream.matchCondition('app', 'IN', ['my-app', 'other-app']).addReceiver(receiver);
        stream.send(m3);
        expect(mockfn).not.toHaveBeenCalled();
        mockfn.mockClear();
      });
    });

    describe('NOT_IN condition', () => {
      it ('sends receivers messages only if the value for a specific label is not within a given set of values', () => {
        const l1: ILabel = {
          app: 'my-app'
        };

        const l2: ILabel = {
          app: 'other-app'
        };

        const l3: ILabel = {
          app: 'not-specified'
        };

        // Messages
        const m1: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l1
          value: 'foo'
        };

        const m2: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l2,
          value: 'foo'
        };

        const m3: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l3,
          value: 'foo'
        };

        // Messages not for 'my-app' and 'other-app' should be received
        stream.matchCondition('app', 'NOT_IN', ['my-app', 'other-app']).addReceiver(receiver);
        stream.send(m1);
        expect(mockfn).not.toHaveBeenCalled();
        mockfn.mockClear();

        stream.send(m2);
        expect(mockfn).not.toHaveBeenCalled();
        mockfn.mockClear();

        stream.send(m3);
        expect(mockfn).toHaveBeenCalledWith(m3);
        mockfn.mockClear();
      });
    });

    describe('NOT condition', () => {
      it ('sends receivers messages only if the value for a specific label is not the specified value', () => {
        const l1: ILabel = {
          app: 'my-app'
        };

        const l2: ILabel = {
          app: 'other-app'
        };

        const l3: ILabel = {
          app: 'not-specified'
        };

        // Messages
        const m1: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l1
          value: 'foo'
        };

        const m2: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l2,
          value: 'foo'
        };

        const m3: IMessage = {
          logLevel: DEFAULT_LOG_LEVELS.debug,
          labels: l3,
          value: 'foo'
        };

        // Messages not for 'my-app' and 'other-app' should be received
        stream.matchCondition('app', 'NOT', 'my-app').addReceiver(receiver);
        stream.send(m1);
        expect(mockfn).not.toHaveBeenCalled();
        mockfn.mockClear();

        stream.send(m2);
        expect(mockfn).toHaveBeenCalledWith(m2);
        mockfn.mockClear();

        stream.send(m3);
        expect(mockfn).toHaveBeenCalledWith(m3);
        mockfn.mockClear();
      });
    });

    describe('throw on unknown operator', () => {
      it ('should throw when given an unknown operator', () => {
        const shouldThrow = () => {
          stream.matchCondition('foo', 'some-unknown-opp', 'bar');
        };
        expect(shouldThrow).toThrow();
      });
    });
  });
});

