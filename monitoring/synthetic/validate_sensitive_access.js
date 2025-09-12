const fs = require('fs');
const events = JSON.parse(fs.readFileSync('./monitoring/synthetic/synthetic-events.json','utf8'));

const hits = events.filter(e =>
  (e['event.action']==='consent.read' && /medical/.test(e['consent.scope']||'') && e['is_off_hours'] === true) ||
  (e['event.action']==='consent.update' && /medical/.test(e['consent.scope']||''))
);

console.log('Sensitive-access alerts:', hits.map(e => ({
  ts: e['@timestamp'],
  action: e['event.action'],
  user: e['user.id'],
  ip: e['source.ip'],
  scope: e['consent.scope'],
  offhours: e['is_off_hours']
})));
