/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateParticipantCmd = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
class CreateParticipantCmd extends messages_1.CommandMsg {
    constructor(initial_position) {
        super();
        this.payload = {
            initial_position
        };
    }
}
exports.CreateParticipantCmd = CreateParticipantCmd;
//# sourceMappingURL=create_payer_position_cmd.js.map