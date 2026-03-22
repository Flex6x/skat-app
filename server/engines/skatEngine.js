/**
 * SkatEngine.js
 * 
 * ⚠️ KEINE DOM-ABHÄNGIGKEITEN! 
 * Diese Datei ist die Single Source of Truth für alle Spiellogik.
 * Sie läuft server-seitig und verwaltet den kompletten Game State.
 * 
 * Verantwortlichkeiten:
 * 1. Game State Management (Phasen, Karten, Spieler)
 * 2. Aktion-Validierung (Regelprüfung)
 * 3. State-Filterung (Hidden Information)
 * 4. Game-Durchlauf (Phase-Transitionen)
 */

// ============================================================================
// KONSTANTEN
// ============================================================================

const PHASES = {
    DEALING: 'dealing',
    BIDDING: 'bidding',
    SKAT_DECISION: 'skat_decision',
    TRUMP_SELECTION: 'trump_selection',
    ANNOUNCEMENT: 'announcement',
    PLAYING: 'playing',
    RAMSCH: 'ramsch',
    GAME_OVER: 'game_over'
};

const TRUMP_MODES = {
    EICHEL: 'Eichel',
    GRUEN: 'Grün',
    ROT: 'Rot',
    SCHELLEN: 'Schellen',
    GRAND: 'Grand',
    NULL: 'Null'
};

const PLAYER_TYPES = {
    HUMAN: 'human',
    BOT: 'bot'
};

// ============================================================================
// HAUPTKLASSE
// ============================================================================

class SkatEngine {
    /**
     * @param {Array} players - Array von Player-Objekten { id, type, name, socketId? }
     * @param {Object} settings - Spiel-Einstellungen (optional)
     * @param {Object} engines - Optional: externe Engines { biddingEngine, gameValueEngine, cardValidator }
     */
    constructor(players, settings = {}, engines = {}) {
        // Basis-Setup
        this.players = players.map((p, idx) => ({
            id: idx,
            type: p.type,
            name: p.name,
            socketId: p.socketId || null, // null für Bots
            hand: [],
            tricks: [],
            score: 0
        }));

        this.settings = settings;
        this.dealerIndex = Math.floor(Math.random() * 3);

        // Optional externe Engines (falls nicht vorhanden, verwendete interne Stubs)
        this.externalCardValidator = engines.cardValidator || null;

        // Game State
        this.reset();
    }

    /**
     * Setzt das Spiel in den Ausgangszustand zurück
     */
    reset() {
        this.deck = null; // Wird in initializeDeal() befüllt
        this.skat = [];
        this.initialSkat = [];

        // Phase Management
        this.phase = PHASES.DEALING;
        this.forehandIndex = (this.dealerIndex + 1) % 3;
        const mittelhandIndex = (this.dealerIndex + 2) % 3;
        const hinterhandIndex = this.dealerIndex;
        this.turnIndex = this.forehandIndex;

        // Spielers Karten zurücksetzen
        this.players.forEach(p => {
            p.hand = [];
            p.tricks = [];
        });

        // Reiz-State
        this.bidValue = 0;
        this.declarerIndex = -1;
        this.trumpMode = null;
        this.handGame = false;
        this.announcedSchneider = false;
        this.announcedSchwarz = false;
        this.isOuvert = false;

        // Trick Management
        this.currentTrick = {
            cards: [], // { playerId, card }
            leadSuit: null
        };
        this.trickCount = 0;
        this.lastTrick = null;

        // Ramsch-Modus
        this.isRamschMode = false;

        // Flags
        this.aborted = false;
    }

    /**
     * Initialisiert die Kartenverteilung (Deck shuffeln, Karten austeilen)
     * @returns {Array} Dealt cards { p1: [], p2: [], p3: [], skat: [] }
     */
    initializeDeal() {
        this.deck = this._createDeck();
        this._shuffleDeck();
        
        const dealt = this._dealCards();
        this.players[0].hand = dealt.p1;
        this.players[1].hand = dealt.p2;
        this.players[2].hand = dealt.p3;
        this.skat = dealt.skat;
        this.initialSkat = [...dealt.skat];

        this.phase = PHASES.BIDDING;

        return dealt;
    }

    /**
     * ========================================================================
     * AKTION-VALIDIERUNG
     * ========================================================================
     * Prüft, ob eine Aktion erlaubt ist und gibt Fehlermeldung bei Verstoß
     */

