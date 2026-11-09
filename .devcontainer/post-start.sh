#!/usr/bin/env bash
# Runs on every container start: applies pending migrations, then starts the
# dev server in the background so http://localhost:3000 works without
# attaching a terminal.
#   Logs: /tmp/dev.log
#   Stop: kill -- -"$(cat /tmp/dev.pid)"
set -euo pipefail

LOG=/tmp/dev.log
PIDFILE=/tmp/dev.pid

port_open() { (echo >/dev/tcp/127.0.0.1/3000) 2>/dev/null; }

if [ ! -f node_modules/.modules.yaml ]; then
  echo "Dependencies are not installed (did post-create.sh fail?)." >&2
  echo "Run 'pnpm install', then restart the container or run this script again." >&2
  exit 1
fi

until pg_isready -h postgres -U postgres -q; do sleep 1; done
pnpm db:migrate

if port_open; then
  echo "Port 3000 is already in use; not starting another dev server."
  exit 0
fi

# When this runs under a TTY (devcontainer CLI in a terminal, docker exec -t),
# the shell's exit sends SIGHUP to its process group. Ignore it before forking
# so the child can't be hit before setsid moves it into its own session.
# setsid also makes the server a process group leader, so the stop command
# above takes down pnpm, turbo and next together.
trap '' HUP
rm -f "$PIDFILE"
setsid -f bash -c 'echo $$ >"$1"; exec nohup pnpm dev >"$2" 2>&1 </dev/null' _ "$PIDFILE" "$LOG"

# Report failure here instead of leaving a dead server and a silent log.
for _ in $(seq 1 60); do
  if port_open; then
    echo "Dev server running on http://localhost:3000 (logs: $LOG)"
    exit 0
  fi
  if [ -f "$PIDFILE" ] && ! kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "Dev server exited during startup. Last lines of $LOG:" >&2
    tail -n 20 "$LOG" >&2
    exit 1
  fi
  sleep 1
done
echo "Dev server is not up after 60s. Last lines of $LOG:"
tail -n 20 "$LOG"
