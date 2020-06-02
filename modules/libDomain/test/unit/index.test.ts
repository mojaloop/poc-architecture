/**
 * Created by pedrosousabarreto@gmail.com on 28/May/2020.
 */

"use strict";


import {CreateTestCommand} from './domain/test_messages'
import {SimpleLogger} from './utilities/simple_logger'
import {TestAgg} from './domain/test_aggregate'
import {ILogger} from '../../src/ilogger'
import {MessageTypes} from '../../src/messages';
import {IMessagePublisher} from '../../src/imessage_publisher'
import {InMemoryTestEntityStateRepo} from './infrastructure/test_repo'
import {InMemMessagePublisher} from './infrastructure/in_mem_publisher';


const logger: ILogger = new SimpleLogger()
let repo: InMemoryTestEntityStateRepo
let in_mem_publisher: IMessagePublisher
let testAgg: TestAgg

describe('libDomain entities', () => {
  beforeAll(async (done:()=>void)=>{
    repo = new InMemoryTestEntityStateRepo()
    await repo.init()

    in_mem_publisher = new InMemMessagePublisher(logger)

    await in_mem_publisher.init()

    testAgg = new TestAgg(repo, in_mem_publisher, logger);

    done()
  })

  test('test commands fromIDomainMessage', () => {

// const idm:TestCommand = TestCommand.fromIDomainMessage<TestCommand>({
    const idm:CreateTestCommand =  CreateTestCommand.fromIDomainMessage({
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
    }) as CreateTestCommand

    const ret = idm.specialMethod()
  // expect(ret).to.eq('worked')

  })

  test('aggregate process cmd', async(done:()=>void) => {
    const create_cmd = new CreateTestCommand({
      id: 'my_id',
      name: 'Test name 2'
    });

    await testAgg.processCommand(create_cmd)
    logger.info("cmd complete")
    done()
  })

})



