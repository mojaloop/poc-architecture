/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */

'use strict'

import { BaseEventSourcingAggregate, IEntityStateRepository, IMessagePublisher, ILogger, IEntityDuplicateRepository, IESourcingStateRepository, TCommandResult } from '@mojaloop-poc/lib-domain'
import { DuplicateTransferDetectedEvt, TransferPrepareAcceptedEvt, TransferFulfilledEvt, TransferFulfilledEvtPayload, TransferNotFoundEvt, TransferPreparedEvt, TransferPreparedEvtPayload, InvalidTransferEvt, InvalidTransferEvtPayload, TransferFulfilAcceptedEvt } from '@mojaloop-poc/lib-public-messages'
import { PrepareTransferCmd } from '../messages/prepare_transfer_cmd'
import { TransferEntity, TransferState, TransferInternalStates, PrepareTransferData, FulfilTransferData } from './transfer_entity'
import { TransfersFactory } from './transfers_factory'
import { AckPayerFundsReservedCmd } from '../messages/ack_payer_funds_reserved_cmd'
import { FulfilTransferCmd } from '../messages/fulfil_transfer_cmd'
import { AckPayeeFundsCommittedCmd } from '../messages/ack_payee_funds_committed_cmd'
import { TransferPreparedStateEvt, TransferPreparedStateEvtPayload } from '../messages/transfer_prepared_stateevt'
import { TransferStateChangedStateEvt, TransferStateChangedStateEvtPayload } from '../messages/transfer_state_changed_stateevt'
import { TransferFulfiledStateEvt, TransferFulfiledStateEvtPayload } from '../messages/transfer_fulfiled_stateevt'

export enum TransfersAggTopics {
  'Commands' = 'TransferCommands',
  'DomainEvents' = 'TransferDomainEvents',
}

export class TransfersAgg extends BaseEventSourcingAggregate<TransferEntity, TransferState> {
  constructor (entityStateRepo: IEntityStateRepository<TransferState>, entityDuplicateRepo: IEntityDuplicateRepository, esStateRepo: IESourcingStateRepository, msgPublisher: IMessagePublisher, logger: ILogger) {
    super(TransfersFactory.GetInstance(), entityStateRepo, entityDuplicateRepo, esStateRepo, msgPublisher, logger)

    this._registerCommandHandler('PrepareTransferCmd', this.processPrepareTransferCommand)
    this._registerCommandHandler('AckPayerFundsReservedCmd', this.processAckPayerFundsReservedCommand)
    this._registerCommandHandler('AckPayeeFundsCommittedCmd', this.processAckPayeeFundsReservedCommand)
    this._registerCommandHandler('FulfilTransferCmd', this.processFulfilTransferCommand)

    // register event handlers
    this._registerStateEventHandler('TransferPreparedStateEvt', this._applyTransferPreparedStateEvent)
    this._registerStateEventHandler('TransferStateChangedStateEvt', this._applyTransferStateChangedStateEvent)
    this._registerStateEventHandler('TransferFulfiledStateEvt', this._applyTransferFulfiledStateEvent)

    // TODO implement snapshot handler
    // this._setSnapshotHandler(this._applySnapshotHandler)
  }

