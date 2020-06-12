/**
 * Created by Roman Pietrzak y@ke.mu on 2020-05-26.
 */
'use strict'

import { BaseEntityState, BaseEntity } from '@mojaloop-poc/lib-domain'
import { TransferRawPayload } from '@mojaloop-poc/lib-public-messages'
import * as crypto from 'crypto'
import base64url from 'base64url'

export enum TransferInternalStates {
  ABORTED_ERROR = 'ABORTED_ERROR',
  ABORTED_REJECTED = 'ABORTED_REJECTED',
  COMMITTED = 'COMMITTED',
  EXPIRED_PREPARED = 'EXPIRED_PREPARED',
  EXPIRED_RESERVED = 'EXPIRED_RESERVED',
  FAILED = 'FAILED',
  INVALID = 'INVALID',
  RECEIVED_ERROR = 'RECEIVED_ERROR',
  RECEIVED_FULFIL = 'RECEIVED_FULFIL',
  RECEIVED_PREPARE = 'RECEIVED_PREPARE',
  RECEIVED_REJECT = 'RECEIVED_REJECT',
  RESERVED = 'RESERVED',
  RESERVED_TIMEOUT = 'RESERVED_TIMEOUT'
}

export class ValidateFulfilConditionFailed extends Error {}
export class ValidateFulfilConditionNoMatch extends Error {}

export class TransferState extends BaseEntityState {
  amount: string
  currency: string
  transferInternalState: TransferInternalStates
  payerId: string
  payeeId: string
  expiration: string
  condition: string
  prepare: TransferRawPayload
  fulfilment: string
  completedTimestamp: string
  fulfil: TransferRawPayload
  reject: TransferRawPayload
}

export type PrepareTransferData = {
  id: string
  amount: string
  currency: string
  payerId: string
  payeeId: string
  expiration: string
  condition: string
  prepare: TransferRawPayload
}

export type FulfilTransferData = {
  id: string
  payerId: string
  payeeId: string
  fulfilment: string
  completedTimestamp: string
  transferState: string
  fulfil: TransferRawPayload
}

const fulfilmentToCondition = (fulfilment: string): string => {
  const hashSha256 = crypto.createHash('sha256')
  const preimage = base64url.toBuffer(fulfilment)

  if (preimage.length !== 32) {
    throw new ValidateFulfilConditionFailed('fulfilmentToCondition: Interledger preimages must be exactly 32 bytes')
  }

  const calculatedConditionDigest = hashSha256.update(preimage).digest('base64')
  const calculatedConditionUrlEncoded = base64url.fromBase64(calculatedConditionDigest)
  return calculatedConditionUrlEncoded
}

export class TransferEntity extends BaseEntity<TransferState> {
  get amount (): string {
    return this._state.amount
  }

  get currency (): string {
    return this._state.currency
  }

  get transferInternalState (): TransferInternalStates {
    return this._state.transferInternalState
  }

  get payerId (): string {
    return this._state.payerId
  }

  get payeeId (): string {
    return this._state.payeeId
  }

  get prepare (): TransferRawPayload {
    return this._state?.prepare
  }

  get fulfil (): TransferRawPayload {
    return this._state?.fulfil
  }

  get reject (): TransferRawPayload {
    return this._state?.reject
  }

  static CreateInstance (initialState?: TransferState): TransferEntity {
    initialState = initialState ?? new TransferState()

    const entity: TransferEntity = new TransferEntity(initialState)

    return entity
  }

  prepareTransfer (incommingTransfer: PrepareTransferData): void {
    this._state.id = incommingTransfer.id
    this._state.amount = incommingTransfer.amount
    this._state.currency = incommingTransfer.currency
    this._state.payerId = incommingTransfer.payerId
    this._state.payeeId = incommingTransfer.payeeId
    this._state.transferInternalState = TransferInternalStates.RECEIVED_PREPARE
    this._state.expiration = incommingTransfer.expiration
    this._state.condition = incommingTransfer.condition
    this._state.prepare = {
      headers: incommingTransfer.prepare?.headers,
      payload: incommingTransfer.prepare?.payload
    }
  }

  acknowledgeTransferReserved (): void {
    this._state.transferInternalState = TransferInternalStates.RESERVED
  }

  validateFulfilCondition (fulfilment: string): boolean {
    const calculatedCondition = fulfilmentToCondition(fulfilment)
    return calculatedCondition === this._state.condition
  }

  fulfilTransfer (incommingTransfer: FulfilTransferData): void {
    if (!this.validateFulfilCondition(incommingTransfer.fulfilment)) {
      this._state.transferInternalState = TransferInternalStates.RECEIVED_ERROR
      throw new ValidateFulfilConditionNoMatch(`Fulfilment and condition do not match (condition: ${this._state.condition} fulfilment: ${incommingTransfer.fulfilment})`)
    }
    this._state.fulfilment = incommingTransfer.fulfilment
    this._state.completedTimestamp = incommingTransfer.completedTimestamp
    this._state.fulfil = incommingTransfer.fulfil
    this._state.transferInternalState = TransferInternalStates.RECEIVED_FULFIL
  }

  commitTransfer (): void {
    this._state.transferInternalState = TransferInternalStates.COMMITTED
  }
}
