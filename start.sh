#!/usr/bin/env bash
set -eo pipefail

# ==============================================================================
# Home Faults Report System — Standalone Launcher
# Optimized for Linux, low-resource hardware, and Android Termux hosting
# ==============================================================================

# Change to project root directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 1. Memory Bounding: Prevent OOM on low-resource mobile hardware (1GB V8 heap cap)
export NODE_OPTIONS="--max-old-space-size=1024"

# 2. Node.js Version Verification (Node >= 22.5.0 required for built-in node:sqlite)
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Error: Node.js is not installed or not available in PATH."
  echo "Please install Node.js 22.5.0 or later."
  echo "In Termux, install with: pkg update && pkg install nodejs-lts git"
  exit 1
fi

CURRENT_NODE_VERSION=$(node -v 2>/dev/null || echo "")
IS_NODE_COMPATIBLE=$(node -e "
  const parts = process.versions.node.split('.').map(Number);
  const major = parts[0];
  const minor = parts[1] || 0;
  if (major > 22 || (major === 22 && minor >= 5)) {
    process.stdout.write('true');
  } else {
    process.stdout.write('false');
  }
" 2>/dev/null || echo "false")

if [ "$IS_NODE_COMPATIBLE" != "true" ]; then
  echo "❌ Error: Unsupported Node.js version ($CURRENT_NODE_VERSION)."
  echo "The Home Faults Report System requires Node.js >= 22.5.0 for the built-in 'node:sqlite' database engine."
  echo ""
  echo "To upgrade in Termux:"
  echo "  pkg update && pkg upgrade"
  echo "  pkg install nodejs-lts"
  echo ""
  echo "Verify your installed version with: node -v"
  exit 1
fi

# 3. Android Filesystem Safety Check
case "$PROJECT_DIR" in
  /sdcard*|/storage/emulated*)
    echo "⚠️  WARNING: Running from Android shared/emulated storage ($PROJECT_DIR)."
    echo "Android FUSE/sdcardfs does NOT support POSIX fcntl locks required by SQLite WAL mode."
    echo "If database locking errors occur, move this repository to Termux internal storage (\$HOME or ~)."
    echo ""
    ;;
esac

# 4. Termux Wake-Lock Integration
WAKE_LOCK_ACQUIRED=0
cleanup() {
  local exit_code=$?
  trap - EXIT SIGINT SIGTERM
  if [ "$WAKE_LOCK_ACQUIRED" -eq 1 ] && command -v termux-wake-unlock >/dev/null 2>&1; then
    echo ""
    echo "📱 Releasing Termux wake-lock..."
    termux-wake-unlock || true
    WAKE_LOCK_ACQUIRED=0
  fi
  exit "$exit_code"
}
trap cleanup EXIT SIGINT SIGTERM

if command -v termux-wake-lock >/dev/null 2>&1; then
  echo "📱 Termux environment detected. Acquiring wake-lock to prevent CPU sleep..."
  termux-wake-lock || true
  WAKE_LOCK_ACQUIRED=1
fi

# 5. Production Build Detection
if [ ! -d ".next" ]; then
  echo "📦 Production build directory (.next) not found."
  echo "🔨 Compiling application ('npm run build')... Please wait."
  npm run build
fi

# 6. Local Network (LAN) IP Detection
detect_lan_ip() {
  local ip=""
  # Method 1: ip route get (preferred on modern Linux/Android)
  if command -v ip >/dev/null 2>&1; then
    ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="src") print $(i+1); exit}')
  fi
  # Method 2: hostname -I
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}')
  fi
  # Method 3: ifconfig
  if [ -z "$ip" ] && command -v ifconfig >/dev/null 2>&1; then
    ip=$(ifconfig 2>/dev/null | awk '/inet / && !/127.0.0.1/ {sub(/addr:/,"",$2); print $2; exit}')
  fi
  # Method 4: ip addr show
  if [ -z "$ip" ] && command -v ip >/dev/null 2>&1; then
    ip=$(ip -4 addr show 2>/dev/null | awk '/inet / && !/127.0.0.1/ {sub(/\/.*/,"",$2); print $2; exit}')
  fi
  echo "$ip"
}

LAN_IP=$(detect_lan_ip)
PORT="${PORT:-3000}"

# 7. Startup Banner
echo ""
echo "=================================================================="
echo " 🏠 Home Faults Report System (نظام الإبلاغ عن أعطال المنازل)"
echo "=================================================================="
echo " 🚀 Starting server bound to 0.0.0.0 on port ${PORT}..."
echo ""
echo " 📱 Local Access (this device):"
echo "    👉 http://localhost:${PORT}"
echo ""
if [ -n "$LAN_IP" ] && [ "$LAN_IP" != "127.0.0.1" ]; then
  echo " 🌐 LAN / Wi-Fi Network Access (other phones, tablets & PCs):"
  echo "    👉 http://${LAN_IP}:${PORT}"
else
  echo " 🌐 LAN / Wi-Fi Network Access:"
  echo "    👉 http://<lan-ip>:${PORT}"
fi
echo ""
echo " 💡 Tip: Keep Termux open or allow background running in notification."
echo " 🛑 Press Ctrl+C to stop the server."
echo "=================================================================="
echo ""

# 8. Start Next.js server bound to 0.0.0.0 on port $PORT (without exec, so trap remains active)
npx next start -H 0.0.0.0 -p "$PORT" "$@"
