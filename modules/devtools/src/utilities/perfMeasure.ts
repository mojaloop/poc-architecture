/**
 * Created by pedrosousabarreto@gmail.com on 04/Jun/2020.
 */

'use strict'

import { IDomainMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaGenericConsumer, KafkaGenericConsumerOptions, KafkaInfraTypes, MessageConsumer, RDKafkaConsumer, RDKafkaConsumerOptions, KafkaStreamConsumer, EnumOffset, KafkaJsConsumerOptions, KafkaJsConsumer, RdKafkaCommitMode, ApiServer, TApiServerOptions } from '@mojaloop-poc/lib-infrastructure'
import { MojaLogger, Crypto, getEnvIntegerOrDefault, TMetricOptionsType, Metrics } from '@mojaloop-poc/lib-utilities'
// import { ConsoleLogger, Metrics, TMetricOptionsType } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'
import * as promclient from 'prom-client'
import { TransfersTopics, MLTopics } from '@mojaloop-poc/lib-public-messages'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const pckg = require('../../package.json')

const STR_INTERVAL_MS = process.env?.INTERVAL_MS ?? '1000'
const INTERVAL_MS = Number.parseInt(STR_INTERVAL_MS)

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

let perfMetricsHisto: promclient.Histogram
let perfMetricsPendingGauge: promclient.Gauge

const logger: ILogger = new MojaLogger()
let metrics: Metrics
let startTime = 0
let requestedCounter = 0
let fulfiledCounter = 0
let overOneSecCounter = 0

// # setup application config
const appConfig = {
  api: {
    host: (process.env.PERF_MEASURE_API_HOST != null) ? process.env.PERF_MEASURE_API_HOST : '0.0.0.0',
    port: getEnvIntegerOrDefault('PERF_MEASURE_API_PORT', 4001)
  },
  kafka: {
    host: (process.env.KAFKA_HOST != null) ? process.env.KAFKA_HOST : 'localhost:9092',
    consumer: (process.env.KAFKA_CONSUMER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_CONSUMER,
    producer: (process.env.KAFKA_PRODUCER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_PRODUCER,
    autocommit: (process.env.KAFKA_AUTO_COMMIT === 'true'),
    autoCommitInterval: (process.env.KAFKA_AUTO_COMMIT_INTERVAL != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_INTERVAL)) && process.env.KAFKA_AUTO_COMMIT_INTERVAL?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL) : null,
    autoCommitThreshold: (process.env.KAFKA_AUTO_COMMIT_THRESHOLD != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_THRESHOLD)) && process.env.KAFKA_AUTO_COMMIT_THRESHOLD?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_THRESHOLD) : null,
    rdKafkaCommitWaitMode: (process.env.RDKAFKA_COMMIT_WAIT_MODE == null) ? RdKafkaCommitMode.RDKAFKA_COMMIT_MSG_SYNC : process.env.RDKAFKA_COMMIT_WAIT_MODE,
    gzipCompression: (process.env.KAFKA_PRODUCER_GZIP === 'true')
  },
  redis: {
    host: process.env.REDIS_HOST
  },
  simulator: {
    host: process.env.SIMULATOR_HOST
  },
  measure: {
    groupId: (process.env.MEASURE_KAFKA_GROUP_ID == null) ? null : process.env.MEASURE_KAFKA_GROUP_ID
  }
}

