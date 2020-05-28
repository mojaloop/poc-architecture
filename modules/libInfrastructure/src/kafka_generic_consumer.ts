/**
 * Created by pedro.barreto@bynder.com on 17/Jan/2019.
 */
'use strict'

import { EventEmitter } from 'events'
import * as lo from 'lodash'
import * as kafka from 'kafka-node'
import * as async from 'async'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { ILogger, IMessage } from '@mojaloop-poc/lib-domain'
import { promises } from 'fs'

const MAX_PROCESSING_TIMEOUT = 30 * 1000

export enum EnumOffset {
  LATEST = 'latest'
}

export class KafkaGenericConsumer extends EventEmitter {
  // private _client: kafka.Client;
  private readonly _topics: string[]
  private _consumerGroup!: kafka.ConsumerGroup
  private readonly _consumerGroupName: string
  private readonly _kafkaConnStr: string
  private readonly _kafkaClientName: string
  private _initialized: boolean = false
  private readonly _envName: string
  private _syncQueue: async.AsyncQueue<any>

  private readonly _queue: any[] = []
  private _processing: boolean = false
  // private _handlerCallback!: (msg: any, callback: () => void) => void
  private _handlerCallback!: (msg: any) => void
  private readonly _fromOffset: EnumOffset

  protected _logger: ILogger

  constructor (
    kafkaConString: string,
    kafkaClientName: string,
    kafkaConsumerGroup: string,
    topics: string | string[], 
    envName: string,
    fromOffset: EnumOffset.LATEST,
    logger?: ILogger
  ) {
    super()

    this._kafkaConnStr = kafkaConString
    this._kafkaClientName = kafkaClientName
    this._consumerGroupName = kafkaConsumerGroup

    

    this._envName = envName ?? process.env.NODE_ENV ?? 'dev'

    if (typeof topics === 'string') { topics = [topics] }

    this._topics = topics.map((topic_name) => {
      return topic_name
      // return this._envName + '_' + topic_name
    })

    this._fromOffset = fromOffset

    if (logger && typeof (<any>logger).child === 'function') {
      this._logger = (<any>logger).child({
        class: 'KafkaConsumer2',
        kafkaTopics: this._topics.join(','),
        kafkaGroupname: this._consumerGroupName
      })
    } else {
      this._logger = new ConsoleLogger()
    }

    this._logger.info('instance created')
  }

  destroy (forceCommit: boolean = false, callback?: (err?: Error) => void) {
    if (this._consumerGroup && this._consumerGroup.close) {
      this._consumerGroup.close(forceCommit, (callback ?? (() => {
      })))
    } else {
      if (callback) { return callback() }
    }
  }

  removeHandler () {
    this._handlerCallback = () => {} // noop
  }

  setHandler (handlerCallback: (msg: any) => void) {
    this._handlerCallback = handlerCallback
    // this._processQueue()
  }

