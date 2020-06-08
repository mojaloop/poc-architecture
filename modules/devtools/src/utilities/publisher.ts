import { IMessagePublisher, IMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher, KafkaGenericProducerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

const logger: ILogger = new ConsoleLogger()

// # setup application config
const appConfig = {
  kafka: {
    host: process.env.KAFKA_HOST
  }
}

const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
  client: {
    kafka: {
      kafkaHost: appConfig.kafka.host,
      clientId: 'tools-publisher'
    }
  }
}

const kafkaMsgPublisher: IMessagePublisher = new KafkaMessagePublisher(
  kafkaGenericProducerOptions,
  logger
)

export const publishMessage = async (message: IMessage): Promise<void> => {
  await kafkaMsgPublisher.init()
  await kafkaMsgPublisher.publish(message)
  await kafkaMsgPublisher.destroy()
}

export const publishMessageMultipleInit = async (): Promise<void> => {
  await kafkaMsgPublisher.init()
}

export const publishMessageMultipleDestroy = async (): Promise<void> => {
  await kafkaMsgPublisher.destroy()
}

export const publishMessageMultiple = async (messages: IMessage[]): Promise<void> => {
  const promises = messages.map(async msg => await kafkaMsgPublisher.publish(msg))
  await Promise.all(promises)
}