const CreateConsumer = async (topic: string): Promise<MessageConsumer | undefined> => {
  let consumer: MessageConsumer | undefined

  /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
  logger.isInfoEnabled() && logger.info(`perfMeasure - Creating ${appConfig.kafka.consumer} perfMeasure for topic: ${topic}...`)
  const clientId = `perfMeasure-${appConfig.kafka.consumer}-${Crypto.randomBytes(8)}`
  // const groupId = 'perf_measure_consumer' + Date.now().toString()
  // const groupId = 'perf_measure_consumer'
  let groupId
  if (appConfig.measure.groupId != null && appConfig.measure.groupId.length > 0) {
    groupId = appConfig.measure.groupId
  } else {
    groupId = 'perf_measure_consumer' + Date.now().toString()
  }
  switch (appConfig.kafka.consumer) {
    case (KafkaInfraTypes.NODE_KAFKA): {
      const simulatorEvtConsumerOptions: KafkaGenericConsumerOptions = {
        client: {
          kafkaHost: appConfig.kafka.host,
          id: clientId,
          groupId,
          fromOffset: EnumOffset.LATEST,
          autoCommit: appConfig.kafka.autocommit
        },
        topics: [topic]
      }
      consumer = new KafkaGenericConsumer(simulatorEvtConsumerOptions, logger)
      break
    }
    case (KafkaInfraTypes.NODE_KAFKA_STREAM): {
      const simulatorEvtConsumerOptions: KafkaGenericConsumerOptions = {
        client: {
          kafkaHost: appConfig.kafka.host,
          id: clientId,
          groupId,
          fromOffset: EnumOffset.LATEST,
          autoCommit: appConfig.kafka.autocommit
        },
        topics: [topic]
      }
      consumer = new KafkaStreamConsumer(simulatorEvtConsumerOptions, logger)
      break
    }
    case (KafkaInfraTypes.KAFKAJS): {
      const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
        client: {
          client: { // https://kafka.js.org/docs/configuration#options
            brokers: [appConfig.kafka.host],
            clientId
          },
          consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
            groupId
          },
          consumerRunConfig: {
            autoCommit: appConfig.kafka.autocommit,
            autoCommitInterval: appConfig.kafka.autoCommitInterval,
            autoCommitThreshold: appConfig.kafka.autoCommitThreshold
          }
        },
        topics: [topic]
      }
      consumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
      break
    }
    case (KafkaInfraTypes.NODE_RDKAFKA): {
      const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
        client: {
          consumerConfig: {
            'client.id': clientId,
            'metadata.broker.list': appConfig.kafka.host,
            'group.id': groupId,
            'enable.auto.commit': appConfig.kafka.autocommit,
            'auto.commit.interval.ms': (appConfig.kafka.autoCommitInterval != null) ? appConfig.kafka.autoCommitInterval : 200
          },
          topicConfig: {},
          rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode as RdKafkaCommitMode
        },
        topics: [topic]
      }
      consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
      break
    }
    default: {
      logger.isWarnEnabled() && logger.warn(`perfMeasure - Unable to find a Kafka consumer implementation for topic: ${topic}!`)
      throw new Error(`perfMeasure was not created for topic: ${topic}!`)
    }
  }

  logger.isInfoEnabled() && logger.info(`perfMeasure - Created kafkaConsumer of type ${consumer.constructor.name} for topic: ${topic}`)
  return consumer
}

// const kafkaConsumerOptions: KafkaGenericConsumerOptions = {
//   client: {
//     kafkaHost: appConfig.kafka.host,
//     groupId: 'perf_measure_consumer' + Date.now().toString(),
//     fromOffset: 'latest'
//   },
//   topics: [TransfersTopics.DomainEvents]
// }

// const kafkaConsumerOptionsMl: KafkaGenericConsumerOptions = {
//   client: kafkaConsumerOptions.client,
//   topics: [MLTopics.Events]
// }

const buckets: Map<number, {counter: number, totalTimeMs: number}> = new Map<number, {counter: number, totalTimeMs: number}>()
const evtMap: Map<string, number> = new Map<string, number>()

function logRPS (): void {
  const now = Date.now()
  const lastSecond = Math.floor(now / 1000) - 1
  let counter = 0
  let totalMs = 0
  let avg = 0
  const seconds = INTERVAL_MS / 1000

  for (let i = 0; i < seconds; i++) {
    const bucketData = buckets.get(lastSecond - i)
    if (bucketData == null) { continue }
    counter += bucketData.counter
    totalMs += bucketData.totalTimeMs
  }

  avg = totalMs > 0 ? Math.floor((totalMs / counter) / seconds) : 0
  counter = Math.floor(counter / seconds)

  // totals
  const elaspsed = now - startTime
  const avgRequested = Math.floor(requestedCounter / (elaspsed / 1000))
  const avgFulfiled = Math.floor(fulfiledCounter / (elaspsed / 1000))
  const overOneSecPercentage = overOneSecCounter === 0 || fulfiledCounter === 0 ? 0 : Math.floor((overOneSecCounter / fulfiledCounter) * 100)

  // eslint-disable-next-line no-console
  logger.isInfoEnabled() && logger.info(`\n *** ${counter} req/sec *** ${avg} avg ms *** ${evtMap.size} pending *** ${avgRequested}/${avgFulfiled} avg req/ful ${requestedCounter}/${fulfiledCounter} total req/ful *** ${overOneSecCounter} reqs over 1 sec (${overOneSecPercentage}%)  \n`)

  if (buckets.has(lastSecond - 1)) {
    buckets.delete(lastSecond - 1)
  } // clean up old

  setTimeout(() => {
    logRPS()
  }, INTERVAL_MS)
}

