/**
 * Created by pedrosousabarreto@gmail.com on 28/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const messages_1 = require("../../src/messages");
const test_domain_1 = require("./test_domain");
describe("libDomain entities", () => {
    test("new entity id", () => {
        // const idm:TestCommand = TestCommand.fromIDomainMessage<TestCommand>({
        const idm = test_domain_1.TestCommand.fromIDomainMessage({
            aggregate_name: "aggregate_name",
            aggregateId: "aggregateId",
            msg_name: "msg_name",
            msgId: "msgId",
            msgKey: "msgKey",
            msgTimestamp: 123,
            msgTopic: "msgTopic",
            msgType: messages_1.MessageTypes.COMMAND,
            payload: {
                id: 'id',
                limit: 2,
                'name': 'name',
                'position': 100
            }
        });
        const ret = idm.specialMethod();
    });
});
//# sourceMappingURL=index.test.js.map