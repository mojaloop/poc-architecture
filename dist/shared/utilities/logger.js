/**
 * Created by pedrosousabarreto@gmail.com on 22/May/2020.
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleLogger = void 0;
class ConsoleLogger {
    // trace(...anything) {
    // 	console.trace.apply(this, anything);
    // }
    debug(message, ...optional) {
        // @ts-ignore
        console.log.apply(this, arguments);
    }
    info(message, ...optionalParams) {
        // @ts-ignore
        console.info.apply(this, arguments);
    }
    warn(message, ...optional) {
        // @ts-ignore
        console.warn.apply(this, arguments);
    }
    error(message, ...optional) {
        // @ts-ignore
        console.error.apply(this, arguments);
    }
    fatal(message, ...optional) {
        // @ts-ignore
        console.error.apply(this, rguments);
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=logger.js.map