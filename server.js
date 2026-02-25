const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = process.env.APP_VERSION || 'dev';

// ─── / Dashboard (Tailwind CDN, no build step) ───────────────────────────────
app.get('/', (_req, res) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    const secs = Math.floor(uptime % 60);

    res.send(/*html*/`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DeployBot Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
    .pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
  </style>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-xl space-y-6">

    <!-- Header -->
    <div class="text-center space-y-1">
      <h1 class="text-3xl font-bold tracking-tight">🚀 DeployBot</h1>
      <p class="text-gray-400 text-sm">Continuous-deployment demo</p>
    </div>

    <!-- Status card -->
    <div class="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">

      <!-- Badge -->
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full bg-emerald-400 pulse-dot"></span>
        <span class="text-emerald-400 font-semibold text-sm uppercase tracking-wide">Operational</span>
      </div>

      <!-- Metrics grid -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-gray-800/50 rounded-xl p-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Uptime</p>
          <p class="text-lg font-mono font-semibold mt-1">${hours}h ${mins}m ${secs}s</p>
        </div>
        <div class="bg-gray-800/50 rounded-xl p-4">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Server Time</p>
          <p class="text-lg font-mono font-semibold mt-1">${new Date().toLocaleTimeString()}</p>
        </div>
        <div class="bg-gray-800/50 rounded-xl p-4 col-span-2">
          <p class="text-xs text-gray-400 uppercase tracking-wide">Version (commit SHA)</p>
          <p class="text-lg font-mono font-semibold mt-1 truncate">${APP_VERSION}</p>
        </div>
      </div>

      <!-- Links -->
      <div class="flex flex-wrap gap-3 pt-2">
        <a href="/health"
           class="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition">
          /health <span class="text-gray-500">JSON</span>
        </a>
        <a href="/health/ui"
           class="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition">
          /health/ui <span class="text-gray-500">Status Page</span>
        </a>
        <a href="/version"
           class="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm font-medium transition">
          /version <span class="text-gray-500">JSON</span>
        </a>
      </div>
    </div>

    <p class="text-center text-gray-600 text-xs">
      Built with Express &amp; Tailwind CDN &middot; zero build step
    </p>
  </div>
</body>
</html>`);
});

// ─── /health  JSON (CI/CD-friendly) ──────────────────────────────────────────
app.get('/health', (_req, res) => {
    const checks = { server: 'ok' };

    // If you later add db.js, uncomment the block below:
    // try {
    //   const db = require('./db');
    //   db.prepare('SELECT 1').get();
    //   checks.db = 'ok';
    // } catch {
    //   checks.db = 'fail';
    // }

    const allOk = Object.values(checks).every(v => v === 'ok');

    res.status(allOk ? 200 : 503).json({
        status: allOk ? 'ok' : 'fail',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: APP_VERSION,
        checks,
    });
});

// ─── /health/ui  Human-friendly status page ──────────────────────────────────
app.get('/health/ui', (_req, res) => {
    res.send(/*html*/`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DeployBot Health</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen flex items-center justify-center p-6">
  <div class="w-full max-w-md space-y-6">
    <h1 class="text-2xl font-bold text-center tracking-tight">🩺 Health Status</h1>

    <div id="card" class="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
      <div class="flex items-center gap-2">
        <span id="dot" class="h-3 w-3 rounded-full bg-gray-600"></span>
        <span id="badge" class="font-semibold text-sm uppercase tracking-wide text-gray-400">Loading…</span>
      </div>
      <table class="w-full text-sm">
        <tbody id="checks"></tbody>
      </table>
      <p id="meta" class="text-xs text-gray-500"></p>
    </div>

    <p class="text-center text-gray-600 text-xs">Auto-refreshes every 5 s &middot; <a href="/" class="underline hover:text-gray-400">Dashboard</a></p>
  </div>

  <script>
    async function refresh() {
      try {
        const r = await fetch('/health');
        const d = await r.json();
        const ok = d.status === 'ok';

        document.getElementById('dot').className =
          'h-3 w-3 rounded-full ' + (ok ? 'bg-emerald-400' : 'bg-red-400');
        document.getElementById('badge').textContent = ok ? 'All Systems Operational' : 'Degraded';
        document.getElementById('badge').className =
          'font-semibold text-sm uppercase tracking-wide ' + (ok ? 'text-emerald-400' : 'text-red-400');

        const tbody = document.getElementById('checks');
        tbody.innerHTML = Object.entries(d.checks).map(([k,v]) => {
          const color = v === 'ok' ? 'text-emerald-400' : 'text-red-400';
          return '<tr class="border-t border-gray-800">'
            + '<td class="py-2 text-gray-300">' + k + '</td>'
            + '<td class="py-2 text-right font-mono ' + color + '">' + v + '</td>'
            + '</tr>';
        }).join('');

        document.getElementById('meta').textContent =
          'v' + d.version + ' · uptime ' + Math.floor(d.uptime) + 's · ' + d.timestamp;
      } catch {
        document.getElementById('badge').textContent = 'Unreachable';
      }
    }
    refresh();
    setInterval(refresh, 5000);
  </script>
</body>
</html>`);
});

// ─── /version  JSON ──────────────────────────────────────────────────────────
app.get('/version', (_req, res) => {
    res.json({ version: APP_VERSION });
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 DeployBot server running at http://localhost:${PORT}`);
});
