/**
 * server.js
 * 
 * Express + Socket.io Server für Multiplayer Skat
 * Orchestriert alle GameRooms und Socket-Verbindungen
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';

import GameRoom from './server/game/gameRoom.js';
import gameEvents from './server/events/gameEvents.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);

// Socket.io Setup
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
});

// Middleware
app.use(express.static('public'));
app.use(express.json());

// ============================================================================
// Game Room Management
// ============================================================================

const gameRooms = new Map(); // roomId → GameRoom instance
const playerSockets = new Map(); // playerId → { socketId, roomId }
const socketPlayers = new Map(); // socketId → playerId

// ============================================================================
// Routes
// ============================================================================

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeRooms: gameRooms.size,
        activePlayers: socketPlayers.size
    });
});

app.get('/api/rooms', (req, res) => {
    const rooms = Array.from(gameRooms.values()).map(room => ({
        roomId: room.roomId,
        playerCount: room.players.length,
        gameState: room.gameState,
        phase: room.skatEngine?.phase || 'initializing'
    }));
    res.json(rooms);
});

// ============================================================================
// Socket.io Event Handlers
// ============================================================================

io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Import event handlers
    const events = gameEvents(io, gameRooms, playerSockets, socketPlayers);

    // Register all event handlers for this socket
    socket.on('joinGame', (data) => events.onJoinGame(socket, data));
    socket.on('playerAction', (data) => events.onPlayerAction(socket, data));
    socket.on('chat', (data) => events.onChat(socket, data));
    socket.on('disconnect', () => events.onDisconnect(socket));

    // Fallback error handler
    socket.on('error', (error) => {
        console.error(`[Socket ${socket.id}] Error:`, error);
    });
});

// ============================================================================
// Server Start
// ============================================================================

httpServer.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║        Multiplayer Skat Server Started                    ║
║                                                           ║
║  🎴 Socket.io running on ws://0.0.0.0:${port}
║  🌐 HTTP server on http://0.0.0.0:${port}
║  📊 Health check: http://localhost:${port}/health
║                                                           ║
║  Press Ctrl+C to stop                                     ║
╚═══════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down gracefully...');
    
    // Close all game rooms
    gameRooms.forEach((room) => {
        io.to(`room-${room.roomId}`).emit('gameClosed', {
            reason: 'Server shutdown'
        });
    });

    httpServer.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
    });

    // Force exit after 5 seconds
    setTimeout(() => {
        console.error('[Server] Force shutdown');
        process.exit(1);
    }, 5000);
});

export { io, gameRooms, playerSockets, socketPlayers };
