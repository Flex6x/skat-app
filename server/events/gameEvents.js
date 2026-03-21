/**
 * gameEvents.js
 * 
 * Socket.io Event Handlers für alle Spieler-Aktionen
 * - joinGame: Spieler tritt Spiel bei
 * - playerAction: Spieler macht einen Spielzug
 * - chat: Chat-Nachrichten
 * - disconnect: Spieler trennt Verbindung
 */

import GameRoom from '../game/gameRoom.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * @param {SocketIOServer} io - Socket.io Server
 * @param {Map} gameRooms - Map von roomId → GameRoom
 * @param {Map} playerSockets - Map von playerId → {socketId, roomId}
 * @param {Map} socketPlayers - Map von socketId → playerId
 */
export default function gameEvents(io, gameRooms, playerSockets, socketPlayers) {
    return {
        /**
         * Spieler tritt einem Spiel bei oder erstellt ein neues
         */
        async onJoinGame(socket, data) {
            try {
                const {
                    roomId = null,
                    playerName = `Player_${Math.random().toString(36).substring(7)}`,
                    playerType = 'human'
                } = data;

                console.log(`[joinGame] ${socket.id} as ${playerName} (${playerType})`);

                let room;
                let playerId;

                // Existierendes Spiel beitreten oder neues erstellen?
                if (roomId && gameRooms.has(roomId)) {
                    room = gameRooms.get(roomId);
                    
                    // Prüfe ob Platz vorhanden
                    const humanPlayers = room.players.filter(p => p.type === 'human' && !p.socketId);
                    if (humanPlayers.length === 0) {
                        socket.emit('errorOccurred', {
                            code: 'ROOM_FULL',
                            message: 'Room is full'
                        });
                        return;
                    }

                    // Ordne einen menschlichen Spieler zu
                    playerId = humanPlayers[0].id;
                    humanPlayers[0].socketId = socket.id;
                } else {
                    // Neues Spiel erstellen
                    const newRoomId = `room-${uuidv4()}`;
                    const playerConfigs = [
                        { type: playerType, name: playerName },
                        { type: 'bot', name: 'Bot1' },
                        { type: 'bot', name: 'Bot2' }
                    ];

                    room = new GameRoom(
                        newRoomId,
                        playerConfigs,
                        {
                            ruleSet: 'standard', // oder 'pub' für Ramsch
                            autoStart: true
                        },
                        {
                            onStateUpdate: (state) => {
                                // Broadcast zu allen Spielern im Room (mit Filterung!)
                                io.to(`room-${newRoomId}`).emit('stateUpdate', {
                                    ...state,
                                    filteredStates: room.players.map(p => ({
                                        playerId: p.id,
                                        state: room.skatEngine.getFilteredState(p.id)
                                    }))
                                });
                            },
                            onGameEnd: (result) => {
                                io.to(`room-${newRoomId}`).emit('gameEnd', result);
                                gameRooms.delete(newRoomId);
                            }
                        }
                    );

                    gameRooms.set(newRoomId, room);
                    playerId = 0; // First player
                    room.players[0].socketId = socket.id;
                }

                // Registriere Socket-Mappings
                socketPlayers.set(socket.id, playerId);
                playerSockets.set(playerId, {
                    socketId: socket.id,
                    roomId: room.roomId
                });

                // Socket tritt room-spezifischem Channel bei
                socket.join(`room-${room.roomId}`);

                // Sende Bestätigung an Client
                socket.emit('joinedGame', {
                    roomId: room.roomId,
                    playerId,
                    players: room.players.map(p => ({
                        id: p.id,
                        name: p.name,
                        type: p.type,
                        connected: !!p.socketId
                    }))
                });

                // Benachrichtige andere Spieler
                socket.broadcast.to(`room-${room.roomId}`).emit('playerJoined', {
                    playerId,
                    playerName
                });

                console.log(`[joinGame] ${socket.id} joined as Player ${playerId} in Room ${room.roomId}`);

                // Wenn alle Spieler connected + autoStart: Spiel starten
                const allConnected = room.players.every(p => p.type === 'bot' || p.socketId);
                if (allConnected && room.settings.autoStart) {
                    console.log(`[joinGame] All players connected. Starting game...`);
                    
                    // Starte Spiel im Hintergrund (nicht blockierend)
                    room.run()
                        .then(result => {
                            console.log(`[Game] Finished:`, result);
                            io.to(`room-${room.roomId}`).emit('gameFinished', result);
                        })
                        .catch(error => {
                            console.error(`[Game] Error:`, error);
                            io.to(`room-${room.roomId}`).emit('gameError', {
                                message: error.message
                            });
                        });
                }
            } catch (error) {
                console.error('[joinGame] Error:', error);
                socket.emit('errorOccurred', {
                    code: 'JOIN_FAILED',
                    message: error.message
                });
            }
        },

        /**
         * Spieler macht einen Spielzug
         */
        async onPlayerAction(socket, data) {
            try {
                const { roomId, action } = data;

                // Validiere dass Spieler in diesem Room ist
                const playerId = socketPlayers.get(socket.id);
                if (!playerId && playerId !== 0) {
                    socket.emit('errorOccurred', {
                        code: 'NOT_IN_GAME',
                        message: 'You are not in a game'
                    });
                    return;
                }

                const room = gameRooms.get(roomId);
                if (!room) {
                    socket.emit('errorOccurred', {
                        code: 'ROOM_NOT_FOUND',
                        message: 'Room not found'
                    });
                    return;
                }

                // Prüfe ob es der richtige Spieler ist
                if (room.players[playerId].id !== playerId) {
                    socket.emit('errorOccurred', {
                        code: 'WRONG_PLAYER',
                        message: 'This is not your player ID'
                    });
                    return;
                }

                console.log(`[playerAction] Player ${playerId} in Room ${roomId}:`, action.type);

                // Validiere Aktion server-seitig
                const validation = room.skatEngine.validateAction(playerId, action);
                if (!validation.valid) {
                    socket.emit('actionInvalid', {
                        action: action.type,
                        reason: validation.reason
                    });
                    return;
                }

                // Führe Aktion aus
                room.skatEngine.executeAction(playerId, action);

                // Submitiere Aktion für human player
                room.players[playerId].submitAction(action);

                // Broadcast neuer State
                io.to(`room-${roomId}`).emit('actionExecuted', {
                    playerId,
                    action,
                    phase: room.skatEngine.phase
                });

                socket.emit('actionAccepted', { action: action.type });
            } catch (error) {
                console.error('[playerAction] Error:', error);
                socket.emit('errorOccurred', {
                    code: 'ACTION_FAILED',
                    message: error.message
                });
            }
        },

        /**
         * Chat-Nachricht
         */
        onChat(socket, data) {
            const { roomId, message } = data;
            const playerId = socketPlayers.get(socket.id);

            if (!roomId || !playerId && playerId !== 0) {
                return;
            }

            const room = gameRooms.get(roomId);
            if (!room) return;

            const playerName = room.players[playerId]?.name || 'Unknown';

            io.to(`room-${roomId}`).emit('chatMessage', {
                playerId,
                playerName,
                message,
                timestamp: new Date().toISOString()
            });

            console.log(`[chat] ${playerName}: ${message}`);
        },

        /**
         * Spieler trennt Verbindung
         */
        onDisconnect(socket) {
            console.log(`[disconnect] Client disconnected: ${socket.id}`);

            const playerId = socketPlayers.get(socket.id);
            if (!playerId && playerId !== 0) return;

            const playerData = playerSockets.get(playerId);
            if (!playerData) return;

            const room = gameRooms.get(playerData.roomId);
            if (room && room.players[playerId]) {
                room.players[playerId].socketId = null;

                io.to(`room-${room.roomId}`).emit('playerDisconnected', {
                    playerId,
                    playerName: room.players[playerId].name
                });

                console.log(`[disconnect] Player ${playerId} disconnected from Room ${room.roomId}`);
            }

            // Cleanup Maps
            socketPlayers.delete(socket.id);
            playerSockets.delete(playerId);
        }
    };
}
