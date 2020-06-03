// import { logger } from '../application'
import { publishMessage } from './publisher'
import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'

const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = {
  "payerId": "fsp-10",
  "payeeId": "fsp-20",
  "transferId": "34e6af77-d05d-43e8-ae49-1a2571510697",
  "currency": CurrencyTypes.USD,
  "amount": 1
}
const reservePayerFundsCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)

const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)  
}

start()