function recordCompleted (timeMs: number, transferId: string): void {
  const currentSecond = Math.floor(Date.now() / 1000)
  const bucketData = buckets.get(currentSecond) ?? { counter: 0, totalTimeMs: 0 }

  bucketData.counter++
  bucketData.totalTimeMs += timeMs
  buckets.set(currentSecond, bucketData)
}

const handlerForFulfilEvt = async (message: IDomainMessage): Promise<void> => {
  if (message.msgName === 'TransferFulfilledEvt') {
    fulfiledCounter++
    const reqReceivedAt = evtMap.get(message.aggregateId)
    if (reqReceivedAt != null) {
      const timeDelta = message.msgTimestamp - reqReceivedAt
      // console.log(`Prepare leg completed for transfer id: ${message.aggregateId} took: - ${message.msgTimestamp - reqReceivedAt} ms`)
      recordCompleted(timeDelta, message.aggregateId)
      evtMap.delete(message.aggregateId)

      if (timeDelta > 1000) overOneSecCounter++
      perfMetricsHisto.observe({}, timeDelta / 1000)
    }

    // decrease even if we don't have it here in mem
    perfMetricsPendingGauge.dec()
  }
}

const handlerForInitialReqEvt = async (message: IDomainMessage): Promise<void> => {
  if (message.msgName === 'TransferPrepareRequestedEvt') {
    requestedCounter++
    evtMap.set(message.aggregateId, message.msgTimestamp)

    if (startTime === 0) {
      startTime = Date.now()
    } // delay until we actually receive the first req

    perfMetricsPendingGauge.inc()
    // console.log(`Prepare leg started for transfer id: ${message.aggregateId} at: - ${new Date(message.msgTimestamp).toISOString()}`)
  }
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  logRPS()

  // Instantiate metrics factory

  const metricsConfig: TMetricOptionsType = {
    timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
    prefix: 'moja_', // Set prefix for all defined metrics names
    defaultLabels: { // Set default labels that will be applied to all metrics
      serviceName: 'simulator'
    }
  }

  metrics = new Metrics(metricsConfig)
  await metrics.init()

  perfMetricsHisto = metrics.getHistogram(
    'tx_transfer',
    'Transaction metrics for Transfers',
    []
  )

  perfMetricsPendingGauge = metrics.getGauge(
    'tx_pending',
    'Transaction metrics for pending transfers',
    []
  )

  // Kafka consumer
  const kafkaEvtConsumer = await CreateConsumer(TransfersTopics.DomainEvents)
  if (kafkaEvtConsumer === undefined) {
    throw Error('perfMeasure - Unabled to create kafkaEvtConsumer consumer')
  }
  // const kafkaEvtConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(kafkaConsumerOptions, logger)
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await kafkaEvtConsumer.init(handlerForFulfilEvt, ['TransferFulfilledEvt'])

  const kafkaEvtConsumerMl = await CreateConsumer(MLTopics.Events)
  if (kafkaEvtConsumerMl === undefined) {
    throw Error('perfMeasure - Unabled to create kafkaEvtConsumerMl consumer')
  }
  // const kafkaEvtConsumerMl = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(kafkaConsumerOptionsMl, logger)
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await kafkaEvtConsumerMl.init(handlerForInitialReqEvt, ['TransferPrepareRequestedEvt'])

  // start only API
  const args = { // TODO: do a proper args parsing instead of hard-coded const
    disableApi: null
  }
  let apiServer: ApiServer | undefined
  if (args.disableApi == null) {
    const apiServerOptions: TApiServerOptions = {
      host: appConfig.api.host,
      port: appConfig.api.port,
      metricCallback: async () => {
        return await metrics.getMetricsForPrometheus()
      },
      healthCallback: async () => {
        return {
          status: 'ok',
          version: pckg.version,
          name: pckg.name
        }
      }
    }
    apiServer = new ApiServer(apiServerOptions, logger)
    await apiServer.init()
  }
}

start().catch((err) => {
  logger.isErrorEnabled() && logger.error(err)
}).finally(() => {
  // process.exit(0)
})

process.on('SIGINT', function () {
  // eslint-disable-next-line no-console
  logger.isInfoEnabled() && logger.info('Ctrl-C... collecting pending...')
  const now = Date.now()

  evtMap.forEach((value, key) => {
    // eslint-disable-next-line no-console
    logger.isInfoEnabled() && logger.info(`Pending transfer - ID: ${key} - Timestamp: ${value} - Age: ${now - value} ms`)
  })

  process.exit(2)
})