  async processPrepareTransferCommand (commandMsg: PrepareTransferCmd): Promise<TCommandResult> {
    // try loading first to detect duplicates

    const duplicate: boolean = await this._entityDuplicateRepo.exists(commandMsg.payload.transferId)

    if (duplicate) {
      this.recordDomainEvent(new DuplicateTransferDetectedEvt(commandMsg.payload.transferId))
      return { success: false, stateEvent: null }
    }

    // await this.load(commandMsg.payload.transferId, false)

    // if (this._rootEntity != null) {
    //   this.recordDomainEvent(new DuplicateTransferDetectedEvt(commandMsg.payload.transferId))
    //   return false
    // }

    /* TODO: validation of incoming payload */

    this.create(commandMsg.payload.transferId)

    const transferPrepareRequestData: PrepareTransferData = {
      id: commandMsg.payload.transferId,
      amount: commandMsg.payload.amount,
      currency: commandMsg.payload.currency,
      payerId: commandMsg.payload.payerId,
      payeeId: commandMsg.payload.payeeId,
      expiration: commandMsg.payload.expiration,
      condition: commandMsg.payload.condition,
      prepare: {
        headers: commandMsg.payload.prepare?.headers,
        payload: commandMsg.payload.prepare?.payload
      }
    }

    this._rootEntity!.prepareTransfer(transferPrepareRequestData)

    const transferPrepareAcceptedEvtPayload = {
      transferId: transferPrepareRequestData.id,
      amount: transferPrepareRequestData.amount,
      currency: transferPrepareRequestData.currency,
      payerId: transferPrepareRequestData.payerId,
      payeeId: transferPrepareRequestData.payeeId
    }
    this.recordDomainEvent(new TransferPrepareAcceptedEvt(transferPrepareAcceptedEvtPayload))

    // state event
    const stateEvtPayload: TransferPreparedStateEvtPayload = {
      transfer: {
        ...this._rootEntity!.exportState()
      }
    }
    const stateEvt: TransferPreparedStateEvt = new TransferPreparedStateEvt(stateEvtPayload)

    return { success: true, stateEvent: stateEvt }
  }

  private async _applyTransferPreparedStateEvent (stateEvent: TransferPreparedStateEvt, replayed?: boolean): Promise<void> {
    const state: TransferState = {
      ...stateEvent.payload.transfer,
      created_at: stateEvent.msgTimestamp,
      updated_at: stateEvent.msgTimestamp,
      version: 0 // fixed for now?!?!
    }

    this._rootEntity = this._entity_factory.createFromState(state)
  }

