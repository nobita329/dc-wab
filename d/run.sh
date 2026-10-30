#!/usr/bin/env bash
# ==============================================================================
# NOVA STUDIO — CONTROL CENTER & SERVICE RUNNER (run.sh)
# ==============================================================================
# Interactive menu and CLI runner for Nova Studio
# Features: PM2 Process Management, Next.js Web, Node.js API, SQLite Database
#           Migrations, Administrator Account Provisioning, and Live Diagnostics.
# ==============================================================================

set -e

# Detect Script Directory & Project Root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/apps" ]; then
  PROJECT_DIR="$SCRIPT_DIR"
elif [ -f "$SCRIPT_DIR/d/package.json" ]; then
  PROJECT_DIR="$SCRIPT_DIR/d"
elif [ -f "/workspaces/w/d/package.json" ]; then
  PROJECT_DIR="/workspaces/w/d"
else
  PROJECT_DIR="$PWD"
fi

cd "$PROJECT_DIR"

export PM2_HOME="$PROJECT_DIR/.pm2"

# ANSI Color Codes
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
BLUE='\033[0;34m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Helper: Print styled section banner
print_header() {
  clear 2>/dev/null || true
  echo -e "${PURPLE}================================================================================${RESET}"
  echo -e "${BOLD}${CYAN}   🚀 NOVA STUDIO — CONTROL CENTER & SERVICE RUNNER${RESET}"
  echo -e "${DIM}   Architecture: Next.js 15 Web (3001) • Node API (3002) • SQLite Multi-DB Cluster${RESET}"
  echo -e "${PURPLE}================================================================================${RESET}"
  print_quick_status
  echo -e "${PURPLE}================================================================================${RESET}"
}

# Helper: Check live port status
check_port() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -i ":$port" >/dev/null 2>&1 && return 0 || return 1
  elif command -v ss >/dev/null 2>&1; then
    ss -tlpn 2>/dev/null | grep -q ":$port " && return 0 || return 1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -tlpn 2>/dev/null | grep -q ":$port " && return 0 || return 1
  else
    return 1
  fi
}

# Helper: Print quick live status header
print_quick_status() {
  local api_status="${RED}Offline${RESET}"
  local web_status="${RED}Offline${RESET}"

  if check_port 3002; then
    api_status="${GREEN}Online (:3002)${RESET}"
  fi
  if check_port 3001; then
    web_status="${GREEN}Online (:3001)${RESET}"
  fi

  local db_count=0
  if [ -d "$PROJECT_DIR/data" ]; then
    db_count=$(find "$PROJECT_DIR/data" -name "*.db" 2>/dev/null | wc -l)
  fi

  echo -e "   ${BOLD}Service Status:${RESET} API: $api_status  |  Web: $web_status  |  Databases: ${CYAN}${db_count} engines${RESET}"
}

# 1. Start Services via PM2
cmd_start() {
  echo -e "\n${BOLD}${CYAN}▶ Starting Nova Studio Services (PM2 Cluster)...${RESET}"
  npx pm2 start ecosystem.config.cjs
  echo -e "${GREEN}✔ Services started successfully!${RESET}"
  cmd_status
}

# 2. Stop Services via PM2
cmd_stop() {
  echo -e "\n${BOLD}${YELLOW}▶ Stopping Nova Studio Services (PM2 Cluster)...${RESET}"
  npx pm2 stop ecosystem.config.cjs 2>/dev/null || true
  echo -e "${GREEN}✔ Services stopped.${RESET}"
}

# 3. Restart Services via PM2
cmd_restart() {
  echo -e "\n${BOLD}${CYAN}▶ Restarting Nova Studio Services (PM2 Cluster)...${RESET}"
  npx pm2 restart ecosystem.config.cjs
  echo -e "${GREEN}✔ Services restarted with zero downtime!${RESET}"
  cmd_status
}

