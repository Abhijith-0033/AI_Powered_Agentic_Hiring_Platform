
const http = require('http');

console.log('Triggering sync-all endpoint...');

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/tests/sync-all',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, res => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', d => process.stdout.write(d));
});

req.on('error', error => {
    console.error('Error:', error);
});

req.end();
