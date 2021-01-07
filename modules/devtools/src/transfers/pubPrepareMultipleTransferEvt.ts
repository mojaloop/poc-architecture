import * as Publisher from '../utilities/publisher'
import {
  CurrencyTypes,
  TransferPrepareRequestedEvt
} from '@mojaloop-poc/lib-public-messages'
import { v4 as uuidv4 } from 'uuid'
import { ILogger } from '@mojaloop-poc/lib-domain'
import { MojaLogger, injectTraceStateToMessage, Metrics, getEnvBoolOrDefault, TMetricOptionsType, getEnvIntegerOrDefault, getEnvValueOrDefault } from '@mojaloop-poc/lib-utilities'
import { getRandomFsps } from '../utilities/participant'
import { ApiServer, TApiServerOptions } from '@mojaloop-poc/lib-infrastructure'
import * as dotenv from 'dotenv'

/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const pckg = require('../../package.json')

/* eslint-disable @typescript-eslint/no-var-requires */
const encodePayload = require('@mojaloop/central-services-shared').Util.StreamingProtocol.encodePayload

const logger: ILogger = new MojaLogger()
const STR_INJECTED_PER_SECOND = process.env?.INJECTED_PER_SECOND ?? '50'
const INJECTED_PER_SECOND = Number.parseInt(STR_INJECTED_PER_SECOND)
const contentType = 'application/vnd.interoperability.transfers+json;version=1'

const timeout = async (ms: number): Promise<void> => {
  return await new Promise(resolve => setTimeout(resolve, ms))
}

let histoSendHandlerMetric: any | undefined
let histoSendPublishHandlerMetric: any | undefined
let histoSendConstructHandlerMetric: any | undefined
let histoSendConstructSingleHandlerMetric: any | undefined
let histSendAllTimer: any | undefined
let histSendPublishTimer: any | undefined
let histSendConstructTimer: any | undefined
let histSendConstructSingleTimer: any | undefined

let evts: TransferPrepareRequestedEvt[] = []
let expireDate = new Date()
const send = async (metrics?: Metrics | undefined): Promise<void> => {
  if (metrics !== undefined) histSendAllTimer = histoSendHandlerMetric.startTimer()

  const startTime = Date.now()
  evts = []
  expireDate = new Date()
  expireDate.setMinutes(expireDate.getMinutes() + 5)

  if (metrics !== undefined) histSendConstructTimer = histoSendConstructHandlerMetric.startTimer()
  for (let i = 0; i < INJECTED_PER_SECOND; i++) {
    if (metrics !== undefined) histSendConstructSingleTimer = histoSendConstructSingleHandlerMetric.startTimer()

    const fspIds = getRandomFsps()

    const preparePayload = {
      transferId: uuidv4(),
      payerFsp: fspIds[0],
      payeeFsp: fspIds[1],
      amount: {
        amount: '1.11',
        currency: CurrencyTypes.USD
      },
      expiration: expireDate.toISOString(), // '2020-06-09T20:46:57.650Z',
      ilpPacket: 'AQAAAAAAAADIEHByaXZhdGUucGF5ZWVmc3CCAiB7InRyYW5zYWN0aW9uSWQiOiIyZGY3NzRlMi1mMWRiLTRmZjctYTQ5NS0yZGRkMzdhZjdjMmMiLCJxdW90ZUlkIjoiMDNhNjA1NTAtNmYyZi00NTU2LThlMDQtMDcwM2UzOWI4N2ZmIiwicGF5ZWUiOnsicGFydHlJZEluZm8iOnsicGFydHlJZFR5cGUiOiJNU0lTRE4iLCJwYXJ0eUlkZW50aWZpZXIiOiIyNzcxMzgwMzkxMyIsImZzcElkIjoicGF5ZWVmc3AifSwicGVyc29uYWxJbmZvIjp7ImNvbXBsZXhOYW1lIjp7fX19LCJwYXllciI6eyJwYXJ0eUlkSW5mbyI6eyJwYXJ0eUlkVHlwZSI6Ik1TSVNETiIsInBhcnR5SWRlbnRpZmllciI6IjI3NzEzODAzOTExIiwiZnNwSWQiOiJwYXllcmZzcCJ9LCJwZXJzb25hbEluZm8iOnsiY29tcGxleE5hbWUiOnt9fX0sImFtb3VudCI6eyJjdXJyZW5jeSI6IlVTRCIsImFtb3VudCI6IjIwMCJ9LCJ0cmFuc2FjdGlvblR5cGUiOnsic2NlbmFyaW8iOiJERVBPU0lUIiwic3ViU2NlbmFyaW8iOiJERVBPU0lUIiwiaW5pdGlhdG9yIjoiUEFZRVIiLCJpbml0aWF0b3JUeXBlIjoiQ09OU1VNRVIiLCJyZWZ1bmRJbmZvIjp7fX19',
      // condition: 'HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks'
      // condition: 'eqLXL11vT-db_1JPAjFkLX5QP2UOFTUmbyEPbnJxNlc'
      condition: 'HOr22-H3AfTDHrSkPjJtVPRdKouuMkDXTR4ejlQa8Ks'
    }

    const encodedPreparePayload = encodePayload(Buffer.from(JSON.stringify(preparePayload)), contentType)
    const newEvent = new TransferPrepareRequestedEvt({
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
    })
    injectTraceStateToMessage(newEvent, { timeApiPrepare: Date.now() })

    evts.push(newEvent)

    if (metrics !== undefined) histSendConstructSingleTimer({ payerId: preparePayload.payerFsp })
  }
  if (metrics !== undefined) histSendConstructTimer()

  const constructMsgsMs = Date.now() - startTime

  if (metrics !== undefined) histSendPublishTimer = histoSendPublishHandlerMetric.startTimer()
  await Publisher.publishMessageMultiple(evts)
  if (metrics !== undefined) histSendPublishTimer()

  const totalTimeMs = Date.now() - startTime
  const publishMsgsMs = totalTimeMs - constructMsgsMs

  if (totalTimeMs > 1000) {
    // eslint-disable-next-line no-console
    console.info(`Sending batches of ${INJECTED_PER_SECOND} messages - ${constructMsgsMs} ms to construct - ${publishMsgsMs} ms to publish - ${totalTimeMs} ms total - NOT COPING`)
  } else {
    // eslint-disable-next-line no-console
    console.info(`Sending batches of ${INJECTED_PER_SECOND} messages - ${constructMsgsMs} ms to construct - ${publishMsgsMs} ms to publish - ${totalTimeMs} ms total`)
  }

  await timeout(totalTimeMs > 1000 ? 10 : 1000 - totalTimeMs)
  if (metrics !== undefined) histSendAllTimer()
}

