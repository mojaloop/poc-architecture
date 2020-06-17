const RC = require('parse-strings-in-object')(require('rc')('MLAPI', require('../../config/default.json')))
const fs = require('fs')

function getFileContent (path) {
  if (!fs.existsSync(path)) {
    console.log(`File ${path} doesn't exist, can't enable JWS signing`)
    throw new Error('File doesn\'t exist')
  }
  return fs.readFileSync(path)
}
// Set config object to be returned
const config = {
  HOSTNAME: RC.HOSTNAME.replace(/\/$/, ''),
  PORT: RC.PORT,
  AMOUNT: RC.AMOUNT,
  DFSP_URLS: RC.DFSP_URLS,
  SEND_TRANSFER_CONFIRMATION_TO_PAYEE: RC.TRANSFERS.SEND_TRANSFER_CONFIRMATION_TO_PAYEE,
  ERROR_HANDLING: RC.ERROR_HANDLING,
  HANDLERS: RC.HANDLERS,
  HANDLERS_DISABLED: RC.HANDLERS.DISABLED,
  HANDLERS_API: RC.HANDLERS.API,
  HANDLERS_API_DISABLED: RC.HANDLERS.API.DISABLED,
  KAFKA_CONFIG: RC.KAFKA,
  ENDPOINT_CACHE_CONFIG: RC.ENDPOINT_CACHE_CONFIG,
  ENDPOINT_SOURCE_URL: RC.ENDPOINT_SOURCE_URL,
  ENDPOINT_HEALTH_URL: RC.ENDPOINT_HEALTH_URL,
  INSTRUMENTATION_METRICS_DISABLED: RC.INSTRUMENTATION.METRICS.DISABLED,
  INSTRUMENTATION_METRICS_CONFIG: RC.INSTRUMENTATION.METRICS.config,
  ENDPOINT_SECURITY: RC.ENDPOINT_SECURITY,
  ENDPOINT_SECURITY_TLS: RC.ENDPOINT_SECURITY.TLS,
  MAX_FULFIL_TIMEOUT_DURATION_SECONDS: RC.MAX_FULFIL_TIMEOUT_DURATION_SECONDS,
  MAX_CALLBACK_TIME_LAG_DILATION_MILLISECONDS: RC.MAX_CALLBACK_TIME_LAG_DILATION_MILLISECONDS,
  STRIP_UNKNOWN_HEADERS: RC.STRIP_UNKNOWN_HEADERS,
  JWS_SIGN: RC.ENDPOINT_SECURITY.JWS.JWS_SIGN,
  FSPIOP_SOURCE_TO_SIGN: RC.ENDPOINT_SECURITY.JWS.FSPIOP_SOURCE_TO_SIGN,
  JWS_SIGNING_KEY_PATH: RC.ENDPOINT_SECURITY.JWS.JWS_SIGNING_KEY_PATH
}

if (config.JWS_SIGN) {
  config.JWS_SIGNING_KEY = getFileContent(config.JWS_SIGNING_KEY_PATH)
}

module.exports = config