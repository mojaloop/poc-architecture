/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */

'use strict'

import { CommandMsg } from '@mojaloop-poc/lib-domain'
import { ParticipantsAggTopics } from '../domain/participants_agg'

export class ReservePayerFundsCmd extends CommandMsg {
  aggregateId: string
  aggregate_name: string = 'Participants'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.Commands

  payload: {
    payerId: string
    transferId: string
    amount: number
  }

  constructor (payerId: string, transferId: string, amount: number) {
    super()
    this.aggregateId = this.msgKey = payerId

    this.payload = {
      payerId,
      transferId,
      amount
    }
  }
}
