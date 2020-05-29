/**
 * Created by pedrosousabarreto@gmail.com on 28/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestCommand = void 0;
const messages_1 = require("../../src/messages");
class TestCommand extends messages_1.CommandMsg {
    constructor(payload) {
        super();
        this.aggregate_name = 'Test';
        this.msgTopic = 'TestTopic';
        if (!payload)
            return;
        this.payload = payload;
        this.aggregateId = this.msgKey = this.payload.id;
    }
    validatePayload() {
    }
    specialMethod() {
        return 'worked';
    }
}
exports.TestCommand = TestCommand;
//# sourceMappingURL=test_domain.js.map