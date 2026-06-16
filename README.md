# CronView

A self-hosted dashboard for monitoring cron jobs: run history, failure alerts, and AI-assisted diagnosis when something breaks.

## Stack

- **server** — Fastify + SQLite (`node:sqlite`), TypeScript
- **client** — React, Vite, Tailwind CSS
- **agent** — a small Python wrapper that reports cron job runs from any server back to the API

## Features

- Import an existing crontab and get validated, human-readable schedules
- Track run history per job with a 28-day heatmap and stdout/stderr on each run
- Get alerted by email or webhook when a job fails
- Ask Claude to diagnose a failing job from its recent output and run history
- Register multiple servers and issue per-server agent keys

## Getting started

```bash
pnpm install
cp .env.example .env   # set ANTHROPIC_API_KEY and friends
pnpm dev
```

This runs the server on `:3001` and the client on Vite's dev port concurrently.

## Agent

To report cron job runs from a server, see [`agent/README.md`](agent/README.md) — it's a single-file Python wrapper you drop in front of your existing crontab entries.
