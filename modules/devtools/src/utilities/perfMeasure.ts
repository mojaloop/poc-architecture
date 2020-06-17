/**
 * Created by pedrosousabarreto@gmail.com on 04/Jun/2020.
 */

'use strict'

import { IDomainMessage, ILogger } from '@mojaloop-poc/lib-domain'
import { KafkaGenericConsumer, KafkaGenericConsumerOptions } from '@mojaloop-poc/lib-infrastructure'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

import * as dotenv from 'dotenv'
import { TransfersTopics, MLTopics } from '@mojaloop-poc/lib-public-messages'

// TODO: Figure a better way to handle env config here
dotenv.config({ path: '../../.env' })

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
    groupId: 'perf_measure_consumer',
    fromOffset: 'latest'
  },
  topics: [TransfersTopics.DomainEvents]
}

const kafkaConsumerOptionsMl: KafkaGenericConsumerOptions = {
  client: kafkaConsumerOptions.client,
  topics: [MLTopics.Events]
}

const buckets: Map<number, {counter: number, totalTimeMs: number}> = new Map<number, {counter: number, totalTimeMs: number}>()

function recordCompleted (timeMs: number, transferId: string): void {
  const currentSecond = Math.floor(Date.now() / 1000)
  const bucketData = buckets.get(currentSecond) ?? { counter: 0, totalTimeMs: 0 }
  bucketData.counter++
  bucketData.totalTimeMs += timeMs
  buckets.set(currentSecond, bucketData)

  evtMap.delete(transferId)
}

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

const evtMap: Map<string, number> = new Map<string, number>()

const evtHandler = (message: IDomainMessage): void => {
  // if (message.msgName === 'TransferPreparedEvt') {
  if (message.msgName === 'TransferFulfilledEvt') {
    const reqReceivedAt = evtMap.get(message.aggregateId)
    if (reqReceivedAt != null) {
      // console.log(`Prepare leg completed for transfer id: ${message.aggregateId} took: - ${message.msgTimestamp - reqReceivedAt} ms`)
      recordCompleted(message.msgTimestamp - reqReceivedAt, message.aggregateId)
    }
  }
}

const evtHandlerMl = (message: IDomainMessage): void => {
  if (message.msgName === 'TransferPrepareRequestedEvt') {
    evtMap.set(message.aggregateId, message.msgTimestamp)

    // console.log(`Prepare leg started for transfer id: ${message.aggregateId} at: - ${new Date(message.msgTimestamp).toISOString()}`)
  }
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  logRPS()
  const kafkaEvtConsumer = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(kafkaConsumerOptions, logger)
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  await kafkaEvtConsumer.init(evtHandler)

  const kafkaEvtConsumerMl = await KafkaGenericConsumer.Create<KafkaGenericConsumerOptions>(kafkaConsumerOptionsMl, logger)

  await kafkaEvtConsumerMl.init(evtHandlerMl)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  // process.exit(0)
})
