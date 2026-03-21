/**
 * GameRoom.js
 * 
 * Der Hauptspielloop. Orchestriert einen kompletten Skat-Spielverlauf:
 * - Kartenausteilung
 * - Reizphase
 * - Skat-Entscheidung
 * - Trumpfwahl
 * - Spielphase (10 Tricks)
 * - Auswertung
 */

const SkatEngine = require('../engines/skatEngine');
const Player = require('./player');
const BiddingCoordinator = require('./biddingCoordinator');
const GameValueEngine = require('../engines/gameValueEngine');

class GameRoom {
    /**
     * @param {string} roomId - Eindeutige Room-ID
     * @param {Object[]} playerConfigs - [ { type, name, socketId? }, ... ] (3 Spieler)
     * @param {Object} settings - Spiel-Einstellungen
     * @param {Object} callbacks - { onStateUpdate, onGameEnd, onBiddingUpdate }
     */
    constructor(roomId, playerConfigs, settings = {}, callbacks = {}) {
        this.roomId = roomId;
        this.settings = settings;
        this.callbacks = callbacks;

        // Spieler
        this.players = playerConfigs.map((config, idx) => 
            new Player(idx, config.type, config.name, config.socketId)
        );

        // Game Engine
        this.skatEngine = new SkatEngine(
            this.players.map(p => ({ type: p.type, name: p.name })),
            settings
        );

        // State
        this.gameState = 'initializing'; // initializing, dealing, bidding, playing, finished
        this.declarerId = -1;
        this.bidValue = 0;
        this.gameResult = null;
    }

    /**
     * Startet einen kompletten Spielverlauf
     */
    async run() {
        try {
            console.log(`[GameRoom ${this.roomId}] Starting game...`);

            // Phase 1: Kartenausteilung
            await this._dealPhase();

            // Phase 2: Reizphase
            await this._biddingPhase();

            // Wenn Ramsch, gehe direkt zum Spielen
            if (this.skatEngine.isRamschMode) {
                await this._playingPhase();
                await this._finishPhase();
                return this.gameResult;
            }

            // Wenn keiner gereizt hat
            if (this.declarerId === -1) {
                console.log(`[GameRoom ${this.roomId}] No one bid. Game ends.`);
                this.gameResult = { status: 'passed', declarerId: -1 };
                await this._finishPhase();
                return this.gameResult;
            }

            // Phase 3: Skat-Entscheidung
            await this._skatDecisionPhase();

            // Phase 4: Trumpfwahl
            await this._trumpSelectionPhase();

            // Phase 5: Ansagen
            await this._announcementPhase();

            // Phase 6: Spielphase
            await this._playingPhase();

            // Phase 7: Auswertung
            await this._finishPhase();

            return this.gameResult;
        } catch (error) {
            console.error(`[GameRoom ${this.roomId}] Error:`, error);
            this.gameResult = { status: 'error', error: error.message };
            return this.gameResult;
        }
    }

    /**
     * ========================================================================
     * PHASE 1: KARTENAUSTEILUNG
     * ========================================================================
     */
    async _dealPhase() {
        console.log(`[GameRoom ${this.roomId}] Dealing cards...`);
        
        const dealt = this.skatEngine.initializeDeal();

        // Übergebe Karten an Player-Objekte
        this.players.forEach((p, idx) => {
            p.hand = dealt[`p${idx + 1}`];
        });

        this._broadcastStateUpdate('DEALING');
        await this._delay(1500);
    }

    /**
     * ========================================================================
     * PHASE 2: REIZPHASE
     * ========================================================================
     */
    async _biddingPhase() {
        console.log(`[GameRoom ${this.roomId}] Bidding phase...`);

        this.skatEngine.phase = 'bidding';
        this._broadcastStateUpdate('BIDDING');

        const coordinator = new BiddingCoordinator(
            this.players,
            this.skatEngine.dealerIndex,
            (declarerId, bidValue) => {
                this.declarerId = declarerId;
                this.bidValue = bidValue;

                if (declarerId !== -1) {
                    this.skatEngine.declarerIndex = declarerId;
                    this.skatEngine.bidValue = bidValue;
                }
            }
        );

        await coordinator.start();

        // Ramsch oder Spieler gefunden?
        if (this.declarerId === -1) {
            if (this.settings.ruleSet === 'pub') {
                this.skatEngine.startRamsch();
                console.log(`[GameRoom ${this.roomId}] Starting Ramsch.`);
            }
        }
    }

