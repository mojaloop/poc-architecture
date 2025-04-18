/*****
License
--------------
Copyright © 2020-2025 Mojaloop Foundation
The Mojaloop files are made available by the Mojaloop Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Contributors
--------------
This is the official list of the Mojaloop project contributors for this file.
Names of the original copyright holders (individuals or organizations)
should be listed with a '*' in the first column. People who have
contributed from an organization can be listed under the organization
that actually holds the copyright for their contributions (see the
Mojaloop Foundation for an example). Those individuals should have
their names indented and be marked with a '-'. Email address can be added
optionally within square brackets <email>.

* Mojaloop Foundation
- Name Surname <name.surname@mojaloop.io>

* Lazola Lucas <lazola.lucas@modusbox.com>

* Rajiv Mothilal <rajiv.mothilal@modusbox.com>

* Miguel de Barros <miguel.debarros@modusbox.com>
*****/

/**
 * Kafka Producer
 * @module Producer
 */

'use strict'

const EventEmitter = require('events')
const Logger = require('@mojaloop/central-services-logger')
const Kafka = require('node-rdkafka')
// const Protocol = require('./protocol')

/**
 * Producer ENUMs
 *
 * This ENUM is for the events for the produced message
 *
 * The HTTP method for the process
 *
 * This ENUM is for the HTTP method that called the producer
 *
 * @typedef {object} ENUMS~METHOD
 * @property {string} get
 * @property {string} post
 * @property {string} put
 * @property {string} delete
 */
const METHOD = {
  get: 'get',
  post: 'post',
  put: 'put',
  del: 'delete'
}
/**
 * The status of the process being posted to the topic
 *
 * This ENUM is for the STATUS of the message being produced
 *
 * @typedef {object} ENUMS~STATUS
 * @property {string} success - successful validation passed
 * @property {string} failed - failed validation
 * @property {string} pending - pending processing
 */
const STATUS = {
  success: 'success',
  failure: 'failed',
  pending: 'pending'
}
/**
 * ENUMS
 *
 * Global ENUMS object
 *
 * @typedef {object} ENUMS
 * @property {object} METHOD - This ENUM is for the METHOD
 * @property {object} STATUS - This ENUM is for the STATUS
 */
const
  ENUMS = {
    METHOD,
    STATUS
  }

/**
 * Ready event.
 *
 * @event Producer#ready
 * @type {object}
 * @property {string} - emits 'ready' on producer event ready
 */

/**
 * Producer class for adding messages to Kafka
 *
 * This is the main entry point for writing data to Kafka. You
 * configure this like you do any other client, with a global
 * configuration and default topic configuration.
 *
 * @example
 * let producer = new Producer({
 *  options: {
 *   {
 *     pollIntervalMs: 50,
 *     messageCharset: 'utf8'
 *   },
 *   rdkafkaConf: {
 *     'metadata.broker.list': 'localhost:9092',
 *     'client.id': 'default-client',
 *     'event_cb': true,
 *     'compression.codec': 'none',
 *     'retry.backoff.ms': 100,
 *     'message.send.max.retries': 2,
 *     'socket.keepalive.enable': true,
 *     'queue.buffering.max.messages': 10,
 *     'queue.buffering.max.ms': 50,
 *     'batch.num.messages': 10000,
 *     'api.version.request': true,
 *     'dr_cb': true
 *   },
 *   topicConf: {
 *    'request.required.acks': 1
 *   }
 * })
 *
 *  * @fires Producer#ready
 *
 * @param {object} options - Key value pairs for mapping to the configuration
 * @param {object} config - Key value pairs for the configuration of the Producer with the following:
 * rdkafkaConf - specific rdkafka configurations [Refer to configuration doc]{@link https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md}
 * topicConf - topic configuration
 * logger - logger object that supports debug(), info(), verbose(), error() & silly()
 * pollIntervalMs - is the number that will be passed to setPollInterval() when connected. Default is 50
 * @extends EventEmitter
 * @constructor
 */
