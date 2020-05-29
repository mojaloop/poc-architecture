module.exports = {
  // format version sem-ver
  // `v{major}.${minor}.${patch}`
  wait4: 'v0.1.0',

  // How many times should we retry waiting for a service?
  retries: 10,

  // How many ms to wait before retrying a service connection?
  waitMs: 2500,

  // services definitions
  services: [
    {
      name: 'participants',

      // list of services to wait for
      wait4: [
        {
          description: 'Kafka broker',
          uri: 'kafka:9092',
          method: 'ncat'
        },
        {
          description: 'Redis',
          uri: 'redis://redis-participants:6379',
          method: 'redis'
        }
      ]
    },
    {
      name: 'transfers',

      // list of services to wait for
      wait4: [
        {
          description: 'Kafka broker',
          uri: 'kafka:9092',
          method: 'ncat'
        }
      ]
    }
  ]
}