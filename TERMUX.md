# 📱 Termux & Mobile Hosting Guide (دليل التشغيل على الهواتف والأجهزة المحدودة)

This guide walks you through hosting the **Home Faults Report System (نظام الإبلاغ عن أعطال المنازل)** locally on an Android smartphone or tablet using **Termux**, as well as low-resource single-board computers (such as Raspberry Pi).

Because this application utilizes Node.js built-in **`node:sqlite`** (`DatabaseSync`), it requires **no C++ native compilation**, **no node-gyp**, and **no external database servers** (PostgreSQL/MySQL), making it exceptionally lightweight and fast on mobile hardware.

---

## 1. Prerequisites & Termux Installation

> ⚠️ **CRITICAL WARNING — DO NOT USE GOOGLE PLAY STORE**:  
> The Termux version published on Google Play is deprecated and abandoned due to Android SDK policy restrictions. Package repositories on the Play Store build will fail to update.  
> **Always install Termux from F-Droid or GitHub Releases.**

1. **Install Termux**:
   - Download the latest APK from [F-Droid](https://f-droid.org/en/packages/com.termux/) or [Termux GitHub Releases](https://github.com/termux/termux-app/releases).
2. *(Optional)* Install **Termux:API** from F-Droid if you wish to use extended hardware hooks.

---

## 2. Package Installation

Open Termux on your Android device and run:

```bash
# 1. Update core Termux packages and package mirrors
pkg update && pkg upgrade -y

# 2. Install Node.js LTS and Git
pkg install -y nodejs-lts git

# 3. Verify Node.js version (MUST be >= 22.5.0)
node -v
```

> 💡 **Node.js Requirement**:  
> The system requires **Node.js >= 22.5.0** for the built-in `node:sqlite` module. If your repository provides Node 20, run `pkg install nodejs` (current branch) instead of `nodejs-lts` to get Node 22+.

---

## 3. Storage Location Requirement (CRITICAL)

Android partitions internal storage into two separate layers:
- **Termux Internal Sandbox (`$HOME` / `~`)**: Located at `/data/data/com.termux/files/home`. This is an authentic ext4/f2fs Linux filesystem supporting POSIX file locking (`fcntl`), symbolic links, and shared memory.
- **Android Shared Storage (`/sdcard` or `/storage/emulated/0`)**: Emulated via FUSE/sdcardfs for media sharing with Android apps. **It does NOT support POSIX shared memory or `fcntl` file locks.**

> ❌ **NEVER clone this project into `/sdcard/` or `/storage/emulated/0`!**  
> SQLite in Write-Ahead Logging (WAL) mode requires POSIX shared memory files (`.db-shm` and `.db-wal`). Running inside `/sdcard` will cause `SQLITE_IOERR` (error code 10), database lock freezes, or corrupted tables.

### Clone into Termux Home:

```bash
# Ensure you are in Termux private home storage
cd ~

# Clone the repository
git clone https://github.com/Top1mo/Smart-Home-Maintainance-Reporting-System.git "Home Faults Report System"

# Navigate into the project directory
cd "Home Faults Report System"

# Install project dependencies
npm install
```

---

## 4. 1-Click Startup

The repository includes an automated launcher script (`start.sh`) that:
- Verifies Node.js >= 22.5.0
- Sets memory safety bounds (`NODE_OPTIONS="--max-old-space-size=1024"`)
- Checks and acquires Termux wake-lock automatically to prevent Android CPU sleep
- Compiles the production build (`npm run build`) if not already built
- Automatically detects your local Wi-Fi / Hotspot LAN IP
- Launches the production server bound to all network interfaces (`0.0.0.0:3000`)
- Safely releases wake-locks upon pressing `Ctrl+C`

### Launching:

```bash
# Make the script executable (first time only)
chmod +x start.sh

# Start the application
./start.sh
```

Alternatively, you can build and start directly using npm:

```bash
npm run build && npm run start:lan
```

> **Note:** On a fresh clone, if starting via `npm run start:lan`, `npm run build` must be run first (`npm run build && npm run start:lan`). Alternatively, use `./start.sh` which automatically detects and builds `.next` if not already present.

---

## 5. Local Network (LAN) & Hotspot Access

Once started, the terminal displays access URLs:

```
==================================================================
 🏠 Home Faults Report System (نظام الإبلاغ عن أعطال المنازل)
==================================================================
 🚀 Starting server bound to 0.0.0.0 on port 3000...

 📱 Local Access (this device):
    👉 http://localhost:3000

 🌐 LAN / Wi-Fi Network Access (other phones, tablets & PCs):
    👉 http://192.168.1.55:3000
==================================================================
```

### Access Modes:

1. **On the Hosting Phone**:
   - Open Chrome, Firefox, or Samsung Internet and visit `http://localhost:3000`.
2. **From Other Devices on the Same Wi-Fi**:
   - Ensure other phones, tablets, or laptops are connected to the same Wi-Fi router.
   - Enter `http://<HOST_PHONE_IP>:3000` (e.g. `http://192.168.1.55:3000`) in their web browsers.
3. **Standalone Field Operation (Portable Wi-Fi Hotspot)**:
   - If no Wi-Fi router is available (e.g. on-site at a building during construction or inspection), turn on **Portable Hotspot** on the hosting Android phone.
   - Have residents or technicians connect their phones to your hotspot.
   - Access the server via `http://192.168.43.1:3000` (the default Android hotspot gateway IP).

---

## 6. Battery Optimization & Background Execution

Android's aggressive battery savers and OEM power managers (Samsung OneUI, Xiaomi MIUI/HyperOS, Huawei EMUI) will suspend Termux if the screen turns off, dropping all active user sessions.

### Steps to Prevent Background Suspension:

1. **Acquire Termux Wake-Lock**:
   - Pull down the Android notification shade, find the Termux notification, and tap **Acquire Wakelock**.
   - Alternatively, `start.sh` automatically calls `termux-wake-lock` when available.
2. **Whitelist Termux in Android Settings**:
   - Go to **Android Settings** → **Apps** → **Termux** → **Battery**.
   - Change battery setting from *Optimized* to **Unrestricted**.
3. **Disable OEM Memory Killers**:
   - On Xiaomi / Poco: Disable "MIUI battery saver" and enable "Autostart".
   - On Samsung: Add Termux to "Never sleeping apps" in Device Care.
   - Visit [dontkillmyapp.com](https://dontkillmyapp.com) for manufacturer-specific guides.

---

## 7. SQLite Low-Resource Configuration

The database engine (`src/lib/db/index.ts`) is pre-configured with memory and flash-storage optimizations:

| Pragma | Value | Purpose |
|---|---|---|
| `foreign_keys` | `ON` | Enforces relational integrity across units, tickets, and events. |
| `journal_mode` | `WAL` | Write-Ahead Logging allows concurrent reads while writes occur. |
| `synchronous` | `NORMAL` | Reduces disk sync latency while guaranteeing WAL durability. |
| `busy_timeout` | `5000` | Queues requests for up to 5 seconds during concurrent transactions. |
| `cache_size` | `-2000` | Limits SQLite memory cache to **2 MB**, preventing RAM bloat. |
| `mmap_size` | `0` | Disables memory mapping to avoid virtual memory exhaustion on 32-bit ARM. |
| `temp_store` | `MEMORY` | Stores temporary sorting tables in RAM, eliminating flash wear. |

---

## 8. Troubleshooting & FAQ

### Issue 1: `Error: Cannot find module 'node:sqlite'` or `ERR_UNKNOWN_BUILTIN_MODULE`
- **Cause**: Node.js version is older than 22.5.0.
- **Solution**: Run `pkg update && pkg install nodejs-lts` or `pkg install nodejs`. Verify with `node -v`.

### Issue 2: `Error: listen EADDRINUSE: address already in use :::3000`
- **Cause**: Another instance of Node.js or a previous server process is still occupying port 3000.
- **Solution**:
  ```bash
  # Terminate existing Node processes
  pkill -f node
  # Or find and kill the process listening on port 3000
  lsof -i :3000
  ```
  Then restart with `./start.sh`.

### Issue 3: `SQLITE_IOERR` or `database is locked`
- **Cause**: The project was cloned into `/sdcard/` or an external SD card where Android FUSE prevents POSIX locks.
- **Solution**: Move the project folder to `~/` (Termux internal storage).
  ```bash
  cd ~
  mv /sdcard/Download/Home\ Faults\ Report\ System ~/home-faults
  cd ~/home-faults
  ```

### Issue 4: Out of Memory (OOM / Kill code 137) during `npm run build`
- **Cause**: Compiling Next.js with TypeScript and Turbopack on devices with 2GB–3GB RAM may trigger Android's Low Memory Killer.
- **Solutions**:
  1. Build on your PC/laptop first, then copy the project (or `.next/` directory) to your phone.
  2. Enable Android zRAM or swap via Termux (`pkg install zram-tools` or Android developer options).
  3. Ensure `NODE_OPTIONS="--max-old-space-size=1024"` is exported (default in `start.sh`).

---

## 9. Stopping the Server

To stop the server cleanly:
- Press **Ctrl + C** in Termux.
- The script will catch the signal, gracefully stop the Node process, and release the wake-lock.
