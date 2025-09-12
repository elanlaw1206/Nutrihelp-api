const fs = require('fs');

const base = Date.parse('2025-09-12T20:00:00Z'); // 8 PM off-hours
const events = [
  // Off-hours sensitive READ (should alert)
  {
    "@timestamp": new Date(base).toISOString(),
    "event.action": "consent.read",
    "event.outcome": "success",
    "user.id": "staff1",
    "source.ip": "10.0.1.5",
    "consent.scope": "medical",
    "is_off_hours": true,
    "url.path": "/consents/123"
  },
  // Business-hours sensitive READ (should NOT alert for read)
  {
    "@timestamp": new Date(base - 12 * 60 * 60 * 1000).toISOString(), // 8 AM
    "event.action": "consent.read",
    "event.outcome": "success",
    "user.id": "staff1",
    "source.ip": "10.0.1.5",
    "consent.scope": "medical",
    "is_off_hours": false,
    "url.path": "/consents/456"
  },
  // Any sensitive UPDATE (should alert)
  {
    "@timestamp": new Date(base + 5 * 60 * 1000).toISOString(),
    "event.action": "consent.update",
    "event.outcome": "success",
    "user.id": "staff2",
    "source.ip": "10.0.1.6",
    "consent.scope": "medical",
    "is_off_hours": false,
    "url.path": "/consents/789"
  }
];

// keep previous as noise (optional)
try {
  const prev = JSON.parse(fs.readFileSync('./monitoring/synthetic/synthetic-events.json','utf8'));
  events.unshift(...prev);
} catch (_) {}

fs.writeFileSync('./monitoring/synthetic/synthetic-events.json', JSON.stringify(events, null, 2));
console.log('Wrote sensitive-access events -> monitoring/synthetic/synthetic-events.json');
