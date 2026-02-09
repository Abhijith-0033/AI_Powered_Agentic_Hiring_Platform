import tls from 'tls';

const host = 'ep-delicate-brook-ahp3lur6-pooler.c-3.us-east-1.aws.neon.tech';
const port = 5432;

console.log(`Connecting to ${host}:${port} via TLS...`);

const socket = tls.connect(port, host, { rejectUnauthorized: false, servername: host }, () => {
    console.log('✅ TLS authorized:', socket.authorized);
    console.log('✅ Cipher:', JSON.stringify(socket.getCipher()));
    console.log('✅ Protocol:', socket.getProtocol());
    socket.end();
});

socket.on('error', (err) => {
    console.error('❌ TLS Connection Failed:', err);
});

socket.on('end', () => {
    console.log('Connection closed');
});

setTimeout(() => {
    console.log('Timeout reached, destroying socket.');
    socket.destroy();
}, 30000);
