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
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MessageConsumer } from '@mojaloop-poc/lib-infrastructure'
import * as ParticipantCmdHandler from './participantCmdHandler'

export const logger: ILogger = new ConsoleLogger()

export const appConfig = {
  kafka: {
    host: 'localhost:9092'
  },
  redis: {
    host: 'redis://localhost:6379'
  }
}

const start = async (): Promise<void> => {
  // list of all handlers
  const consumerHandlerList: MessageConsumer[] = []

  // start all handlers here
  consumerHandlerList.push(await ParticipantCmdHandler.start(appConfig, logger))

  // lets clean up all consumers here
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  const killProcess = async (): Promise<void> => {
    logger.info('Exiting process...')
    logger.info('Disconnecting handlers...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    consumerHandlerList.forEach(async (consumer) => {
      logger.info(`\tDestroying handler...${consumer.constructor.name}`)
      await consumer.destroy(true)
    })
    logger.info('Exit complete!')
    process.exit(2)
  }
  /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
  process.on('SIGINT', killProcess)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