  async init () : Promise<void> {
    return await new Promise((resolve, reject) => {
      this._logger.info('initialising...')

      const consumerGroupOptions = {
        kafkaHost: this._kafkaConnStr,
        id: this._kafkaClientName,
        groupId: this._consumerGroupName,
        sessionTimeout: 15000,
        // An array of partition assignment protocols ordered by preference.
        // 'roundrobin' or 'range' string for built ins (see below to pass in custom assignment protocol)
        protocol: ['roundrobin'],
        autoCommit: false, // this._auto_commit,
        // Offsets to use for new groups other options could be 'earliest' or 'none' (none will emit an error if no offsets were saved)
        // equivalent to Java client's auto.offset.reset
        fromOffset: this._fromOffset, // "latest", // default is latest
        // outOfRangeOffset: 'earliest', // default is earliest
        // migrateHLC: false,    // for details please see Migration section below
        // migrateRolling: true,
        // migrateHLC: true, // default is false
        // migrateRolling: false, // default is true
        connectOnReady: true, // this._connect_on_ready,
        // connectOnReady: false // this._connect_on_ready,
        // // paused: true
        // kafkaHost: 'localhost:9092', // connect directly to kafka broker (instantiates a KafkaClient)
        batch: undefined, // put client batch settings if you need them
        // ssl: true, // optional (defaults to false) or tls options hash
        encoding: 'utf8', // default is utf8, use 'buffer' for binary data
        // commitOffsetsOnFirstJoin: true, // on the very first time this consumer group subscribes to a topic, record the offset returned in fromOffset (latest/earliest)
        // how to recover from OutOfRangeOffset error (where save offset is past server retention) accepts same value as fromOffset
        // outOfRangeOffset: 'earliest', // default
        // Callback to allow consumers with autoCommit false a chance to commit before a rebalance finishes
        // isAlreadyMember will be false on the first connection, and true on rebalances triggered after that
        // onRebalance: (isAlreadyMember, callback) => { callback(); } // or null
        autoConnect: true,
      }
      this._logger.info(`options: \n${JSON.stringify(consumerGroupOptions)}`)
  
      this._consumerGroup = new kafka.ConsumerGroup(
        consumerGroupOptions as kafka.ConsumerGroupOptions, this._topics
      )
  
      this._consumerGroup.on('error', (err: Error) => {
        this._logger.error(err, ' - consumer error')
        process.nextTick(() => {
          this.emit('error', err)
        })
      })
  
      this._consumerGroup.on('offsetOutOfRange', (err) => {
        this._logger.error(err, ' - offsetOutOfRange consumer error')
        process.nextTick(() => {
          this.emit('error', err)
        })
      })
  
      this._consumerGroup.on('connect', () => {
        if (!this._initialized) {
          this._logger.info('first on connect')
  
          this._initialized = true
          process.nextTick(() => {
            resolve()
          })
        } else {
          this._logger.info('on connect - (re)connected')
        }
      })
  
      this._consumerGroup.client.on('ready', () => {
        this._logger.info('on ready')
      })
  
      this._consumerGroup.client.on('reconnect', () => {
        this._logger.info('on reconnect')
      })

      // this.on('commit', (data) => {
      //   this._logger.info(`commit - ${JSON.stringify(data)}`)
      // })

      // hook on message
      // this._consumerGroup.on('message', this.messageHandler.bind(this));
      this._consumerGroup.on('message', (message: any) => {
        const logger = this._logger
        // this._logger.info(`MESSAGE:${JSON.stringify(message)}`)
        this._syncQueue.push({ message }, function (err) {
          if (err) {
            logger.error(`Consumer::_consumePoller()::syncQueue.push - error: ${err}`)
          }
        })
      })

      this._logger.info('async queue created')

      this._syncQueue = async.queue(async (message) => {
        // this._logger.debug(`async::queue() - message: ${JSON.stringify(message)}`)

        const msgMetaData = {
          key: message?.message?.key,
          timestamp: message?.message?.timestamp,
          topic: message.message?.topic,
          partition: message?.message?.partition,
          offset: message?.message?.offset,
          highWaterOffset: message?.message?.highWaterOffset,
          commitResult: undefined
        }

        if (!this._handlerCallback) {
          this._logger.debug(`async::queue() - message: ${JSON.stringify(message)}`)
          // if (queueCallbackDone) queueCallbackDone()
        }

        try {
          await this._handlerCallback(message)
        } catch (err) {
          this._logger.error(`async::queue() - error: ${err}`)
          this.emit('error', err)
          // if (queueCallbackDone) queueCallbackDone()
        } finally {
          if (!consumerGroupOptions.autoCommit) {
            const isCommited = await new Promise<boolean>( (resolve, reject) => {
              this._consumerGroup.commit( function(err, data) {
                msgMetaData.commitResult = data
                resolve(true)
              })
            })

            if (isCommited) {
              this.emit('commit', msgMetaData)
            }
          }
        }


        // Promise.resolve(this._handlerCallback(message, queueCallbackDone)).then(() => {
        //   this._logger.info(`Committing ${JSON.stringify(msgMetaData)}`)
        //   const emitter = super.emit
        //   this._consumerGroup.commit( function(err, data) {
        //     // console.log('test')
        //     // msgMetaData.commitResult = data
        //     // emitter('commit', msgMetaData)
        //   })
        // }).catch((err) => {
        //   this._logger.error(`async::queue() - error: ${err}`)
        //   super.emit('error', err)
        //   queueCallbackDone()
        // })
      }, 1)

      this._syncQueue.drain(() => {
        // do something here...
      })

    })
    // TODO need a timeout for this on-ready
  }

  connect () {
    (this._consumerGroup as any).connect()
  }

  pause () {
    this._consumerGroup.pause()
  }

  resume () {
    this._consumerGroup.resume()
  }

  // get_latest_offsets() {
  // 	return this._startup_latest_offsets;
  // }

  // messageHandler (message: any) {
  //   // console.log("message received - topic: '%s' offset: '%d' partition: '%d'", this._get_log_prefix(), message.topic, message.offset, message.partition);
  //   // let msg = lo.clone(message);

  //   try {
  //     // get key string from buffer
  //     // message.key = message.key.toString();

  //     if (!lo.isObject(message.value)) {
  //       try {
  //         message.value = JSON.parse(message.value)
  //       } catch (e) {
  //         this._logger.error(e, ' - error on messageHandler')
  //         return
  //       }
  //     }

  //     if (!message.value) { return }

  //     this._queue.push(message)
  //     this._processQueue.call(this)
  //   } catch (e) {
  //     this._logger.error(e, 'error sending message to handler - message was not commited to kafka')
  //   }
  // }

  close () {
    this._consumerGroup.close(false, () => {
    })
  }

  // _processQueue () {
  //   if (this._processing || this._queue.length <= 0 || !this._handlerCallback) { 
  //     return 
  //   }

  //   this._processing = true

  //   async.whilst(() => { return this._queue.length > 0 }, (next) => {
  //     const wrapped = async.timeout(this._handlerCallback, MAX_PROCESSING_TIMEOUT)

  //     wrapped(this._queue.shift(), (err: any) => {
  //       if (err && err.code === 'ETIMEDOUT') { this._logger.warn(`KafkaConsumer2 - handler timedout after ${MAX_PROCESSING_TIMEOUT} ms`) } else if (err) { this._logger.error(err) }

  //       next()
  //     })
  //   }, () => {
  //     this._processing = false
  //     if (this._queue.length > 0) { setTimeout(() => { this._processQueue() }, 0) }
  //   })
  // }
}
