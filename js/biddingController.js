/**
 * Skat Bidding Controller
 * Handles the official Vorhand / Mittelhand / Hinterhand dialog logic.
 */

class BiddingController {
    constructor(biddingEngine, botBidding, ui, players, dealerIndex, onComplete) {
        this.engine = biddingEngine;
        this.botBidding = botBidding;
        this.ui = ui;
        this.players = players;
        this.onComplete = onComplete; // callback(declarerId, finalBid)

        this.dealer = dealerIndex;
        this.vorhand = (this.dealer + 1) % 3;
        this.mittelhand = (this.dealer + 2) % 3;
        this.hinterhand = this.dealer;

        // Precalculate bots
        this.botData = [];
        this.players.forEach(p => {
            if (p.type === 'bot') {
                this.botData[p.id] = this.botBidding.evaluateHand(p.hand);
            }
        });

        this.currentBid = 0;
        
        // State tracking
        this.survivor = this.vorhand;
        this.challenger = this.mittelhand;
        this.activeTurn = this.challenger; // Middlehand speaks first
        this.phase = 1; // 1: M vs V | 2: Winner(M,V) vs H | 3: Final check for Forehand if all passed
        this.hasBidBeenMade = false;
        this.passedPlayers = new Set();
    }

    async start() {
        this.ui.showMessage('Die Reiz-Phase beginnt.');
        await this.delay(1000);
        this.processTurn();
    }

    async processTurn() {
        const p = this.players[this.activeTurn];
        this.ui.updateTurn(this.activeTurn);

        if (p.type === 'human') {
            this.handleHumanTurn();
        } else {
            await this.delay(800 + Math.random() * 500);
            this.handleBotTurn(this.activeTurn);
        }
    }

    handleHumanTurn() {
        const isChallenger = this.activeTurn === this.challenger || this.phase === 3;
        
        // In phase 3, Forehand is the only one left and must bid at least 18 to play
        const targetBid = isChallenger ? 
            (this.currentBid === 0 ? 18 : this.engine.getNextBid(this.currentBid)) : 
            this.currentBid;

        this.ui.showAdvancedBiddingOverlay(
            targetBid,
            isChallenger, // canBid (Reizen)
            !isChallenger && this.phase !== 3, // canHold (Ja)
            () => this.onAction(isChallenger ? 'bid' : 'hold', targetBid),
            () => this.onAction('pass', null)
        );
    }

    handleBotTurn(botId) {
        const isChallenger = botId === this.challenger || this.phase === 3;
        const data = this.botData[botId];
        
        const targetBid = isChallenger ? 
            (this.currentBid === 0 ? 18 : this.engine.getNextBid(this.currentBid)) : 
            this.currentBid;

        if (!targetBid) {
            this.onAction('pass');
            return;
        }

        // Bots only bid if they have a good hand
        if (this.botBidding.decideBid(targetBid, data)) {
            this.onAction(isChallenger ? 'bid' : 'hold', targetBid);
        } else {
            this.onAction('pass');
        }
    }

    async onAction(action, value) {
        const actorId = this.activeTurn;

        if (action === 'pass') {
            this.ui.hideBiddingOverlay();
            this.ui.showSpeechBubble(actorId, 'Passe');
            this.passedPlayers.add(actorId);
            await this.delay(1000);
            this.handlePass(actorId);
        } else if (action === 'bid') {
            this.ui.hideBiddingOverlay();
            this.hasBidBeenMade = true;
            this.currentBid = value;
            this.ui.showSpeechBubble(actorId, `Reize ${value}`);
            
            if (this.phase === 3) {
                // Forehand bid 18 after others passed, they win immediately
                await this.delay(1000);
                this.finishBidding(this.vorhand);
            } else {
                this.activeTurn = this.survivor; // Survivor must answer now
                await this.delay(1000);
                this.processTurn();
            }
        } else if (action === 'hold') {
            this.ui.hideBiddingOverlay();
            this.ui.showSpeechBubble(actorId, 'Ja');
            this.activeTurn = this.challenger; // Challenger must increase
            await this.delay(1000);
            this.processTurn();
        }
    }

    handlePass(actorId) {
        if (this.phase === 1) {
            if (actorId === this.mittelhand) {
                // Mittelhand passed, Hinterhand challenges Vorhand
                this.survivor = this.vorhand;
                this.challenger = this.hinterhand;
                this.activeTurn = this.challenger;
                this.phase = 2;
                this.processTurn();
            } else {
                // Vorhand passed, Mittelhand is now the survivor, Hinterhand challenges
                this.survivor = this.mittelhand;
                this.challenger = this.hinterhand;
                this.activeTurn = this.challenger;
                this.phase = 2;
                this.processTurn();
            }
        } else if (this.phase === 2) {
            const winnerId = (actorId === this.challenger) ? this.survivor : this.challenger;
            
            // Special case: If everyone so far passed (M, H and V was challenger or survivor)
            // we must check if Forehand wants to play at 18.
            if (!this.hasBidBeenMade && this.passedPlayers.has(this.mittelhand) && this.passedPlayers.has(this.hinterhand)) {
                this.phase = 3;
                this.activeTurn = this.vorhand;
                this.processTurn();
            } else {
                this.finishBidding(winnerId);
            }
        } else if (this.phase === 3) {
            // Forehand also passed
            this.finishBidding(null);
        }
    }

    finishBidding(winnerId) {
        if (winnerId === null) {
            this.onComplete(null, 0);
        } else {
            // If winner wins without a bid (only Forehand can do this if others passed), bid is 18 minimum
            const finalBid = this.currentBid === 0 ? 18 : this.currentBid;
            this.onComplete(winnerId, finalBid);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
