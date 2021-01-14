import { IMessagePublisher, IMessage, ILogger } from '@mojaloop-poc/lib-domain'
import {
  KafkaInfraTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher,
  RDKafkaCompressionTypes
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
    logger.isDebugEnabled() && logger.debug('initPublisher - initializing')

    appConfig = {
      kafka: {
        host: (process.env.KAFKA_HOST != null) ? process.env.KAFKA_HOST : 'localhost:9092',
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

    logger.isInfoEnabled() && logger.info('Running devtools Publisher!')
    logger.isInfoEnabled() && logger.info(`appConfig=${JSON.stringify(appConfig)}`)

    logger.isInfoEnabled() && logger.info(`Creating ${JSON.stringify(appConfig.kafka.producer)} participantCmdHandler.kafkaMsgPublisher...`)
    const clientId = `kafkaMsgPublisher-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaProducerOptions: RDKafkaProducerOptions = {
          client: {
            producerConfig: {
              'client.id': clientId,
              'metadata.broker.list': appConfig.kafka.host,
              dr_cb: true,
              'socket.keepalive.enable': true,
              'compression.codec': appConfig.kafka.gzipCompression === true ? RDKafkaCompressionTypes.GZIP : RDKafkaCompressionTypes.NONE
            },
            topicConfig: {
              // partitioner: RDKafkaPartioner.MURMUR2_RANDOM // default java algorithm, seems to have worse random distribution for hashing than rdkafka's default
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
        logger.isWarnEnabled() && logger.warn('Unable to find a Kafka Producer implementation!')
        throw new Error('participantCmdHandler.kafkaMsgPublisher was not created!')
      }
    }
    await kafkaMsgPublisher.init()
    isInit = true
  } else {
    logger.isDebugEnabled() && logger.debug('initPublisher - publisher already initiated')
  }
}

export const publishMessage = async (message: IMessage): Promise<void> => {
  // await init()
  // logger.isDebugEnabled() && logger.debug(`publishMessage - message: ${JSON.stringify(message)}`)
  await kafkaMsgPublisher!.publish(message)
  // await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultipleInit = async (): Promise<void> => {
  await init()
  logger.isDebugEnabled() && logger.debug('publishMessageMultipleInit')
}

export const publishMessageMultipleDestroy = async (): Promise<void> => {
  // await init()
  logger.isDebugEnabled() && logger.debug('publishMessageMultipleDestroy')
  await kafkaMsgPublisher!.destroy()
}

export const publishMessageMultiple = async (messages: IMessage[]): Promise<void> => {
  // await init()
  // logger.isDebugEnabled() && logger.debug(`publishMessageMultiple - messages: ${JSON.stringify(messages)}`)
  const promises = messages.map(async msg => await kafkaMsgPublisher!.publish(msg))
  await Promise.all(promises)
}
