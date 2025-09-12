const fs = require('fs');

const events = JSON.parse(fs.readFileSync('./monitoring/synthetic/synthetic-events.json','utf8'));
const windowMs = 10 * 60 * 1000; // 10 minutes
const threshold = 5;

function distinctUsersWithinWindow(byKey) {
  const arr = events
    .filter(e => e['event.action']==='auth.login' && e['event.outcome']==='success' && e[byKey])
    .map(e => ({...e, ts: Date.parse(e['@timestamp'])}))
    .sort((a,b)=>a.ts-b.ts);

  const result = {};
  for (let i=0; i<arr.length; i++){
    const now = arr[i];
    const set = new Set([now['user.id']]);
    for (let j=i-1; j>=0 && (now.ts - arr[j].ts) <= windowMs; j--){
      if (arr[j][byKey] === now[byKey]) set.add(arr[j]['user.id']);
    }
    if (set.size >= threshold){
      result[now[byKey]] = set.size;
    }
  }
  return result;
}

console.log('Distinct users by source.ip:', distinctUsersWithinWindow('source.ip'));
console.log('Distinct users by device.id:', distinctUsersWithinWindow('device.id'));
