/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list (alphabetical ordering) of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Coil
 - Donovan Changfoot <donovan.changfoot@coil.com>

 * Crosslake
 - Pedro Sousa Barreto <pedrob@crosslaketech.com>

 * ModusBox
 - Miguel de Barros <miguel.debarros@modusbox.com>
 - Roman Pietrzak <roman.pietrzak@modusbox.com>

 --------------
******/

'use strict'
// import {InMemoryTransferStateRepo} from "../infrastructure/inmemory_transfer_repo";
import { DomainEventMsg, IDomainMessage, IMessagePublisher, ILogger, CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransferPrepareRequestedEvt, TransferFulfilRequestedEvt, TransferPreparedEvt, TransferFulfilledEvt, TransferFulfilRequestedEvtPayload, TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import {
  IRunHandler,
  KafkaInfraTypes,
  MessageConsumer,
  EnumOffset,
  RDKafkaCompressionTypes,
  RDKafkaProducerOptions,
  RDKafkaMessagePublisher,
  RDKafkaConsumerOptions,
  RDKafkaConsumer
} from '@mojaloop-poc/lib-infrastructure'
import { Crypto, IMetricsFactory, mergeObjectIntoTraceStateToMessage } from '@mojaloop-poc/lib-utilities'

/* eslint-disable @typescript-eslint/no-var-requires */
const encodePayload = require('@mojaloop/central-services-shared').Util.StreamingProtocol.encodePayload
const contentType = 'application/vnd.interoperability.transfers+json;version=1'

export class SimulatorEvtHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private _publisher: IMessagePublisher

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)
    let kafkaMsgPublisher: IMessagePublisher | undefined

    logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - Creating ${appConfig.kafka.producer as string} simulatorEvtHandler.kafkaMsgPublisher...`)
    let clientId = `simulatorEvtHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.producer) {
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaProducerOptions: RDKafkaProducerOptions = {
          client: {
            producerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              dr_cb: true,
              'client.id': clientId,
              'socket.keepalive.enable': true,
              'compression.codec': appConfig.kafka.gzipCompression === true ? RDKafkaCompressionTypes.GZIP : RDKafkaCompressionTypes.NONE
            },
            topicConfig: {
              // partitioner: RDKafkaPartioner.MURMUR2_RANDOM // default java algorithm, seems to have worse random distribution for hashing than rdkafka's default
            }
          }
        }
        kafkaMsgPublisher = new RDKafkaMessagePublisher(
          rdKafkaProducerOptions,
          logger
        )
        break
      }
      default: {
        logger.isWarnEnabled() && logger.warn('SimulatorEvtHandler - Unable to find a Kafka Producer implementation!')
        throw new Error('simulatorEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    const histoSimulatorEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'simulatorEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for simulatorEvtHandler', // Description of metric
      ['success', 'error'] // Define a custom label 'success'
    )

    const simulatorEvtHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoSimulatorEvtHandlerMetric.startTimer()
      try {
        logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
        let simulatorEvt: DomainEventMsg | undefined
        let transferEvt: CommandMsg | null = null
        // # Transform messages into correct Command
        switch (message.msgName) {
          case TransferPreparedEvt.name: {
            simulatorEvt = TransferPreparedEvt.fromIDomainMessage(message)
            if (simulatorEvt == null) throw new Error(`simulatorEvtHandler is unable to process event - ${TransferPrepareRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            // const prepareTransferCmdPayload: PrepareTransferCmdPayload = simulatorEvt.payload
            // transferCmd = new PrepareTransferCmd(prepareTransferCmdPayload)
            /* eslint-disable @typescript-eslint/restrict-template-expressions */
            logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - ${TransferPreparedEvt.name} Received - transferId: ${simulatorEvt.payload.transferId}`)
            const fulfilPayload = {
              completedTimestamp: (new Date()).toISOString(),
              transferState: 'COMMITTED',
              fulfilment: 'XoSz1cL0tljJSCp_VtIYmPNw-zFUgGfbUqf69AagUzY'
            }

            const encodedFulfilPayload = encodePayload(Buffer.from(JSON.stringify(fulfilPayload)), contentType)

            const transferFulfilRequestedEvtPayload: TransferFulfilRequestedEvtPayload = {
              transferId: message.payload.transferId,
              payerId: message.payload.payerId,
              payeeId: message.payload.payeeId,
              fulfilment: fulfilPayload.fulfilment,
              completedTimestamp: fulfilPayload.completedTimestamp,
              transferState: fulfilPayload.transferState,
              fulfil: {
                headers: {
                  accept: 'application/vnd.interoperability.transfers+json;version=1',
                  'content-type': 'application/vnd.interoperability.transfers+json;version=1.0',
                  date: '2020-06-08T08:15:26.000Z',
                  'fspiop-source': message.payload.payerId,
                  'fspiop-destination': message.payload.payeeId,
                  'fspiop-signature': '{"signature":"iU4GBXSfY8twZMj1zXX1CTe3LDO8Zvgui53icrriBxCUF_wltQmnjgWLWI4ZUEueVeOeTbDPBZazpBWYvBYpl5WJSUoXi14nVlangcsmu2vYkQUPmHtjOW-yb2ng6_aPfwd7oHLWrWzcsjTF-S4dW7GZRPHEbY_qCOhEwmmMOnE1FWF1OLvP0dM0r4y7FlnrZNhmuVIFhk_pMbEC44rtQmMFv4pm4EVGqmIm3eyXz0GkX8q_O1kGBoyIeV_P6RRcZ0nL6YUVMhPFSLJo6CIhL2zPm54Qdl2nVzDFWn_shVyV0Cl5vpcMJxJ--O_Zcbmpv6lxqDdygTC782Ob3CNMvg","protectedHeader":"eyJhbGciOiJSUzI1NiIsIkZTUElPUC1VUkkiOiIvdHJhbnNmZXJzIiwiRlNQSU9QLUhUVFAtTWV0aG9kIjoiUE9TVCIsIkZTUElPUC1Tb3VyY2UiOiJPTUwiLCJGU1BJT1AtRGVzdGluYXRpb24iOiJNVE5Nb2JpbGVNb25leSIsIkRhdGUiOiIifQ"}',
                  'fspiop-uri': `/transfers/${message.payload.transferId}`,
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

            transferEvt = new TransferFulfilRequestedEvt(transferFulfilRequestedEvtPayload)
            mergeObjectIntoTraceStateToMessage(message, { timeApiFulfil: Date.now() })
            transferEvt.passTraceInfo(message)

            break
          }
          case TransferFulfilledEvt.name: {
            simulatorEvt = TransferFulfilledEvt.fromIDomainMessage(message)
            /* eslint-disable @typescript-eslint/restrict-template-expressions */
            if (simulatorEvt == null) throw new Error(`simulatorEvtHandler is unable to process event - ${TransferFulfilRequestedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - ${TransferFulfilRequestedEvt.name} Received - transferId: ${simulatorEvt.payload.transferId}`)
            break
          }
          default: {
            logger.isDebugEnabled() && logger.debug(`SimulatorEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            histTimer({ success: 'true' })
            return
          }
        }

        if (transferEvt != null) {
          logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${transferEvt?.msgName}:${transferEvt?.msgId}`)
          await kafkaMsgPublisher!.publish(transferEvt)
          logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - publishing cmd Finished - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
        }
        histTimer({ success: 'true' })
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.isErrorEnabled() && logger.error(err)
        histTimer({ success: 'false', error: err.message })
      }
    }

    let simulatorEvtConsumer: MessageConsumer | undefined

    /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
    logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - Creating ${appConfig.kafka.consumer} simulatorEvtConsumer...`)
    clientId = `simulatorEvtConsumer-${appConfig.kafka.consumer}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
          client: {
            consumerConfig: {
              'client.id': clientId,
              'metadata.broker.list': appConfig.kafka.host,
              'group.id': 'simulatorEvtGroup',
              'enable.auto.commit': appConfig.kafka.autocommit,
              'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
              'socket.keepalive.enable': true,
              'fetch.min.bytes': appConfig.kafka.fetchMinBytes,
              'fetch.wait.max.ms': appConfig.kafka.fetchWaitMaxMs
            },
            topicConfig: {},
            rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
          },
          topics: [TransfersTopics.DomainEvents]
        }
        simulatorEvtConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
        break
      }
      default: {
        logger.isWarnEnabled() && logger.warn('SimulatorEvtHandler - Unable to find a Kafka consumer implementation!')
        throw new Error('simulatorEvtConsumer was not created!')
      }
    }

    logger.isInfoEnabled() && logger.info(`SimulatorEvtHandler - Created kafkaConsumer of type ${simulatorEvtConsumer.constructor.name}`)

    this._consumer = simulatorEvtConsumer
    logger.isInfoEnabled() && logger.info('SimulatorEvtHandler - Initializing transferCmdConsumer...')

    const subscribedMsgNames = [
      'TransferPreparedEvt',
      'TransferFulfilledEvt'
    ]

    logger.isInfoEnabled() && logger.info('SimulatorEvtHandler - Initializing transferCmdConsumer...')
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await simulatorEvtConsumer.init(simulatorEvtHandler, subscribedMsgNames)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
  }
}
