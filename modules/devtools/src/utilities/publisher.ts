import { IMessagePublisher, IMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaMessagePublisher, KafkaGenericProducerOptions, KafkaInfraTypes, KafkajsMessagePublisher, KafkaJsProducerOptions } from '@mojaloop-poc/lib-infrastructure'
import { MojaLogger, Crypto } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

let logger: ILogger
const isInit: boolean = false

let kafkaMsgPublisher: IMessagePublisher | undefined
export let appConfig: any | undefined

export const init = async (): Promise<void> => {
  if (!isInit && kafkaMsgPublisher == null && logger == null) {
    logger = new MojaLogger()
    logger.debug('initPublisher - initializing')

    appConfig = {
      kafka: {
        host: process.env.KAFKA_HOST ?? 'localhost:9092',
        producer: (process.env.KAFKA_PRODUCER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_PRODUCER
      },
      simulator: {
        host: process.env.SIMULATOR_HOST
      }
    }

    logger.info('Running devtools Publisher!')
    logger.info(`appConfig=${JSON.stringify(appConfig)}`)

    logger.info(`Creating ${JSON.stringify(appConfig.kafka.producer)} participantCmdHandler.kafkaMsgPublisher...`)
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
              brokers: [appConfig.kafka.host],
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
    await kafkaMsgPublisher.init()
  } else {
    logger.debug('initPublisher - publisher already initiated')
  }
}

export const publishMessage = async (message: IMessage): Promise<void> => {
  await init()
  logger.debug(`publishMessage - message: ${JSON.stringify(message)}`)
  await kafkaMsgPublisher!.publish(message)
  await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultipleInit = async (): Promise<void> => {
  await init()
  logger.debug('publishMessageMultipleInit')
}

export const publishMessageMultipleDestroy = async (): Promise<void> => {
  await init()
  logger.debug('publishMessageMultipleDestroy')
  await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultiple = async (messages: IMessage[]): Promise<void> => {
  await init()
  logger.debug(`publishMessageMultiple - messages: ${JSON.stringify(messages)}`)
  const promises = messages.map(async msg => await kafkaMsgPublisher!.publish(msg))
  await Promise.all(promises)
}
