/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseAggregate, IEntityStateRepository, IMessagePublisher } from '@mojaloop-poc/lib-domain'
// import {CommandMsg, DomainEventMsg, MessageTypes} from "../../shared/domain_abstractions/messages";
import { TransferEntity, TransferState } from './transfer_entity'
import { TransfersFactory } from './transfers_factory'

export enum TransferssAggTopics {
  'Commands' = 'TransferCommands',
  'DomainEvents' = 'TransferDomainEvents',
}

export class TransfersAgg extends BaseAggregate<TransferEntity, TransferState> {
  constructor (entityStateRepo: IEntityStateRepository<TransferState>, msgPublisher: IMessagePublisher, logger:ILogger) {
    super(TransfersFactory.GetInstance(), entityStateRepo, msgPublisher, logger)
    this._registerCommandHandler('CreateTransferCmd', this.processCreateTransferCommand)
  }

  async processCreateTransferCommand (commandMsg: CreateParticipantCmd): Promise<boolean> {
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
}