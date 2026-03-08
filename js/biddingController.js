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

        this.ui.updatePlayerRoles(this.vorhand, this.mittelhand, this.hinterhand);

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
        this.phase = 1; // 1: M vs V | 2: H vs Winner(M,V)
        this.hasBidBeenMade = false; // Tracks if anyone ever said >= 18
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
        const isChallenger = this.activeTurn === this.challenger;
        const targetBid = isChallenger ? 
            (this.currentBid === 0 ? 18 : this.engine.getNextBid(this.currentBid)) : 
            this.currentBid;

        this.ui.showAdvancedBiddingOverlay(
            targetBid,
            isChallenger, // canBid (Reizen)
            !isChallenger, // canHold (Ja)
            () => this.onAction(isChallenger ? 'bid' : 'hold', targetBid),
            () => this.onAction('pass', null)
        );
    }

    handleBotTurn(botId) {
        const isChallenger = botId === this.challenger;
        const data = this.botData[botId];
        
        const targetBid = isChallenger ? 
            (this.currentBid === 0 ? 18 : this.engine.getNextBid(this.currentBid)) : 
            this.currentBid;

        if (!targetBid) {
            this.onAction('pass');
            return;
        }

        if (this.botBidding.decideBid(targetBid, data)) {
            this.onAction(isChallenger ? 'bid' : 'hold', targetBid);
        } else {
            this.onAction('pass');
        }
    }

    async onAction(action, value) {
        this.ui.hideBiddingOverlay();
        const actorId = this.activeTurn;

        if (action === 'pass') {
            this.ui.showSpeechBubble(actorId, 'Passe');
            await this.delay(1000);
            this.handlePass(actorId);
        } else if (action === 'bid') {
            this.hasBidBeenMade = true;
            this.currentBid = value;
            this.ui.showSpeechBubble(actorId, `Reize ${value}`);
            this.activeTurn = this.survivor; // Survivor must answer now
            await this.delay(1000);
            this.processTurn();
        } else if (action === 'hold') {
            this.ui.showSpeechBubble(actorId, 'Ja');
            this.activeTurn = this.challenger; // Challenger must increase
            await this.delay(1000);
            this.processTurn();
        }
    }

    handlePass(actorId) {
        if (this.phase === 1) {
            // Phase 1 ended
            if (actorId === this.challenger) {
                // M passed, V is survivor
                this.survivor = this.vorhand;
            } else {
                // V passed, M is survivor
                this.survivor = this.mittelhand;
            }
            // Move to Phase 2: H challenges Survivor
            this.phase = 2;
            this.challenger = this.hinterhand;
            this.activeTurn = this.challenger;
            this.processTurn();
        } else if (this.phase === 2) {
            // Phase 2 ended
            if (actorId === this.challenger) {
                // H passed, survivor wins
                this.finishBidding(this.survivor);
            } else {
                // Survivor passed, H wins
                this.finishBidding(this.hinterhand);
            }
        }
    }

    finishBidding(winnerId) {
        if (!this.hasBidBeenMade) {
            this.onComplete(null, 0); // Schieberamsch / Eingepasst
        } else {
            this.onComplete(winnerId, this.currentBid);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
