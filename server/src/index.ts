import 'dotenv/config'
import Fastify from 'fastify'
import { migrate } from './db/migrate.js'
import corsPlugin from './plugins/cors.js'
import statsRoutes from './routes/stats.js'
import jobsRoutes from './routes/jobs.js'
import runsRoutes from './routes/runs.js'
import importRoutes from './routes/import.js'
import diagnoseRoutes from './routes/diagnose.js'
import serversRoutes from './routes/servers.js'

const fastify = Fastify({ logger: { level: 'info' } })

migrate()

await fastify.register(corsPlugin)

await fastify.register(async (app) => {
  await app.register(statsRoutes)
  await app.register(jobsRoutes)
  await app.register(runsRoutes)
  await app.register(importRoutes)
  await app.register(diagnoseRoutes)
  await app.register(serversRoutes)
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
