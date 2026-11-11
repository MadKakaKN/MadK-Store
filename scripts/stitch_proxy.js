#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Read key from environment variable or git-ignored .env.stitch file
const envFile = path.resolve(__dirname, '..', '.env.stitch');
let apiKey = process.env.STITCH_API_KEY || '';
if (!apiKey && fs.existsSync(envFile)) {
  apiKey = fs.readFileSync(envFile, 'utf8').trim();
}

const ENDPOINT = 'https://stitch.googleapis.com/mcp';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const payload = JSON.parse(trimmed);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (payload.id !== undefined && payload.id !== null) {
      const data = await res.json();
      process.stdout.write(JSON.stringify(data) + '\n');
    }
  } catch (err) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.id !== undefined) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: parsed.id,
          error: {
            code: -32603,
            message: err.message
          }
        }) + '\n');
      }
    } catch {}
  }
});
