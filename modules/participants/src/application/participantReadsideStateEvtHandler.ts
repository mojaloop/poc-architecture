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
// import { v4 as uuidv4 } from 'uuid'
// import {InMemoryParticipantStateRepo} from "../infrastructure/inmemory_participant_repo";
import { DomainEventMsg, IDomainMessage, IMessagePublisher, ILogger, CommandMsg } from '@mojaloop-poc/lib-domain'
import { TransferPrepareAcceptedEvt, TransferFulfilAcceptedEvt, TransfersTopics } from '@mojaloop-poc/lib-public-messages'
import {
  EnumOffset,
  IRunHandler,
  KafkaInfraTypes,
  KafkaMessagePublisher,
  MessageConsumer,
  // node-kafka imports
  KafkaGenericConsumer, KafkaGenericConsumerOptions, KafkaGenericProducerOptions, KafkaNodeCompressionTypes,
  // node-kafka-stream imports
  KafkaStreamConsumerOptions, KafkaStreamConsumer,
  // kafkajs imports
  KafkaJsCompressionTypes, KafkaJsConsumer, KafkaJsConsumerOptions, KafkajsMessagePublisher, KafkaJsProducerOptions,
  // rdkafka imports
  RDKafkaCompressionTypes, RDKafkaProducerOptions, RDKafkaMessagePublisher, RDKafkaConsumerOptions, RDKafkaConsumer
} from '@mojaloop-poc/lib-infrastructure'
import { ReservePayerFundsCmd, ReservePayerFundsCmdPayload } from '../messages/reserve_payer_funds_cmd'
import { CommitPayeeFundsCmd, CommitPayeeFundsCmdPayload } from '../messages/commit_payee_funds_cmd'
import { InvalidParticipantEvtError } from './errors'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { IParticipantRepo } from '../domain/participant_repo'
import { CachedRedisParticipantStateRepo } from '../infrastructure/cachedredis_participant_repo'

