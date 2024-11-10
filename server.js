const http = require('http');
const fs = require('fs');
const os = require('os');
const socketIo = require('socket.io');
const express = require('express');
const ioClient = require('socket.io-client');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let counter = 0;
let visits = 0;

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // Fixed path concatenation
});

// WebSocket connection handling
io.on('connection', (socket) => {
    const clientIp = socket.handshake.address;
    console.log(`Client ip: ${clientIp}`);

    visits += 1;
    // Make the visits visible
    io.emit('update', visits);
    socket.emit('update', visits);
    
    // Log the user
    console.log('A user has connected');
    console.log(`User platform: ${os.platform()}`);

    // Send current counter value to newly connected client
    socket.emit('counterUpdate', counter);

    // Listen for increment events
    socket.on('increment', () => {
        counter++;
        io.emit('counterUpdate', counter); // Broadcast to all connected clients
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Use the PORT environment variable or default to 3000
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Connect to your Railway-hosted app
const railwayAppUrl = 'https://countercounter-production.up.railway.app';
const socketClient = ioClient(railwayAppUrl);

socketClient.on('connect', () => {
    console.log('Connected to Railway app');
});

socketClient.on('userAction', (message) => {
    console.log('User action:', message);
    
    // You can add additional logic here, like writing to a file
    fs.appendFile('user_actions.log', message + '\n', (err) => {
        if (err) console.error('Error writing to log file:', err);
    });
});

socketClient.on('disconnect', () => {
    console.log('Disconnected from Railway app');
});