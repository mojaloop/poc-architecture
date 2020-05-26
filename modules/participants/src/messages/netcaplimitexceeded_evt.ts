/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { DomainEventMsg } from '@mojaloop-poc/lib-domain'
import { ParticipantsAggTopics } from '../domain/participants_agg'

export class NetCapLimitExceededEvt extends DomainEventMsg {
  aggregateId: string
  aggregate_name: string = 'Participants'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.DomainEvents

  payload: {
    participantId: string
    transferId: string
  }

  constructor (participantId: string, transferId: string) {
    super()

    this.aggregateId = this.msgKey = participantId

    this.payload = {
      participantId,
      transferId
    }
  }
}
