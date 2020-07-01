import { IMessagePublisher, IMessage, ILogger } from '@mojaloop-poc/lib-domain'
import {
  KafkaMessagePublisher,
  KafkaGenericProducerOptions,
  KafkaInfraTypes,
  KafkajsMessagePublisher,
  KafkaJsProducerOptions,
  KafkaJsCompressionTypes,
  KafkaNodeCompressionTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher
} from '@mojaloop-poc/lib-infrastructure'
import { MojaLogger, Crypto } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

let logger: ILogger
let isInit: boolean = false

let kafkaMsgPublisher: IMessagePublisher | undefined
export let appConfig: any | undefined

export const init = async (): Promise<void> => {
  if (!isInit && kafkaMsgPublisher == null && logger == null) {
    logger = new MojaLogger()
    logger.debug('initPublisher - initializing')

    appConfig = {
      kafka: {
        host: process.env.KAFKA_HOST ?? 'localhost:9092',
        producer: (process.env.KAFKA_PRODUCER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_PRODUCER,
        autocommit: (process.env.KAFKA_AUTO_COMMIT === 'true'),
        autoCommitInterval: (process.env.KAFKA_AUTO_COMMIT_INTERVAL != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_INTERVAL)) && process.env.KAFKA_AUTO_COMMIT_INTERVAL?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL) : null,
        autoCommitThreshold: (process.env.KAFKA_AUTO_COMMIT_THRESHOLD != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_THRESHOLD)) && process.env.KAFKA_AUTO_COMMIT_THRESHOLD?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_THRESHOLD) : null,
        gzipCompression: (process.env.KAFKA_PRODUCER_GZIP === 'true')
      },
      simulator: {
        host: process.env.SIMULATOR_HOST
      }
    }

    logger.info('Running devtools Publisher!')
    logger.info(`appConfig=${JSON.stringify(appConfig)}`)

    logger.info(`Creating ${JSON.stringify(appConfig.kafka.producer)} participantCmdHandler.kafkaMsgPublisher...`)
    const clientId = `kafkaMsgPublisher-${appConfig.kafka.producer}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_KAFKA_STREAM):
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId
            },
            compression: appConfig.kafka.gzipCompression === true ? KafkaNodeCompressionTypes.GZIP : KafkaNodeCompressionTypes.None
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
              clientId
            },
            producer: { // https://kafka.js.org/docs/producing#options
              allowAutoTopicCreation: true,
              transactionTimeout: 60000
            },
            compression: appConfig.kafka.gzipCompression as boolean ? KafkaJsCompressionTypes.GZIP : KafkaJsCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkajsMessagePublisher(
          kafkaJsProducerOptions,
          logger
        )
        break
      }
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaProducerOptions: RDKafkaProducerOptions = {
          client: {
            producerConfig: {
              'client.id': clientId,
              'metadata.broker.list': appConfig.kafka.host,
              dr_cb: true
            },
            topicConfig: {
            }
          }
        }
        kafkaMsgPublisher = new RDKafkaMessagePublisher(
          rdKafkaProducerOptions,
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
    isInit = true
  } else {
    logger.debug('initPublisher - publisher already initiated')
  }
}

export const publishMessage = async (message: IMessage): Promise<void> => {
  // await init()
  // logger.debug(`publishMessage - message: ${JSON.stringify(message)}`)
  await kafkaMsgPublisher!.publish(message)
  //await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultipleInit = async (): Promise<void> => {
  await init()
  logger.debug('publishMessageMultipleInit')
}

export const publishMessageMultipleDestroy = async (): Promise<void> => {
  // await init()
  logger.debug('publishMessageMultipleDestroy')
  await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultiple = async (messages: IMessage[]): Promise<void> => {
  // await init()
  // logger.debug(`publishMessageMultiple - messages: ${JSON.stringify(messages)}`)
  const promises = messages.map(async msg => await kafkaMsgPublisher!.publish(msg))
  await Promise.all(promises)
}
