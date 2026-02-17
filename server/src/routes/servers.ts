import type { FastifyInstance } from 'fastify'
import { sqlite } from '../db/client.js'
import { nanoid } from 'nanoid'
import type { ServerRecord } from '../db/schema.js'

export default async function (fastify: FastifyInstance) {
  fastify.get('/servers', async () => {
    const servers = sqlite.prepare(`SELECT id, name, host, created_at FROM servers ORDER BY name`).all() as Array<{
      id: string; name: string; host: string | null; created_at: string | null
    }>
    return servers.map(s => ({ id: s.id, name: s.name, host: s.host, createdAt: s.created_at }))
  })

  fastify.post('/servers', async (req, reply) => {
    const { name, host } = req.body as { name: string; host?: string }
    if (!name) return reply.code(400).send({ error: 'name is required' })

    const agentKey = nanoid(32)
    const id = nanoid()
    const now = new Date().toISOString()

    sqlite.prepare(`
      INSERT INTO servers (id, name, host, agent_key, created_at) VALUES (?, ?, ?, ?, ?)
    `).run(id, name, host ?? null, agentKey, now)

    const server = sqlite.prepare(`SELECT * FROM servers WHERE id = ?`).get(id) as ServerRecord
    return reply.code(201).send({
      id: server.id,
      name: server.name,
      host: server.host,
      agentKey: server.agent_key,
      createdAt: server.created_at,
    })
  })
}
