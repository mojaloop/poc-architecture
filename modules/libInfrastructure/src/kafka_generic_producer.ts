/**
 * Created by pedrosousabarreto@gmail.com on 17/Jan/2019.
 */
'use strict'

import * as kafka from 'kafka-node'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { ILogger, IMessage } from '@mojaloop-poc/lib-domain'

export class KafkaGenericProducer {
  protected _logger: ILogger
  private _client!: kafka.KafkaClient
  private readonly _kafka_conn_str: string
  private readonly _kafka_client_name: string
  private _producer!: kafka.HighLevelProducer
  private readonly _knownTopics = new Map<string, boolean>()

  constructor (kafkaConString: string, kafkaClientName: string, envName: string, logger?: ILogger) {
    this._kafka_conn_str = kafkaConString
    this._kafka_client_name = kafkaClientName

    this._env_name = envName

    if (logger != null && typeof (logger as any).child === 'function') {
      this._logger = (logger as any).child({ class: 'KafkaProducer' })
    } else {
      this._logger = new ConsoleLogger()
    }

    this._logger.info('KafkaGenericProducer instance created')
  }

  private readonly _env_name: string

  get envName (): string {
    return this._env_name
  }

  async init (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._logger.info('initialising...')

      const kafkaClientOptions: kafka.KafkaClientOptions = {
        kafkaHost: this._kafka_conn_str,
        clientId: this._kafka_client_name
      }

      this._client = new kafka.KafkaClient(kafkaClientOptions)
      this._producer = new kafka.HighLevelProducer(this._client, { partitionerType: 3 })

      this._producer.on('ready', async () => {
        this._logger.info('KafkaProducer ready!')

        // force refresh metadata to avoid BrokerNotAvailableError on first request
        // https://www.npmjs.com/package/kafka-node#highlevelproducer-with-keyedpartitioner-errors-on-first-send

        this._client.refreshMetadata([], async (err: Error) => {
          if (err != null) {
            this._logger.error(err, ' - error refreshMetadata()')
            return reject(err)
          }

          resolve()
        })
      })

      this._producer.on('error', (err: Error) => {
        this._logger.error(err, 'KafkaProducer on error')
      })
    })
  }

  async destroy (): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (this._producer != null) {
        this._producer?.close(() => {
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  // async send(kafkaMsg: IMessage, callback: (err?: Error, offset_data?: any) => void): Promise<>;
  async send(kafkaMsg: IMessage): Promise<void>;

  async send(kafkaMessages: IMessage[]): Promise<void>;

  /*
  # Commented out as it causes the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  async send (kafkaMessages: any): Promise<void> {
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    return await new Promise(async (resolve, reject) => {
      if (!Array.isArray(arguments[0])) { kafkaMessages = [arguments[0]] as IMessage[] }

      // const msgsByTopic: Map<string, kafka.KeyedMessage[]> = new Map<string, kafka.KeyedMessage[]>()
      const payloads: any[] = []

      // iterate the messages to parse and check them, and fill _knownTopics with first time topics
      kafkaMessages.forEach((kafkaMsg: IMessage) => {
        if (kafkaMsg.msgTopic == null) { throw new Error(`Invalid topic for message: ${kafkaMsg?.msgType}`) }

        let msg: string
        // let topic = this._env_name + "_"+ kafkaMsg.header.msgTopic; // prefix envName on all topics
        const topic = kafkaMsg.msgTopic
        const key = kafkaMsg.msgKey

        try {
          msg = JSON.stringify(kafkaMsg)
        } catch (e) {
          this._logger.error(e, +' - error parsing message')
          return process.nextTick(() => {
            reject(new Error('KafkaProducer - Error parsing message'))
          })
        }

        if (msg == null) {
          this._logger.error('invalid message in send_message')
          return process.nextTick(() => {
            reject(new Error('KafkaProducer - invalid or empty message'))
          })
        }

        // check for known topic and add null if not there
        if (!this._knownTopics.has(topic)) { this._knownTopics.set(topic, false) }

        const km = new kafka.KeyedMessage(key, msg)
        payloads.push({ topic: topic, messages: km, key: key })
        // payloads.push({topic: topic, messages: [km]});
        // payloads.push(km);
      })

      // make sure we refresh metadata for first time topics - otherwise we bet BrokerNotAvailable error on first time topic
      // const results = Promise.all(Array.from(this._knownTopics.entries()).map(async (item) => {
      //   const topicName = item[0]
      //   const val = item[1]
      //   if (val) { return }

      //   return this._refreshMetadata(topicName)
      //   // this._knownTopics.set(topicName, true)
      //   // return
      // }))

      // await results.catch(err => {
      //   reject(err)
      // }).then(async () => {
      //   this._producer.send(payloads, (err?: Error | null, data?: any) => {
      //     if (err != null) {
      //       this._logger.error(err, 'KafkaGenericProducer error sending message')
      //       return reject(err)
      //     }
      //     console.log('KafkaGenericProducer sent message - response:', data)
      //     resolve(data)
      //   })
      // })

      this._producer.send(payloads, (err?: Error | null, data?: any) => {
        if (err != null) {
          this._logger.error(err, 'KafkaGenericProducer error sending message')
          return reject(err)
        }
        console.log('KafkaGenericProducer sent message - response:', data)
        resolve(data)
      })
    })
  }

  /*
  # Attempt to resolve the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  // async send (kafkaMessages: any): Promise<void> {
  //   if (!Array.isArray(arguments[0])) { kafkaMessages = [arguments[0]] as IMessage[] }

  //   // const msgsByTopic: Map<string, kafka.KeyedMessage[]> = new Map<string, kafka.KeyedMessage[]>()
  //   const payloads: any[] = []

  //   // iterate the messages to parse and check them, and fill _knownTopics with first time topics
  //   kafkaMessages.forEach((kafkaMsg: IMessage) => {
  //     if (kafkaMsg.msgTopic == null) { throw new Error(`Invalid topic for message: ${kafkaMsg?.msgType}`) }

  //     let msg: string
  //     // let topic = this._env_name + "_"+ kafkaMsg.header.msgTopic; // prefix envName on all topics
  //     const topic = kafkaMsg.msgTopic
  //     const key = kafkaMsg.msgKey

  //     try {
  //       msg = JSON.stringify(kafkaMsg)
  //     } catch (e) {
  //       this._logger.error(e, +' - error parsing message')
  //       return process.nextTick(() => {
  //         throw new Error('KafkaProducer - Error parsing message')
  //       })
  //     }

  //     if (msg == null) {
  //       this._logger.error('invalid message in send_message')
  //       return process.nextTick(() => {
  //         throw new Error('KafkaProducer - invalid or empty message')
  //       })
  //     }

  //     // check for known topic and add null if not there
  //     if (!this._knownTopics.has(topic)) { this._knownTopics.set(topic, false) }

  //     const km = new kafka.KeyedMessage(key, msg)
  //     payloads.push({ topic: topic, messages: km, key: key })
  //     // payloads.push({topic: topic, messages: [km]});
  //     // payloads.push(km);
  //   })

  //   /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  //   return new Promise(async (resolve, reject) => {
  //     this._producer.send(payloads, (err?: Error | null, data?: any) => {
  //       if (err != null) {
  //         this._logger.error(err, 'KafkaGenericProducer error sending message')
  //         reject(err)
  //       }
  //       console.log('KafkaGenericProducer sent message - response:', data)
  //       resolve(data)
  //     })
  //   })
  //   // # make sure we refresh metadata for first time topics - otherwise we bet BrokerNotAvailable error on first time topic
  //   // return new Promise(async (resolve, reject) => {
  //   //   Promise.all(Array.from(this._knownTopics.entries()).map(async (item) => {
  //   //     const topicName = item[0]
  //   //     const val = item[1]
  //   //     if (val) { return false }

  //   //     await this._refreshMetadata(topicName)
  //   //     this._knownTopics.set(topicName, true)
  //   //     return true
  //   //   })).catch(err => {
  //   //     reject(err)
  //   //   }).then(async () => {
  //   //       this._producer.send(payloads, (err?: Error | null, data?: any) => {
  //   //       if (err != null) {
  //   //         this._logger.error(err, 'KafkaGenericProducer error sending message')
  //   //         reject(err)
  //   //       }
  //   //       console.log('KafkaGenericProducer sent message - response:', data)
  //   //       resolve(data)
  //   //     })
  //   //   })
  //   // })
  // }

  private async _refreshMetadata (topicName: string): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._client.refreshMetadata([topicName], async (err?: Error) => {
        if (err != null) {
          this._logger.error(err, ' - error refreshMetadata()')
          return reject(err)
        }

        this._client.topicExists([topicName], (error?: kafka.TopicsNotExistError | any) => {
          if (error != null) { return reject(error) }

          resolve()
        })
      })
    })
  }
}