class Producer extends EventEmitter {
  constructor (config = {}) {
    super()
    if (!config) {
      config = {}
    }
    if (!config.options) {
      config.options = {
        messageCharset: 'utf8'
      }
    }
    if (!config.options.pollIntervalMs) {
      config.options.pollIntervalMs = 50
    }
    if (!config.rdkafkaConf) {
      config.rdkafkaConf = {
        'metadata.broker.list': 'localhost:9092',
        'client.id': 'default-client',
        event_cb: true,
        'compression.codec': 'none',
        'retry.backoff.ms': 100,
        'message.send.max.retries': 2,
        'socket.keepalive.enable': true,
        'queue.buffering.max.messages': 10,
        'queue.buffering.max.ms': 50,
        'batch.num.messages': 100,
        'api.version.request': true,
        dr_cb: true
      }
    }
    if (!config.topicConf) {
      config.topicConf = {
        'request.required.acks': 1
      }
    }
    if (!config.logger) {
      config.logger = Logger
    }
    const { logger } = config
    Logger.isSillyEnabled && logger.silly('Producer::constructor() - start')
    this._config = config
    this._status = {}
    this._status.runningInProduceMode = false
    this._status.runningInProduceBatchMode = false
    Logger.isSillyEnabled && logger.silly('Producer::constructor() - end')
  }

  /**
   * Connect Producer
   *
   * @fires Producer#ready
   *
   * @async
   * Connects the producer to the Kafka broker.
   * @returns {Promise} - Returns a promise: resolved if successful, or rejection if connection failed
   */
  async connect () {
    const { logger } = this._config
    Logger.isSillyEnabled && logger.silly('Producer::connect() - start')
    return new Promise((resolve, reject) => {
      this._producer = new Kafka.Producer(this._config.rdkafkaConf, this._config.topicConf)

      this._producer.on('event.log', log => {
        Logger.isSillyEnabled && logger.silly(log.message)
      })

      this._producer.on('event.error', error => {
        super.emit('error', error)
      })

      this._producer.on('error', error => {
        super.emit('error', error)
      })

      this._producer.on('delivery-report', (report) => {
        Logger.isDebugEnabled && logger.debug('DeliveryReport: ' + JSON.stringify(report))
      })

      this._producer.on('disconnected', () => {
        Logger.isWarnEnabled && logger.warn('Disconnected.')
      })

      this._producer.on('ready', (args) => {
        Logger.isDebugEnabled && logger.debug(`Native producer ready v. ${Kafka.librdkafkaVersion}, e. ${Kafka.features.join(', ')}.`)
        // Passing non-integer (including "undefined") to setPollInterval() may cause unexpected behaviour, which is hard to trace.
        if (!Number.isInteger(this._config.options.pollIntervalMs)) {
          return reject(new Error('pollIntervalMs should be integer'))
        }
        this._producer.setPollInterval(this._config.options.pollIntervalMs)
        super.emit('ready', args)
        resolve(true)
      })

      Logger.isSillyEnabled && logger.silly('Connecting..')
      this._producer.connect(null, (error, metadata) => {
        if (error) {
          super.emit('error', error)
          Logger.isSillyEnabled && logger.silly('Consumer::connect() - end')
          return reject(error)
        }
        // this.subscribe()
        Logger.isSillyEnabled && logger.silly('Consumer metadata:')
        Logger.isSillyEnabled && logger.silly(metadata)
        resolve(true)
      })
    })
  }

  _createBuffer (str, encoding) {
    const bufferResponse = Buffer.from(JSON.stringify(str), encoding)
    return bufferResponse
  }