    /**
     * ========================================================================
     * PHASE 3: SKAT-ENTSCHEIDUNG (Hand vs. Pickup)
     * ========================================================================
     */
    async _skatDecisionPhase() {
        console.log(`[GameRoom ${this.roomId}] Skat decision phase...`);

        this.skatEngine.phase = 'skat_decision';
        this._broadcastStateUpdate('SKAT_DECISION');

        const declarer = this.players[this.declarerId];
        const action = await declarer.getAction(
            { skatOptions: this.skatEngine.skat },
            { players: this.players }
        );

        // Validiere und führe aus
        const validation = this.skatEngine.validateAction(this.declarerId, action);
        if (!validation.valid) {
            throw new Error(`Invalid skat decision: ${validation.reason}`);
        }

        this.skatEngine.executeAction(this.declarerId, action);

        if (action.payload.action === 'pickup') {
            declarer.hand = this.skatEngine.players[this.declarerId].hand;
        }

        this._broadcastStateUpdate('SKAT_DECISION_MADE');
        await this._delay(1000);
    }

    /**
     * ========================================================================
     * PHASE 4: TRUMPFWAHL
     * ========================================================================
     */
    async _trumpSelectionPhase() {
        console.log(`[GameRoom ${this.roomId}] Trump selection phase...`);

        this.skatEngine.phase = 'trump_selection';
        this._broadcastStateUpdate('TRUMP_SELECTION');

        const declarer = this.players[this.declarerId];
        const action = await declarer.getAction(
            { trumpOptions: Object.values({ Eichel: 'Eichel', Grün: 'Grün', Rot: 'Rot', Schellen: 'Schellen', Grand: 'Grand', 'Null': 'Null' }) },
            { players: this.players }
        );

        const validation = this.skatEngine.validateAction(this.declarerId, action);
        if (!validation.valid) {
            throw new Error(`Invalid trump: ${validation.reason}`);
        }

        this.skatEngine.executeAction(this.declarerId, action);

        console.log(`[GameRoom ${this.roomId}] Trump: ${this.skatEngine.trumpMode}`);
        this._broadcastStateUpdate('TRUMP_SELECTED');
        await this._delay(1000);
    }

    /**
     * ========================================================================
     * PHASE 5: ANSAGEN (Schneider, Schwarz, Ouvert)
     * ========================================================================
     */
    async _announcementPhase() {
        console.log(`[GameRoom ${this.roomId}] Announcement phase...`);

        this.skatEngine.phase = 'announcement';
        this._broadcastStateUpdate('ANNOUNCEMENT');

        const declarer = this.players[this.declarerId];
        const action = await declarer.getAction(
            { announcementOptions: true },
            { players: this.players }
        );

        const validation = this.skatEngine.validateAction(this.declarerId, action);
        if (!validation.valid) {
            throw new Error(`Invalid announcement: ${validation.reason}`);
        }

        this.skatEngine.executeAction(this.declarerId, action);

        console.log(`[GameRoom ${this.roomId}] Announcements made`);
        this._broadcastStateUpdate('ANNOUNCEMENT_MADE');
        await this._delay(500);
    }

    /**
     * ========================================================================
     * PHASE 6: SPIELPHASE (10 Tricks)
     * ========================================================================
     */
    async _playingPhase() {
        console.log(`[GameRoom ${this.roomId}] Playing phase...`);

        this.skatEngine.phase = this.skatEngine.isRamschMode ? 'ramsch' : 'playing';
        this._broadcastStateUpdate('PLAYING');

        // Spiele alle 10 Tricks
        for (let trick = 0; trick < 10; trick++) {
            // Trick mit 3 Karten
            for (let cardInTrick = 0; cardInTrick < 3; cardInTrick++) {
                const currentPlayer = this.players[this.skatEngine.turnIndex];
                const validCards = this.skatEngine.getValidCards(this.skatEngine.turnIndex);

                const action = await currentPlayer.getAction(
                    {
                        cardOptions: validCards,
                        currentTrick: this.skatEngine.currentTrick,
                        trumpMode: this.skatEngine.trumpMode,
                        declarerIndex: this.skatEngine.declarerIndex,
                        isRamsch: this.skatEngine.isRamschMode,
                        isOuvert: this.skatEngine.isOuvert
                    },
                    { players: this.players }
                );

                const validation = this.skatEngine.validateAction(this.skatEngine.turnIndex, action);
                if (!validation.valid) {
                    throw new Error(`Invalid card play: ${validation.reason}`);
                }

                const result = this.skatEngine.executeAction(this.skatEngine.turnIndex, action);

                this._broadcastStateUpdate('CARD_PLAYED', { playerId: this.skatEngine.turnIndex, card: action.payload.card });

                if (result.type === 'TRICK_COMPLETED') {
                    console.log(`[GameRoom ${this.roomId}] Trick ${trick + 1} won by player ${result.winner}`);
                    this._broadcastStateUpdate('TRICK_COMPLETED', { winner: result.winner, trickCount: this.skatEngine.trickCount });
                    await this._delay(1000);

                    if (result.gameOver) {
                        console.log(`[GameRoom ${this.roomId}] Game over after trick ${trick + 1}`);
                        break;
                    }
                }
            }

            if (this.skatEngine.phase === 'game_over') break;
        }

        this._broadcastStateUpdate('PLAYING_END');
    }

