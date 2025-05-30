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

import { MojaLogger, Metrics, TMetricOptionsType } from '@mojaloop-poc/lib-utilities'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { TApiServerOptions, ApiServer, IRunHandler, KafkaInfraTypes, RdKafkaCommitMode } from '@mojaloop-poc/lib-infrastructure'
import { SimulatorEvtHandler } from './simulatorEvtHandler'
import * as dotenv from 'dotenv'
import { Command } from 'commander'
import { resolve as Resolve } from 'path'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const pckg = require('../../package.json')

const Program = new Command()
Program
  .version('0.1')
  .description('CLI to manage Simulator Handlers')
Program.command('handler')
  .alias('h')
  .description('Start Simulator Handlers') // command description
  .option('--disableApi', 'Disable API server for health & metrics')
  .option('-c, --config [configFilePath]', '.env config file')

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
      api: {
        host: (process.env.SIMULATOR_API_HOST != null) ? process.env.SIMULATOR_API_HOST : '0.0.0.0',
        port: (process.env.SIMULATOR_API_PORT != null && !isNaN(Number(process.env.SIMULATOR_API_PORT)) && process.env.SIMULATOR_API_PORT?.trim()?.length > 0) ? Number.parseInt(process.env.SIMULATOR_API_PORT) : 4000
      },
      kafka: {
        host: (process.env.KAFKA_HOST != null) ? process.env.KAFKA_HOST : 'localhost:9092',
        consumer: (process.env.KAFKA_CONSUMER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_CONSUMER,
        producer: (process.env.KAFKA_PRODUCER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_PRODUCER,
        autocommit: (process.env.KAFKA_AUTO_COMMIT === 'true'),
        autoCommitInterval: (process.env.KAFKA_AUTO_COMMIT_INTERVAL != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_INTERVAL)) && process.env.KAFKA_AUTO_COMMIT_INTERVAL?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL) : null,
        autoCommitThreshold: (process.env.KAFKA_AUTO_COMMIT_THRESHOLD != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_THRESHOLD)) && process.env.KAFKA_AUTO_COMMIT_THRESHOLD?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_THRESHOLD) : null,
        rdKafkaCommitWaitMode: (process.env.RDKAFKA_COMMIT_WAIT_MODE == null) ? RdKafkaCommitMode.RDKAFKA_COMMIT_MSG_SYNC : process.env.RDKAFKA_COMMIT_WAIT_MODE,
        gzipCompression: (process.env.KAFKA_PRODUCER_GZIP === 'true'),
        fetchMinBytes: (process.env.KAFKA_FETCH_MIN_BYTES != null && !isNaN(Number(process.env.KAFKA_FETCH_MIN_BYTES)) && process.env.KAFKA_FETCH_MIN_BYTES?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_FETCH_MIN_BYTES) : 1,
        fetchWaitMaxMs: (process.env.KAFKA_FETCH_WAIT_MAX_MS != null && !isNaN(Number(process.env.KAFKA_FETCH_WAIT_MAX_MS)) && process.env.KAFKA_FETCH_WAIT_MAX_MS?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_FETCH_WAIT_MAX_MS) : 100
      }
    }

    // Instantiate logger
    const logger: ILogger = new MojaLogger()

    // Instantiate metrics factory

    const metricsConfig: TMetricOptionsType = {
      timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
      prefix: 'poc_', // Set prefix for all defined metrics names
      defaultLabels: { // Set default labels that will be applied to all metrics
        serviceName: 'simulator'
      }
    }

    const metrics = new Metrics(metricsConfig)
    await metrics.init()

    logger.isDebugEnabled() && logger.debug(`appConfig=${JSON.stringify(appConfig)}`)

    // list of all handlers
    const runHandlerList: IRunHandler[] = []

    // start all handlers here
    const simulatorEvtHandler = new SimulatorEvtHandler()
    await simulatorEvtHandler.start(appConfig, logger, metrics)
    runHandlerList.push(simulatorEvtHandler)

    // start only API
    let apiServer: ApiServer | undefined
    if (args.disableApi == null) {
      const apiServerOptions: TApiServerOptions = {
        host: appConfig.api.host,
        port: appConfig.api.port,
        metricCallback: async () => {
          return await metrics.getMetricsForPrometheus()
        },
        healthCallback: async () => {
          return {
            status: 'ok',
            version: pckg.version,
            name: pckg.name
          }
        }
      }
      apiServer = new ApiServer(apiServerOptions, logger)
      await apiServer.init()
    }

    // lets clean up all consumers here
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    const killProcess = async (): Promise<void> => {
      logger.isInfoEnabled() && logger.info('Exiting process...')
      logger.isInfoEnabled() && logger.info('Disconnecting handlers...')
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      runHandlerList.forEach(async (handler) => {
        logger.isInfoEnabled() && logger.info(`\tDestroying handler...${handler.constructor.name}`)
        await handler.destroy()
      })

      if (apiServer != null) {
        logger.isInfoEnabled() && logger.info('Destroying API server...')
        await apiServer.destroy()
      }

      logger.isInfoEnabled() && logger.info('Exit complete!')
      process.exit(0)
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