# 4. View PM2 & Port Status
cmd_status() {
  echo -e "\n${BOLD}${CYAN}▶ PM2 Process Table & Resource Utilization:${RESET}"
  npx pm2 status
  echo ""
  echo -e "${BOLD}Access Endpoints:${RESET}"
  echo -e "  • ${CYAN}Admin Panel:${RESET}     http://localhost:3001/admin"
  echo -e "  • ${CYAN}Admin Login:${RESET}     http://localhost:3001/admin/login"
  echo -e "  • ${CYAN}Public Showcase:${RESET} http://localhost:3001"
  echo -e "  • ${CYAN}API Server:${RESET}      http://localhost:3002"
  echo -e "  • ${CYAN}API Status:${RESET}      http://localhost:3002/api/health"
  echo -e "  • ${CYAN}WebSocket:${RESET}       ws://localhost:3002/ws"
}

# 5. Tail Live Logs
cmd_logs() {
  echo -e "\n${BOLD}${CYAN}▶ Streaming Nova Studio Live Logs (Press Ctrl+C to return to menu)...${RESET}\n"
  npx pm2 logs --lines 30
}

# 6. Build Project
cmd_build() {
  echo -e "\n${BOLD}${CYAN}▶ Building Nova Studio Monorepo (@nova/shared, @nova/api, @nova/web)...${RESET}"
  npm run build
  echo -e "\n${GREEN}✔ Build completed successfully!${RESET}"
}

# 7. Run DB Migrations
cmd_migration() {
  echo -e "\n${BOLD}${CYAN}▶ Running Database Cluster Migrations (npm run migration)...${RESET}"
  npm run migration
  echo -e "\n${GREEN}✔ Database migrations executed and verified!${RESET}"
}

# 8. Create / Provision Admin User
cmd_createuser() {
  echo -e "\n${BOLD}${PURPLE}================================================================================${RESET}"
  echo -e "${BOLD}${CYAN}👑 Administrator Account Provisioning${RESET}"
  echo -e "${DIM}Create or update admin credentials directly in the SQLite database.${RESET}"
  echo -e "${PURPLE}================================================================================${RESET}\n"

  # Prompt for custom values or accept defaults
  read -rp "Enter Admin Username [admin]: " input_user
  input_user="${input_user:-admin}"

  read -rp "Enter Admin Password [admin]: " input_pass
  input_pass="${input_pass:-admin}"

  read -rp "Enter Admin Email [${input_user}@novastudio.internal]: " input_email
  input_email="${input_email:-${input_user}@novastudio.internal}"

  read -rp "Enter Role (admin / developer / moderator) [admin]: " input_role
  input_role="${input_role:-admin}"

  read -rp "Enter First Name [Nova]: " input_first
  input_first="${input_first:-Nova}"

  read -rp "Enter Last Name [Admin]: " input_last
  input_last="${input_last:-Admin}"

  echo -e "\n${CYAN}Provisioning account for user '${input_user}'...${RESET}"
  npm run createuser -- \
    --username="$input_user" \
    --password="$input_pass" \
    --email="$input_email" \
    --role="$input_role" \
    --nameFirst="$input_first" \
    --nameLast="$input_last"

  echo -e "${GREEN}✔ Account provisioned successfully!${RESET}"
}

# 9. Seed Initial Data
cmd_seed() {
  echo -e "\n${BOLD}${CYAN}▶ Seeding Initial Database Data (npm run db:seed)...${RESET}"
  npm run db:seed
  echo -e "\n${GREEN}✔ Seed data inserted successfully!${RESET}"
}

# 10. Start in Development Mode
cmd_dev() {
  echo -e "\n${BOLD}${CYAN}▶ Starting Nova Studio in Development Mode (Live Reload)...${RESET}"
  echo -e "${DIM}Running concurrently: API (:3002) + Next.js (:3001)... Press Ctrl+C to stop.${RESET}\n"
  npm run dev
}

