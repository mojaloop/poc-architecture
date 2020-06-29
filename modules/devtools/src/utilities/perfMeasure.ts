/**
 * Created by pedrosousabarreto@gmail.com on 04/Jun/2020.
 */

'use strict'

import { IDomainMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaGenericConsumer, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ConsoleLogger, Metrics, TMetricOptionsType } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'
import { TransfersTopics, MLTopics } from '@mojaloop-poc/lib-public-messages'

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

const metricsConfig: TMetricOptionsType = {
  timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
  prefix: 'poc_tran_', // Set prefix for all defined metrics names
  defaultLabels: { // Set default labels that will be applied to all metrics
    serviceName: 'perfMeasure'
  }
}

const metrics = new Metrics(metricsConfig)

const perfMetricsHisto = metrics.getHistogram( // Create a new Histogram instrumentation
  'perfMeasureHist', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
  'Instrumentation for perfMeasure', // Description of metric
  [] // Define a custom label 'success'
)

const perfMetricsPendingGauge = metrics.getGauge( // Create a new Histogram instrumentation
  'perfMeasureGauge', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
  'Instrumentation for perfMeasure', // Description of metric
  [] // Define a custom label 'success'
)

const logger: ILogger = new ConsoleLogger()

// # setup application config
const appConfig = {
  kafka: {
    host: process.env.KAFKA_HOST
  }
}

const kafkaConsumerOptions: KafkaGenericConsumerOptions = {
  client: {
    kafkaHost: appConfig.kafka.host,
    groupId: 'perf_measure_consumer' + Date.now().toString(),
    fromOffset: 'latest'
  },
  topics: [TransfersTopics.DomainEvents]
}

const kafkaConsumerOptionsMl: KafkaGenericConsumerOptions = {
  client: kafkaConsumerOptions.client,
  topics: [MLTopics.Events]
}

const buckets: Map<number, {counter: number, totalTimeMs: number}> = new Map<number, {counter: number, totalTimeMs: number}>()
const evtMap: Map<string, number> = new Map<string, number>()

function logRPS (): void {
  const lastSecond = Math.floor(Date.now() / 1000) - 1
  const bucketData = buckets.get(lastSecond)
  let counter = 0
  let avg = 0

  if (bucketData !== undefined) {
    counter = bucketData.counter
    avg = Math.floor(bucketData.totalTimeMs / bucketData.counter)
  }
  // eslint-disable-next-line no-console
  console.log(`\n *** ${counter} req/sec *** ${avg} avg ms *** ${evtMap.size} pending *** \n`)

  if (buckets.has(lastSecond - 1)) {
    buckets.delete(lastSecond - 1)
  } // clean up old

  setTimeout(() => {
    logRPS()
  }, 1000)
}

function recordCompleted (timeMs: number, transferId: string): void {
  const currentSecond = Math.floor(Date.now() / 1000)
  const bucketData = buckets.get(currentSecond) ?? { counter: 0, totalTimeMs: 0 }
  bucketData.counter++
  bucketData.totalTimeMs += timeMs
  buckets.set(currentSecond, bucketData)

  perfMetricsHisto.observe(timeMs)
}

const handlerForFulfilEvt = async (message: IDomainMessage): Promise<void> => {
  if (message.msgName === 'TransferFulfilledEvt') {
    const reqReceivedAt = evtMap.get(message.aggregateId)
    if (reqReceivedAt != null) {
      // console.log(`Prepare leg completed for transfer id: ${message.aggregateId} took: - ${message.msgTimestamp - reqReceivedAt} ms`)
      recordCompleted(message.msgTimestamp - reqReceivedAt, message.aggregateId)
      evtMap.delete(message.aggregateId)
    }

    // decrease even if we don't have it here in mem
    perfMetricsPendingGauge.dec()
  }
}

const handlerForInitialReqEvt = async (message: IDomainMessage): Promise<void> => {
  if (message.msgName === 'TransferPrepareRequestedEvt') {
    evtMap.set(message.aggregateId, message.msgTimestamp)
    perfMetricsPendingGauge.inc()
    // console.log(`Prepare leg started for transfer id: ${message.aggregateId} at: - ${new Date(message.msgTimestamp).toISOString()}`)
  }
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  logRPS()

  await metrics.init()

  const kafkaEvtConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(kafkaConsumerOptions, logger)
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await kafkaEvtConsumer.init(handlerForFulfilEvt)

  const kafkaEvtConsumerMl = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(kafkaConsumerOptionsMl, logger)
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await kafkaEvtConsumerMl.init(handlerForInitialReqEvt)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  // process.exit(0)
})

process.on('SIGINT', function () {
  // eslint-disable-next-line no-console
  console.log('Ctrl-C... collecting pending...')
  const now = Date.now()

  evtMap.forEach((value, key) => {
    // eslint-disable-next-line no-console
    console.log(`Pending transfer - ID: ${key} - Timestamp: ${value} - Age: ${now - value} ms`)
  })

  process.exit(2)
})
