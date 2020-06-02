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

import { BaseAggregate, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
import { ParticipantEntity, ParticipantState, InvalidAccountError, InvalidLimitError, NetDebitCapLimitExceededError } from './participant_entity'
import { ParticipantsFactory } from './participants_factory'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { DuplicateParticipantDetectedEvt, InvalidParticipantEvt, PayerFundsReservedEvt, ParticipantCreatedEvt, NetCapLimitExceededEvt, PayerFundsCommittedEvt } from '@mojaloop-poc/lib-public-messages'
import { IParticipantRepo } from './participant_repo'
import { CommitPayeeFundsCmd } from '../messages/commit_payee_funds_cmd'

export class ParticpantsAgg extends BaseAggregate<ParticipantEntity, ParticipantState> {
  constructor (entityStateRepo: IParticipantRepo, msgPublisher: IMessagePublisher, logger: ILogger) {
    super(ParticipantsFactory.GetInstance(), entityStateRepo, msgPublisher, logger)
    this._registerCommandHandler('CreateParticipantCmd', this.processCreateParticipantCommand)
    this._registerCommandHandler('ReservePayerFundsCmd', this.processReserveFundsCommand)
    this._registerCommandHandler('CommitPayeeFundsCmd', this.processCommitFundsCommand)
  }

  /*
  # Commented out as it causes the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  // async processCreateParticipantCommand (commandMsg: CreateParticipantCmd): Promise<boolean> {
  //   return await new Promise(async (resolve, reject) => {
  //     // try loadling first to detect duplicates
  //     await this.load(commandMsg.payload.id, false)
  //     if (this._rootEntity != null) {
  //       this.recordDomainEvent(new DuplicateParticipantDetectedEvt(commandMsg.payload.id))
  //       return reject(new Error(`DuplicateParticipantDetected with command: ${commandMsg.constructor.name} - name: ${commandMsg.payload.name}, id:${commandMsg.payload.id}`))
  //     }

  //     this.create(commandMsg.payload.id)
  //     this._rootEntity!.setupInitialState(
  //       commandMsg.payload.name,
  //       commandMsg.payload.limit,
  //       commandMsg.payload.initialPosition
  //     )

  //     this.recordDomainEvent(new ParticipantCreatedEvt(this._rootEntity!))

  //     return resolve(true)
  //   })
  // }

  async processCreateParticipantCommand (commandMsg: CreateParticipantCmd): Promise<boolean> {
    // try loadling first to detect duplicates
    await this.load(commandMsg.payload.id, false)
    if (this._rootEntity != null) {
      const duplicateParticipantDetectedEvtPayload = {
        id: commandMsg.payload.id
      }
      this.recordDomainEvent(new DuplicateParticipantDetectedEvt(duplicateParticipantDetectedEvtPayload))
      return false
    }

    this.create(commandMsg.payload.id)

    const initialState = Object.assign({}, new ParticipantState(), commandMsg.payload)

    this._rootEntity!.setupInitialState(initialState)

    // TODO: Do mapping from rootEntity to participantCreatedEvtPayload
    const participantCreatedEvtPayload = { ...initialState }
    this.recordDomainEvent(new ParticipantCreatedEvt(participantCreatedEvtPayload))

    return true
  }

  /*
  # Commented out as it causes the following lint error `error  Promise returned in function argument where a void return was expected  @typescript-eslint/no-misused-promises`. See below alternative implementation to fix linting issue.
  */
  // async processReserveFundsCommand (commandMsg: ReservePayerFundsCmd): Promise<boolean> {
  //   return await new Promise(async (resolve, reject) => {
  //     await this.load(commandMsg.payload.payerId)

  //     if (this._rootEntity == null) {
  //       this.recordDomainEvent(new InvalidParticipantEvt(commandMsg.payload.payerId))
  //       return resolve(false)
  //     }

  //     if (!this._rootEntity.canReserveFunds(commandMsg.payload.amount)) {
  //       this.recordDomainEvent(new NetCapLimitExceededEvt(this._rootEntity.id, commandMsg.payload.transferId))
  //       return resolve(false)
  //     }

  //     this._rootEntity.reserveFunds(commandMsg.payload.amount)

  //     this.recordDomainEvent(new PayerFundsReservedEvt(commandMsg.payload.transferId, commandMsg.payload.payerId, this._rootEntity.position))

  //     return resolve(true)
  //   })
  // }

  private recordInvalidParticipantEvt (participantId: string, transferId: string, err?: Error): void {
    const InvalidParticipantEvtPayload = {
      id: participantId,
      transferId: transferId,
      reason: err?.message
    }
    this.recordDomainEvent(new InvalidParticipantEvt(InvalidParticipantEvtPayload))
  }

  async processReserveFundsCommand (commandMsg: ReservePayerFundsCmd): Promise<boolean> {
    await this.load(commandMsg.payload.payerId, false)

    // # Validate PayerFSP exists
    if (this._rootEntity == null) {
      this.recordInvalidParticipantEvt(commandMsg.payload.payerId, commandMsg.payload.transferId)
      return false
    }

    // # Validate PayerFSP account - commenting this out since we validate the PayerFSP account as part of the reseverFunds
    // const payerHasAccount: boolean = this._rootEntity.hasAccount(commandMsg.payload.currency)
    // if (!payerHasAccount) {
    //   recordInvalidParticipantEvt(commandMsg.payload.payerId, commandMsg.payload.transferId)
    //   return false
    // }

    // # Validate PayeeFSP account
    const payeeHasAccount: boolean = await (this._entity_state_repo as IParticipantRepo).hasAccount(commandMsg.payload.payeeId, commandMsg.payload.currency)
    if (!payeeHasAccount) {
      this.recordInvalidParticipantEvt(commandMsg.payload.payeeId, commandMsg.payload.transferId)
      return false
    }

    try {
      // # Validate PayerFSP Account+Limit, and Reserve-Funds against position if NET_DEBIG_CAP limit has not been exceeded
      this._rootEntity.reserveFunds(commandMsg.payload.currency, commandMsg.payload.amount)
      const currentPosition = this._rootEntity.getCurrentPosition(commandMsg.payload.currency)
      const payerFundsReservedEvtPayload = {
        transferId: commandMsg.payload.transferId,
        payerId: commandMsg.payload.payerId,
        currency: commandMsg.payload.currency,
        currentPosition: currentPosition
      }
      this.recordDomainEvent(new PayerFundsReservedEvt(payerFundsReservedEvtPayload))
      return true
    } catch (err) {
      switch (err.constructor) {
        case InvalidAccountError:
        case InvalidLimitError: {
          this.recordInvalidParticipantEvt(commandMsg.payload.payerId, commandMsg.payload.transferId, err)
          break
        }
        case NetDebitCapLimitExceededError: {
          const netCapLimitExceededEvtPayload = {
            transferId: commandMsg.payload.transferId,
            payerId: commandMsg.payload.payerId,
            reason: err.message
          }
          this.recordDomainEvent(new NetCapLimitExceededEvt(netCapLimitExceededEvtPayload))
          break
        }
        default: {
          throw err
        }
      }
    }
    return false
  }

  async processCommitFundsCommand (commandMsg: CommitPayeeFundsCmd): Promise<boolean> {
    await this.load(commandMsg.payload.payeeId, false)

    // # Validate PayerFSP exists
    if (this._rootEntity == null) {
      this.recordInvalidParticipantEvt(commandMsg.payload.payeeId, commandMsg.payload.transferId)
      return false
    }

    // # Validate PayeeFSP account - commenting this out since we validate the PayerFSP account as part of the reseverFunds
    const payeeHasAccount: boolean = this._rootEntity.hasAccount(commandMsg.payload.currency)
    if (!payeeHasAccount) {
      this.recordInvalidParticipantEvt(commandMsg.payload.payeeId, commandMsg.payload.transferId)
      return false
    }

    // # Validate PayerFSP account - Is this required?
    const payerHasAccount: boolean = await (this._entity_state_repo as IParticipantRepo).hasAccount(commandMsg.payload.payerId, commandMsg.payload.currency)
    if (!payerHasAccount) {
      this.recordInvalidParticipantEvt(commandMsg.payload.payerId, commandMsg.payload.transferId)
      return false
    }

    // # TODO: Should we also include checks that this commit is in a response to a reserve?

    try {
      // # Validate PayerFSP Account+Limit, and Reserve-Funds against position if NET_DEBIG_CAP limit has not been exceeded
      this._rootEntity.commitFunds(commandMsg.payload.currency, commandMsg.payload.amount)
      const currentPosition = this._rootEntity.getCurrentPosition(commandMsg.payload.currency)
      const commitPayeeFundsCmdPayload = {
        transferId: commandMsg.payload.transferId,
        payerId: commandMsg.payload.payerId,
        payeeId: commandMsg.payload.payeeId,
        currency: commandMsg.payload.currency,
        currentPosition: currentPosition
      }
      this.recordDomainEvent(new PayerFundsCommittedEvt(commitPayeeFundsCmdPayload))
      return true
    } catch (err) {
      switch (err.constructor) {
        case InvalidAccountError:
        case InvalidLimitError: {
          this.recordInvalidParticipantEvt(commandMsg.payload.payerId, commandMsg.payload.transferId, err)
          break
        }
        case NetDebitCapLimitExceededError: {
          const netCapLimitExceededEvtPayload = {
            transferId: commandMsg.payload.transferId,
            payerId: commandMsg.payload.payerId,
            reason: err.message
          }
          this.recordDomainEvent(new NetCapLimitExceededEvt(netCapLimitExceededEvtPayload))
          break
        }
        default: {
          throw err
        }
      }
    }
    return false
  }
}
