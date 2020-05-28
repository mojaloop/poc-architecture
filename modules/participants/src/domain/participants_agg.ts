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

import { BaseAggregate, IEntityStateRepository, IMessagePublisher, ILogger } from '@mojaloop-poc/lib-domain'
// import {CommandMsg, DomainEventMsg, MessageTypes} from "../../shared/domain_abstractions/messages";
import { ParticipantEntity, ParticipantState } from './participant_entity'
import { ParticipantsFactory } from './participants_factory'
import { ReservePayerFundsCmd } from '../messages/reserve_payer_funds_cmd'
import { CreateParticipantCmd } from '../messages/create_participant_cmd'
import { DuplicateParticipantDetectedEvt } from '../messages/duplicate_participant_evt'
import { InvalidParticipantEvt } from '../messages/invalid_participant_evt'
import { PayerFundsReservedEvt } from '../messages/payer_funds_reserved_evt'
import { ParticipantCreatedEvt } from '../messages/participant_created_evt'
import { NetCapLimitExceededEvt } from '../messages/netcaplimitexceeded_evt'

export enum ParticipantsAggTopics{
  'Commands' = 'ParticipantCommands',
  'DomainEvents' = 'ParticipantDomainEvents',
  // "StateEvents" = "ParticipantStateEvents"
}

export class ParticpantsAgg extends BaseAggregate<ParticipantEntity, ParticipantState> {
  constructor (entityStateRepo: IEntityStateRepository<ParticipantState>, msgPublisher: IMessagePublisher, logger: ILogger) {
    super(ParticipantsFactory.GetInstance(), entityStateRepo, msgPublisher, logger)
    this._registerCommandHandler('CreateParticipantCmd', this.processCreateParticipantCommand)
    this._registerCommandHandler('ReservePayerFundsCmd', this.processReserveFundsCommand)
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
      this.recordDomainEvent(new DuplicateParticipantDetectedEvt(commandMsg.payload.id))
      return false
    }

    this.create(commandMsg.payload.id)
    this._rootEntity!.setupInitialState(
      commandMsg.payload.name,
      commandMsg.payload.limit,
      commandMsg.payload.initialPosition
    )

    this.recordDomainEvent(new ParticipantCreatedEvt(this._rootEntity!))

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

  async processReserveFundsCommand (commandMsg: ReservePayerFundsCmd): Promise<boolean> {
    await this.load(commandMsg.payload.payerId)

    if (this._rootEntity == null) {
      this.recordDomainEvent(new InvalidParticipantEvt(commandMsg.payload.payerId))
      return false
    }

    if (!this._rootEntity.canReserveFunds(commandMsg.payload.amount)) {
      this.recordDomainEvent(new NetCapLimitExceededEvt(this._rootEntity.id, commandMsg.payload.transferId))
      return true
    }

    this._rootEntity.reserveFunds(commandMsg.payload.amount)

    this.recordDomainEvent(new PayerFundsReservedEvt(commandMsg.payload.transferId, commandMsg.payload.payerId, this._rootEntity.position))

    return true
  }
}
