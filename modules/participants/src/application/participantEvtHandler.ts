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
  KafkaMessagePublisher,
  // node-kafka imports
  KafkaGenericProducerOptions, KafkaNodeCompressionTypes,
  // kafkajs imports
  KafkaJsCompressionTypes, KafkajsMessagePublisher, KafkaJsProducerOptions,
  // rdkafka importsz
  RDKafkaCompressionTypes, RDKafkaProducerOptions, RDKafkaMessagePublisher, RDKafkaConsumerOptions,
  RDKafkaConsumerBatched
} from '@mojaloop-poc/lib-infrastructure'
import { ReservePayerFundsCmd, ReservePayerFundsCmdPayload } from '../messages/reserve_payer_funds_cmd'
import { CommitPayeeFundsCmd, CommitPayeeFundsCmdPayload } from '../messages/commit_payee_funds_cmd'
import { InvalidParticipantEvtError } from './errors'
import { Crypto, IMetricsFactory } from '@mojaloop-poc/lib-utilities'
import { IParticipantRepo } from '../domain/participant_repo'
import { CachedRedisParticipantStateRepo } from '../infrastructure/cachedredis_participant_repo'

export class ParticipantEvtHandler implements IRunHandler {
  private _consumer: RDKafkaConsumerBatched
  private _publisher: IMessagePublisher
  private _repo: IParticipantRepo
  private readonly _partipantsPartitions: Array<{ id: string, partition: number }> = []

  async start (appConfig: any, logger: ILogger, metrics: IMetricsFactory): Promise<void> {
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
      case (KafkaInfraTypes.NODE_KAFKA_STREAM):
      case (KafkaInfraTypes.NODE_KAFKA): {
        const kafkaGenericProducerOptions: KafkaGenericProducerOptions = {
          client: {
            kafka: {
              kafkaHost: appConfig.kafka.host,
              clientId
            },
            compression: appConfig.kafka.gzipCompression === true ? KafkaNodeCompressionTypes.GZIP : KafkaNodeCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkaMessagePublisher(
          kafkaGenericProducerOptions,
          logger
        )
        break
      }
      case (KafkaInfraTypes.KAFKAJS): {
        const kafkaJsProducerOptions: KafkaJsProducerOptions = {
          client: {
            client: { // https://kafka.js.org/docs/configuration#options
              brokers: [appConfig.kafka.host],
              clientId
            },
            producer: { // https://kafka.js.org/docs/producing#options
              allowAutoTopicCreation: true,
              transactionTimeout: 60000
            },
            compression: appConfig.kafka.gzipCompression as boolean ? KafkaJsCompressionTypes.GZIP : KafkaJsCompressionTypes.None
          }
        }
        kafkaMsgPublisher = new KafkajsMessagePublisher(
          kafkaJsProducerOptions,
          logger
        )
        break
      }
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

    // TODO re-enable the histograms/metrics
    // const histoParticipantEvtHandlerMetric = metrics.getHistogram( // Create a new Histogram instrumentation
    //   'participantEvtHandler', // Name of metric. Note that this name will be concatenated after the prefix set in the config. i.e. '<PREFIX>_exampleFunctionMetric'
    //   'Instrumentation for participantEvtHandler', // Description of metric
    //   ['success', 'error', 'evtname'] // Define a custom label 'success'
    // )

    const participantEvtHandler = async (messages: IDomainMessage[]): Promise<void> => {
      logger.isDebugEnabled() && logger.debug(`ParticipantEvtHandler - processing ${messages?.length} message(s)`)

      // FIXME see todo above
      // const histTimer = histoParticipantEvtHandlerMetric.startTimer()

      const commands: IDomainMessage[] = []

      for (const message of messages) {
        // const evtname = message.msgName ?? 'unknown' // FIXME see todo above
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
              // histTimer({ success: 'true', evtname }) // FIXME see todo above
              return
            }
          }

          if (participantCmd != null) {
            logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - queuing Cmd: ${participantCmd?.msgName}:${message?.msgKey}:${participantCmd?.msgId} `)
            commands.push(participantCmd)
          } else {
            logger.isWarnEnabled() && logger.warn(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Unable to process event`)
          }

          // histTimer({ success: 'true', evtname }) // FIXME see todo above
        } catch (err) {
          const errMsg: string = err?.message?.toString()
          logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - processing event - ${message?.msgName}:${message?.msgKey}:${message?.msgId} - Error: ${errMsg}`)
          logger.isErrorEnabled() && logger.error(err)
          // histTimer({ success: 'false', evtname }) // FIXME see todo above
        }
      }

      if (commands.length > 0) {
        logger.isInfoEnabled() && logger.info(`ParticipantEvtHandler - publishing ${commands.length} cmd(s)`)
        await kafkaMsgPublisher!.publishMany(commands)
      } else {
        logger.isWarnEnabled() && logger.warn('ParticipantEvtHandler - no commands to publish at batch end')
      }
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
    this._consumer = new RDKafkaConsumerBatched(rdKafkaConsumerOptions, logger)

    logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Created RDKafkaConsumerBatched')

    logger.isInfoEnabled() && logger.info('ParticipantEvtHandler - Initializing participantCmdConsumer...')

    const subscribedMsgNames = [
      'TransferPrepareAcceptedEvt',
      'TransferFulfilAcceptedEvt'
    ]

    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    await this._consumer.init(participantEvtHandler, subscribedMsgNames)
  }

  async destroy (): Promise<void> {
    await this._consumer.destroy(true)
    await this._publisher.destroy()
    await this._repo.destroy()
  }
}
