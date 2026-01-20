import 'dotenv/config'
import Fastify from 'fastify'
import { migrate } from './db/migrate.js'

const fastify = Fastify({ logger: { level: 'info' } })

migrate()

fastify.get('/health', async () => ({ ok: true }))

const port = parseInt(process.env.PORT ?? '3001')
try {
  await fastify.listen({ port, host: '0.0.0.0' })
  console.log(`CronView server running on http://localhost:${port}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
