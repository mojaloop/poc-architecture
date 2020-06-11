/**
 * Created by pedro.barreto@bynder.com on 17/Jan/2019.
 */
'use strict'

import * as async from 'async'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { ILogger, IDomainMessage } from '@mojaloop-poc/lib-domain'
import { MessageConsumer, Options } from './imessage_consumer'
import { logLevel, Consumer, PartitionAssigners, ConsumerConfig, KafkaConfig, Kafka as Kafkajs } from 'kafkajs'

type KafkajsConfig = {
  client: KafkaConfig
  consumer: ConsumerConfig
}

export type KafkaJsConsumerOptions = Options<KafkajsConfig>
// export class KafkaGenericConsumer extends EventEmitter implements MessageConsumer {
export class KafkaJsConsumer extends MessageConsumer {
  private readonly _topics: string[]
  private _client!: Kafkajs
  private _consumer!: Consumer
  private readonly _initialized: boolean = false
  private readonly _syncQueue: async.AsyncQueue<any> | undefined
  private readonly _options: KafkaJsConsumerOptions

  private readonly _queue: any[] = []
  private readonly _processing: boolean = false
  private _handlerCallback!: (message: IDomainMessage) => void

  protected _logger: ILogger

  constructor (options: KafkaJsConsumerOptions, logger?: ILogger) {
    super()

    // make a copy of the options
    this._options = { ...options }

    let tempTopics
    if (typeof options.topics === 'string') {
      tempTopics = []
      tempTopics.push(options.topics)
    } else {
      tempTopics = options.topics
    }

    this._topics = tempTopics.map((topicName: string) => {
      return topicName
    })

    if (logger != null) {
      this._logger = new ConsoleLogger()
    }

    this._logger.info('instance created')
  }

  async destroy (forceCommit: boolean = false): Promise<void> {
    await this._consumer.disconnect()
  }

  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  async init (handlerCallback: (message: IDomainMessage) => void): Promise<void> {
    this._logger.info('initialising...')

    this._handlerCallback = handlerCallback

    const defaultKafkajsOptions: KafkajsConfig = {
      client: { // https://kafka.js.org/docs/configuration#options
        brokers: ['localhost:9092'],
        // connectionTimeout: 3000,
        // requestTimeout: 25000,
        // authenticationTimeout: 1000,
        // reauthenticationThreshold: 10000
        logLevel: logLevel.ERROR
      },
      consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
        groupId: 'notset',
        partitionAssigners: [PartitionAssigners.roundRobin]
        // metadataMaxAge: 300000,
        // sessionTimeout: 30000,
        // rebalanceTimeout: 60000,
        // heartbeatInterval: 3000,
        // maxBytesPerPartition: 1048576,
        // minBytes: 1,
        // maxBytes: 10485760,
        // maxWaitTimeInMs: 5000,
        // retry: { retries: 5 },
        // allowAutoTopicCreation: true,
        // maxInFlightRequests: undefined,
        // readUncommitted: false
      }
    }

    // copy default config
    const KafkajsOptions = { ...defaultKafkajsOptions }
    // override any values with the options given to the client
    Object.assign(KafkajsOptions, this._options.client)

    this._logger.debug(`Consumer options: \n${JSON.stringify(KafkajsOptions)}`)
    this._client = new Kafkajs(KafkajsOptions.client)
    this._consumer = this._client.consumer(KafkajsOptions.consumer)

    await this._consumer.connect()

    const fromBeginning = true
    if (Array.isArray(this._options.topics)) {
      for await (const topic of this._options.topics) {
        this._logger.info(`Consumer Subscribing to ${topic}`)
        await this._consumer.subscribe({ topic, fromBeginning })
      }
    } else {
      this._logger.info(`Consumr Subscribing to ${this._options.topics}`)
      await this._consumer.subscribe({ topic: this._options.topics, fromBeginning })
    }

    await this._consumer.run({
      autoCommit: false,
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const domainMessage = JSON.parse(message.value.toString()) as IDomainMessage
          await this._handlerCallback(domainMessage)
          // const admin = this._client.admin()
          // await admin.connect()
          // const offset = await admin.fetchTopicOffsets(topic)
          // this._logger.info(`current Offset=${offset}`)
        } catch (err) {
          // TODO: Deadletter queue or log scrapping to monitor this unhandled error?
          this._logger.error(err)
        } finally {
          const offset = (parseInt(message.offset) + 1).toString()
          const commitData = { topic, partition, offset }
          this._logger.debug(`committing - ${JSON.stringify(commitData)}`)
          await this._consumer.commitOffsets([
            commitData
          ])
        }
      }
    })
  }

  connect (): void {
    throw Error('Not Implemented')
  }

  pause (): void {
    throw Error('Not Implemented')
  }

  resume (): void {
    throw Error('Not Implemented')
  }

  disconnect (): void {
    throw Error('Not Implemented')
  }
}
