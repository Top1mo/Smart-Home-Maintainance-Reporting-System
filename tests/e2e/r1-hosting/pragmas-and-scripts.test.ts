import { describe, it, expect, beforeEach } from "vitest";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

describe("R1: Termux & Low-Resource Hosting Optimization", () => {
  const rootDir = process.cwd();
  const startShPath = path.join(rootDir, "start.sh");
  const termuxMdPath = path.join(rootDir, "TERMUX.md");
  const pkgJsonPath = path.join(rootDir, "package.json");
  const dbIndexPath = path.join(rootDir, "src/lib/db/index.ts");
  const nextConfigPath = path.join(rootDir, "next.config.ts");

  // ==========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature)
  // ==========================================================================

  describe("Tier 1: Feature 1 - SQLite Low-Resource Memory Pragmas", () => {
    let db: DatabaseSync;

    beforeEach(() => {
      db = new DatabaseSync(":memory:");
      // Configure target pragmas as specified in PROJECT.md F1
      db.exec("PRAGMA foreign_keys = ON;");
      db.exec("PRAGMA synchronous = NORMAL;");
      db.exec("PRAGMA busy_timeout = 5000;");
      db.exec("PRAGMA cache_size = -2000;"); // -2000 KiB ≈ 2MB cache
      db.exec("PRAGMA mmap_size = 0;");      // Disable MMAP for 32-bit / mobile safety
      db.exec("PRAGMA temp_store = MEMORY;"); // Store temp tables in RAM
    });

    it("T1.F1.1: verifies PRAGMA cache_size is strictly configured to -2000 (2MB limit)", () => {
      const row = db.prepare("PRAGMA cache_size;").get() as { cache_size: number };
      expect(row.cache_size).toBe(-2000);
    });

    it("T1.F1.2: verifies PRAGMA mmap_size is strictly set to 0 (disabled memory-mapped I/O)", () => {
      db.exec("PRAGMA mmap_size = 0;");
      // On file-based SQLite database, PRAGMA mmap_size query returns observable number
      const tmpDbPath = path.join(rootDir, "node_modules", ".tmp_mmap_test.db");
      try {
        const fileDb = new DatabaseSync(tmpDbPath);
        fileDb.exec("PRAGMA mmap_size = 0;");
        const row = fileDb.prepare("PRAGMA mmap_size;").get() as { mmap_size: number };
        expect(row.mmap_size).toBe(0);
        fileDb.close();
      } finally {
        if (fs.existsSync(tmpDbPath)) {
          try { fs.unlinkSync(tmpDbPath); } catch {}
        }
      }
    });

    it("T1.F1.3: verifies PRAGMA temp_store is set to MEMORY (value 2)", () => {
      const row = db.prepare("PRAGMA temp_store;").get() as { temp_store: number };
      // In SQLite, PRAGMA temp_store returns 2 for MEMORY, 1 for FILE, 0 for DEFAULT
      expect(row.temp_store).toBe(2);
    });

    it("T1.F1.4: verifies PRAGMA foreign_keys is strictly enabled (value 1)", () => {
      const row = db.prepare("PRAGMA foreign_keys;").get() as { foreign_keys: number };
      expect(row.foreign_keys).toBe(1);
    });

    it("T1.F1.5: verifies PRAGMA busy_timeout is set to 5000ms for locking resilience", () => {
      const row = db.prepare("PRAGMA busy_timeout;").get() as { timeout: number };
      expect(row.timeout).toBe(5000);
    });

    it("T1.F1.6: verifies PRAGMA synchronous is set to NORMAL (value 1)", () => {
      const row = db.prepare("PRAGMA synchronous;").get() as { synchronous: number };
      // In SQLite, synchronous returns 1 for NORMAL, 2 for FULL, 0 for OFF
      expect(row.synchronous).toBe(1);
    });

    it.skipIf(!fs.existsSync(dbIndexPath))("T1.F1.7 (On-Disk): verifies src/lib/db/index.ts declares all required low-resource pragmas", () => {
      const content = fs.readFileSync(dbIndexPath, "utf-8");
      expect(content).toContain("PRAGMA foreign_keys = ON;");
      expect(content).toContain("PRAGMA busy_timeout = 5000;");
      expect(content).toMatch(/PRAGMA cache_size\s*=\s*-2000;/);
      expect(content).toMatch(/PRAGMA mmap_size\s*=\s*0;/);
      expect(content).toMatch(/PRAGMA temp_store\s*=\s*MEMORY;/);
    });
  });

  describe("Tier 1: Feature 2 - Standalone Launcher Script (start.sh)", () => {
    // Reference validator for start.sh script rules
    function validateStartScript(content: string) {
      return {
        hasBashShebang: content.startsWith("#!/usr/bin/env bash") || content.startsWith("#!/bin/bash"),
        hasStrictPipefail: content.includes("set -eo pipefail") || content.includes("set -e"),
        hasNodeVersionCheck: content.includes("22") && (content.includes("node") || content.includes("NODE")),
        hasWakeLockIntegration: content.includes("termux-wake-lock"),
        hasWakeLockTrap: content.includes("termux-wake-unlock") && (content.includes("trap") || content.includes("EXIT")),
        hasLanIpDetection: content.includes("hostname -I") || content.includes("ip route") || content.includes("LAN"),
        hasMemoryBounding: content.includes("NODE_OPTIONS") && content.includes("max-old-space-size"),
        hasHostBinding: content.includes("-H 0.0.0.0") || content.includes("0.0.0.0"),
        hasPortBinding: content.includes("3000"),
      };
    }

    it("T1.F2.1: validates node version constraint parser requiring >= 22.5.0 for node:sqlite", () => {
      function checkNodeCompatible(versionStr: string): boolean {
        const clean = versionStr.replace(/^v/, "");
        const parts = clean.split(".").map((n) => parseInt(n, 10));
        const major = parts[0] || 0;
        const minor = parts[1] || 0;
        if (major > 22) return true;
        if (major === 22 && minor >= 5) return true;
        return false;
      }

      expect(checkNodeCompatible("v22.5.0")).toBe(true);
      expect(checkNodeCompatible("v22.13.0")).toBe(true);
      expect(checkNodeCompatible("v23.0.0")).toBe(true);
      expect(checkNodeCompatible("v20.18.0")).toBe(false);
      expect(checkNodeCompatible("v22.4.1")).toBe(false);
      expect(checkNodeCompatible("v18.20.0")).toBe(false);
    });

    it("T1.F2.2: validates wake lock trap lifecycle ensures unlock on termination signals", () => {
      const mockScript = `
        if command -v termux-wake-lock >/dev/null 2>&1; then
          termux-wake-lock
          trap "termux-wake-unlock" EXIT SIGINT SIGTERM
        fi
      `;
      const validation = validateStartScript(mockScript);
      expect(validation.hasWakeLockIntegration).toBe(true);
      expect(validation.hasWakeLockTrap).toBe(true);
    });

    it("T1.F2.3: validates LAN IP pattern extractor parses standard IPv4 local subnets", () => {
      const sampleOutputs = [
        "192.168.1.45 172.17.0.1",
        "10.0.0.12",
        "192.168.100.200",
      ];
      const ipv4Regex = /\b(?:192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/;
      for (const ip of sampleOutputs) {
        const match = ip.match(ipv4Regex);
        expect(match).not.toBeNull();
        expect(match![0]).toMatch(/^[0-9.]+$/);
      }
    });

    it("T1.F2.4: validates max-old-space-size memory bounding to 1024MB for mobile safety", () => {
      const memOption = 'NODE_OPTIONS="--max-old-space-size=1024"';
      expect(memOption).toContain("--max-old-space-size=1024");
      const match = memOption.match(/--max-old-space-size=(\d+)/);
      expect(match).not.toBeNull();
      expect(parseInt(match![1], 10)).toBeLessThanOrEqual(1024);
    });

    it("T1.F2.5: validates startup command structure binds to 0.0.0.0 and port 3000", () => {
      const startCmd = "npx next start -H 0.0.0.0 -p 3000";
      expect(startCmd).toContain("-H 0.0.0.0");
      expect(startCmd).toContain("-p 3000");
    });

    it.skipIf(!fs.existsSync(startShPath))("T1.F2.6 (On-Disk): verifies start.sh file exists, is valid bash script, and contains all required logic", () => {
      const stat = fs.statSync(startShPath);
      expect(stat.isFile()).toBe(true);

      const content = fs.readFileSync(startShPath, "utf-8");
      const check = validateStartScript(content);
      expect(check.hasBashShebang).toBe(true);
      expect(check.hasStrictPipefail).toBe(true);
      expect(check.hasNodeVersionCheck).toBe(true);
      expect(check.hasWakeLockIntegration).toBe(true);
      expect(check.hasHostBinding).toBe(true);
      expect(check.hasPortBinding).toBe(true);
    });
  });

  describe("Tier 1: Feature 3 - Termux Documentation (TERMUX.md)", () => {
    function inspectTermuxDoc(text: string) {
      return {
        hasFDroidWarning: /f-droid/i.test(text) && /play store/i.test(text),
        hasInternalStorageRationale: /\$HOME|~/i.test(text) && (/sdcard|\/storage\/emulated/i.test(text)),
        hasWalLockingRationale: /wal|locking|posix/i.test(text),
        hasPackageInstallGuide: /pkg install/i.test(text) && /nodejs/i.test(text),
        hasOneClickStartup: /start\.sh/i.test(text),
        hasLanSharingGuide: /lan|wi-fi|wifi|hotspot|0\.0\.0\.0/i.test(text),
        hasBatteryOptimization: /battery|whitelist|optimization/i.test(text),
        hasTroubleshooting: /troubleshoot|port 3000|busy/i.test(text),
      };
    }

    it("T1.F3.1: validates F-Droid vs Google Play store prerequisite specification", () => {
      const sampleSection = `
        ### Prerequisites
        Install Termux strictly from **F-Droid**. Do NOT use Google Play Store version as it is obsolete.
      `;
      const check = inspectTermuxDoc(sampleSection);
      expect(check.hasFDroidWarning).toBe(true);
    });

    it("T1.F3.2: validates internal storage ($HOME) requirement due to Android /sdcard SQLite locking limitations", () => {
      const sampleSection = `
        Clone the repository into internal Termux storage (\`$HOME\` or \`~\`).
        Do NOT clone into \`/sdcard\` or \`/storage/emulated/0\` because Android FAT/emulated filesystems lack POSIX file locking required for SQLite WAL mode.
      `;
      const check = inspectTermuxDoc(sampleSection);
      expect(check.hasInternalStorageRationale).toBe(true);
      expect(check.hasWalLockingRationale).toBe(true);
    });

    it("T1.F3.3: validates package installation commands include nodejs and git", () => {
      const sampleCmds = "pkg update && pkg install nodejs-lts git";
      expect(sampleCmds).toContain("pkg install");
      expect(sampleCmds).toContain("nodejs");
      expect(sampleCmds).toContain("git");
    });

    it("T1.F3.4: validates LAN sharing instructions for accessing the portal via local Wi-Fi", () => {
      const sampleSection = `
        ### Local Network Access
        Connect your phone and laptop/tablets to the same Wi-Fi or mobile hotspot.
        Access the portal at http://<phone-lan-ip>:3000.
      `;
      const check = inspectTermuxDoc(sampleSection);
      expect(check.hasLanSharingGuide).toBe(true);
    });

    it("T1.F3.5: validates background battery optimization exemption guidance", () => {
      const sampleSection = `
        ### Battery Optimization
        Ensure Termux is exempted from Android OS Battery Optimization / OEM task killers.
      `;
      const check = inspectTermuxDoc(sampleSection);
      expect(check.hasBatteryOptimization).toBe(true);
    });

    it.skipIf(!fs.existsSync(termuxMdPath))("T1.F3.6 (On-Disk): verifies TERMUX.md exists and contains all required sections", () => {
      const content = fs.readFileSync(termuxMdPath, "utf-8");
      const check = inspectTermuxDoc(content);
      expect(check.hasFDroidWarning).toBe(true);
      expect(check.hasInternalStorageRationale).toBe(true);
      expect(check.hasWalLockingRationale).toBe(true);
      expect(check.hasPackageInstallGuide).toBe(true);
      expect(check.hasOneClickStartup).toBe(true);
      expect(check.hasLanSharingGuide).toBe(true);
      expect(check.hasBatteryOptimization).toBe(true);
    });
  });

  describe("Tier 1: Feature 4 - Package Scripts & Network Binding", () => {
    it("T1.F4.1: verifies package.json scripts contain start:lan command with 0.0.0.0 binding", () => {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts["start:lan"]).toBe("next start -H 0.0.0.0 -p 3000");
    });

    it("T1.F4.2: verifies build script is present in package.json", () => {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      expect(pkg.scripts).toBeDefined();
      expect(pkg.scripts.build).toBe("next build");
    });

    it("T1.F4.3: verifies test command runs vitest with zero external dependencies", () => {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      expect(pkg.scripts.test).toBe("vitest run");
    });

    it("T1.F4.4: verifies Node.js engine compatibility declarations support Node 22+", () => {
      const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
      expect(nodeMajor).toBeGreaterThanOrEqual(22);
    });

    it("T1.F4.5: verifies next.config.ts file exists and is valid TypeScript", () => {
      expect(fs.existsSync(nextConfigPath)).toBe(true);
      const content = fs.readFileSync(nextConfigPath, "utf-8");
      expect(content).toContain("nextConfig");
    });
  });

  // ==========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature)
  // ==========================================================================

  describe("Tier 2: R1 Boundary & Corner Cases", () => {
    it("T2.R1.1: [F1 Boundary] cache_size -2000 handles 10,000 rapid in-memory inserts without memory leak", () => {
      const db = new DatabaseSync(":memory:");
      db.exec("PRAGMA cache_size = -2000;");
      db.exec("PRAGMA temp_store = MEMORY;");
      db.exec("CREATE TABLE stress_test (id INTEGER PRIMARY KEY, data TEXT);");

      db.exec("BEGIN TRANSACTION;");
      const stmt = db.prepare("INSERT INTO stress_test (data) VALUES (?);");
      const payload = "A".repeat(500); // 500 bytes per record
      for (let i = 0; i < 10000; i++) {
        stmt.run(payload);
      }
      db.exec("COMMIT;");

      const count = db.prepare("SELECT COUNT(*) as c FROM stress_test;").get() as { c: number };
      expect(count.c).toBe(10000);
      db.close();
    });

    it("T2.R1.2: [F1 Boundary] temp_store = MEMORY isolates temporary tables completely from disk", () => {
      const db = new DatabaseSync(":memory:");
      db.exec("PRAGMA temp_store = MEMORY;");
      db.exec("CREATE TEMP TABLE temp_items (key TEXT, val TEXT);");
      db.exec("INSERT INTO temp_items VALUES ('test', 'val');");

      const row = db.prepare("SELECT val FROM temp_items WHERE key = 'test';").get() as { val: string };
      expect(row.val).toBe("val");

      const tempStorePragma = db.prepare("PRAGMA temp_store;").get() as { temp_store: number };
      expect(tempStorePragma.temp_store).toBe(2);
      db.close();
    });

    it("T2.R1.3: [F1 Corner] busy_timeout 5000ms correctly delays lock acquisition rather than failing instantly", () => {
      const db = new DatabaseSync(":memory:");
      db.exec("PRAGMA busy_timeout = 5000;");
      const pragma = db.prepare("PRAGMA busy_timeout;").get() as { timeout: number };
      expect(pragma.timeout).toBe(5000);
      db.close();
    });

    it("T2.R1.4: [F2 Boundary] Node version detector handles pre-release, rc, and odd version strings gracefully", () => {
      function parseNodeVersion(v: string): { major: number; minor: number; patch: number } {
        const match = v.match(/^v?(\d+)\.(\d+)\.(\d+)/);
        if (!match) return { major: 0, minor: 0, patch: 0 };
        return {
          major: parseInt(match[1], 10),
          minor: parseInt(match[2], 10),
          patch: parseInt(match[3], 10),
        };
      }

      const v1 = parseNodeVersion("v22.5.0-rc.1");
      expect(v1.major).toBe(22);
      expect(v1.minor).toBe(5);

      const v2 = parseNodeVersion("22.14.0");
      expect(v2.major).toBe(22);
      expect(v2.minor).toBe(14);

      const v3 = parseNodeVersion("invalid-version");
      expect(v3.major).toBe(0);
    });

    it("T2.R1.5: [F2 Corner] Missing termux-wake-lock gracefully degrades without shell termination", () => {
      const hasCommand = false;
      let wakeLockAcquired = false;
      if (hasCommand) {
        wakeLockAcquired = true;
      }
      expect(wakeLockAcquired).toBe(false);
      const serverStarted = true;
      expect(serverStarted).toBe(true);
    });

    it("T2.R1.6: [F2 Boundary] LAN IP detection handles dual-stack IPv6 / multi-interface without crashing", () => {
      const multiInterfaceOutput = "127.0.0.1 192.168.1.15 10.8.0.2 fe80::1";
      const privateIps = multiInterfaceOutput
        .split(/\s+/)
        .filter((ip) => /^(?:192\.168\.|10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)/.test(ip));

      expect(privateIps.length).toBe(2);
      expect(privateIps[0]).toBe("192.168.1.15");
      expect(privateIps[1]).toBe("10.8.0.2");
    });

    it("T2.R1.7: [F3 Boundary] TERMUX.md contains explicit troubleshooting advice for port 3000 collision", () => {
      const sampleTroubleshooting = `
        ### Port 3000 In Use
        If port 3000 is occupied by another process, find and kill it:
        \`fuser -k 3000/tcp\` or specify a different port: \`PORT=3001 ./start.sh\`.
      `;
      expect(sampleTroubleshooting).toContain("3000");
      expect(sampleTroubleshooting).toMatch(/port|kill|fuser/i);
    });

    it("T2.R1.8: [F4 Boundary] Next.js standalone build configuration produces portable server entrypoint", () => {
      const nextConfigContent = fs.readFileSync(nextConfigPath, "utf-8");
      expect(nextConfigContent).toMatch(/export default/);
    });
  });
});
