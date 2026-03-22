/**
 * socketClient.js
 * 
 * Socket.io Client Manager
 * Verbindung zum Server, Event-Handling, State-Verwaltung
 */

class SocketClient {
    constructor() {
        this.socket = null;
        this.roomId = null;
        this.playerId = null;
        this.isConnected = false;
        this.listeners = {};
    }

    /**
     * Verbinde zum Server
     */
    connect(serverUrl = 'http://localhost:3000') {
        return new Promise((resolve, reject) => {
            try {
                this.socket = io(serverUrl, {
                    reconnection: true,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    reconnectionAttempts: 5
                });

                this.socket.on('connect', () => {
                    console.log('[Socket] Connected to server');
                    this.isConnected = true;
                    resolve();
                });

                this.socket.on('connect_error', (error) => {
                    console.error('[Socket] Connection error:', error);
                    this.isConnected = false;
                    reject(error);
                });

                this.socket.on('disconnect', () => {
                    console.log('[Socket] Disconnected from server');
                    this.isConnected = false;
                    this._emit('disconnected');
                });

                // Register all socket listeners
                this._registerListeners();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Registriere alle Server-zu-Client Event Listener
     */
    _registerListeners() {
        this.socket.on('joinedGame', (data) => {
            this.roomId = data.roomId;
            this.playerId = data.playerId;
            console.log(`[Socket] Joined game as Player ${this.playerId} in Room ${this.roomId}`);
            this._emit('joinedGame', data);
        });

        this.socket.on('playerJoined', (data) => {
            console.log(`[Socket] Player ${data.playerName} joined`);
            this._emit('playerJoined', data);
        });

        this.socket.on('playerDisconnected', (data) => {
            console.log(`[Socket] Player ${data.playerName} disconnected`);
            this._emit('playerDisconnected', data);
        });

        this.socket.on('stateUpdate', (data) => {
            this._emit('stateUpdate', data);
        });

        this.socket.on('actionExecuted', (data) => {
            this._emit('actionExecuted', data);
        });

        this.socket.on('actionAccepted', (data) => {
            this._emit('actionAccepted', data);
        });

        this.socket.on('actionInvalid', (data) => {
            console.warn('[Socket] Action invalid:', data);
            this._emit('actionInvalid', data);
        });

        this.socket.on('errorOccurred', (data) => {
            console.error('[Socket] Server error:', data);
            this._emit('errorOccurred', data);
        });

        this.socket.on('gameFinished', (data) => {
            console.log('[Socket] Game finished:', data);
            this._emit('gameFinished', data);
        });

        this.socket.on('gameError', (data) => {
            console.error('[Socket] Game error:', data);
            this._emit('gameError', data);
        });

        this.socket.on('chatMessage', (data) => {
            this._emit('chatMessage', data);
        });

        this.socket.on('gameReady', (data) => {
            console.log('[Socket] Game ready, waiting for other players...');
            this._emit('gameReady', data);
        });

        this.socket.on('requestAction', (data) => {
            console.log('[Socket] Server requesting action');
            this._emit('requestAction', data);
        });
    }

    /**
     * Trete einem Spiel bei oder erstelle eines
     */
    joinGame(playerName, roomId = null) {
        return new Promise((resolve) => {
            this.socket.emit('joinGame', {
                playerName,
                roomId
            });
            this._once('joinedGame', resolve);
        });
    }

    /**
     * Sende einen Spielzug an den Server
     */
    sendPlayerAction(action) {
        if (!this.roomId || this.playerId === null) {
            console.error('[Socket] Not in game');
            return;
        }

        this.socket.emit('playerAction', {
            roomId: this.roomId,
            action
        });
    }

    /**
     * Sende Chat-Nachricht
     */
    sendChat(message) {
        if (!this.roomId) {
            console.error('[Socket] Not in game');
            return;
        }

        this.socket.emit('chat', {
            roomId: this.roomId,
            message
        });
    }

    /**
     * Registriere Event Listener
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Einmalig Event Listener
     */
    _once(event, callback) {
        const listener = (data) => {
            callback(data);
            this._off(event, listener);
        };
        this.on(event, listener);
    }

    /**
     * Entferne Event Listener
     */
    _off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emittiere Event an alle Listener
     */
    _emit(event, data = {}) {
        if (!this.listeners[event]) return;
        this.listeners[event].forEach(cb => cb(data));
    }

    /**
     * Trenne Verbindung
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.isConnected = false;
            this.roomId = null;
            this.playerId = null;
        }
    }

    /**
     * Prüfe Verbindung
     */
    isConnectedToServer() {
        return this.isConnected && this.socket && this.socket.connected;
    }
}

// Export für globale Nutzung
window.SocketClient = SocketClient;
