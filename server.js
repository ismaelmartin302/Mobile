const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const desiredPort = process.env.PORT ?? 1234;
let clients = [];

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
    } else if (req.url === '/') {
        const filePath = path.join(__dirname, 'app/index.html');
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Error interno del servidor');
            } else {
                const htmlWithReloadScript = data.toString().replace(
                    '</body>',
                    `<script>
                        const ws = new WebSocket('ws://localhost:1235');
                        ws.onmessage = (message) => {
                            if (message.data === 'reload') {
                                window.location.reload();
                            }
                        };
                    </script></body>`
                );

                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/html');
                res.end(htmlWithReloadScript);
            }
        });
    } else {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Página no encontrada');
    }
});

// Iniciar el servidor HTTP
server.listen(desiredPort, () => {
    console.log(`Servidor escuchando en el puerto http://localhost:${desiredPort}`);
});

const wsServer = http.createServer();
wsServer.on('upgrade', (req, socket) => {
    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }

    const acceptKey = req.headers['sec-websocket-key'];
    const hash = crypto
        .createHash('sha1')
        .update(acceptKey + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');

    const headers = [
        'HTTP/1.1 101 Web Socket Protocol Handshake',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${hash}`,
    ];

    socket.write(headers.join('\r\n') + '\r\n\r\n');

    clients.push(socket);

    socket.on('data', (buffer) => {
        const message = buffer.toString();
        console.log('Mensaje recibido del cliente:', message);
    });

    socket.on('end', () => {
        clients = clients.filter(client => client !== socket);
        console.log('Cliente WebSocket desconectado');
    });
});

wsServer.listen(1235, () => {
    console.log('WebSocket escuchando en el puerto 1235');
});

fs.watch(path.join(__dirname, 'app'), (eventType, filename) => {
    if (filename) {
        console.log(`Archivo cambiado: ${filename}`);
        const message = Buffer.from([0x81, 0x06, ...Buffer.from('reload')]);
        clients.forEach(socket => socket.write(message));
    }
});
