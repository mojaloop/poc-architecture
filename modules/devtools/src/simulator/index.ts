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

import { MojaLogger, Metrics, TMetricOptionsType } from '@mojaloop-poc/lib-utilities'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { TApiServerOptions, ApiServer, IRunHandler, KafkaInfraTypes } from '@mojaloop-poc/lib-infrastructure'
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
      kafka: {
        host: process.env.KAFKA_HOST,
        consumer: (process.env.KAFKA_CONSUMER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_CONSUMER,
        producer: (process.env.KAFKA_PRODUCER == null) ? KafkaInfraTypes.NODE_KAFKA : process.env.KAFKA_PRODUCER,
        autocommit: (process.env.KAFKA_AUTO_COMMIT === 'true'),
        autoCommitInterval: (process.env.KAFKA_AUTO_COMMIT_INTERVAL != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_INTERVAL)) && process.env.KAFKA_AUTO_COMMIT_INTERVAL?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_INTERVAL) : null,
        autoCommitThreshold: (process.env.KAFKA_AUTO_COMMIT_THRESHOLD != null && !isNaN(Number(process.env.KAFKA_AUTO_COMMIT_THRESHOLD)) && process.env.KAFKA_AUTO_COMMIT_THRESHOLD?.trim()?.length > 0) ? Number.parseInt(process.env.KAFKA_AUTO_COMMIT_THRESHOLD) : null,
        gzipCompression: (process.env.KAFKA_PRODUCER_GZIP === 'true')
      }
    }

    // Instantiate logger
    const logger: ILogger = new MojaLogger()

    // Instantiate metrics factory

    const metricsConfig: TMetricOptionsType = {
      timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
      prefix: 'poc_sim_', // Set prefix for all defined metrics names
      defaultLabels: { // Set default labels that will be applied to all metrics
        serviceName: 'simulator'
      }
    }

    const metrics = new Metrics(metricsConfig)
    await metrics.init()

    logger.debug(`appConfig=${JSON.stringify(appConfig)}`)

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
        host: '0.0.0.0',
        port: 4000,
        metricCallback: async () => {
          return metrics.getMetricsForPrometheus()
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
      logger.info('Exiting process...')
      logger.info('Disconnecting handlers...')
      /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
      runHandlerList.forEach(async (handler) => {
        logger.info(`\tDestroying handler...${handler.constructor.name}`)
        await handler.destroy()
      })

      if (apiServer != null) {
        logger.info('Destroying API server...')
        await apiServer.destroy()
      }

      logger.info('Exit complete!')
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
