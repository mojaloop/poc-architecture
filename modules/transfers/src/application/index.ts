/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

'use strict'

import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ConsoleLogger = new ConsoleLogger()

async function start (): Promise<void> {
  logger.info('To be implemented')
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
  process.exit(0)
})
