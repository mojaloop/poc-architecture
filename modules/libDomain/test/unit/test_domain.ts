/**
 * Created by pedrosousabarreto@gmail.com on 28/May/2020.
 */

"use strict";
import {CommandMsg} from '../../src/messages';

export type TestCommandPayload = {
  id: string
  name: string
  limit: number
  initialPosition: number
}

export class TestCommand extends CommandMsg {
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
