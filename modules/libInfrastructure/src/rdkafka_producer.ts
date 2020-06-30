/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - Donovan Changfoot <donovan.changfoot@coil.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'

import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { ILogger, IMessage } from '@mojaloop-poc/lib-domain'
import { MessageProducer, Options } from './imessage_producer'
import * as RDKafka from 'node-rdkafka'
import { NumberNullUndefined } from 'node-rdkafka'

type RDKafkaConfig = {
  producerConfig: RDKafka.ProducerGlobalConfig
  topicConfig: RDKafka.ProducerTopicConfig
}

export type RDKafkaProducerOptions = Options<RDKafkaConfig>
export class RDKafkaProducer extends MessageProducer {
  protected _logger: ILogger
  private readonly _options: RDKafkaProducerOptions
  private readonly _env_name: string
  private _client!: RDKafka.Producer

  constructor (options: RDKafkaProducerOptions, logger?: ILogger) {
    super()

    // make a copy of the options
    this._options = { ...options }

    this._logger = logger ?? new ConsoleLogger()

    this._logger.info('RDKafkaProducer instance created')
  }

  get envName (): string {
    return this._env_name
  }

  async init (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._logger.info('RDKafkaProducer initialising...')

      /* Global config: Mix incoming config with default config */
      const defaultGlobalConfig: RDKafka.ProducerGlobalConfig = {
      }
      const globalConfig = {
        ...defaultGlobalConfig,
        ...this._options.client.producerConfig
      }

      /* Topic config: Mix incoming config with default config */
      const defaultTopicConfig: RDKafka.ProducerGlobalConfig = {
      }
      const topicConfig = {
        ...defaultTopicConfig,
        ...this._options.client.topicConfig
      }

      /* Start and connect the client */
      this._client = new RDKafka.HighLevelProducer(globalConfig, topicConfig)
      this._client.connect(undefined, (err: RDKafka.LibrdKafkaError | null, data: RDKafka.Metadata) => {
        if (err !== null) {
          this._logger.info('RDKafkaProducer failed to connect with error:', err)
          reject(err)
        }
      })

      this._client.on('ready', () => {
        this._logger.info('RDKafkaProducer ...connected !')
        resolve()
      })

      this._client.on('event.error', () => {
        this._logger.error('RDKafkaProducer ...error !')
      })
    })
  }

  async destroy (): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._logger.info('RDKafkaProducer disconnect()-ing...')
      this._client.disconnect((err: any, _data: RDKafka.ClientMetrics) => {
        if (err !== null) {
          this._logger.error('RDKafkaProducer disconnect() failed', err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  connect (): void {
    throw new Error('Method connect() not implemented.')
  }

  pause (): void {
    throw new Error('Method pause() not implemented.')
  }

  resume (): void {
    throw new Error('Method resume() not implemented.')
  }

  disconnect (): void {
    throw new Error('Method disconnect() not implemented.')
  }

  async send (kafkaMessages: IMessage | IMessage[] | any): Promise<void> {
    return await new Promise((resolve, reject) => {
      if (!Array.isArray(arguments[0])) { kafkaMessages = [arguments[0]] as IMessage[] }

      kafkaMessages.forEach((kafkaMsg: IMessage) => {
        const msg = JSON.stringify(kafkaMsg)

        try {
          this._client.produce(
            /* topic name */
            kafkaMsg.msgTopic,
            /* partiton - if manually specified otherwise null */
            null,
            /* msg in form a buffer */
            Buffer.from(msg, 'utf-8'),
            /* key */
            kafkaMsg.msgKey,
            /* timestamp */
            null,
            /* callback */
            (err: any, _offset?: NumberNullUndefined) => {
              if (err !== null) {
                reject(err)
              } else {
                resolve()
              }
            }
          )
        } catch (err) {
          this._logger.error('RDKafkaProducer::send ...error !', err)
          throw err
        }
      })
    })
  }
}
