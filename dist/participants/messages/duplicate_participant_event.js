/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DuplicateParticipantDetectedEvt = void 0;
const messages_1 = require("../../shared/domain_abstractions/messages");
class DuplicateParticipantDetectedEvt extends messages_1.DomainEventMsg {
    constructor(participant_id) {
        super();
        this.payload = {
            participant_id
        };
    }
}
exports.DuplicateParticipantDetectedEvt = DuplicateParticipantDetectedEvt;
//# sourceMappingURL=duplicate_participant_event.js.map