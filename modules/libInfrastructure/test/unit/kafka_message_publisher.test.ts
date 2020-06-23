import { KafkaMessagePublisher } from '../../src/kafka_message_publisher'
import { IMessage, MessageTypes } from '@mojaloop-poc/lib-domain'

describe('Kafka Message Publisher', () => {

  let publisher: KafkaMessagePublisher

  beforeAll(() => {
    const kafkaGenericProducerOptions = {
      client: {
        kafka: {
          kafkaHost: 'localhost:9092',
          clientId: 'testCmdHandler'
        }
      }
    }
    publisher = new KafkaMessagePublisher(kafkaGenericProducerOptions);
  })

  test('sends a single message', async () => {    
    const message: IMessage = {
      msgId: '123',
      msgKey: '321',
      msgTimestamp: 0,
      msgTopic: 'test',
      msgType: MessageTypes.COMMAND,
      payload: {},
      traceInfo: null,
      addTraceInfo: (trace) => {},
      passTraceInfo: (message) => {}
    };    
    (publisher as any)._producer.send = jest.fn().mockResolvedValue(undefined)

    await publisher.publish(message)

    expect((publisher as any)._producer.send).toHaveBeenCalledWith(message)
  })

  test('sends an array of messages', async () => {
    const messages: IMessage[] = [
      {
        msgId: '123',
        msgKey: '321',
        msgTimestamp: 0,
        msgTopic: 'test',
        msgType: MessageTypes.COMMAND,
        payload: {},
        traceInfo: null,
        addTraceInfo: (trace) => {},
        passTraceInfo: (message) => {}
      },
      {
        msgId: '124',
        msgKey: '322',
        msgTimestamp: 1,
        msgTopic: 'test',
        msgType: MessageTypes.COMMAND,
        payload: {},
        traceInfo: null,
        addTraceInfo: (trace) => {},
        passTraceInfo: (message) => {}
      }
    ];
    (publisher as any)._producer.send = jest.fn().mockResolvedValue(undefined)

    await publisher.publishMany(messages)

    expect((publisher as any)._producer.send).toHaveBeenCalledWith(messages)
  })
})