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

* Coil
- Donovan Changfoot <donovan.changfoot@coil.com>

* Crosslake
- Pedro Sousa Barreto <pedrob@crosslaketech.com>

* ModusBox
- Miguel de Barros <miguel.debarros@modusbox.com>
- Roman Pietrzak <roman.pietrzak@modusbox.com>
*****/

'use strict'

// import * as kafka from 'kafka-node'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { ILogger, IMessage, IMessagePublisher } from '@mojaloop-poc/lib-domain'
import { RDKafkaProducer, RDKafkaProducerOptions } from './rdkafka_producer'

export class RDKafkaMessagePublisher implements IMessagePublisher {
  private readonly _producer: RDKafkaProducer
  protected _logger: ILogger

  constructor (options: RDKafkaProducerOptions, logger?: ILogger) {
    this._logger = logger ?? new ConsoleLogger()
    this._producer = new RDKafkaProducer(options, this._logger)
  }

  get envName (): string {
    return this._producer.envName
  }

  async init (): Promise<void> {
    return await this._producer.init()
  }

  async destroy (): Promise<void> {
    return await this._producer.destroy()
  }

  async publish (message: IMessage): Promise<void> {
    return await this._producer.send(message)
  }

  async publishMany (messages: IMessage[]): Promise<void> {
    return await this._producer.send(messages)
  }
}
