import { IMessagePublisher, IMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher, KafkaGenericProducerOptions, KafkaInfraTypes, KafkajsMessagePublisher, KafkaJsProducerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ConsoleLogger, Crypto } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

const logger: ILogger = new ConsoleLogger()
const isInit: boolean = false

// # setup application config
export const appConfig = {
  kafka: {
    host: process.env.KAFKA_HOST ?? 'localhost:9092',
    producer: (process.env.KAFKA_PRODUCER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_PRODUCER,
  },
  simulator: {
    host: process.env.SIMULATOR_HOST
  }
}

logger.info(`Running devtools Publisher!`)
logger.info(`appConfig=${JSON.stringify(appConfig)}`)

let kafkaMsgPublisher: IMessagePublisher | undefined

logger.info(`Creating ${appConfig.kafka.producer} participantCmdHandler.kafkaMsgPublisher...`)
switch (appConfig.kafka.producer) {
  case (KafkaInfraTypes.NODE_KAFKA): {
    const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
      client: {
        kafka: {
          kafkaHost: appConfig.kafka.host,
          clientId: `kafkaMsgPublisher-${Crypto.randomBytes(8)}`
        }
      }
    }
    kafkaMsgPublisher = new KafkaMessagePublisher(
      kafkaGenericProducerOptions,
      logger
    )
    break
  }
  case (KafkaInfraTypes.KAFKAJS): {
    const kafkaJsProducerOptions: KafkaJsProducerOptions = {
      client: {
        client: { // https://kafka.js.org/docs/configuration#options
          brokers: [ appConfig.kafka.host ],
          clientId: `kafkaMsgPublisher-${Crypto.randomBytes(8)}`
        },
        producer: { // https://kafka.js.org/docs/producing#options
          allowAutoTopicCreation: true,
          idempotent: true, // false is default
          transactionTimeout: 60000
        }
      }
    }
    kafkaMsgPublisher = new KafkajsMessagePublisher(
      kafkaJsProducerOptions,
      logger
    )
    break
  }
  default: {
    logger.warn('Unable to find a Kafka Producer implementation!')
    throw new Error('participantCmdHandler.kafkaMsgPublisher was not created!')
  }
}

const initPublisher = async () => {
  if (kafkaMsgPublisher == null) throw Error('kafkaMsgPublisher with ')
  if (isInit == false) {
    logger.debug(`initPublisher - initializing}`)
    await kafkaMsgPublisher!.init()
  }
}

export const publishMessage = async (message: IMessage): Promise<void> => {
  logger.debug(`publishMessage - message: ${JSON.stringify(message)}`)
  await initPublisher()
  await kafkaMsgPublisher!.publish(message)
  await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultipleInit = async (): Promise<void> => {
  logger.debug(`publishMessageMultipleInit`)
  await initPublisher()
}

export const publishMessageMultipleDestroy = async (): Promise<void> => {
  logger.debug(`publishMessageMultipleDestroy`)
  await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultiple = async (messages: IMessage[]): Promise<void> => {
  logger.debug(`publishMessageMultiple - messages: ${JSON.stringify(messages)}`)
  await initPublisher()
  const promises = messages.map(async msg => await kafkaMsgPublisher!.publish(msg))
  await Promise.all(promises)
}