export class ParticipantReadsideStateEvtHandler implements IRunHandler {
  private _consumer: MessageConsumer
  private readonly _publisher: IMessagePublisher
  private _readSideRepo:

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Creating repo of type ${CachedRedisParticipantStateRepo.constructor.name}`)

    const repo: IParticipantRepo = new CachedRedisParticipantStateRepo(appConfig.redis.host, logger)

    this._repo = repo
    await repo.init()

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Created repo of type ${repo.constructor.name}`)

    const histoParticipantEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantEvtHandler', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )

    const participantEvtHandler = async (message: IDomainMessage): Promise<void> => {
      const histTimer = histoParticipantEvtHandlerMetric.startTimer()
      const evtname = message.msgName ?? 'unknown'
      try {
        logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
        let participantEvt: DomainEventMsg | undefined
        let participantCmd: CommandMsg | undefined
        // # Transform messages into correct Command
        switch (message.msgName) {
          case TransferPrepareAcceptedEvt.name: {
            participantEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
            if (participantEvt == null) throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - ${TransferPrepareAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const reservePayerFundsCmdPayload: ReservePayerFundsCmdPayload = participantEvt.payload
            participantCmd = new ReservePayerFundsCmd(reservePayerFundsCmdPayload)
            participantCmd.passTraceInfo(participantEvt)
            // lets find and set the appropriate partition for the participant
            const participant = await this._repo.load(participantCmd.msgKey)
            if (participant == null) {
              throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - Participant '${participantCmd.msgKey}' is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            }
            participantCmd.msgPartition = participant.partition
            break
          }
          case TransferFulfilAcceptedEvt.name: {
            participantEvt = TransferPrepareAcceptedEvt.fromIDomainMessage(message)
            if (participantEvt == null) throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - ${TransferFulfilAcceptedEvt.name} is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            const commitPayeeFundsCmdPayload: CommitPayeeFundsCmdPayload = participantEvt.payload
            participantCmd = new CommitPayeeFundsCmd(commitPayeeFundsCmdPayload)
            participantCmd.passTraceInfo(participantEvt)
            // lets find and set the appropriate partition for the participant
            const participant = await this._repo.load(participantCmd.msgKey)
            if (participant == null) {
              throw new InvalidParticipantEvtError(`ParticipantEvtHandler is unable to process event - Participant '${participantCmd.msgKey}' is Invalid - ${message?.msgName}:${message?.msgKey}:${message?.msgId}`)
            }
            participantCmd.msgPartition = participant.partition
            break
          }
          default: {
            logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
            histTimer({ success: 'true', evtname })
            return
          }
        }

        if (participantCmd != null) {
          logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${participantCmd?.msgName}:${message?.msgKey}:${participantCmd?.msgId}`)
          await kafkaMsgPublisher.publish(participantCmd)
        } else {
          logger.isWarnEnabled() && logger.warn(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
        }

        logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: true`)
        histTimer({ success: 'true', evtname })
      } catch (err) {
        const errMsg: string = err?.message?.toString()
        logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
        logger.isErrorEnabled() && logger.error(err)
        histTimer({ success: 'false', /* error: err.message, */ evtname })
      }
    }

    let participantEvtConsumer: MessageConsumer | undefined

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Creating ${appConfig.kafka.consumer as string} participantEvtConsumer...`)
    clientId = `participantEvtConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`
    switch (appConfig.kafka.consumer) {
      case (KafkaInfraTypes.NODE_KAFKA): {
        const participantEvtConsumerOptions: KafkaGenericConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'participantEvtGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaGenericConsumer(participantEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_KAFKA_STREAM): {
        const participantEvtConsumerOptions: KafkaStreamConsumerOptions = {
          client: {
            kafkaHost: appConfig.kafka.host,
            id: clientId,
            groupId: 'participantEvtGroup',
            fromOffset: EnumOffset.LATEST,
            autoCommit: appConfig.kafka.autocommit
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaStreamConsumer(participantEvtConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsConsumerOptions: KafkaJsConsumerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId
            },
            consumer: { // https://kafka.js.org/docs/consuming#a-name-options-a-options
              groupId: 'participantEvtGroup'
            },
            consumerRunConfig: {
              autoCommit: appConfig.kafka.autocommit,
              autoCommitInterval: appConfig.kafka.autoCommitInterval,
              autoCommitThreshold: appConfig.kafka.autoCommitThreshold
            }
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new KafkaJsConsumer(kafkaJsConsumerOptions, logger)
        break
      }
      case (KafkaInfraTypes.NODE_RDKAFKA): {
        const rdKafkaConsumerOptions: RDKafkaConsumerOptions = {
          client: {
            consumerConfig: {
              'metadata.broker.list': appConfig.kafka.host,
              'group.id': 'participantEvtGroup',
              'enable.auto.commit': appConfig.kafka.autocommit,
              'auto.commit.interval.ms': appConfig.kafka.autoCommitInterval,
              'client.id': clientId,
              'socket.keepalive.enable': true,
              'fetch.min.bytes': appConfig.kafka.fetchMinBytes,
              'fetch.wait.max.ms': appConfig.kafka.fetchWaitMaxMs
            },
            topicConfig: {},
            rdKafkaCommitWaitMode: appConfig.kafka.rdKafkaCommitWaitMode
          },
          topics: [TransfersTopics.DomainEvents]
        }
        participantEvtConsumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
        break
      }
      default: {
        logger.isWarnEnabled() && logger.warn('ParticipantEvtHandler - Unable to find a Kafka consumer implementation!')
        throw new Error('participantEvtConsumer was not created!')
      }
    }

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Created kafkaConsumer of type ${participantEvtConsumer.constructor.name}`)

    this._consumer = participantEvtConsumer
    logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Initializing participantCmdConsumer...')

    const subscribedMsgNames = [
      'TransferPrepareAcceptedEvt',
      'TransferFulfilAcceptedEvt'
    ]

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await participantEvtConsumer.init(participantEvtHandler, subscribedMsgNames)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._repo.destroy()
  }
}