    /**
     * Haupt-Validierungsmethode
     * @param {number} playerId - Spieler, der die Aktion versucht
     * @param {Object} action - { type, payload }
     * @returns {Object} { valid, reason, value? }
     */
    validateAction(playerId, action) {
        const { type, payload } = action;

        // Basis-Checks
        if (!this._isPlayerValid(playerId)) {
            return { valid: false, reason: 'Invalid player ID' };
        }

        // Phase-spezifische Validierung
        switch (type) {
            case 'BID':
                return this._validateBid(playerId, payload);

            case 'PASS':
                return this._validatePass(playerId);

            case 'SKAT_DECISION':
                return this._validateSkatDecision(playerId, payload);

            case 'TRUMP_SELECTION':
                return this._validateTrumpSelection(playerId, payload);

            case 'ANNOUNCEMENT':
                return this._validateAnnouncement(playerId, payload);

            case 'PLAY_CARD':
                return this._validatePlayCard(playerId, payload);

            default:
                return { valid: false, reason: `Unknown action type: ${type}` };
        }
    }

    /**
     * Validiert ein Gebot während der Reizphase
     */
    _validateBid(playerId, payload) {
        if (this.phase !== PHASES.BIDDING) {
            return { valid: false, reason: 'Not in bidding phase' };
        }

        const bid = payload.value;

        if (!Number.isInteger(bid) || bid <= 0) {
            return { valid: false, reason: 'Bid must be a positive integer' };
        }

        // Muss höher als aktuelles Gebot sein
        if (bid <= this.bidValue) {
            return { valid: false, reason: `Bid must be higher than ${this.bidValue}` };
        }

        return { valid: true, value: bid };
    }

    /**
     * Validiert ein "Passen" während der Reizphase
     */
    _validatePass(playerId) {
        if (this.phase !== PHASES.BIDDING) {
            return { valid: false, reason: 'Not in bidding phase' };
        }

        return { valid: true };
    }

    /**
     * Validiert eine Skat-Entscheidung (Aufnehmen/Drücken)
     */
    _validateSkatDecision(playerId, payload) {
        if (this.phase !== PHASES.SKAT_DECISION) {
            return { valid: false, reason: 'Not in skat decision phase' };
        }

        if (playerId !== this.declarerIndex) {
            return { valid: false, reason: 'Only declarer can decide on skat' };
        }

        const { action, discardCards = [] } = payload;

        if (!['pickup', 'hand'].includes(action)) {
            return { valid: false, reason: 'Action must be "pickup" or "hand"' };
        }

        // Wenn Aufnehmen: 2 Karten müssen abgeworfen werden
        if (action === 'pickup') {
            if (!discardCards || discardCards.length !== 2) {
                return { valid: false, reason: 'Must discard exactly 2 cards' };
            }

            // Prüfe, dass Discard-Karten in Hand sind
            for (const card of discardCards) {
                if (!this._cardInHand(playerId, card)) {
                    return { valid: false, reason: `Card ${card.id} not in hand` };
                }
            }
        }

        return { valid: true, value: { action, discardCards } };
    }

    /**
     * Validiert Trumpf-Auswahl
     */
    _validateTrumpSelection(playerId, payload) {
        if (this.phase !== PHASES.TRUMP_SELECTION) {
            return { valid: false, reason: 'Not in trump selection phase' };
        }

        if (playerId !== this.declarerIndex) {
            return { valid: false, reason: 'Only declarer can select trump' };
        }

        const trump = payload.trump;
        if (!Object.values(TRUMP_MODES).includes(trump)) {
            return { valid: false, reason: `${trump} is not a valid trump mode` };
        }

        return { valid: true, value: trump };
    }

    /**
     * Validiert Ansagen (Schneider, Schwarz, Ouvert)
     */
    _validateAnnouncement(playerId, payload) {
        if (this.phase !== PHASES.ANNOUNCEMENT) {
            return { valid: false, reason: 'Not in announcement phase' };
        }

        if (playerId !== this.declarerIndex) {
            return { valid: false, reason: 'Only declarer can announce' };
        }

        const { schneider, schwarz, ouvert } = payload;

        // Grundregel: Schwarz impliziert Schneider
        if (schwarz && !schneider) {
            return { valid: false, reason: 'Cannot announce Schwarz without Schneider' };
        }

        return { valid: true, value: { schneider, schwarz, ouvert } };
    }

