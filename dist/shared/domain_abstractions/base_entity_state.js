/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntityState = void 0;
const uuid_1 = require("uuid");
class BaseEntityState {
    constructor() {
        this.created_at = Date.now();
        this.updated_at = Date.now();
        this.version = 0;
        this.id = uuid_1.v4();
    }
}
exports.BaseEntityState = BaseEntityState;
//# sourceMappingURL=base_entity_state.js.map