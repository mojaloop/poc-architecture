/**
 * Created by pedrosousabarreto@gmail.com on 17/Jan/2019.
 */

'use strict'

// import * as kafka from 'kafka-node'
import { ConsoleLogger, ILogger } from '../utilities/logger'
import { IMessage } from '../domain_abstractions/messages'
import { KafkaGenericProducer } from './kafka_generic_producer'
import { IMessagePublisher } from '../domain_abstractions/imessage_publisher'

export class KafkaMessagePublisher implements IMessagePublisher {
  private readonly _producer: KafkaGenericProducer
  protected _logger: ILogger

  constructor (kafkaConString: string, kafkaClientName: string, envName: string, logger?: ILogger) {
    this._logger = logger ?? new ConsoleLogger()
    this._producer = new KafkaGenericProducer(kafkaConString, kafkaClientName, envName, this._logger)
  }

  get envName (): string {
    return this._producer.envName
  }

  async init (): Promise<void> {
    return await this._producer.init()
  }

  async destroy (): Promise<void> {
    return await this._producer.destroy()
  }

  async publish (message: IMessage): Promise<void> {
    return await this._producer.send(message)
  }

  async publishMany (messages: IMessage[]): Promise<void> {
    return await this._producer.send(messages)
  }
}
