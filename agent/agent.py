#!/usr/bin/env python3
"""
CronView agent — wraps cron jobs to report runs to the CronView API.
Usage: add to crontab as a wrapper:
  0 2 * * *  /path/to/agent.py --job "cleanup:temp-files" -- /usr/bin/find /tmp -delete
"""

import argparse
import subprocess
import sys
import json
import urllib.request
import datetime
import os

API_URL = os.environ.get('CRONVIEW_API_URL', 'http://localhost:3001')
AGENT_KEY = os.environ.get('CRONVIEW_AGENT_KEY', '')
SERVER_ID = os.environ.get('CRONVIEW_SERVER_ID', '')


def report(job_name, started_at, finished_at, exit_code, stdout, stderr):
    payload = json.dumps({
        'jobName': job_name,
        'serverId': SERVER_ID,
        'startedAt': started_at,
        'finishedAt': finished_at,
        'exitCode': exit_code,
        'stdout': stdout[-10000:],
        'stderr': stderr[-10000:],
    }).encode()
    req = urllib.request.Request(
        f'{API_URL}/api/runs',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'X-Agent-Key': AGENT_KEY,
        },
        method='POST'
    )
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception as e:
        print(f'[cronview-agent] Failed to report: {e}', file=sys.stderr)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--job', required=True)
    parser.add_argument('cmd', nargs=argparse.REMAINDER)
    args = parser.parse_args()

    cmd = args.cmd
    if cmd and cmd[0] == '--':
        cmd = cmd[1:]

    started_at = datetime.datetime.utcnow().isoformat() + 'Z'
    result = subprocess.run(cmd, capture_output=True, text=True)
    finished_at = datetime.datetime.utcnow().isoformat() + 'Z'

    if result.stdout:
        print(result.stdout, end='')
    if result.stderr:
        print(result.stderr, end='', file=sys.stderr)

    report(
        job_name=args.job,
        started_at=started_at,
        finished_at=finished_at,
        exit_code=result.returncode,
        stdout=result.stdout,
        stderr=result.stderr,
    )
    sys.exit(result.returncode)


if __name__ == '__main__':
    main()
