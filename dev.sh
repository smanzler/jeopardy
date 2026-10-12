#!/usr/bin/env bash
# dev.sh — start the stack in its own tmux session.
#
#   backend   docker logs | api
#   frontend  web
#
# Starts detached — it never moves you. Jump there yourself:
#   tmux switch-client -t '=jeopardy:'

set -uo pipefail

SESSION="${JEOPARDY_SESSION:-jeopardy}"
ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
COMPOSE="$ROOT/packages/api/docker-compose.yml"

step() { printf '\n\033[1m==> %s\033[0m\n' "$*"; }
info() { printf '  %s\n' "$*"; }
die()  { printf '\033[31mdev: %s\033[0m\n' "$*" >&2; exit 1; }

jump_hint() {
  if [ -n "${TMUX:-}" ]; then
    info "jump there with: tmux switch-client -t '=$SESSION:'"
  else
    info "attach with:     tmux attach -t '=$SESSION:'"
  fi
}

command -v tmux >/dev/null || die "tmux not found"

# A session target needs both the '=' and the trailing ':'. Bare -t
# prefix-matches, and '=' alone can lose to a window of the same name.
if tmux has-session -t "=$SESSION:" 2>/dev/null; then
  info "session '$SESSION' is already up"
  jump_hint
  exit 0
fi

step "Containers"
docker info >/dev/null 2>&1 || die "Docker is not responding"
# --wait blocks until the database healthcheck passes, so the api never starts
# against a database that does not accept connections yet.
docker compose -f "$COMPOSE" up --wait --wait-timeout 120 -d \
  || die "containers did not come up — check 'docker compose -f $COMPOSE ps'"
info "database healthy"

step "Session"
tmux new-session -d -s "$SESSION" -c "$ROOT" -n backend \
  || die "could not create session '$SESSION'"

p_docker=$(tmux list-panes -t "=$SESSION:backend" -F '#{pane_id}' | head -1)
p_api=$(tmux split-window -h -t "$p_docker" -c "$ROOT/packages/api" -P -F '#{pane_id}')
p_web=$(tmux new-window -d -t "=$SESSION:" -n frontend -c "$ROOT/apps/web" -P -F '#{pane_id}')

tmux select-layout -t "=$SESSION:backend"  even-horizontal

# send-keys rather than a pane command, so each server runs in a real
# interactive shell and keeps the PATH you normally develop with.
tmux send-keys -t "$p_docker" "docker compose -f packages/api/docker-compose.yml logs -f" Enter
tmux send-keys -t "$p_api"    "pnpm dev" Enter
tmux send-keys -t "$p_web"    "pnpm dev" Enter

info "backend:  docker logs | api      :4311"
info "frontend: web    :4310"

step "Ready"
info "running detached in session '$SESSION'"
jump_hint
info "stop it with:    pnpm down"
