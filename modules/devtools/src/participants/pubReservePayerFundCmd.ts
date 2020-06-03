// import { logger } from '../application'
import { publishMessage } from '../utilities/publisher'
// import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
// # HACK-ALERT: Importing directly from the node_modules folder as Commands are not publically accessible until some additional re-factoring can be done. Note that this "tool" module is only for development purposes.
import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../../node_modules/@mojaloop-poc/participants/dist/messages/reserve_payer_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'

const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = {
  // "payerId": "fsp-24",
  // "payeeId": "fsp-14",
  payerId: 'fsp-14',
  payeeId: 'fsp-24',
  transferId: uuidv4(),
  currency: CurrencyTypes.USD,
  amount: 1
}
const reservePayerFundsCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)
}

start().catch((err) => {
  console.error(err)
}).finally(() => {
})