let apiServer: ApiServer | undefined
let metrics: Metrics | undefined

/* eslint-disable-next-line @typescript-eslint/explicit-function-return-type */
const start = async () => {
  logger.isInfoEnabled() && logger.info('Starting pubPrepareMultipleTransferEvt publisher!')

  // TODO: Figure a better way to handle env config here
  dotenv.config({ path: '../../.env' })

  // # setup application config
  const appConfig = {
    api: {
      isDisabled: getEnvBoolOrDefault('PERFTOOLCLIENT_API_DISABLED'),
      host: getEnvValueOrDefault('PERFTOOLCLIENT_API_HOST', '0.0.0.0'),
      port: getEnvIntegerOrDefault('PERFTOOLCLIENT_API_PORT', 4002)
    }
  }

  // start API
  if (appConfig.api.isDisabled === false) {
    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.isInfoEnabled() && logger.info(`Starting pubPrepareMultipleTransferEvt api Server on ${appConfig.api.host}:${appConfig.api.port}`)

    // init metrics
    const metricsConfig: TMetricOptionsType = {
      timeout: 5000, // Set the timeout in ms for the underlying prom-client library. Default is '5000'.
      prefix: 'poc_', // Set prefix for all defined metrics names
      defaultLabels: { // Set default labels that will be applied to all metrics
        serviceName: 'perftoolclient'
      }
    }

    metrics = new Metrics(metricsConfig)
    await metrics.init()

    if (metrics !== undefined) {
      histoSendHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
        'sendAll', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
        'Instrumentation for perfClientTools for a sending a batch of transfers', // Description of metric
        [] // Define a custom label 'success'
      )
      histoSendConstructSingleHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
        'sendConstructSingle', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
        'Instrumentation for perfClientTools for constructing a single transfer', // Description of metric
        ['payerId'] // Define a custom label 'success'
      )
      histoSendConstructHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
        'sendConstruct', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
        'Instrumentation for perfClientTools for constructing a batch of transfers', // Description of metric
        [] // Define a custom label 'success'
      )
      histoSendPublishHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
        'sendPublish', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
        'Instrumentation for perfClientTools for publishing a batch of transfers to kafka', // Description of metric
        [] // Define a custom label 'success'
      )
    }

    const apiServerOptions: TApiServerOptions = {
      host: appConfig.api.host,
      port: appConfig.api.port,
      metricCallback: async () => {
        return await metrics!.getMetricsForPrometheus()
      },
      healthCallback: async () => {
        return {
          status: 'ok',
          version: pckg.version,
          name: pckg.name
        }
      }
    }
    apiServer = new ApiServer(apiServerOptions, logger)
    await apiServer.init()
  } else {
    logger.isInfoEnabled() && logger.info('pubPrepareMultipleTransferEvt api Server disabled')
  }

  // start publisher
  await Publisher.init()
  await Publisher.publishMessageMultipleInit()
  while (true) {
    await send(metrics)
  }
}

// lets clean up all consumers here
/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
const killProcess = async (): Promise<void> => {
  logger.isInfoEnabled() && logger.info('Exiting process...')

  if (apiServer != null) {
    logger.isInfoEnabled() && logger.info('Destroying API server...')
    await apiServer.destroy()
  }

  logger.isInfoEnabled() && logger.info('Destroying handlers...')
  await Publisher.publishMessageMultipleDestroy()

  logger.isInfoEnabled() && logger.info('Exit complete!')
  process.exit(0)
}
/* eslint-disable-next-line @typescript-eslint/no-misused-promises */
process.on('SIGINT', killProcess)

start().catch((err) => {
  logger.isErrorEnabled() && logger.error(err)
}).finally(() => {
})
