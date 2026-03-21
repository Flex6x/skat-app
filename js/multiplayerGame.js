/**
 * multiplayerGame.js
 * 
 * Wrapper für Multiplayer-Spiele über Socket.io
 * Vereinheitlicht die Schnittstelle zwischen lokalem Spiel und Multiplayer
 */

class MultiplayerGame {
    constructor(ui, socketClient) {
        this.ui = ui;
        this.socket = socketClient;
        this.gameState = null;
        this.filteredState = null;
        this.playerName = 'Player';
        this.gameStartCallback = null;
        this.gameEndCallback = null;
    }

    /**
     * Verbinde und trete Spiel bei
     */
    async joinGame(playerName, roomId = null) {
        this.playerName = playerName;

        try {
            // Verbinde zum Server falls nicht verbunden
            if (!this.socket.isConnectedToServer()) {
                console.log('[Multiplayer] Connecting to server...');
                await this.socket.connect();
            }

            // Trete Spiel bei
            console.log('[Multiplayer] Joining game...');
            const result = await this.socket.joinGame(playerName, roomId);

            // Registriere Event Listener
            this._registerGameListeners();

            // Zeige Spiel-UI
            this.ui.hideMainMenu();
            this.ui.showGameArea();

            return result;
        } catch (error) {
            console.error('[Multiplayer] Failed to join game:', error);
            this.ui.showError(`Failed to join: ${error.message}`);
            throw error;
        }
    }

    /**
     * Registriere Game Event Listener
     */
    _registerGameListeners() {
        // Spieler ist beigetreten
        this.socket.on('joinedGame', (data) => {
            console.log('[Multiplayer] Joined game:', data);
            this.ui.showWaitingForPlayers(data.players);
        });

        // Anderer Spieler ist beigetreten
        this.socket.on('playerJoined', (data) => {
            console.log('[Multiplayer] Player joined:', data.playerName);
            this.ui.updatePlayerList(data);
        });

        // Anderer Spieler getrennt
        this.socket.on('playerDisconnected', (data) => {
            console.log('[Multiplayer] Player disconnected:', data.playerName);
            this.ui.showPlayerDisconnected(data.playerName);
        });

        // Game State Update (wichtigste Event!)
        this.socket.on('stateUpdate', (data) => {
            this.gameState = data;
            this.filteredState = data.filteredStates?.find(s => s.playerId === this.socket.playerId)?.state;
            this._renderGameState();
        });

        // Spielzug ausgeführt
        this.socket.on('actionExecuted', (data) => {
            console.log('[Multiplayer] Action executed:', data.action.type);
            // State wird via stateUpdate aktualisiert
        });

        // Spielzug akzeptiert
        this.socket.on('actionAccepted', (data) => {
            console.log('[Multiplayer] Action accepted');
        });

        // Spielzug ungültig
        this.socket.on('actionInvalid', (data) => {
            console.warn('[Multiplayer] Action invalid:', data.reason);
            this.ui.showError(`Invalid move: ${data.reason}`);
        });

        // Server-Fehler
        this.socket.on('errorOccurred', (data) => {
            console.error('[Multiplayer] Server error:', data);
            this.ui.showError(`Error: ${data.message}`);
        });

        // Spiel beendet
        this.socket.on('gameFinished', (result) => {
            console.log('[Multiplayer] Game finished:', result);
            this.ui.showGameResult(result);
            if (this.gameEndCallback) {
                this.gameEndCallback(result);
            }
        });

        // Chat-Nachricht
        this.socket.on('chatMessage', (data) => {
            this.ui.addChatMessage(data.playerName, data.message);
        });
    }

    /**
     * Spieler macht einen Spielzug
     */
    makeMove(action) {
        if (!this.socket.isConnectedToServer()) {
            this.ui.showError('Not connected to server');
            return;
        }

        console.log('[Multiplayer] Sending action:', action.type);
        this.socket.sendPlayerAction(action);
    }

    /**
     * Spieler klickt auf eine Karte
     */
    onCardClick(cardIndex) {
        if (!this.filteredState) return;

        const card = this.filteredState.myHand?.[cardIndex];
        if (!card) return;

        // Spielphase: Karte spielen
        if (this.gameState.phase === 'PLAYING') {
            this.makeMove({
                type: 'PLAY_CARD',
                payload: { card }
            });
        }
    }

    /**
     * Spieler klickt Gebot
     */
    onBidClick(bidValue) {
        if (this.gameState.phase === 'BIDDING') {
            this.makeMove({
                type: 'BID',
                payload: { value: bidValue }
            });
        }
    }

    /**
     * Spieler passt
     */
    onPass() {
        if (['BIDDING', 'SKAT_DECISION'].includes(this.gameState.phase)) {
            this.makeMove({ type: 'PASS' });
        }
    }

    /**
     * Rendern Sie den Spiel-State
     */
    _renderGameState() {
        if (!this.filteredState) return;

        const state = this.filteredState;

        // Rendere Spieler-Karten
        if (state.myHand) {
            this.ui.renderHand(state.myHand);
        }

        // Rendere Gegner-Kartenzahl (nicht die Karten!)
        if (state.opponents) {
            state.opponents.forEach((opp, idx) => {
                this.ui.updateOpponentCardCount(idx, opp.cardCount);
            });
        }

        // Rendere Trick auf dem Tisch
        if (state.currentTrick) {
            this.ui.renderCurrentTrick(state.currentTrick);
        }

        // Rendere Status/Phase
        this.ui.updateGameStatus({
            phase: this.gameState.phase,
            trumpMode: state.trumpMode,
            currentBid: state.currentBid,
            turnIndex: state.turnIndex,
            declarerId: state.declarerId
        });

        // Zeige verfügbare Aktionen
        this._showAvailableActions();
    }

    /**
     * Zeige verfügbare Aktionen für aktuellen Spieler
     */
    _showAvailableActions() {
        const isMyTurn = this.filteredState?.turnIndex === this.socket.playerId;

        if (!isMyTurn) {
            this.ui.disableAllActions();
            return;
        }

        const phase = this.gameState.phase;

        switch (phase) {
            case 'PLAYING':
                // Nur gültige Karten können gespielt werden
                if (this.filteredState?.validCards) {
                    this.ui.enableCardSelection(this.filteredState.validCards);
                }
                break;

            case 'BIDDING':
                // Zeige Gebot-Buttons
                if (this.filteredState?.bidOptions) {
                    this.ui.enableBidding(this.filteredState.bidOptions);
                }
                break;

            case 'SKAT_DECISION':
                // Hand vs Pickup
                this.ui.showSkatDecision();
                break;

            case 'TRUMP_SELECTION':
                // Trumpfwahl
                this.ui.showTrumpSelection();
                break;

            case 'ANNOUNCEMENT':
                // Ansagen (Schneider, Schwarz, Ouvert)
                this.ui.showAnnouncements();
                break;
        }
    }

    /**
     * Sende Chat-Nachricht
     */
    sendChat(message) {
        this.socket.sendChat(message);
    }

    /**
     * Trenne Verbindung
     */
    disconnect() {
        this.socket.disconnect();
        this.ui.showMainMenu();
    }

    /**
     * Getter für Spieler-Infos
     */
    getPlayerId() {
        return this.socket.playerId;
    }

    getRoomId() {
        return this.socket.roomId;
    }

    getPlayers() {
        return this.gameState?.players || [];
    }
}

// Export
window.MultiplayerGame = MultiplayerGame;
