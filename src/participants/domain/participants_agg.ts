/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */

'use strict'

import { BaseAggregate } from '../../shared/domain_abstractions/base_aggregate'
import { ParticipantEntity, ParticipantState } from './participant_entity'
// import {CommandMsg, DomainEventMsg, MessageTypes} from "../../shared/domain_abstractions/messages";
import { IEntityStateRepository } from '../../shared/domain_abstractions/ientity_state_repository'
import { IMessagePublisher } from '../../shared/domain_abstractions/imessage_publisher'
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
  constructor (entityStateRepo: IEntityStateRepository<ParticipantState>, msgPublisher: IMessagePublisher) {
    super(ParticipantsFactory.GetInstance(), entityStateRepo, msgPublisher)
    this._registerCommandHandler('CreateParticipantCmd', this.processCreateParticipantCommand)
    this._registerCommandHandler('ReservePayerFundsCmd', this.processReserveFundsCommand)
  }

  async processCreateParticipantCommand (commandMsg: CreateParticipantCmd): Promise<boolean> {
    return await new Promise(async (resolve, reject) => {
      // try loadling first to detect duplicates
      await this.load(commandMsg.payload.id, false)
      if (this._rootEntity != null) {
        this.recordDomainEvent(new DuplicateParticipantDetectedEvt(commandMsg.payload.id))
        return reject(`DuplicateParticipantDetected with command: ${commandMsg.constructor.name} - name: ${commandMsg.payload.name}, id:${commandMsg.payload.id}`)
      }

      this.create(commandMsg.payload.id)
      this._rootEntity!.setupInitialState(
        commandMsg.payload.name,
        commandMsg.payload.limit,
        commandMsg.payload.initialPosition
      )

      this.recordDomainEvent(new ParticipantCreatedEvt(this._rootEntity!))

      return resolve(true)
    })
  }

  async processReserveFundsCommand (commandMsg: ReservePayerFundsCmd): Promise<boolean> {
    return await new Promise(async (resolve, reject) => {
      await this.load(commandMsg.payload.payerId)

      if (this._rootEntity == null) {
        this.recordDomainEvent(new InvalidParticipantEvt(commandMsg.payload.payerId))
        return resolve(false)
      }

      if (!this._rootEntity.canReserveFunds(commandMsg.payload.amount)) {
        this.recordDomainEvent(new NetCapLimitExceededEvt(this._rootEntity.id, commandMsg.payload.transferId))
        return resolve(false)
      }

      this._rootEntity.reserveFunds(commandMsg.payload.amount)

      this.recordDomainEvent(new PayerFundsReservedEvt(commandMsg.payload.transferId, commandMsg.payload.payerId, this._rootEntity.position))

      return resolve(true)
    })
  }
}
