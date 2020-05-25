/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { DomainEventMsg } from '../../shared/domain_abstractions/messages'
import { ParticipantsAggTopics } from '../domain/participants_agg'

export class DuplicateParticipantDetectedEvt extends DomainEventMsg {
  aggregateId: string
  aggregate_name: string = 'Participants'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.DomainEvents

  payload: {
    participantId: string
  }

  constructor (participantId: string) {
    super()

    this.aggregateId = this.msgKey = participantId

    this.payload = {
      participantId
    }
  }
}
