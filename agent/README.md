# CronView Agent

A lightweight Python script that wraps cron jobs to report runs back to the CronView API.

## Installation

1. Copy `agent.py` to your server (e.g. `/usr/local/bin/cronview-agent`)
2. Make it executable: `chmod +x /usr/local/bin/cronview-agent`
3. Set environment variables (e.g. in `/etc/environment` or your crontab):

```
CRONVIEW_API_URL=http://your-cronview-host:3001
CRONVIEW_AGENT_KEY=<key from CronView Servers page>
CRONVIEW_SERVER_ID=<server id from CronView>
```

## Usage

Wrap your existing cron commands with the agent:

```crontab
# Before
0 2 * * * /scripts/backup.sh

# After
0 2 * * * CRONVIEW_API_URL=http://... CRONVIEW_AGENT_KEY=... CRONVIEW_SERVER_ID=... /usr/local/bin/cronview-agent --job "backup:postgres" -- /scripts/backup.sh
```

Or set the env vars globally so your crontab stays clean:

```crontab
CRONVIEW_API_URL=http://your-cronview-host:3001
CRONVIEW_AGENT_KEY=your-agent-key
CRONVIEW_SERVER_ID=your-server-id

0 2 * * * /usr/local/bin/cronview-agent --job "backup:postgres" -- /scripts/backup.sh
0 9 * * 1 /usr/local/bin/cronview-agent --job "report:weekly" -- /scripts/weekly-report.sh
```

## How it works

1. Runs your command and captures stdout, stderr, and exit code
2. POSTs the run result to the CronView API
3. Passes through all output — your existing log capture still works
4. Exits with the same exit code as the wrapped command
