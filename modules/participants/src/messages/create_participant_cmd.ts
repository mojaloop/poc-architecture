/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { ParticipantsAggTopics } from '../domain/participants_agg'

export class CreateParticipantCmd extends CommandMsg {
  aggregateId: string
  aggregate_name: string = 'Participants'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.Commands

  payload: {
    id: string
    name: string
    limit: number
    initialPosition: number
  }

  constructor (id: string, name: string, limit: number, initialPosition: number) {
    super()

    this.aggregateId = this.msgKey = id

    this.payload = {
      id,
      name,
      limit,
      initialPosition
    }
  }
}
