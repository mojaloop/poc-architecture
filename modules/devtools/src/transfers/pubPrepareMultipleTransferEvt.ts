// import { logger } from '../application'
import { publishMessageMultiple } from '../utilities/publisher'
import { CurrencyTypes, TransferPrepareRequestedEvt } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'

const send = async()=>{
  return new Promise(async (resolve, reject)=>{
    let evts: TransferPrepareRequestedEvt[] = []

    for(let i=0; i<80; i++){
      evts.push(new TransferPrepareRequestedEvt({
        transferId: uuidv4(),
        payerId: 'fsp-14',
        payeeId: 'fsp-24',
        currency: CurrencyTypes.USD,
        amount: 1
      }))
    }

    await publishMessageMultiple(evts)

    setTimeout(async () =>{
      resolve()
    }, 1000)
  })
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {

  while(1) {
    await send()
  }
  // process.exit(0)
}

start().catch((err) => {
  console.error(err)
}).finally(() => {
})