    /**
     * ========================================================================
     * PHASE 7: AUSWERTUNG & SPIELENDE
     * ========================================================================
     */
    async _finishPhase() {
        console.log(`[GameRoom ${this.roomId}] Calculating results...`);

        this.skatEngine.phase = 'game_over';

        if (this.skatEngine.isRamschMode) {
            this._calculateRamschResult();
        } else {
            this._calculateGameResult();
        }

        this._broadcastStateUpdate('GAME_OVER', this.gameResult);
        await this._delay(2000);

        console.log(`[GameRoom ${this.roomId}] Game ended.`, this.gameResult);
    }

    /**
     * Berechnet das Ergebnis eines normalen Spiels
     */
    _calculateGameResult() {
        const declarer = this.players[this.declarerId];
        const declarerPoints = declarer.tricks.reduce((sum, c) => sum + (this._getCardValue(c)), 0);
        const defenderPoints = 120 - declarerPoints;
        const defenderTrickCount = this.skatEngine.trickCount; // Vereinfachung

        // Nutze GameValueEngine
        const evaluation = GameValueEngine.evaluateEndGame({
            trumpMode: this.skatEngine.trumpMode,
            declarerCards: [...declarer.hand, ...this.skatEngine.skat],
            skat: this.skatEngine.skat,
            bidValue: this.bidValue,
            handGame: this.skatEngine.handGame,
            isOuvert: this.skatEngine.isOuvert,
            announcedSchneider: this.skatEngine.announcedSchneider,
            announcedSchwarz: this.skatEngine.announcedSchwarz,
            declarerPoints,
            defenderPoints,
            defenderTrickCount,
            declarerWonNormally: declarerPoints >= 61
        });

        this.gameResult = {
            status: 'finished',
            declarerId: this.declarerId,
            declarerName: declarer.name,
            bidValue: this.bidValue,
            won: evaluation.won,
            gameValue: evaluation.gameValue,
            multiplier: evaluation.multiplier,
            declarerPoints,
            details: evaluation.details
        };
    }

    /**
     * Berechnet das Ergebnis eines Ramsch-Spiels
     */
    _calculateRamschResult() {
        // Ramsch: Der mit den wenigsten Punkten "gewinnt"
        let lowestPoints = 120;
        let loserId = -1;

        this.players.forEach((p, idx) => {
            const points = p.tricks.reduce((sum, c) => sum + this._getCardValue(c), 0);
            if (points < lowestPoints) {
                lowestPoints = points;
                loserId = idx;
            }
        });

        this.gameResult = {
            status: 'ramsch',
            loserId,
            loserName: this.players[loserId].name,
            points: lowestPoints,
            details: `${this.players[loserId].name} lost Ramsch with ${lowestPoints} points`
        };
    }

    /**
     * ========================================================================
     * HILFSFUNKTIONEN
     * ========================================================================
     */

    _getCardValue(card) {
        const values = { '7': 0, '8': 0, '9': 0, '10': 10, 'U': 2, 'O': 3, 'K': 4, 'A': 11 };
        return values[card.rank] || 0;
    }

    _broadcastStateUpdate(phase, data = {}) {
        if (this.callbacks.onStateUpdate) {
            this.callbacks.onStateUpdate({
                roomId: this.roomId,
                phase,
                skatEngine: this.skatEngine,
                players: this.players.map(p => p.toJSON()),
                ...data
            });
        }
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Wird von Socket-Server aufgerufen wenn ein Human-Player eine Aktion macht
     */
    submitPlayerAction(playerId, action) {
        const player = this.players[playerId];
        if (player && player.type === 'human') {
            player.submitAction(action);
        }
    }
}

module.exports = GameRoom;
