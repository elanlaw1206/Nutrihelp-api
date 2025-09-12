const fs = require('fs');

const base = Date.parse('2025-09-12T03:00:00Z');
const ip = '10.0.0.99';
const device = 'd-777';

const events = [];
// 6 different users from same IP/device within 10 minutes
for (let i = 0; i < 6; i++) {
  events.push({
    "@timestamp": new Date(base + i * 60 * 1000).toISOString(), // 1 min apart
    "event.action": "auth.login",
    "event.outcome": "success",
    "user.id": `u${i+1}`,
    "source.ip": ip,
    "device.id": device,
    "url.path": "/login"
  });
}

// keep previous brute-force sample as noise (optional)
try {
  const prev = JSON.parse(fs.readFileSync('./monitoring/synthetic/synthetic-events.json','utf8'));
  events.unshift(...prev);
} catch (_) {}

fs.writeFileSync('./monitoring/synthetic/synthetic-events.json', JSON.stringify(events, null, 2));
console.log('Wrote multi-account events -> monitoring/synthetic/synthetic-events.json');
