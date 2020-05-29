/**
 * Created by pedrosousabarreto@gmail.com on 28/May/2020.
 */
"use strict";

import {MessageTypes} from "../../src/messages";
import {TestCommand} from "./test_domain";

describe("libDomain entities", () => {
  test("new entity id", () => {


// const idm:TestCommand = TestCommand.fromIDomainMessage<TestCommand>({
    const idm:TestCommand =  TestCommand.fromIDomainMessage({
      aggregate_name:"aggregate_name",
      aggregateId: "aggregateId",
      msg_name:"msg_name",
      msgId:"msgId",
      msgKey:"msgKey",
      msgTimestamp: 123,
      msgTopic:"msgTopic",
      msgType:MessageTypes.COMMAND,
      payload: {
        id: 'id',
        limit: 2,
        'name': 'name',
        'position': 100
      }
    }) as TestCommand

    const ret = idm.specialMethod()

  })
})



