import 'dotenv/config'
import Fastify from 'fastify'
import { migrate } from './db/migrate.js'
import corsPlugin from './plugins/cors.js'
import jobsRoutes from './routes/jobs.js'

const fastify = Fastify({ logger: { level: 'info' } })

migrate()

await fastify.register(corsPlugin)

await fastify.register(async (app) => {
  await app.register(jobsRoutes)
}, { prefix: '/api' })

fastify.get('/health', async () => ({ ok: true }))

const port = parseInt(process.env.PORT ?? '3001')
try {
  await fastify.listen({ port, host: '0.0.0.0' })
  console.log(`CronView server running on http://localhost:${port}`)
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