  async processAckPayerFundsReservedCommand (commandMsg: AckPayerFundsReservedCmd): Promise<TCommandResult> {
    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.transferId))
      return { success: false, stateEvent: null }
    }

    if (this._rootEntity.transferInternalState !== TransferInternalStates.RECEIVED_PREPARE) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId,
        reason: `transfer in invalid state of ${this._rootEntity.transferInternalState} while should be RECEIVED_PREPARE`
      }

      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      this._logger.isWarnEnabled() && this._logger.warn(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return { success: false, stateEvent: null }
    }

    this._rootEntity.acknowledgeTransferReserved()

    const transferPreparedEvtPayload: TransferPreparedEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId,
      payerEndPoints: commandMsg.payload.payerEndPoints,
      payeeEndPoints: commandMsg.payload.payeeEndPoints,
      prepare: this._rootEntity.prepare
    }
    this.recordDomainEvent(new TransferPreparedEvt(transferPreparedEvtPayload))

    // state event
    const stateEvtPayload: TransferStateChangedStateEvtPayload = {
      transfer: {
        id: this._rootEntity.id,
        transferInternalState: this._rootEntity.transferInternalState
      }
    }
    const stateEvt: TransferStateChangedStateEvt = new TransferStateChangedStateEvt(stateEvtPayload)

    return { success: true, stateEvent: stateEvt }
  }

  private async _applyTransferStateChangedStateEvent (stateEvent: TransferFulfiledStateEvt, replayed?: boolean): Promise<void> {
    if (this._rootEntity === null) {
      throw new Error('Null root entity found while trying to apply "TransferStateChangedStateEvt"')
    }

    const state: TransferState = this._rootEntity.exportState()

    state.transferInternalState = stateEvent.payload.transfer.transferInternalState

    // replace the state
    this._rootEntity = this._entity_factory.createFromState(state)
  }

  async processFulfilTransferCommand (commandMsg: FulfilTransferCmd): Promise<TCommandResult> {
    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.transferId))
      return { success: false, stateEvent: null }
    }

    if (this._rootEntity.transferInternalState !== TransferInternalStates.RESERVED) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId,
        reason: `transfer in invalid state of ${this._rootEntity.transferInternalState} while should be RESERVED`
      }

      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      this._logger.isWarnEnabled() && this._logger.warn(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return { success: false, stateEvent: null }
    }

    /* TODO: validation of incoming payload */

    // TODO validate the participants are the same, so we can remove the validation from the commitCmd on the participants

    // # Lets try fulfilling transfer
    try {
      const transferFulfilRequestData: FulfilTransferData = {
        id: commandMsg.payload.transferId,
        payerId: commandMsg.payload.payerId,
        payeeId: commandMsg.payload.payeeId,
        fulfilment: commandMsg.payload.fulfilment,
        completedTimestamp: commandMsg.payload.completedTimestamp,
        transferState: commandMsg.payload.transferState,
        fulfil: {
          headers: commandMsg.payload.fulfil?.headers,
          payload: commandMsg.payload.fulfil?.payload
        }
      }

      this._rootEntity.fulfilTransfer(transferFulfilRequestData)
    } catch (err) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId
      }
      /* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
      invalidTransferEvtPayload.reason = `${err.constructor.name} ${err.message}`
      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      this._logger.isWarnEnabled() && this._logger.warn(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return { success: false, stateEvent: null }
    }

    const transferFulfilAcceptedEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId
    }
    this.recordDomainEvent(new TransferFulfilAcceptedEvt(transferFulfilAcceptedEvtPayload))

    // state event
    const state = this._rootEntity.exportState()
    const stateEvtPayload: TransferFulfiledStateEvtPayload = {
      transfer: {
        id: this._rootEntity.id,
        transferInternalState: this._rootEntity.transferInternalState,
        completedTimestamp: state.completedTimestamp,
        fulfil: state.fulfil,
        fulfilment: state.fulfilment
      }
    }
    const stateEvt: TransferFulfiledStateEvt = new TransferFulfiledStateEvt(stateEvtPayload)

    return { success: true, stateEvent: stateEvt }
  }

  private async _applyTransferFulfiledStateEvent (stateEvent: TransferFulfiledStateEvt, replayed?: boolean): Promise<void> {
    if (this._rootEntity === null) {
      throw new Error('Null root entity found while trying to apply "TransferFulfiledStateEvt"')
    }

    const state: TransferState = this._rootEntity.exportState()

    state.transferInternalState = stateEvent.payload.transfer.transferInternalState
    state.completedTimestamp = stateEvent.payload.transfer.completedTimestamp
    state.fulfil = stateEvent.payload.transfer.fulfil
    state.fulfilment = stateEvent.payload.transfer.fulfilment

    // replace the state
    this._rootEntity = this._entity_factory.createFromState(state)
  }

  async processAckPayeeFundsReservedCommand (commandMsg: AckPayeeFundsCommittedCmd): Promise<TCommandResult> {
    await this.load(commandMsg.payload.transferId, false)

    if (this._rootEntity === null) {
      this.recordDomainEvent(new TransferNotFoundEvt(commandMsg.payload.transferId))
      return { success: false, stateEvent: null }
    }

    if (this._rootEntity.transferInternalState !== TransferInternalStates.RECEIVED_FULFIL) {
      const invalidTransferEvtPayload: InvalidTransferEvtPayload = {
        transferId: commandMsg.payload.transferId,
        reason: `transfer in invalid state of ${this._rootEntity.transferInternalState} while should be RECEIVED_FULFIL`
      }

      this.recordDomainEvent(new InvalidTransferEvt(invalidTransferEvtPayload))
      this._logger.isWarnEnabled() && this._logger.warn(`InvalidTransferEvtPayload: ${JSON.stringify(invalidTransferEvtPayload)}`)
      return { success: false, stateEvent: null }
    }

    this._rootEntity.commitTransfer()

    const transferFulfiledEvtPayload: TransferFulfilledEvtPayload = {
      transferId: this._rootEntity.id,
      amount: this._rootEntity.amount,
      currency: this._rootEntity.currency,
      payerId: this._rootEntity.payerId,
      payeeId: this._rootEntity.payeeId,
      payerEndPoints: commandMsg.payload.payerEndPoints,
      payeeEndPoints: commandMsg.payload.payeeEndPoints,
      fulfil: this._rootEntity.fulfil
    }
    this.recordDomainEvent(new TransferFulfilledEvt(transferFulfiledEvtPayload))

    // state event
    const stateEvtPayload: TransferStateChangedStateEvtPayload = {
      transfer: {
        id: this._rootEntity.id,
        transferInternalState: this._rootEntity.transferInternalState
      }
    }
    const stateEvt: TransferStateChangedStateEvt = new TransferStateChangedStateEvt(stateEvtPayload)

    return { success: true, stateEvent: stateEvt }
  }
}
