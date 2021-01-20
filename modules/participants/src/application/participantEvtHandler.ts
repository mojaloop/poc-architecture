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
  IRunHandler,
  KafkaInfraTypes,
  // rdkafka imports
  RDKafkaCompressionTypes, RDKafkaProducerOptions, RDKafkaMessagePublisher, RDKafkaConsumerOptions,
  // rdkafka batch imports
  RDKafkaConsumerBatched, RDKafkaConsumer
} from '@mojaloop-poc/lib-infrastructure'
import { ReservePayerFundsCmd, ReservePayerFundsCmdPayload } from '../messages/reserve_payer_funds_cmd'
import { CommitPayeeFundsCmd, CommitPayeeFundsCmdPayload } from '../messages/commit_payee_funds_cmd'
import { InvalidParticipantEvtError } from './errors'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { IParticipantRepo } from '../domain/participant_repo'
import { CachedRedisParticipantStateRepo } from '../infrastructure/cachedredis_participant_repo'
import { v4 as uuidv4 } from 'uuid'

export class ParticipantEvtHandler implements IRunHandler {
  private _logger: ILogger
  private _consumerBatched: RDKafkaConsumerBatched
  private _consumer: RDKafkaConsumer
  private _publisher: IMessagePublisher
  private _repo: IParticipantRepo
  private readonly _partipantsPartitions: Array<{ id: string, partition: number }> = []
  private _histoParticipantEvtHandlerMetric: any
  private _histoParticipantEvtHandlerBatchesMetric: any

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
    this._logger = logger
    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler::start - appConfig=${JSON.stringify(appConfig)}`)

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Creating Statecache of type ${CachedRedisParticipantStateRepo.name}`)

    const repo: IParticipantRepo = new CachedRedisParticipantStateRepo(appConfig.state_cache.host, appConfig.state_cache.clustered, logger)

    this._repo = repo
    await repo.init()

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Created Statecache of type ${repo.constructor.name}`)

    let kafkaMsgPublisher: IMessagePublisher | undefined

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Creating ${appConfig.kafka.producer as string} participantEvtHandler.kafkaMsgPublisher...`)
    let clientId = `participantEvtHandler-${appConfig.kafka.producer as string}-${Crypto.randomBytes(8)}`
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
        logger.isWarnEnabled() && logger.warn('ParticipantEvtHandler - Unable to find a Kafka Producer implementation!')
        throw new Error('participantEvtHandler.kafkaMsgPublisher was not created!')
      }
    }

    logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - Created kafkaMsgPublisher of type ${kafkaMsgPublisher.constructor.name}`)

    this._publisher = kafkaMsgPublisher
    await kafkaMsgPublisher.init()

    this._histoParticipantEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
      'participantEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
      'Instrumentation for participantEvtHandler - time it takes for each event to be processed', // Description of metric
      ['success', 'error', 'evtname'] // Define a custom label 'success'
    )
    if (appConfig.batch.enabled === true) {
      this._histoParticipantEvtHandlerBatchesMetric = metrics.getHistogram( // Create a new Histogram instrumentation
        'participantEvtHandlerBatch', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
        'Instrumentation for participantEvtHandler - time it takes for each batch of events to be processed', // Description of metric
        ['success', 'error'] // Define a custom label 'success'
      )
    }

    logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Creating $RDKafkaConsumerBatched participantEvtConsumer...')
    clientId = `participantEvtConsumer-${appConfig.kafka.consumer as string}-${Crypto.randomBytes(8)}`

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

    const subscribedMsgNames = [
      'TransferPrepareAcceptedEvt',
      'TransferFulfilAcceptedEvt'
    ]

    if (appConfig.batch.enabled === true) {
      this._consumerBatched = new RDKafkaConsumerBatched(rdKafkaConsumerOptions, logger)
      logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Created RDKafkaConsumerBatched')
      await this._consumerBatched.init(this._participantEvtHandlerBatched.bind(this), subscribedMsgNames)
      logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Initialised RDKafkaConsumerBatched')
    } else {
      this._consumer = new RDKafkaConsumer(rdKafkaConsumerOptions, logger)
      logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Created RDKafkaConsumer')
      await this._consumer.init(this._participantEvtHandler.bind(this), subscribedMsgNames)
      logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Initialised RDKafkaConsumer')
    }
  }

  private async _participantEvtHandler (message: IDomainMessage): Promise<void> {
    const histTimer = this._histoParticipantEvtHandlerMetric.startTimer()
    const evtname = message.msgName ?? 'unknown'
    try {
      this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
      const participantCmd: CommandMsg | undefined = await this._getCommandFromEventMsg(message)

      if (participantCmd !== undefined) {
        this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - publishing cmd - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Cmd: ${participantCmd?.msgName}:${message?.msgKey}:${participantCmd?.msgId}`)
        await this._publisher.publish(participantCmd)
      } else {
        this._logger.isWarnEnabled() && this._logger.warn(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
      }

      this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Result: true`)
      histTimer({ success: 'true', evtname })
    } catch (err) {
      const errMsg: string = err?.message?.toString()
      this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimer({ success: 'false', /* error: err.message, */ evtname })
    }
  }

  private async _participantEvtHandlerBatched (messages: IDomainMessage[]): Promise<void> {
    const batchId: string = uuidv4()
    this._logger.isDebugEnabled() && this._logger.debug(`ParticipantEvtHandler - batchId: ${batchId} - processing ${messages?.length} message(s)`)

    const histTimer = this._histoParticipantEvtHandlerMetric.startTimer()
    const histTimerBatches = this._histoParticipantEvtHandlerBatchesMetric.startTimer()

    const commands: IDomainMessage[] = []
    try {
      for (const message of messages) {
        // const evtname = message.msgName ?? 'unknown' // FIXME see todo above
        try {
          this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Start`)
          const participantCmd: CommandMsg | undefined = await this._getCommandFromEventMsg(message)

          if (participantCmd !== undefined) {
            this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - queuing Cmd: ${participantCmd?.msgName}:${message?.msgKey}:${participantCmd?.msgId} `)
            commands.push(participantCmd)
          } else {
            this._logger.isWarnEnabled() && this._logger.warn(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
          }

          // histTimer({ success: 'true', evtname }) // FIXME see todo above
        } catch (err) {
          const errMsg: string = err?.message?.toString()
          this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
          this._logger.isErrorEnabled() && this._logger.error(err)
          // histTimer({ success: 'false', evtname }) // FIXME see todo above
        }
      }

      if (commands.length > 0) {
        this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - publishing ${commands.length} cmd(s)`)
        await this._publisher.publishMany(commands)

        for (const message of messages) {
          histTimer({ success: 'true', evtname: message.msgName ?? 'unknown' })
        }
      } else {
        this._logger.isWarnEnabled() && this._logger.warn('ParticipantEvtHandler - no commands to publish at batch end')
      }

      this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - batchId: ${batchId} - finished`)
      histTimerBatches({ success: 'true' })
    } catch (err) {
      this._logger.isErrorEnabled() && this._logger.error(`ParticipantEvtHandler - batchId: ${batchId} - failed`)
      this._logger.isErrorEnabled() && this._logger.error(err)
      histTimer({ success: 'false', error: err.message })
      histTimerBatches({ success: 'true' })
      throw err
    }

    this._logger.isDebugEnabled() && this._logger.debug('') // empty line to facilitate log analysis
  }

  private async _getCommandFromEventMsg (message: IDomainMessage): Promise<CommandMsg | undefined> {
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
        this._logger.isInfoEnabled() && this._logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Skipping unknown event`)
      }
    }
    return participantCmd
  }

  async destroy (): Promise<void> {
    if (this._consumer !== undefined) await this._consumer.destroy(true)
    if (this._consumerBatched !== undefined) await this._consumerBatched.destroy(true)
    await this._publisher.destroy()
    await this._repo.destroy()
  }
}
