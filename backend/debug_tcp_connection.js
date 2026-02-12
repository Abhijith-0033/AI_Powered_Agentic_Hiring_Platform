import net from 'net';

const host = 'ep-delicate-brook-ahp3lur6-pooler.c-3.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Connecting via TCP to ${host}:${port}...`);

const socket = net.createConnection(port, host, () => {
    console.log('✅ TCP Connection established!');
    socket.end();
});

socket.on('error', (err) => {
    console.error('❌ TCP Connection Failed:', err);
});

socket.on('end', () => {
    console.log('Connection closed');
});

setTimeout(() => {
    console.log('Timeout reached, destroying socket.');
    socket.destroy();
}, 30000);
