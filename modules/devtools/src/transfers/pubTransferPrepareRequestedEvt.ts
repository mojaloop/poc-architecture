import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes, TransferPrepareRequestedEvt, TransferPrepareRequestedEvtPayload } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const encodePayload = require('@mojaloop/central-services-shared').Util.StreamingProtocol.encodePayload
// /* eslint-disable-next-line @typescript-eslint/no-var-requires */
// const isDataUri = require('@mojaloop/central-services-shared').Util.StreamingProtocol.isDataUri

const logger: ILogger = new ConsoleLogger()

const preparePayload = {
  transferId: uuidv4(),
  payerFsp: 'fsp-1',
  payeeFsp: 'fsp-2',
  amount: {
    amount: '1.11',
    currency: CurrencyTypes.USD
  },
  expiration: '2020-06-09T16:46:57.650Z',
  ilpPacket: 'AQAAAAAAAADIEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiIyZGY3NzRlMi1mMWRiLTRmZjctYTQ5NS0yZGRkMzdhZjdjMmMiLCJxdW90ZUlkIjoiMDNhNjA1NTAtNmYyZi00NTU2LThlMDQtMDcwM2UzOWI4N2ZmIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMyIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTExIiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnt9fX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjIwMCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwic3ViU2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIiLCJyZWZ1bmRJbmZvIjp7fX19',
  condition: 'HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks'
}

const contentType = 'application/vnd.interoperability.transfers+json;version=1'
const encodedPreparePayload = encodePayload(Buffer.from(JSON.stringify(preparePayload)), contentType)

const transferPrepareRequestedEvtPayload: TransferPrepareRequestedEvtPayload = {
  transferId: preparePayload.transferId,
  payerId: preparePayload.payerFsp,
  payeeId: preparePayload.payeeFsp,
  currency: preparePayload.amount.currency,
  amount: preparePayload.amount.amount,
  expiration: preparePayload.expiration,
  condition: preparePayload.condition,
  prepare: {
    headers: {
      accept: 'application/vnd.interoperability.transfers+json;version=1',
      'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
      date: '2020-06-08T08:15:26.000Z',
      'fspiop-source': preparePayload.payerFsp,
      'fspiop-destination': preparePayload.payeeFsp,
      'fspiop-signature': '{"signature":"iU4GBXSfY8twZMj1zXX1CTe3LDO8Zvgui53icrriBxCUF_wltQmnjgWLWI4ZUEueVeOeTbDPBZazpBWYvBYpl5WJSUoXi14nVlangcsmu2vYkQUPmHtjOW-yb2ng6_aPfwd7oHLWrWzcsjTF-S4dW7GZRPHEbY_qCOhEwmmMOnE1FWF1OLvP0dM0r4y7FlnrZNhmuVIFhk_pMbEC44rtQmMFv4pm4EVGqmIm3eyXz0GkX8q_O1kGBoyIeV_P6RRcZ0nL6YUVMhPFSLJo6CIhL2zPm54Qdl2nVzDFWn_shVyV0Cl5vpcMJxJ--O_Zcbmpv6lxqDdygTC782Ob3CNMvg","protectedHeader":"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJPTUwiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJNVE5Nb2JpbGVNb25leSIsIkRhdGUiOiIifQ"}',
      'fspiop-uri': '/transfers',
      'fspiop-http-method': 'POST',
      'user-agent': 'PostmanRuntime/7.25.0',
      'cache-control': 'no-cache',
      'postman-token': 'e9db5115-86d7-48dd-ab0f-07b4059d5063',
      host: 'ml-api-adapter.local:3000',
      'accept-encoding': 'gzip, deflate, br',
      connection: 'keep-alive',
      'content-length': '1062'
    },
    payload: encodedPreparePayload
  }
}

const transferPrepareRequestedEvt = new TransferPrepareRequestedEvt(transferPrepareRequestedEvtPayload)

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  await publishMessage(transferPrepareRequestedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
