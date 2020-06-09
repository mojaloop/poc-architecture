/* eslint-disable no-useless-escape */

import { publishMessage } from '../utilities/publisher'
import { CurrencyTypes, TransferFulfilRequestedEvt, TransferFulfilRequestedEvtPayload, TransferPrepareRequestedEvtPayload, TransferPrepareRequestedEvt } from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { ConsoleLogger } from '@mojaloop-poc/lib-utilities'

const logger: ILogger = new ConsoleLogger()

const msgPrepareParams = {
  transferId: uuidv4(),
  payerId: 'fsp-1',
  payeeId: 'fsp-2',
  currency: CurrencyTypes.USD,
  amount: '1',
  expiration: '2020-06-08T10:25:26.575Z',
  condition: 'HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks',
  prepare: {
    headers: {
      accept: 'application/vnd.interoperability.transfers+json;version=1',
      'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
      date: '2020-06-08T08:15:26.000Z',
      'fspiop-source': 'payerfsp',
      'fspiop-destination': 'payeefsp',
      'fspiop-signature': '{\"signature\":\"iU4GBXSfY8twZMj1zXX1CTe3LDO8Zvgui53icrriBxCUF_wltQmnjgWLWI4ZUEueVeOeTbDPBZazpBWYvBYpl5WJSUoXi14nVlangcsmu2vYkQUPmHtjOW-yb2ng6_aPfwd7oHLWrWzcsjTF-S4dW7GZRPHEbY_qCOhEwmmMOnE1FWF1OLvP0dM0r4y7FlnrZNhmuVIFhk_pMbEC44rtQmMFv4pm4EVGqmIm3eyXz0GkX8q_O1kGBoyIeV_P6RRcZ0nL6YUVMhPFSLJo6CIhL2zPm54Qdl2nVzDFWn_shVyV0Cl5vpcMJxJ--O_Zcbmpv6lxqDdygTC782Ob3CNMvg\\\",\\\"protectedHeader\\\":\\\"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJPTUwiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJNVE5Nb2JpbGVNb25leSIsIkRhdGUiOiIifQ\"}',
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
    payload: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJ0cmFuc2ZlcklkIjogIjU5Njg4NjRkLWY5OGQtNGUwNy05MjZhLTA0N2U0MDkzZWY3MCIsCiAgInBheWVyRnNwIjogInBheWVyZnNwIiwKICAicGF5ZWVGc3AiOiAicGF5ZWVmc3AiLAogICJhbW91bnQiOiB7CiAgICAiYW1vdW50IjogIjEuMTEiLAogICAgImN1cnJlbmN5IjogIlVTRCIKICB9LAogICJleHBpcmF0aW9uIjogIjIwMjAtMDYtMDhUMTA6MjU6MjYuNTc1WiIsCiAgImlscFBhY2tldCI6ICJBUUFBQUFBQUFBRElFSEJ5YVhaaGRHVXVjR0Y1WldWbWMzQ0NBaUI3SW5SeVlXNXpZV04wYVc5dVNXUWlPaUl5WkdZM056UmxNaTFtTVdSaUxUUm1aamN0WVRRNU5TMHlaR1JrTXpkaFpqZGpNbU1pTENKeGRXOTBaVWxrSWpvaU1ETmhOakExTlRBdE5tWXlaaTAwTlRVMkxUaGxNRFF0TURjd00yVXpPV0k0TjJabUlpd2ljR0Y1WldVaU9uc2ljR0Z5ZEhsSlpFbHVabThpT25zaWNHRnlkSGxKWkZSNWNHVWlPaUpOVTBsVFJFNGlMQ0p3WVhKMGVVbGtaVzUwYVdacFpYSWlPaUl5TnpjeE16Z3dNemt4TXlJc0ltWnpjRWxrSWpvaWNHRjVaV1ZtYzNBaWZTd2ljR1Z5YzI5dVlXeEpibVp2SWpwN0ltTnZiWEJzWlhoT1lXMWxJanA3ZlgxOUxDSndZWGxsY2lJNmV5SndZWEowZVVsa1NXNW1ieUk2ZXlKd1lYSjBlVWxrVkhsd1pTSTZJazFUU1ZORVRpSXNJbkJoY25SNVNXUmxiblJwWm1sbGNpSTZJakkzTnpFek9EQXpPVEV4SWl3aVpuTndTV1FpT2lKd1lYbGxjbVp6Y0NKOUxDSndaWEp6YjI1aGJFbHVabThpT25zaVkyOXRjR3hsZUU1aGJXVWlPbnQ5Zlgwc0ltRnRiM1Z1ZENJNmV5SmpkWEp5Wlc1amVTSTZJbFZUUkNJc0ltRnRiM1Z1ZENJNklqSXdNQ0o5TENKMGNtRnVjMkZqZEdsdmJsUjVjR1VpT25zaWMyTmxibUZ5YVc4aU9pSkVSVkJQVTBsVUlpd2ljM1ZpVTJObGJtRnlhVzhpT2lKRVJWQlBVMGxVSWl3aWFXNXBkR2xoZEc5eUlqb2lVRUZaUlZJaUxDSnBibWwwYVdGMGIzSlVlWEJsSWpvaVEwOU9VMVZOUlZJaUxDSnlaV1oxYm1SSmJtWnZJanA3ZlgxOSIsCiAgImNvbmRpdGlvbiI6ICJIT3IyMi1IM0FmVERIclNrUGpKdFZQUmRLb3V1TWtEWFRSNGVqbFFhOEtzIgp9'
  }
}

const msgFulfilParams = {
  transferId: msgPrepareParams.transferId,
  payerId: msgPrepareParams.payerId,
  payeeId: msgPrepareParams.payeeId,
  fulfilment: 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzP',
  completedTimestamp: '2020-06-09T08:48:57.543Z',
  transferState: 'COMMITTED',
  fulfil: {
    headers: {
      accept: 'application/vnd.interoperability.transfers+json;version=1',
      'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
      date: '2020-06-08T08:15:26.000Z',
      'fspiop-source': 'payerfsp',
      'fspiop-destination': 'payeefsp',
      'fspiop-signature': '{\"signature\":\"iU4GBXSfY8twZMj1zXX1CTe3LDO8Zvgui53icrriBxCUF_wltQmnjgWLWI4ZUEueVeOeTbDPBZazpBWYvBYpl5WJSUoXi14nVlangcsmu2vYkQUPmHtjOW-yb2ng6_aPfwd7oHLWrWzcsjTF-S4dW7GZRPHEbY_qCOhEwmmMOnE1FWF1OLvP0dM0r4y7FlnrZNhmuVIFhk_pMbEC44rtQmMFv4pm4EVGqmIm3eyXz0GkX8q_O1kGBoyIeV_P6RRcZ0nL6YUVMhPFSLJo6CIhL2zPm54Qdl2nVzDFWn_shVyV0Cl5vpcMJxJ--O_Zcbmpv6lxqDdygTC782Ob3CNMvg\\\",\\\"protectedHeader\\\":\\\"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJPTUwiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJNVE5Nb2JpbGVNb25leSIsIkRhdGUiOiIifQ\"}',
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
    payload: 'data:application/vnd.interoperability.transfers+json;version=1.0;base64,ewogICJ0cmFuc2ZlcklkIjogIjU5Njg4NjRkLWY5OGQtNGUwNy05MjZhLTA0N2U0MDkzZWY3MCIsCiAgInBheWVyRnNwIjogInBheWVyZnNwIiwKICAicGF5ZWVGc3AiOiAicGF5ZWVmc3AiLAogICJhbW91bnQiOiB7CiAgICAiYW1vdW50IjogIjEuMTEiLAogICAgImN1cnJlbmN5IjogIlVTRCIKICB9LAogICJleHBpcmF0aW9uIjogIjIwMjAtMDYtMDhUMTA6MjU6MjYuNTc1WiIsCiAgImlscFBhY2tldCI6ICJBUUFBQUFBQUFBRElFSEJ5YVhaaGRHVXVjR0Y1WldWbWMzQ0NBaUI3SW5SeVlXNXpZV04wYVc5dVNXUWlPaUl5WkdZM056UmxNaTFtTVdSaUxUUm1aamN0WVRRNU5TMHlaR1JrTXpkaFpqZGpNbU1pTENKeGRXOTBaVWxrSWpvaU1ETmhOakExTlRBdE5tWXlaaTAwTlRVMkxUaGxNRFF0TURjd00yVXpPV0k0TjJabUlpd2ljR0Y1WldVaU9uc2ljR0Z5ZEhsSlpFbHVabThpT25zaWNHRnlkSGxKWkZSNWNHVWlPaUpOVTBsVFJFNGlMQ0p3WVhKMGVVbGtaVzUwYVdacFpYSWlPaUl5TnpjeE16Z3dNemt4TXlJc0ltWnpjRWxrSWpvaWNHRjVaV1ZtYzNBaWZTd2ljR1Z5YzI5dVlXeEpibVp2SWpwN0ltTnZiWEJzWlhoT1lXMWxJanA3ZlgxOUxDSndZWGxsY2lJNmV5SndZWEowZVVsa1NXNW1ieUk2ZXlKd1lYSjBlVWxrVkhsd1pTSTZJazFUU1ZORVRpSXNJbkJoY25SNVNXUmxiblJwWm1sbGNpSTZJakkzTnpFek9EQXpPVEV4SWl3aVpuTndTV1FpT2lKd1lYbGxjbVp6Y0NKOUxDSndaWEp6YjI1aGJFbHVabThpT25zaVkyOXRjR3hsZUU1aGJXVWlPbnQ5Zlgwc0ltRnRiM1Z1ZENJNmV5SmpkWEp5Wlc1amVTSTZJbFZUUkNJc0ltRnRiM1Z1ZENJNklqSXdNQ0o5TENKMGNtRnVjMkZqZEdsdmJsUjVjR1VpT25zaWMyTmxibUZ5YVc4aU9pSkVSVkJQVTBsVUlpd2ljM1ZpVTJObGJtRnlhVzhpT2lKRVJWQlBVMGxVSWl3aWFXNXBkR2xoZEc5eUlqb2lVRUZaUlZJaUxDSnBibWwwYVdGMGIzSlVlWEJsSWpvaVEwOU9VMVZOUlZJaUxDSnlaV1oxYm1SSmJtWnZJanA3ZlgxOSIsCiAgImNvbmRpdGlvbiI6ICJIT3IyMi1IM0FmVERIclNrUGpKdFZQUmRLb3V1TWtEWFRSNGVqbFFhOEtzIgp9'
  }
}

const transferPrepareRequestedEvtPayload: TransferPrepareRequestedEvtPayload = msgPrepareParams
const transferPrepareRequestedEvt = new TransferPrepareRequestedEvt(transferPrepareRequestedEvtPayload)

const transferFulfilRequestedEvtPayload: TransferFulfilRequestedEvtPayload = msgFulfilParams
const transferFulfilRequestedEvt = new TransferFulfilRequestedEvt(transferFulfilRequestedEvtPayload)

const delay = async (ms: number): Promise <void> => {
  /* eslint-disable-next-line @typescript-eslint/return-await */
  return new Promise(resolve => setTimeout(resolve, ms))
}

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  logger.info(`Sending Transfer ${msgPrepareParams.transferId}`)
  await publishMessage(transferPrepareRequestedEvt)
  await delay(1000)
  await publishMessage(transferFulfilRequestedEvt)
  process.exit(0)
}

start().catch((err) => {
  logger.error(err)
}).finally(() => {
})
