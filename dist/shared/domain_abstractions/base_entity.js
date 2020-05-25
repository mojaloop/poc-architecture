/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseEntity = void 0;
class BaseEntity {
    constructor(initial_state) {
        this._state = initial_state;
    }
    // id is a property of state data, not behaviour
    get id() {
        return this._state.id;
    }
    get version() {
        return this._state.version;
    }
    ;
    // required so we can export/persist the state and still forbid direct state changes
    export_state() {
        const clone = Object.assign({}, this._state);
        return clone;
    }
}
exports.BaseEntity = BaseEntity;
//# sourceMappingURL=base_entity.js.map