# 11. View / Scan .env Config
cmd_env() {
  echo -e "\n${BOLD}${CYAN}▶ Active Environment Configuration (.env):${RESET}\n"
  if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${DIM}--- Path: $PROJECT_DIR/.env ---${RESET}"
    # Mask passwords and secret keys for safety
    sed -E 's/(PASSWORD|SECRET|KEY|TOKEN)=.*/\1=••••••••••••••••/g' "$PROJECT_DIR/.env"
  else
    echo -e "${YELLOW}Warning: No .env file found in $PROJECT_DIR${RESET}"
  fi
}

# 12. System Health & Diagnostics
cmd_diagnostics() {
  echo -e "\n${BOLD}${CYAN}▶ System Health & Environment Diagnostics:${RESET}\n"
  echo -e "  • ${BOLD}Node.js Version:${RESET}    $(node -v 2>/dev/null || echo 'Not installed')"
  echo -e "  • ${BOLD}NPM Version:${RESET}        $(npm -v 2>/dev/null || echo 'Not installed')"
  echo -e "  • ${BOLD}Workspace Dir:${RESET}      $PROJECT_DIR"
  echo -e "  • ${BOLD}Data Directory:${RESET}     $PROJECT_DIR/data"
  echo -e "  • ${BOLD}Backup Directory:${RESET}   $PROJECT_DIR/backups"

  echo -e "\n${BOLD}SQLite Cluster Databases:${RESET}"
  if [ -d "$PROJECT_DIR/data" ]; then
    ls -lh "$PROJECT_DIR/data"/*.db 2>/dev/null || echo "No .db files created yet. Run option 7 (migrations)."
  fi

  echo -e "\n${BOLD}Network Ports:${RESET}"
  echo -n "  • Port 3001 (Web): "
  check_port 3001 && echo -e "${GREEN}In Use (Online)${RESET}" || echo -e "${DIM}Available${RESET}"
  echo -n "  • Port 3002 (API): "
  check_port 3002 && echo -e "${GREEN}In Use (Online)${RESET}" || echo -e "${DIM}Available${RESET}"
}

# ==============================================================================
# Interactive Menu Loop
# ==============================================================================
show_menu() {
  while true; do
    print_header
    echo -e "${BOLD}   [ PRODUCTION SERVICES (PM2) ]${RESET}"
    echo -e "    ${CYAN}1)${RESET} ${BOLD}Start Services${RESET}            ${DIM}(Start API & Web in background via PM2)${RESET}"
    echo -e "    ${CYAN}2)${RESET} ${BOLD}Stop Services${RESET}             ${DIM}(Stop PM2 background instances)${RESET}"
    echo -e "    ${CYAN}3)${RESET} ${BOLD}Restart Services${RESET}          ${DIM}(Zero-downtime hot reload)${RESET}"
    echo -e "    ${CYAN}4)${RESET} ${BOLD}Service Status & Ports${RESET}    ${DIM}(Check PM2 process list & live ports)${RESET}"
    echo -e "    ${CYAN}5)${RESET} ${BOLD}View Live Logs${RESET}            ${DIM}(Tail real-time API and Web logs)${RESET}"
    echo ""
    echo -e "${BOLD}   [ BUILD & DATABASE ]${RESET}"
    echo -e "    ${CYAN}6)${RESET} ${BOLD}Build Monorepo${RESET}            ${DIM}(Compile shared, api, and next.js web)${RESET}"
    echo -e "    ${CYAN}7)${RESET} ${BOLD}Run DB Migrations${RESET}         ${DIM}(Apply SQLite cluster migrations v2)${RESET}"
    echo -e "    ${PURPLE}8)${RESET} ${BOLD}${PURPLE}Create / Reset Admin User${RESET} ${DIM}(Provision admin account directly into DB)${RESET}"
    echo -e "    ${CYAN}9)${RESET} ${BOLD}Seed Initial Data${RESET}         ${DIM}(Seed commands, showcase & legal)${RESET}"
    echo ""
    echo -e "${BOLD}   [ DEVELOPMENT & CONFIG ]${RESET}"
    echo -e "   ${CYAN}10)${RESET} ${BOLD}Start in Dev Mode${RESET}         ${DIM}(Run concurrently with hot module reload)${RESET}"
    echo -e "   ${CYAN}11)${RESET} ${BOLD}View .env Config${RESET}          ${DIM}(Inspect active environment settings)${RESET}"
    echo -e "   ${CYAN}12)${RESET} ${BOLD}System Diagnostics${RESET}        ${DIM}(Inspect Node, DB files, and ports)${RESET}"
    echo ""
    echo -e "    ${RED}0)${RESET} ${BOLD}Exit${RESET}"
    echo -e "${PURPLE}================================================================================${RESET}"

    read -rp "Enter option [0-12]: " choice

    case "$choice" in
      1)
        cmd_start
        ;;
      2)
        cmd_stop
        ;;
      3)
        cmd_restart
        ;;
      4)
        cmd_status
        ;;
      5)
        cmd_logs
        ;;
      6)
        cmd_build
        ;;
      7)
        cmd_migration
        ;;
      8)
        cmd_createuser
        ;;
      9)
        cmd_seed
        ;;
      10)
        cmd_dev
        ;;
      11)
        cmd_env
        ;;
      12)
        cmd_diagnostics
        ;;
      0|q|Q|exit)
        echo -e "\n${CYAN}Goodbye! Nova Studio Control Center closed.${RESET}\n"
        exit 0
        ;;
      *)
        echo -e "\n${RED}Invalid option: '$choice'. Please select a valid number between 0 and 12.${RESET}"
        ;;
    esac

    echo ""
    read -rp "Press [Enter] to return to menu..." _
  done
}

# ==============================================================================
# CLI Argument Dispatcher
# ==============================================================================
# If arguments are passed, run directly without interactive menu:
# e.g.: ./run.sh start | ./run.sh build | ./run.sh migrate | ./run.sh createuser
# ==============================================================================
if [ $# -gt 0 ]; then
  case "$1" in
    start)
      cmd_start
      ;;
    stop)
      cmd_stop
      ;;
    restart)
      cmd_restart
      ;;
    status)
      cmd_status
      ;;
    logs)
      cmd_logs
      ;;
    build)
      cmd_build
      ;;
    migration|migrate)
      cmd_migration
      ;;
    createuser|user)
      shift
      npm run createuser -- "$@"
      ;;
    seed)
      cmd_seed
      ;;
    dev)
      cmd_dev
      ;;
    env)
      cmd_env
      ;;
    diagnostics|check)
      cmd_diagnostics
      ;;
    menu)
      show_menu
      ;;
    help|--help|-h)
      echo -e "${BOLD}Nova Studio CLI Runner (${CYAN}run.sh${RESET})${RESET}"
      echo -e "Usage: ./run.sh [command]"
      echo ""
      echo "Commands:"
      echo "  (none)      Launch interactive menu"
      echo "  start       Start API & Web background processes with PM2"
      echo "  stop        Stop PM2 background processes"
      echo "  restart     Restart PM2 processes with zero downtime"
      echo "  status      Show PM2 process table and listening ports"
      echo "  logs        Tail live combined API and Web logs"
      echo "  build       Compile monorepo (shared, api, and web)"
      echo "  migration   Execute SQLite cluster schema migrations"
      echo "  createuser  Provision administrator account in database"
      echo "  seed        Seed initial commands, showcase & legal data"
      echo "  dev         Start Next.js + API in development mode"
      echo "  env         Inspect environment configuration (.env)"
      echo "  diagnostics Run system health checks on ports and DBs"
      echo "  menu        Open interactive full-screen menu"
      echo "  help        Display this help message"
      ;;
    *)
      echo -e "${RED}Unknown command: $1${RESET}"
      echo "Run './run.sh help' for usage instructions or './run.sh' for the interactive menu."
      exit 1
      ;;
  esac
  exit 0
fi

# Default: Launch Interactive Menu
show_menu

