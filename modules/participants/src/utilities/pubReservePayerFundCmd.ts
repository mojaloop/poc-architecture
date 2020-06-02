// import { logger } from '../application'
import { publishMessage } from './publisher'
import { ReservePayerFundsCmdPayload, ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'

const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = {
  "payerId": "fsp-1",
  "payeeId": "fsp-2",
  "transferId": "34e6af77-d05d-43e8-ae49-1a2571510697",
  "currency": "USD",
  "amount": 1
}
const reservePayerFundsCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)

const start = async () => {
  await publishMessage(reservePayerFundsCmd)
  process.exit(0)  
}

start()
