// import { logger } from '../application'
import { publishMessage } from './publisher'
import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CurrencyTypes } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'

const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = {
  // "payerId": "fsp-24",
  // "payeeId": "fsp-14",
  "payerId": "fsp-14",
  "payeeId": "fsp-24",
  "transferId": uuidv4(),
  "currency": CurrencyTypes.USD,
  "amount": 1
}
const reservePayerFundsCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)

const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)  
}

start()