    /**
     * Validiert Kartenspielen
     * Dies ist die wichtigste Regel-Validierung!
     */
    _validatePlayCard(playerId, payload) {
        if (this.phase !== PHASES.PLAYING && this.phase !== PHASES.RAMSCH) {
            return { valid: false, reason: 'Not in playing phase' };
        }

        if (playerId !== this.turnIndex) {
            return { valid: false, reason: `Not player ${playerId}'s turn` };
        }

        const card = payload.card;

        // Ist die Karte in der Hand des Spielers?
        if (!this._cardInHand(playerId, card)) {
            return { valid: false, reason: 'Card not in hand' };
        }

        // Hole alle erlaubten Züge
        const validCards = this.getValidCards(playerId);

        // Ist die Karte ein erlaubter Zug?
        if (!validCards.some(c => c.id === card.id)) {
            return { valid: false, reason: 'This card violates Skat rules (suit/trump obligation)' };
        }

        return { valid: true, value: card };
    }

    /**
     * ========================================================================
     * STATE-FILTERUNG (Hidden Information)
     * ========================================================================
     */

    /**
     * Gibt den Game-State gefiltert für einen bestimmten Spieler zurück
     * Hidden Information: Gegner-Karten und Skat sind versteckt
     * @param {number} playerId - Für welchen Spieler filtern?
     * @returns {Object} Gefilterter State
     */
    getFilteredState(playerId) {
        if (!this._isPlayerValid(playerId)) {
            throw new Error(`Invalid player: ${playerId}`);
        }

        const player = this.players[playerId];
        const hand = [...player.hand];

        // Gegner-Infos (nur Kartenzahl + öffentliche Attribute)
        const opponents = this.players.map((p, idx) => ({
            id: idx,
            name: p.name,
            type: p.type,
            cardCount: idx === playerId ? undefined : p.hand.length,
            score: p.score,
            tricks: idx === playerId ? p.tricks : undefined // Nur eig. Tricks zeigen
        }));

        // Skat-Info (versteckt, wenn noch nicht eröffnet)
        let skatInfo;
        if (this.phase === PHASES.DEALING || 
            (this.phase === PHASES.SKAT_DECISION && playerId !== this.declarerIndex)) {
            skatInfo = { hidden: true };
        } else {
            skatInfo = { cards: this.skat };
        }

        // Öffentliche Spielinfos
        const publicInfo = {
            phase: this.phase,
            turnIndex: this.turnIndex,
            forehandIndex: this.forehandIndex,
            dealerIndex: this.dealerIndex,
            declarerIndex: this.declarerIndex,
            bidValue: this.bidValue,
            trumpMode: this.trumpMode,
            handGame: this.handGame,
            announcedSchneider: this.announcedSchneider,
            announcedSchwarz: this.announcedSchwarz,
            isOuvert: this.isOuvert,
            trickCount: this.trickCount
        };

        // Aktueller Trick (Spieler können bereits gespielte Karten sehen)
        const currentTrickInfo = {
            cards: this.currentTrick.cards,
            leadSuit: this.currentTrick.leadSuit
        };

        return {
            playerId,
            myHand: hand,
            opponents,
            skat: skatInfo,
            currentTrick: currentTrickInfo,
            lastTrick: this.lastTrick,
            ...publicInfo
        };
    }

    /**
     * ========================================================================
     * SPIELZUG-VERARBEITUNG
     * ========================================================================
     */

    /**
     * Führt eine validierte Aktion aus
     */
    executeAction(playerId, action) {
        const validation = this.validateAction(playerId, action);
        
        if (!validation.valid) {
            throw new Error(`Invalid action: ${validation.reason}`);
        }

        const { type, payload } = action;

        switch (type) {
            case 'BID':
                this.bidValue = validation.value;
                return { type: 'BID_ACCEPTED', value: validation.value };

            case 'PASS':
                return { type: 'PASS_ACCEPTED', playerId };

            case 'SKAT_DECISION':
                return this._executeSkatDecision(playerId, validation.value);

            case 'TRUMP_SELECTION':
                this.trumpMode = validation.value;
                return { type: 'TRUMP_SELECTED', trump: validation.value };

            case 'ANNOUNCEMENT':
                this.announcedSchneider = validation.value.schneider;
                this.announcedSchwarz = validation.value.schwarz;
                this.isOuvert = validation.value.ouvert;
                return { type: 'ANNOUNCEMENT_MADE', ...validation.value };

            case 'PLAY_CARD':
                return this._executePlayCard(playerId, validation.value);

            default:
                throw new Error(`Unknown action type: ${type}`);
        }
    }

