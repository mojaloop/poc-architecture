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

import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
import { ILogger } from '@mojaloop-poc/lib-domain'
import * as dotenv from 'dotenv'
import { Command } from 'commander'
import { resolve as Resolve } from 'path'

export const logger: ILogger = new ConsoleLogger()

const Program = new Command()
Program
  .version('0.1')
  .description('CLI to manage Participant Handlers')
Program.command('handler')
  .alias('h')
  .description('Start Participant Handlers') // command description
  .option('-c, --config [configFilePath]', '.env config file')
  .option('--example', 'example switch')

  // function to execute when command is uses
  .action(async (args: any): Promise<void> => {
    // #env file
    const configFilePath = args.config
    const dotenvConfig: any = {
      debug: true
    }
    if (configFilePath != null) {
      dotenvConfig.path = Resolve(process.cwd(), configFilePath)
    }
    dotenv.config(dotenvConfig)

    // # setup application config
    const appConfig = {
      kafka: {
        host: process.env.KAFKA_HOST
      },
      redis: {
        host: process.env.REDIS_HOST
      }
    }

    logger.isDebugEnabled() && logger.debug(`appConfig=${JSON.stringify(appConfig)}`)

    // TODO: add logic here to handle pub tool commands

    // lets clean up all consumers here
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    const killProcess = async (): Promise<void> => {
      logger.isInfoEnabled() && logger.info('Exiting process...')
      logger.isInfoEnabled() && logger.info('Exit complete!')
      process.exit(2)
    }
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    process.on('SIGINT', killProcess)
  })

if (Array.isArray(process.argv) && process.argv.length > 2) {
  // parse command line vars
  Program.parse(process.argv)
} else {
  // display default help
  Program.help()
}
