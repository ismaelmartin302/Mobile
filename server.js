const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const desiredPort = process.env.PORT ?? 1234;

const server = http.createServer((req, res) => {
    console.log('Petición recibida:', req.url);

    if (req.url.endsWith('.scss')) {
        const cssPath = path.join(__dirname, `app/${req.url}`);
        fs.readFile(cssPath, (err, data) => {
            if (err) {
                console.error('Error al leer el archivo CSS:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error interno del servidor');
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/css');
                res.end(data);
            }
        });
    }
    else if (req.url === '/') {
        const filePath = path.join(__dirname, 'app/index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error interno del servidor');
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(data);
            }
        });
    }
    else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Página no encontrada');
    }
});

server.listen(desiredPort, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${desiredPort}`);
})