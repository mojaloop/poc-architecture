/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { ParticipantsAggTopics } from '../domain/participants_agg'

export class PayerFundsReservedEvt extends DomainEventMsg {
  aggregateId: string
  aggregate_name: string = 'Participants'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.DomainEvents

  payload: {
    transferId: string
    payerId: string
    currentPosition: number
  }

  constructor (transferId: string, payerId: string, currentPosition: number) {
    super()

    this.aggregateId = this.msgKey = payerId

    this.payload = {
      transferId,
      payerId,
      currentPosition
    }
  }
}
