import { DatabaseSync } from 'node:sqlite'
import path from 'path'
import fs from 'fs'

const dbPath = process.env.DATABASE_PATH ?? './data/cronview.db'
const dir = path.dirname(dbPath)
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true })
}

export const sqlite = new DatabaseSync(dbPath)

sqlite.exec('PRAGMA journal_mode = WAL')
sqlite.exec('PRAGMA foreign_keys = ON')

type SqlParam = string | number | bigint | null | Uint8Array

export function getRow<T>(sql: string, ...params: SqlParam[]): T | undefined {
  return sqlite.prepare(sql).get(...params) as T | undefined
}

export function getRows<T>(sql: string, ...params: SqlParam[]): T[] {
  return sqlite.prepare(sql).all(...params) as T[]
}