  /**
   * @async
   * produces a kafka message to a certain topic
   * @typedef {object} messageProtocol, contains message related data to be converted into a LIME protocol message
   * @property {object} content - value object for the message
   * @property {string} id - unique identifier for message
   * @property {string} from - uri of the initiating fsp
   * @property {string} to - uri of the receiving fsp
   * @property {object} metadata -  data relevant to the context of the message
   * @property {string} type - MIME declaration of the content type of the message
   * @property {string} pp - Optional for the sender, when is considered the identity of the session. Is mandatory in the destination if the identity of the originator is different of the identity of the from property.
   *
   *
   * @typedef {object} topicConf - contains Kafka topic related data
   * @property {*} opaqueKey - optional opaque token, which gets passed along to your delivery reports
   * @property {string} topicName - name of the topic to produce to
   * @property {string} key - optional message key
   * @property {number} partition - optional partition to produce to
   *
   * @todo Validate messageProtocol
   * @todo Validate topicConf
   *
   * @returns {boolean} or if failed {Error}
   */
  async sendMessage (messageProtocol, topicConf) {
    const { logger } = this._config
    try {
      if (!this._producer) {
        throw new Error('You must call and await .connect() before trying to produce messages.')
      }
      if (this._producer._isConnecting) {
        Logger.isDebugEnabled && logger.debug('still connecting')
      }

      // ## Commented out the following line to support the PoC events
      // const parsedMessage = Protocol.parseMessage(messageProtocol)
      // ## Added for PoC-Architecture Stream - START1
      const parsedMessage = Object.assign({}, messageProtocol)
      // ## Added for PoC-Architecture Stream - END
      const parsedMessageBuffer = this._createBuffer(parsedMessage, this._config.options.messageCharset)
      if (!parsedMessageBuffer || !(typeof parsedMessageBuffer === 'string' || Buffer.isBuffer(parsedMessageBuffer))) {
        throw new Error('message must be a string or an instance of Buffer.')
      }
      Logger.isDebugEnabled && logger.debug('Producer::send() - start %s', JSON.stringify({
        topicName: topicConf.topicName,
        partition: topicConf.partition,
        key: topicConf.key
      }))
      const producedAt = Date.now()
      await this._producer.produce(topicConf.topicName, topicConf.partition, parsedMessageBuffer, topicConf.key, producedAt, topicConf.opaqueKey)
      return true
    } catch (e) {
      Logger.isDebugEnabled && logger.debug(e)
      throw e
    }
  }

  /**
   * Disconnect producer
   *
   * Disconnects producer from the Kafka broker
   */
  disconnect (cb = () => {}) {
    if (this._producer) {
      this._producer.flush()
      this._producer.disconnect(cb)
    }
  }

  /**
   * Get client metadata.
   *
   * RDKAFKA:
   *
   * Note: using a <code>metadataOptions.topic</code> parameter has a potential side-effect.
   * A Topic object will be created, if it did not exist yet, with default options
   * and it will be cached by librdkafka.
   *
   * A subsequent call to create the topic object with specific options (e.g. <code>acks</code>) will return
   * the previous instance and the specific options will be silently ignored.
   *
   * To avoid this side effect, the topic object can be created with the expected options before requesting metadata,
   * or the metadata request can be performed for all topics (by omitting <code>metadataOptions.topic</code>).
   *
   * @param {object} metadataOptions - Metadata options to pass to the client.
   * @param {string} metadataOptions.topic - Topic string for which to fetch
   * metadata
   * @param {number} metadataOptions.timeout - Max time, in ms, to try to fetch
   * metadata before timing out. Defaults to 30,000 (30 seconds).
   * @param {Client~metadataCallback} metaDataCb - Callback to fire with the metadata.
   */
  getMetadata (metadataOptions, metaDataCb) {
    if (!metaDataCb || typeof metaDataCb !== 'function') {
      metaDataCb = () => {}
    }
    const { logger } = this._config
    Logger.isSillyEnabled && logger.silly('Producer::getMetadata() - start')
    this._producer.getMetadata(metadataOptions, metaDataCb)
    Logger.isSillyEnabled && logger.silly('Producer::getMetadata() - end')
  }
}

module.exports = Producer
module.exports.ENUMS = ENUMS
