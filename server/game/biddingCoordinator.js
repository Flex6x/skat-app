/**
 * BiddingCoordinator.js
 * 
 * Koordiniert die Reizphase (Bidding Phase) ohne UI-Abhängigkeiten.
 * Adaptiert von BiddingController.js aus dem Frontend.
 */

import BiddingEngine from '../engines/biddingEngine.js';

class BiddingCoordinator {
    /**
     * @param {Player[]} players - Array von 3 Player-Objekten
     * @param {number} dealerIndex - Index des Gebers
     * @param {Object} onComplete - Callback(declarerId, bidValue)
     */
    constructor(players, dealerIndex, onComplete) {
        this.players = players;
        this.dealerIndex = dealerIndex;
        this.onComplete = onComplete;

        this.biddingEngine = new BiddingEngine();

        // Berechne Positionen
        this.vorhand = (dealerIndex + 1) % 3;
        this.mittelhand = (dealerIndex + 2) % 3;
        this.hinterhand = dealerIndex;

        // Bidding-State
        this.currentBid = 0;
        this.survivor = this.vorhand;      // Wer hat zuletzt nicht gepasst
        this.challenger = this.mittelhand; // Wer stellt gerade Fragen
        this.activeTurn = this.challenger; // Wer ist dran
        this.phase = 1;                    // 1: M vs V | 2: Winner vs H | 3: Final check for F
        this.hasBidBeenMade = false;
        this.passedPlayers = new Set();
        this.biddingComplete = false;
    }

    /**
     * Startet die Reizphase
     */
    async start() {
        console.log(`[Bidding] Starting bidding phase. Vorhand=${this.vorhand}, Mittelhand=${this.mittelhand}, Hinterhand=${this.hinterhand}`);
        
        await this._delay(300);
        
        while (!this.biddingComplete) {
            await this._processTurn();
        }

        const result = this._getResult();
        console.log(`[Bidding] Complete. Declarer=${result.declarerId}, Bid=${result.bidValue}`);
        this.onComplete(result.declarerId, result.bidValue);
    }

    /**
     * Verarbeitet einen Spielzug in der Reizphase
     */
    async _processTurn() {
        const player = this.players[this.activeTurn];

        // Bot oder Human - bekomme Aktion
        const validBids = this._getValidBidsForChallenger();
        
        const action = await player.getAction(
            {
                bidOptions: validBids,
                currentBid: this.currentBid
            },
            {
                players: this.players,
                phase: this.phase,
                currentBid: this.currentBid
            }
        );

        // Verarbeite die Aktion
        if (action.type === 'PASS') {
            this._handlePass(this.activeTurn);
        } else if (action.type === 'BID') {
            this._handleBid(action.payload.value);
        }
    }

    /**
     * Spieler passt
     */
    _handlePass(playerId) {
        this.passedPlayers.add(playerId);
        console.log(`[Bidding] Player ${playerId} passes. (Passed: ${this.passedPlayers.size}/3)`);

        // Wenn jemand passt, wechselt die Rolle
        if (this.phase === 1) {
            // Mittelhand vs Vorhand
            if (playerId === this.mittelhand) {
                // Mittelhand passt: Vorhand wird Challenger
                this.challenger = this.vorhand;
                this.activeTurn = this.vorhand;
            } else if (playerId === this.vorhand) {
                // Vorhand passt: Mittelhand wird Survivor, Hinterhand wird Challenger
                this.survivor = this.mittelhand;
                this.challenger = this.hinterhand;
                this.phase = 2;
                this.activeTurn = this.hinterhand;
            }
        } else if (this.phase === 2) {
            // Winner vs Hinterhand
            if (playerId === this.hinterhand) {
                // Hinterhand passt: Reizen vorbei
                this.biddingComplete = true;
            } else if (playerId === this.survivor) {
                // Survivor passt: Hinterhand wird Declarer
                this.biddingComplete = true;
            }
        }
    }

    /**
     * Spieler bietet
     */
    _handleBid(bid) {
        if (bid > this.currentBid) {
            this.currentBid = bid;
            this.hasBidBeenMade = true;
            console.log(`[Bidding] Player ${this.activeTurn} bids ${bid}`);

            // Rolle wechseln
            if (this.phase === 1) {
                // Mittelhand vs Vorhand
                if (this.activeTurn === this.mittelhand) {
                    this.survivor = this.mittelhand;
                    this.activeTurn = this.vorhand;
                } else if (this.activeTurn === this.vorhand) {
                    this.challenger = this.mittelhand;
                    this.survivor = this.vorhand;
                    this.activeTurn = this.mittelhand;
                }
            } else if (this.phase === 2) {
                // Winner vs Hinterhand
                if (this.activeTurn === this.hinterhand) {
                    this.activeTurn = this.survivor;
                } else if (this.activeTurn === this.survivor) {
                    this.activeTurn = this.hinterhand;
                }
            }
        }
    }

    /**
     * Gibt die gültigen Gebote für den Challenger zurück
     */
    _getValidBidsForChallenger() {
        const nextBid = this.biddingEngine.getNextBid(this.currentBid);
        
        if (nextBid === null) {
            return []; // Keine höheren Gebote möglich
        }

        // Alle Gebote von nextBid bis max (264)
        return this.biddingEngine.getAllBids().filter(bid => bid >= nextBid);
    }

    /**
     * Gibt das Ergebnis der Reizphase zurück
     */
    _getResult() {
        // Wer hat die höchsten Gebote gemacht? Der survivor der letzten Runde.
        
        if (this.phase === 1) {
            // Phase 1 nicht vollständig: Wen ist noch dabei?
            const allPassed = this.passedPlayers.size === 3;
            if (allPassed) {
                return { declarerId: null, bidValue: 0 };
            }
            
            // Der der nicht gepasst hat
            for (let i = 0; i < 3; i++) {
                if (!this.passedPlayers.has(i)) {
                    return { declarerId: i, bidValue: this.currentBid };
                }
            }
        } else if (this.phase === 2) {
            // Phase 2: survivor ist der Sieger
            if (this.passedPlayers.has(this.survivor)) {
                // Survivor hat letztendlich gepasst? Challenger gewinnt
                return { declarerId: this.challenger, bidValue: this.currentBid };
            } else {
                return { declarerId: this.survivor, bidValue: this.currentBid };
            }
        }

        return { declarerId: null, bidValue: 0 };
    }

    /**
     * State für Speicherung/Debugging
     */
    getState() {
        return {
            currentBid: this.currentBid,
            survivor: this.survivor,
            challenger: this.challenger,
            activeTurn: this.activeTurn,
            phase: this.phase,
            hasBidBeenMade: this.hasBidBeenMade,
            passedPlayers: Array.from(this.passedPlayers),
            biddingComplete: this.biddingComplete
        };
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default BiddingCoordinator;
