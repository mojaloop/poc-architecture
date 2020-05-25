/**
 * Created by pedrosousabarreto@gmail.com on 21/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandMsg = exports.DomainEventMsg = exports.DomainMsg = exports.MessageTypes = void 0;
const uuid_1 = require("uuid");
// base stuff, can be used for other messaging objects like logging or tracing
var MessageTypes;
(function (MessageTypes) {
    MessageTypes[MessageTypes["STATE_EVENT"] = 0] = "STATE_EVENT";
    MessageTypes[MessageTypes["DOMAIN_EVENT"] = 1] = "DOMAIN_EVENT";
    MessageTypes[MessageTypes["COMMAND"] = 2] = "COMMAND";
})(MessageTypes = exports.MessageTypes || (exports.MessageTypes = {}));
class DomainMsg {
    constructor() {
        this.msg_id = uuid_1.v4(); // unique per message
        this.msg_timestamp = Date.now();
        this.msg_name = this.__proto__.constructor.name;
    }
}
exports.DomainMsg = DomainMsg;
class DomainEventMsg extends DomainMsg {
    constructor() {
        super(...arguments);
        this.msg_type = MessageTypes.DOMAIN_EVENT;
    }
}
exports.DomainEventMsg = DomainEventMsg;
class CommandMsg extends DomainMsg {
    constructor() {
        super(...arguments);
        this.msg_type = MessageTypes.COMMAND;
    }
}
exports.CommandMsg = CommandMsg;
//# sourceMappingURL=messages.js.map