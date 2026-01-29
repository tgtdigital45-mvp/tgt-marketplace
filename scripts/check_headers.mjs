
import http from 'http';

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'HEAD',
};

const req = http.request(options, (res) => {
    console.log('STATUS:', res.statusCode);
    console.log('HEADERS:', JSON.stringify(res.headers, null, 2));
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
