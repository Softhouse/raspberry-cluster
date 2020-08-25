// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })
const os = require('os');
const nodeName = process.env.NODENAME || 'unknown';
let nonce = 0;

// Declare a route
fastify.get('/', async (request, reply) => {
  return {
    id: os.hostname(),
    osUptime: os.uptime(),
    nodeName: nodeName,
    nodeUptime: Math.floor(process.uptime()),
    nonce: ++nonce,
    value: Math.floor(Math.random() * 99999)
  }
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000, '0.0.0.0')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()

process.on('SIGTERM', () => {
  console.log('WHACKED :(')
  process.exit(0);
})