    /**
     * Führt Skat-Entscheidung aus (Aufnehmen oder Hand)
     */
    _executeSkatDecision(playerId, decision) {
        const { action, discardCards } = decision;

        if (action === 'pickup') {
            // Nimm Skat auf
            const declarer = this.players[playerId];
            declarer.hand.push(...this.skat);

            // Sortiere Hand
            this._sortHand(declarer.hand);

            // Drücke 2 Karten
            for (const card of discardCards) {
                const idx = declarer.hand.findIndex(c => c.id === card.id);
                if (idx !== -1) {
                    declarer.hand.splice(idx, 1);
                }
            }

            this.skat = discardCards;
        } else if (action === 'hand') {
            this.handGame = true;
        }

        this.phase = PHASES.TRUMP_SELECTION;
        return { type: 'SKAT_DECISION_EXECUTED', action };
    }

    /**
     * Führt Kartenspielen aus
     */
    _executePlayCard(playerId, card) {
        const player = this.players[playerId];

        // Entferne Karte aus Hand
        const cardIdx = player.hand.findIndex(c => c.id === card.id);
        if (cardIdx === -1) {
            throw new Error('Card not in hand');
        }
        player.hand.splice(cardIdx, 1);

        // Füge zu Trick hinzu
        this.currentTrick.cards.push({ playerId, card });

        // Setze Lead-Suit wenn erste Karte
        if (this.currentTrick.cards.length === 1) {
            this.currentTrick.leadSuit = this._getEffectiveSuit(card);
        }

        // Wenn 3 Karten gespielt: Trick bewerten + Winner bestimmen
        if (this.currentTrick.cards.length === 3) {
            const trickWinner = this._determineTrickWinner();
            const winnerPlayer = this.players[trickWinner];

            // Karten zum Winner-Trick hinzufügen
            this.currentTrick.cards.forEach(({ card }) => {
                winnerPlayer.tricks.push(card);
            });

            // Letzer Trick speichern
            this.lastTrick = [...this.currentTrick.cards];

            // Reset für nächsten Trick
            this.currentTrick = { cards: [], leadSuit: null };
            this.trickCount++;
            this.turnIndex = trickWinner;

            // Spielende prüfen
            if (this.trickCount === 10) {
                this.phase = PHASES.GAME_OVER;
                return { type: 'TRICK_COMPLETED', winner: trickWinner, gameOver: true };
            }
        } else {
            // Nächster Spieler
            this.turnIndex = (this.turnIndex + 1) % 3;
        }

        return { type: 'CARD_PLAYED', playerId, card };
    }

    /**
     * ========================================================================
     * HILFSFUNKTIONEN
     * ========================================================================
     */

    /**
     * Bestimmt, welche Karten ein Spieler spielen darf
     * (Bedienpflicht, Trumpfpflicht)
     */
    getValidCards(playerId) {
        const player = this.players[playerId];
        const hand = player.hand;

        // Keine Regel wenn Trick leer (erste Karte)
        if (this.currentTrick.cards.length === 0) {
            return hand; // Alle Karten erlaubt
        }

        // Lead-Suit muss bedient werden
        const cardsOfLeadSuit = hand.filter(c => this._getEffectiveSuit(c) === this.currentTrick.leadSuit);

        if (cardsOfLeadSuit.length > 0) {
            return cardsOfLeadSuit; // Muss Lead-Suit bedienen
        }

        // Kann nicht bedienen: muss Trumpf spielen
        const trumpCards = hand.filter(c => this._isTrump(c));

        if (trumpCards.length > 0) {
            return trumpCards; // Muss Trumpf spielen
        }

        // Keine Bedienpflicht und kein Trumpf: alle erlaubt
        return hand;
    }

    /**
     * Bestimmt den Winner eines Tricks
     */
    _determineTrickWinner() {
        if (this.currentTrick.cards.length !== 3) {
            return null;
        }

        let winner = this.currentTrick.cards[0].playerId;
        let highestCard = this.currentTrick.cards[0].card;

        for (let i = 1; i < 3; i++) {
            const { playerId, card } = this.currentTrick.cards[i];

            // Besiegt die aktuelle Karte den Winner?
            if (this._beats(card, highestCard)) {
                winner = playerId;
                highestCard = card;
            }
        }

        return winner;
    }

