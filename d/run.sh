#!/usr/bin/env bash
# ==============================================================================
# NOVA STUDIO — CONTROL CENTER & SERVICE RUNNER (run.sh)
# ==============================================================================
# 1-Click Automated Setup, Installation, User Creation, and PM2 Process Runner
# Architecture: Next.js 15 Web (3001) • Node API (3002) • SQLite Multi-DB Cluster
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
  echo -e "${BOLD}${CYAN}   🚀 NOVA STUDIO — CONTROL CENTER & SERVICE RUNNER (run.sh)${RESET}"
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

# ==============================================================================
# ⚡ 1-Click Automated Pipeline: Install -> Setup -> Migrate -> User -> PM2 Run
# ==============================================================================
cmd_auto_setup_run() {
  echo -e "\n${PURPLE}================================================================================${RESET}"
  echo -e "${BOLD}${CYAN}⚡ NOVA STUDIO — 1-CLICK AUTO INSTALL, SETUP, USER & PM2 LAUNCH${RESET}"
  echo -e "${DIM}Pipeline: Directories -> .env Setup -> Dependencies -> DB Migrations -> User -> Build -> PM2${RESET}"
  echo -e "${PURPLE}================================================================================${RESET}\n"

  # Step 1: Environment & Directory Preparation
  echo -e "${BOLD}${CYAN}[Step 1/6] Preparing directories and environment configuration...${RESET}"
  mkdir -p "$PROJECT_DIR/data" \
           "$PROJECT_DIR/backups" \
           "$PROJECT_DIR/data/uploads" \
           "$PROJECT_DIR/apps/web/public/uploads"

  if [ ! -f "$PROJECT_DIR/.env" ] && [ -f "$PROJECT_DIR/.env.example" ]; then
    echo -e "  ${YELLOW}Notice: .env not found. Creating .env from .env.example...${RESET}"
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
  elif [ -f "/workspaces/w/.env" ] && [ ! -f "$PROJECT_DIR/.env" ]; then
    cp "/workspaces/w/.env" "$PROJECT_DIR/.env"
  fi
  echo -e "  ${GREEN}✔ Directories and environment configuration verified.${RESET}\n"

  # Step 2: Auto Install Dependencies
  echo -e "${BOLD}${CYAN}[Step 2/6] Verifying Node package dependencies (npm install)...${RESET}"
  if [ ! -d "$PROJECT_DIR/node_modules" ] || [ ! -d "$PROJECT_DIR/apps/api/node_modules" ]; then
    echo -e "  ${YELLOW}Installing project dependencies via npm...${RESET}"
    npm install
  else
    echo -e "  ${GREEN}✔ Node dependencies already installed.${RESET}"
  fi
  echo ""

  # Step 3: Run Database Migrations
  echo -e "${BOLD}${CYAN}[Step 3/6] Running SQLite cluster migrations (npm run migration)...${RESET}"
  npm run migration
  echo -e "  ${GREEN}✔ All SQLite database cluster migrations executed successfully!${RESET}\n"

  # Step 4: Auto Create / Provision Admin User
  echo -e "${BOLD}${CYAN}[Step 4/6] Provisioning Administrator User (npm run createuser)...${RESET}"
  ADMIN_USER="admin"
  ADMIN_PASS="admin"
  if [ -f "$PROJECT_DIR/.env" ]; then
    ENV_USER=$(grep -E '^ADMIN_USERNAME=' "$PROJECT_DIR/.env" | cut -d= -f2- | tr -d '"\r\n' || true)
    ENV_PASS=$(grep -E '^ADMIN_PASSWORD=' "$PROJECT_DIR/.env" | cut -d= -f2- | tr -d '"\r\n' || true)
    [ -n "$ENV_USER" ] && ADMIN_USER="$ENV_USER"
    [ -n "$ENV_PASS" ] && ADMIN_PASS="$ENV_PASS"
  fi
  npm run createuser -- \
    --username="$ADMIN_USER" \
    --password="$ADMIN_PASS" \
    --role="admin" \
    --email="${ADMIN_USER}@novastudio.internal"
  echo -e "  ${GREEN}✔ Administrator account ready: ${ADMIN_USER} / ${ADMIN_PASS}${RESET}\n"

  # Step 5: Build Monorepo
  echo -e "${BOLD}${CYAN}[Step 5/6] Compiling production build (npm run build)...${RESET}"
  npm run build
  echo -e "  ${GREEN}✔ Monorepo (@nova/shared, @nova/api, @nova/web) built successfully!${RESET}\n"

  # Step 6: Launch background processes with PM2
  echo -e "${BOLD}${CYAN}[Step 6/6] Launching background services with PM2 cluster...${RESET}"
  npx pm2 delete ecosystem.config.cjs 2>/dev/null || true
  npx pm2 start ecosystem.config.cjs
  echo -e "  ${GREEN}✔ Nova Studio PM2 cluster started and online!${RESET}\n"

  # Display Final Summary
  echo -e "${PURPLE}================================================================================${RESET}"
  echo -e "${BOLD}${GREEN}🎉 NOVA STUDIO IS FULLY INITIALIZED, SETUP & RUNNING LIVE VIA PM2!${RESET}"
  echo -e "${PURPLE}================================================================================${RESET}"
  cmd_status
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
  echo -e "  • ${CYAN}Admin Login:${RESET}     http://localhost:3001/admin/login  ${DIM}(Credentials: admin / admin)${RESET}"
  echo -e "  • ${CYAN}Public Showcase:${RESET} http://localhost:3001"
  echo -e "  • ${CYAN}GitHub Manager:${RESET}  http://localhost:3001/admin/github"
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
    ls -lh "$PROJECT_DIR/data"/*.db 2>/dev/null || echo "No .db files created yet. Run option 8 (migrations)."
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
    echo -e "${BOLD}   [ ⚡ 1-CLICK AUTOMATED SETUP & RUN ]${RESET}"
    echo -e "    ${PURPLE}1)${RESET} ${BOLD}${PURPLE}⚡ Auto Install + Setup + User + PM2 Run${RESET}  ${DIM}(Full end-to-end setup)${RESET}"
    echo ""
    echo -e "${BOLD}   [ PRODUCTION SERVICES (PM2) ]${RESET}"
    echo -e "    ${CYAN}2)${RESET} ${BOLD}Start Services${RESET}            ${DIM}(Start API & Web in background via PM2)${RESET}"
    echo -e "    ${CYAN}3)${RESET} ${BOLD}Stop Services${RESET}             ${DIM}(Stop PM2 background instances)${RESET}"
    echo -e "    ${CYAN}4)${RESET} ${BOLD}Restart Services${RESET}          ${DIM}(Zero-downtime hot reload)${RESET}"
    echo -e "    ${CYAN}5)${RESET} ${BOLD}Service Status & Ports${RESET}    ${DIM}(Check PM2 process list & live ports)${RESET}"
    echo -e "    ${CYAN}6)${RESET} ${BOLD}View Live Logs${RESET}            ${DIM}(Tail real-time API and Web logs)${RESET}"
    echo ""
    echo -e "${BOLD}   [ BUILD & DATABASE ]${RESET}"
    echo -e "    ${CYAN}7)${RESET} ${BOLD}Build Monorepo${RESET}            ${DIM}(Compile shared, api, and next.js web)${RESET}"
    echo -e "    ${CYAN}8)${RESET} ${BOLD}Run DB Migrations${RESET}         ${DIM}(Apply SQLite cluster migrations v2)${RESET}"
    echo -e "    ${CYAN}9)${RESET} ${BOLD}Create / Reset Admin User${RESET} ${DIM}(Provision admin account directly into DB)${RESET}"
    echo -e "   ${CYAN}10)${RESET} ${BOLD}Seed Initial Data${RESET}         ${DIM}(Seed commands, showcase & legal)${RESET}"
    echo ""
    echo -e "${BOLD}   [ DEVELOPMENT & CONFIG ]${RESET}"
    echo -e "   ${CYAN}11)${RESET} ${BOLD}Start in Dev Mode${RESET}         ${DIM}(Run concurrently with hot module reload)${RESET}"
    echo -e "   ${CYAN}12)${RESET} ${BOLD}View .env Config${RESET}          ${DIM}(Inspect active environment settings)${RESET}"
    echo -e "   ${CYAN}13)${RESET} ${BOLD}System Diagnostics${RESET}        ${DIM}(Inspect Node, DB files, and ports)${RESET}"
    echo ""
    echo -e "    ${RED}0)${RESET} ${BOLD}Exit${RESET}"
    echo -e "${PURPLE}================================================================================${RESET}"

    read -rp "Enter option [0-13]: " choice

    case "$choice" in
      1)
        cmd_auto_setup_run
        ;;
      2)
        cmd_start
        ;;
      3)
        cmd_stop
        ;;
      4)
        cmd_restart
        ;;
      5)
        cmd_status
        ;;
      6)
        cmd_logs
        ;;
      7)
        cmd_build
        ;;
      8)
        cmd_migration
        ;;
      9)
        cmd_createuser
        ;;
      10)
        cmd_seed
        ;;
      11)
        cmd_dev
        ;;
      12)
        cmd_env
        ;;
      13)
        cmd_diagnostics
        ;;
      0|q|Q|exit)
        echo -e "\n${CYAN}Goodbye! Nova Studio Control Center closed.${RESET}\n"
        exit 0
        ;;
      *)
        echo -e "\n${RED}Invalid option: '$choice'. Please select a valid number between 0 and 13.${RESET}"
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
# e.g.: ./run.sh auto | ./run.sh start | ./run.sh build | ./run.sh migrate
# ==============================================================================
if [ $# -gt 0 ]; then
  case "$1" in
    auto|setup|init|install)
      cmd_auto_setup_run
      ;;
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
      echo "  auto|setup  1-Click Auto Install -> Setup -> Migrate -> User -> PM2 Run"
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
