/**
 * Created by pedrosousabarreto@gmail.com on 29/May/2020.
 */

"use strict";

import {CommandMsg, DomainEventMsg} from "../../../src/messages";
import {ParticipantsAggTopics} from "../../../../participants/src/domain/participants_agg";

export type TestCommandPayload = {
  id: string
  name: string
}

export class UnrecognisedTestCommand extends CommandMsg {
  aggregate_name: string = 'Test'
  msgTopic: string = 'TestTopic'

  aggregateId!: string;
  msgKey!: string

  payload!: TestCommandPayload

  constructor (payload:TestCommandPayload){
    super()

    if(!payload)
      return

    this.payload = payload

    this.aggregateId = this.msgKey = this.payload.id
  }

  validatePayload():void{

  }
}

export class CreateTestCommand extends CommandMsg {
  aggregate_name: string = 'Test'
  msgTopic: string = 'TestTopic'

  aggregateId!: string;
  msgKey!: string

  payload!: TestCommandPayload

  constructor (payload:TestCommandPayload){
    super()

    if(!payload)
      return

    this.payload = payload

    this.aggregateId = this.msgKey = this.payload.id
  }

  validatePayload():void{

  }

  specialMethod():string{
    return 'worked'
  }
}



export class TestCreatedEvent extends DomainEventMsg{
  aggregateId: string
  aggregate_name: string = 'Tests'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.DomainEvents

  constructor (testId: string) {
    super()

    this.aggregateId = this.msgKey = testId

    this.payload = {
      id: testId
    }
  }

  validatePayload():void{ }
}



export class DuplicateTestDetectedEvent extends DomainEventMsg{
  aggregateId: string
  aggregate_name: string = 'Tests'
  msgKey: string
  msgTopic: string = ParticipantsAggTopics.DomainEvents

  constructor (testId: string) {
    super()

    this.aggregateId = this.msgKey = testId

    this.payload = {
      id: testId
    }
  }

  validatePayload():void{ }
}
