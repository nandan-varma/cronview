import cors from '@fastify/cors'
import type { FastifyInstance } from 'fastify'

export default async function (fastify: FastifyInstance) {
  await fastify.register(cors, { origin: true })
}