    /**
     * Prüft, ob Card A Card B schlägt
     */
    _beats(cardA, cardB) {
        // Beide Trumpf: höher gewinnt
        if (this._isTrump(cardA) && this._isTrump(cardB)) {
            return this._getRank(cardA) > this._getRank(cardB);
        }

        // Nur A ist Trumpf: A gewinnt
        if (this._isTrump(cardA)) return true;

        // Nur B ist Trumpf: B gewinnt
        if (this._isTrump(cardB)) return false;

        // Gleiche Farbe: höher gewinnt
        if (this._getEffectiveSuit(cardA) === this._getEffectiveSuit(cardB)) {
            return this._getRank(cardA) > this._getRank(cardB);
        }

        // Verschiedene Farben (keine Trumpf): B gewinnt
        return false;
    }

    /**
     * Ist die Karte ein Trumpf?
     */
    _isTrump(card) {
        if (this.trumpMode === 'Grand') {
            return card.rank === 'U'; // Nur Unters sind Trumpf
        }
        if (this.trumpMode === 'Null') {
            return false; // Keine Trumpf bei Null
        }
        return card.suit === this.trumpMode; // Farbtrumpf
    }

    /**
     * Gibt die effektive Farbe einer Karte zurück
     */
    _getEffectiveSuit(card) {
        if (this.trumpMode === 'Grand' && card.rank === 'U') {
            return 'Grand'; // Pseudo-Suit für Unters
        }
        return card.suit;
    }

    /**
     * Gibt den Rank einer Karte (für Vergleiche)
     */
    _getRank(card) {
        const rankOrder = {
            '7': 0, '8': 1, '9': 2, '10': 3, 'U': 4, 'O': 5, 'K': 6, 'A': 7
        };
        return rankOrder[card.rank] || -1;
    }

    /**
     * Ist die Karte in der Hand des Spielers?
     */
    _cardInHand(playerId, card) {
        return this.players[playerId].hand.some(c => c.id === card.id);
    }

    /**
     * Sortiert eine Hand (nach Farbe + Rank)
     */
    _sortHand(hand) {
        const suitOrder = { 'Eichel': 0, 'Grün': 1, 'Rot': 2, 'Schellen': 3 };
        const rankOrder = { '7': 0, '8': 1, '9': 2, '10': 3, 'U': 4, 'O': 5, 'K': 6, 'A': 7 };

        hand.sort((a, b) => {
            const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
            if (suitDiff !== 0) return suitDiff;
            return rankOrder[a.rank] - rankOrder[b.rank];
        });
    }

    /**
     * Ist Spieler-ID gültig?
     */
    _isPlayerValid(playerId) {
        return playerId >= 0 && playerId < 3;
    }

    /**
     * Erstellt ein Standard-Deck (32 Karten)
     */
    _createDeck() {
        const suits = ['Eichel', 'Grün', 'Rot', 'Schellen'];
        const ranks = ['7', '8', '9', '10', 'U', 'O', 'K', 'A'];
        const deck = [];

        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ suit, rank, id: `${suit}-${rank}`, value: this._getCardValue(rank) });
            }
        }

        return deck;
    }

    /**
     * Gibt den Punktwert einer Karte
     */
    _getCardValue(rank) {
        const values = { '7': 0, '8': 0, '9': 0, '10': 10, 'U': 2, 'O': 3, 'K': 4, 'A': 11 };
        return values[rank] || 0;
    }

    /**
     * Mischt das Deck
     */
    _shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    /**
     * Teilt Karten aus
     */
    _dealCards() {
        const p1 = this.deck.slice(0, 10);
        const p2 = this.deck.slice(10, 20);
        const p3 = this.deck.slice(20, 30);
        const skat = this.deck.slice(30, 32);

        return { p1, p2, p3, skat };
    }

    /**
     * Startet den Ramsch-Modus
     */
    startRamsch() {
        this.isRamschMode = true;
        this.phase = PHASES.RAMSCH;
        this.trumpMode = 'Grand'; // Ramsch wie Grand spielen
        this.declarerIndex = -1; // Kein Alleinspieler
        this.turnIndex = this.forehandIndex;
    }
}

// ============================================================================
// EXPORT
// ============================================================================

export default SkatEngine;
export { PHASES, TRUMP_MODES, PLAYER_TYPES };
