import * as Publisher from '../utilities/publisher'
import { TransferFulfilRequestedEvt, TransferFulfilRequestedEvtPayload } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MojaLogger } from '@mojaloop-poc/lib-utilities'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const encodePayload = require('@mojaloop/central-services-shared').Util.StreamingProtocol.encodePayload
// /* eslint-disable-next-line @typescript-eslint/no-var-requires */
// const isDataUri = require('@mojaloop/central-services-shared').Util.StreamingProtocol.isDataUri

const logger: ILogger = new MojaLogger()

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await Publisher.init()

  const fulfilPayload = {
    completedTimestamp: '2020-06-09T16:59:33.903Z',
    transferState: 'COMMITTED',
    fulfilment: 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
  }

  const payerFsp = 'fsp-1'
  const payeeFsp = 'fsp-2'
  const transferId = uuidv4()
  const contentType = 'application/vnd.interoperability.transfers+json;version=1'
  const encodedFulfilPayload = encodePayload(Buffer.from(JSON.stringify(fulfilPayload)), contentType)

  const transferFulfilRequestedEvtPayload: TransferFulfilRequestedEvtPayload = {
    transferId: transferId,
    payerId: payerFsp,
    payeeId: payeeFsp,
    fulfilment: fulfilPayload.fulfilment,
    completedTimestamp: fulfilPayload.completedTimestamp,
    transferState: fulfilPayload.transferState,
    fulfil: {
      headers: {
        accept: 'application/vnd.interoperability.transfers+json;version=1',
        'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
        date: '2020-06-08T08:15:26.000Z',
        'fspiop-source': payeeFsp,
        'fspiop-destination': payerFsp,
        'fspiop-signature': '{"signature":"iU4GBXSfY8twZMj1zXX1CTe3LDO8Zvgui53icrriBxCUF_wltQmnjgWLWI4ZUEueVeOeTbDPBZazpBWYvBYpl5WJSUoXi14nVlangcsmu2vYkQUPmHtjOW-yb2ng6_aPfwd7oHLWrWzcsjTF-S4dW7GZRPHEbY_qCOhEwmmMOnE1FWF1OLvP0dM0r4y7FlnrZNhmuVIFhk_pMbEC44rtQmMFv4pm4EVGqmIm3eyXz0GkX8q_O1kGBoyIeV_P6RRcZ0nL6YUVMhPFSLJo6CIhL2zPm54Qdl2nVzDFWn_shVyV0Cl5vpcMJxJ--O_Zcbmpv6lxqDdygTC782Ob3CNMvg","protectedHeader":"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJPTUwiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJNVE5Nb2JpbGVNb25leSIsIkRhdGUiOiIifQ"}',
        'fspiop-uri': `/transfers/${transferId}`,
        'fspiop-http-method': 'POST',
        'user-agent': 'PostmanRuntime/7.25.0',
        'cache-control': 'no-cache',
        'postman-token': 'e9db5115-86d7-48dd-ab0f-07b4059d5063',
        host: 'ml-api-adapter.local:3000',
        'accept-encoding': 'gzip, deflate, br',
        connection: 'keep-alive',
        'content-length': '1062'
      },
      payload: encodedFulfilPayload
    }
  }
  const transferFulfilRequestedEvt = new TransferFulfilRequestedEvt(transferFulfilRequestedEvtPayload)

  await Publisher.publishMessage(transferFulfilRequestedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
