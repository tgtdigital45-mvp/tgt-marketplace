const http = require('http');

const url = 'http://localhost:8083/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable';

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('Body snippet:', data.substring(0, 500));
        console.log('Body length:', data.length);
        if (data.includes('error') || data.includes('InternalError')) {
            console.log('Potential error detected in body!');
            const errorIndex = data.indexOf('InternalError');
            if (errorIndex !== -1) {
                console.log('Error context:', data.substring(errorIndex, errorIndex + 500));
            }
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
