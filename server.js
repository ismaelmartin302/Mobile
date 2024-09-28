const http = require('node:http');
const fs = require('node:fs')

const desiredPort = process.env.PORT ?? 1234;

const server = http.createServer((req, res) => {
    console.log('Petición recibida', req.url);
    if (req.url === '/') {
        fs.readFile('./index.html', (err, data) => {
            if (err) {
                console.error(err);
            } else {
                res.end(data)
            }
        })
    } else {
        res.end('Error')
    }
})

server.listen(desiredPort, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${desiredPort}`);
})