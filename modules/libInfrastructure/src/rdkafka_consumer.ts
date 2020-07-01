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

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'

import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import * as RDKafka from 'node-rdkafka'
import { ILogger, IDomainMessage } from '@mojaloop-poc/lib-domain'
import { MessageConsumer, Options } from './imessage_consumer'
import { RdKafkaCommitMode } from '.'

type RDKafkaConfig = {
  consumerConfig: RDKafka.ConsumerGlobalConfig
  topicConfig: RDKafka.ConsumerTopicConfig
  rdKafkaCommitWaitMode: RdKafkaCommitMode
}

export type RDKafkaConsumerOptions = Options<RDKafkaConfig>
export class RDKafkaConsumer extends MessageConsumer {
  protected _logger: ILogger
  private readonly _options: RDKafkaConsumerOptions
  private readonly _env_name: string
  private _client!: RDKafka.KafkaConsumer

  constructor (options: RDKafkaConsumerOptions, logger?: ILogger) {
    super()

    // make a copy of the options
    this._options = { ...options }

    this._logger = logger ?? new ConsoleLogger()

    this._logger.info('RDKafkaConsumer instance created')
  }

  async init (handlerCallback: (message: IDomainMessage) => Promise<void>): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._logger.info('RDKafkaConsumer initialising...')

      /* Global config: Mix incoming config with default config */
      const defaultGlobalConfig: RDKafka.ConsumerGlobalConfig = {
      }
      const globalConfig = {
        ...defaultGlobalConfig,
        ...this._options.client.consumerConfig
      }

      /* Topic config: Mix incoming config with default config */
      const defaultTopicConfig: RDKafka.ConsumerTopicConfig = {
      }
      const topicConfig = {
        ...defaultTopicConfig,
        ...this._options.client.topicConfig
      }

      /* Start and connect the client */
      this._client = new RDKafka.KafkaConsumer(globalConfig, topicConfig)
      this._client.connect()

      const autoCommitEnabled = this._options.client.consumerConfig['enable.auto.commit']
      const commitWaitMode = this._options.client.rdKafkaCommitWaitMode

      this._logger.info(`RDKafkaConsumer autoCommitEnabled is ${autoCommitEnabled}, commitWaitMode is ${commitWaitMode}`)

      const consumeRecursiveWrapper = (): void => {
        /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
        this._client.consume(1, async (err: RDKafka.LibrdKafkaError, messages: RDKafka.Message[]) => {
          if (err !== null) {
            this._logger.error('RDKafkaConsumer got callback with err:', JSON.stringify(err))
          } else {
            if (messages.length > 0) {
              // this._logger.info(`RDKafkaConsumer got callback with data: ${JSON.stringify(messages)}`)
              const msgValue = messages[0].value
              if (msgValue != null) {
                const msgAsString = msgValue.toString()
                let msgAsDomainMessage
                try {
                  msgAsDomainMessage = JSON.parse(msgAsString) as IDomainMessage
                } catch (err) {
                  this._logger.error('RDKafkaConsumer Error when JSON.parse()-ing message')
                }
                if (msgAsDomainMessage != null) {
                  await handlerCallback(msgAsDomainMessage)

                  if (!autoCommitEnabled) {
                    switch (commitWaitMode) {
                      case RdKafkaCommitMode.RDKAFKA_COMMIT_NO_WAIT:
                        this._client.commitMessage(messages[0])
                        break
                      case RdKafkaCommitMode.RDKAFKA_COMMIT_MSG_SYNC:
                        this._client.commitMessageSync(messages[0])
                        break
                      default:
                        this._logger.error('RDKafkaConsumer unknown commitWaitMode - no commits will happen!')
                    }
                  }
                }
              } else {
                this._logger.error('RDKafkaConsumer Received message with value==NULL.')
              }
            }
          }
          consumeRecursiveWrapper()
        })
      }

      this._client.on('ready', () => {
        this._logger.info('RDKafkaConsumer ...connected !')
        this._logger.info(`RDKafkaConsumer Subscribing to topics ${JSON.stringify(this._options.topics)}`)
        if (Array.isArray(this._options.topics)) {
          this._client.subscribe(this._options.topics)
        } else if (typeof this._options.topics === 'string') {
          this._client.subscribe([this._options.topics])
        }
        consumeRecursiveWrapper()
        resolve()
      })
    })
  }

  async destroy (forceCommit: boolean): Promise<void> {
    return await new Promise((resolve, reject) => {
      this._logger.info('RDKafkaConsumer disconnect()-ing...')
      this._client.disconnect((err: any, _data: RDKafka.ClientMetrics) => {
        if (err !== null) {
          this._logger.error('RDKafkaConsumer disconnect() failed', err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  connect (): void {
    throw new Error('Method not implemented.')
  }

  pause (): void {
    throw new Error('Method not implemented.')
  }

  resume (): void {
    throw new Error('Method not implemented.')
  }

  disconnect (): void {
    throw new Error('Method not implemented.')
  }
}
