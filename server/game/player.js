/**
 * Player.js
 * 
 * Abstraktion für einen Spieler (Human oder Bot).
 * Bietet eine einheitliche Schnittstelle für die BiddingCoordinator und GameRoom.
 */

const AIController = require('../ai/aiController');
const BotBidding = require('../ai/botBidding');

class Player {
    /**
     * @param {number} id - Spieler-ID (0, 1, 2)
     * @param {string} type - 'human' oder 'bot'
     * @param {string} name - Spieler-Name
     * @param {string} socketId - Socket.io ID (nur für human)
     */
    constructor(id, type, name, socketId = null) {
        this.id = id;
        this.type = type;
        this.name = name;
        this.socketId = socketId;
        this.hand = [];
        this.tricks = [];
        this.score = 0;

        // AI-Controller (nur für Bots)
        if (type === 'bot') {
            this.aiController = new AIController(id, name);
            this.botBidding = new BotBidding();
            this.botBiddingData = null; // Wird beim Reizen gefüllt
        }

        // Event-Handler für human players
        this._pendingAction = null;
        this._actionResolver = null;
    }

    /**
     * Fragt den Spieler nach einer Aktion
     * @param {Object} validActions - { bidOptions?, cardOptions?, skatOptions? }
     * @param {Object} gameState - Aktueller Spielzustand
     * @returns {Promise<Object>} Die gewählte Aktion
     */
    async getAction(validActions, gameState) {
        if (this.type === 'bot') {
            return await this._getBotAction(validActions, gameState);
        } else {
            return await this._getHumanAction(validActions, gameState);
        }
    }

    /**
     * Bot wählt eine Aktion (synchron, mit Delay)
     */
    async _getBotAction(validActions, gameState) {
        // Kleine Verzögerung für realistisches Tempo
        await this._delay(600 + Math.random() * 400);

        // Was wird vom Bot verlangt?
        if (validActions.bidOptions) {
            return this._getBotBidAction(validActions, gameState);
        }
        if (validActions.cardOptions) {
            return this._getBotCardAction(validActions, gameState);
        }
        if (validActions.skatOptions) {
            return this._getBotSkatAction(validActions, gameState);
        }
        if (validActions.trumpOptions) {
            return this._getBotTrumpAction(validActions, gameState);
        }
        if (validActions.announcementOptions) {
            return this._getBotAnnouncementAction(validActions, gameState);
        }

        return { type: 'PASS' };
    }

    /**
     * Bot-Entscheidung für Reizen
     */
    _getBotBidAction(validActions, gameState) {
        const { bidOptions, currentBid } = validActions;

        // Erste Runde? Evaluiere Hand
        if (currentBid === 0 && !this.botBiddingData) {
            this.botBiddingData = this.botBidding.evaluateHand(this.hand);
        }

        // Entscheide über Gebot
        if (this.botBiddingData && this.botBidding.decideBid(currentBid, this.botBiddingData)) {
            // Bot möchte mitgehen
            const nextBid = bidOptions[bidOptions.length - 1]; // Höchstes Angebot
            return {
                type: 'BID',
                payload: { value: nextBid }
            };
        } else {
            // Bot passt
            return { type: 'PASS' };
        }
    }

    /**
     * Bot-Entscheidung für Kartenspielen
     */
    _getBotCardAction(validActions, gameState) {
        const { cardOptions, currentTrick, trumpMode, declarerIndex, isRamsch, isOuvert } = validActions;

        // Declarers Hand für Perfect Info (bei Ouvert)
        const declarerHand = gameState.players?.[declarerIndex]?.hand || null;

        const chosenCard = this.aiController.chooseCard(
            cardOptions,
            currentTrick,
            trumpMode,
            declarerIndex,
            isRamsch,
            isOuvert,
            declarerHand
        );

        return {
            type: 'PLAY_CARD',
            payload: { card: chosenCard }
        };
    }

    /**
     * Bot-Entscheidung für Skat (aufnehmen/Hand)
     */
    _getBotSkatAction(validActions, gameState) {
        const { skatCards } = validActions;

        // Einfache Heuristik: Wenn die Skat-Karten "gut" sind, aufnehmen. Sonst Hand.
        const skatValue = skatCards.reduce((sum, c) => sum + this._getCardValue(c), 0);
        const myHandValue = this.hand.reduce((sum, c) => sum + this._getCardValue(c), 0);

        // Wenn Skat zusammen mit Hand >= 60 Punkte, aufnehmen
        if (skatValue + myHandValue >= 60) {
            // Drücke die zwei schlechtesten Karten
            const allCards = [...this.hand, ...skatCards];
            const discardCards = this._getWorstCards(allCards, 2);

            return {
                type: 'SKAT_DECISION',
                payload: {
                    action: 'pickup',
                    discardCards
                }
            };
        } else {
            return {
                type: 'SKAT_DECISION',
                payload: { action: 'hand' }
            };
        }
    }

    /**
     * Bot-Entscheidung für Trumpf
     */
    _getBotTrumpAction(validActions, gameState) {
        const { trumpOptions } = validActions;

        // Einfache Heuristik basierend auf Reiz-Daten
        if (this.botBiddingData) {
            const trump = this.botBiddingData.trumpSuit || trumpOptions[0];
            return {
                type: 'TRUMP_SELECTION',
                payload: { trump }
            };
        }

        return {
            type: 'TRUMP_SELECTION',
            payload: { trump: trumpOptions[0] }
        };
    }

    /**
     * Bot-Entscheidung für Ansagen
     */
    _getBotAnnouncementAction(validActions, gameState) {
        // Bots machen einfach keine Ansagen (conservative)
        return {
            type: 'ANNOUNCEMENT',
            payload: {
                schneider: false,
                schwarz: false,
                ouvert: false
            }
        };
    }

    /**
     * Human wartet auf Socket-Event
     * Dies wird von der GameRoom aufgerufen, die den Socket-Event erwartet
     */
    async _getHumanAction(validActions, gameState) {
        return new Promise((resolve) => {
            this._actionResolver = resolve;
            // Die GameRoom wird socket.emit('requestAction', { playerId, validActions })
            // senden und der Client wird socket.emit('playerAction', action) zurückgeben
        });
    }

    /**
     * Wird aufgerufen, wenn der Spieler eine Aktion vom Socket erhält
     */
    submitAction(action) {
        if (this._actionResolver) {
            this._actionResolver(action);
            this._actionResolver = null;
        }
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

    _getWorstCards(cards, count) {
        // Gibt die schlechtesten (niedrigsten Punkt-Wert) Karten zurück
        const sorted = cards.sort((a, b) => this._getCardValue(a) - this._getCardValue(b));
        return sorted.slice(0, count);
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * State für Serialisierung (z.B. für Client)
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            cardCount: this.hand.length,
            score: this.score,
            trickCount: this.tricks.length
        };
    }
}

module.exports = Player;
