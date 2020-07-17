// import { logger } from '../application'
import * as Publisher from '../utilities/publisher'
// import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../../node_modules/@mojaloop-poc/participants/dist/messages/reserve_payer_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MojaLogger } from '@mojaloop-poc/lib-utilities'
import { FspIds } from '../utilities/participant'

const logger: ILogger = new MojaLogger()

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await Publisher.init()
  const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = {
    payerId: FspIds[0],
    payeeId: FspIds[1],
    transferId: uuidv4(),
    currency: CurrencyTypes.USD,
    amount: '1'
  }
  const reservePayerFundsCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)
  await Publisher.publishMessage(reservePayerFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  logger.isErrorEnabled() && logger.error(err)
}).finally(() => {
})
