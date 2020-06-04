// import { logger } from '../application'
import { publishMessageMultiple, publishMessageMultipleInit, publishMessageMultipleDestroy } from '../utilities/publisher'
import { CurrencyTypes, TransferPrepareRequestedEvt } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const timeout = async (ms: number): Promise<void> => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

const send = async (): Promise<void> => {
  const evts: TransferPrepareRequestedEvt[] = []

  for (let i = 0; i < 20; i++) {
    const random = Math.floor(Math.random() * Math.floor(2))
    evts.push(new TransferPrepareRequestedEvt({
      transferId: uuidv4(),
      payerId: random === 0 ? 'fsp-1' : 'fsp-2',
      payeeId: random === 0 ? 'fsp-2' : 'fsp-1',
      currency: CurrencyTypes.USD,
      amount: 1
    }))
  }

  await publishMessageMultiple(evts)
  await timeout(1000)
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessageMultipleInit()

  while (true) {
    await send()
  }

  // eslint-disable-next-line no-unreachable
  await publishMessageMultipleDestroy()
  // process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
