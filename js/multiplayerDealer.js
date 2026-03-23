/**
 * Multiplayer Dealer - Kartenvergabe für Multiplayer Mode
 * Basiert auf Singleplayer-Logik: 3-4-3 Skat Regel
 */

class MultiplayerDealer {
    constructor(socketClient) {
        this.socketClient = socketClient;
        this.deck = null;
        this.dealerIndex = 0;
        this.forehandIndex = 0;
        this.mittelhandIndex = 0;
        this.hinterhandIndex = 0;
        this.players = [];
        this.skat = [];
        this.isAnimating = false;
    }

    /**
     * Kartenvergabe initialisieren und starten
     */
    async initializeDeal(dealerIndexFromServer = null) {
        console.log('[Dealer] Initializing card deal...');
        
        // Dealer-Position bestimmen (von Server oder lokal)
        if (dealerIndexFromServer !== null) {
            this.dealerIndex = dealerIndexFromServer;
        } else {
            this.dealerIndex = Math.floor(Math.random() * 3);
        }

        // Positionen berechnen
        this.forehandIndex = (this.dealerIndex + 1) % 3;
        this.mittelhandIndex = (this.dealerIndex + 2) % 3;
        this.hinterhandIndex = this.dealerIndex;

        // Deck initialisieren und shuffeln (3x wie im Singleplayer)
        this.deck = new Deck();
        this.deck.initialize();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();

        // Karten verteilen (3-4-3 Skat Regel)
        this.dealCards();

        console.log('[Dealer] Deal complete:', {
            forehand: this.forehandIndex,
            mittelhand: this.mittelhandIndex,
            hinterhand: this.hinterhandIndex,
            players: this.players.map(p => p.hand.length)
        });

        return {
            dealerIndex: this.dealerIndex,
            forehandIndex: this.forehandIndex,
            mittelhandIndex: this.mittelhandIndex,
            hinterhandIndex: this.hinterhandIndex,
            skat: this.skat
        };
    }

    /**
     * Karten nach 3-4-3 Regel verteilen
     * Pattern: 3 each, 2 skat, 4 each, 3 each = 32 cards total
     */
    dealCards() {
        const allCards = this.deck.cards;
        const p0 = []; // Player 0
        const p1 = []; // Player 1
        const p2 = []; // Player 2

        // 3-4-3 Pattern:
        // Round 1: 3 cards each (0-2: p0, 3-5: p1, 6-8: p2)
        for (let i = 0; i < 3; i++) {
            p0.push(allCards[i]);
            p1.push(allCards[i + 3]);
            p2.push(allCards[i + 6]);
        }

        // Skat (9-10)
        this.skat = [allCards[9], allCards[10]];

        // Round 2: 4 cards each (11-14: p0, 15-18: p1, 19-22: p2)
        for (let i = 0; i < 4; i++) {
            p0.push(allCards[11 + i]);
            p1.push(allCards[15 + i]);
            p2.push(allCards[19 + i]);
        }

        // Round 3: 3 cards each (23-25: p0, 26-28: p1, 29-31: p2)
        for (let i = 0; i < 3; i++) {
            p0.push(allCards[23 + i]);
            p1.push(allCards[26 + i]);
            p2.push(allCards[29 + i]);
        }

        // Zuordnung zu Players basierend auf Positionen
        this.players = [
            { id: 0, hand: p0, position: null },
            { id: 1, hand: p1, position: null },
            { id: 2, hand: p2, position: null }
        ];

        // Positionen zuordnen
        this.players[this.forehandIndex].position = 'VH';
        this.players[this.mittelhandIndex].position = 'MH';
        this.players[this.hinterhandIndex].position = 'HH';
    }

    /**
     * Hände sortieren (nach Suit/Rank wie im Singleplayer)
     */
    sortHands() {
        this.players.forEach(player => {
            player.hand.sort((a, b) => {
                const suitOrder = { 'Eichel': 0, 'Grün': 1, 'Rot': 2, 'Schellen': 3 };
                const rankOrder = { '7': 0, '8': 1, '9': 2, '10': 3, 'U': 4, 'O': 5, 'K': 6, 'A': 7 };

                const suitDiff = (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
                if (suitDiff !== 0) return suitDiff;

                return (rankOrder[a.rank] || 0) - (rankOrder[b.rank] || 0);
            });
        });
    }

    /**
     * Karten für einen bestimmten Spieler abrufen
     */
    getPlayerHand(playerId) {
        const player = this.players.find(p => p.id === playerId);
        return player ? player.hand : [];
    }

    /**
     * Position-Label für einen Spieler
     */
    getPositionLabel(playerId) {
        const player = this.players.find(p => p.id === playerId);
        return player ? player.position : '?';
    }

    /**
     * Alle Spieler mit Positionen zurückgeben
     */
    getPlayersWithPositions() {
        return this.players.map(p => ({
            id: p.id,
            position: p.position,
            handSize: p.hand.length
        }));
    }
}
