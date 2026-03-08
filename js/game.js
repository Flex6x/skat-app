/**
 * Skat Game Logic
 */

const PHASES = {
    DEALING: 'dealing',
    BIDDING: 'bidding',
    SKAT_DECISION: 'skat_decision',
    TRUMP_SELECTION: 'trump_selection',
    PLAYING: 'playing',
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

class Game {
    constructor(ui, aiControllers) {
        this.ui = ui;
        this.aiControllers = aiControllers; // Array of AI instances
        this.dealerIndex = 0; // Initialize dealer once
        
        this.reset();
    }

    reset() {
        this.deck = new Deck();
        this.players = [
            { id: 0, type: PLAYER_TYPES.BOT, name: 'Aicore', hand: [], score: 0, tricks: [] },
            { id: 1, type: PLAYER_TYPES.BOT, name: 'Aiden', hand: [], score: 0, tricks: [] },
            { id: 2, type: PLAYER_TYPES.HUMAN, name: 'Du', hand: [], score: 0, tricks: [] }
        ]; // Player 2 is the human for easier indexing locally
        this.skat = [];
        
        this.phase = PHASES.DEALING;
        // Compute roles relative to dealer
        this.forehandIndex = (this.dealerIndex + 1) % 3;
        this.turnIndex = this.forehandIndex;
        
        this.declarerIndex = -1;
        this.trumpMode = null;
        
        this.currentTrick = {
            cards: [], // { playerId, card }
            leadSuit: null
        };
        
        this.trickCount = 0;
    }

    async start() {
        if (!this.animations) {
            this.animations = new CardAnimations(this.ui);
        }

        this.deck.initialize();
        this.deck.shuffle();
        const dealt = this.deck.deal();
        
        this.players[0].hand = dealt.p1;
        this.players[1].hand = dealt.p2;
        this.players[2].hand = dealt.p3;
        this.skat = dealt.skat;
        
        // Sort hands
        this.players.forEach(p => this.sortHand(p.hand));
        
        this.ui.setDeclarer('-');
        this.phase = PHASES.DEALING;
        
        // Animate sequence
        await this.animations.animateDealSequence(this.forehandIndex, this.players);
        
        this.ui.renderAllHands(this.players);
        this.ui.updateSkatZone(this.skat);
        
        this.phase = PHASES.BIDDING;
        this.startBiddingPhase();
    }

    async startBiddingPhase() {
        this.biddingEngine = new BiddingEngine();
        this.botBidding = new BotBidding();
        
        this.biddingController = new BiddingController(
            this.biddingEngine, 
            this.botBidding, 
            this.ui, 
            this.players, 
            this.dealerIndex, 
            (declarerId, finalBid) => {
                this.onBiddingComplete(declarerId, finalBid);
            }
        );

        this.biddingController.start();
    }

    async onBiddingComplete(declarerId, finalBid) {
        if (declarerId === null) {
            // Passed in
            this.declarerIndex = -1;
            this.ui.setDeclarer('-');
            this.ui.showMessage('Eingepasst! Niemand möchte spielen.');
            await this.delay(1500);
            this.endGamePassedIn();
        } else {
            // Winner found
            this.declarerIndex = declarerId;
            this.ui.setDeclarer(this.players[this.declarerIndex].name, finalBid);
            this.ui.showMessage(`${this.players[this.declarerIndex].name} spielt (${finalBid}).`);
            await this.delay(1500);
            this.phase = PHASES.SKAT_DECISION;
            this.startSkatDecision(finalBid);
        }
    }

    startSkatDecision(finalBid) {
        if (this.players[this.declarerIndex].type === PLAYER_TYPES.HUMAN) {
            this.ui.showSkatDecisionOverlay(
                // Take Skat
                () => {
                    // Start dragging game: The two cards in this.skat are shown in slots
                    this.ui.showSkatDiscardUI(this.players[this.declarerIndex].hand, this.skat, (discardedIds) => {
                        // The user confirmed physically what 2 cards go into skat. 
                        // Those MUST be extracted from the combination of "hand + old skat"
                        // So first, add the OLD skat to hand
                        this.players[this.declarerIndex].hand.push(...this.skat);
                        
                        // Then remove the newly chosen discardedIds from hand
                        this.skat = discardedIds.map(id => this.removeCardFromHand(this.declarerIndex, id));
                        
                        // Resort and Re-render hand legally
                        this.sortHand(this.players[this.declarerIndex].hand);
                        this.ui.renderPlayerHand(this.players[this.declarerIndex].hand);
                        this.startTrumpSelection();
                    });
                },
                // Hand play
                () => {
                    this.startTrumpSelection();
                }
            );
        } else {
            this.simulateBotSkatDecision();
        }
    }

    async simulateBotSkatDecision() {
        this.ui.showMessage(`${this.players[this.declarerIndex].name} nimmt den Skat auf.`);
        await this.delay(1500);
        
        const botHand = this.players[this.declarerIndex].hand;
        botHand.push(...this.skat);
        this.skat = [];
        
        // Use evaluated trump logic from bot Data
        const data = this.botData[this.declarerIndex];
        this.trumpMode = data.trumpSuit; 
        this.ui.setTrump(this.trumpMode);
        
        this.sortHand(botHand);
        
        const d1 = botHand.pop();
        const d2 = botHand.pop();
        this.skat.push(d1, d2);
        
        this.ui.renderBotHand(this.declarerIndex, botHand.length);
        this.ui.showMessage(`${this.players[this.declarerIndex].name} spielt ${this.trumpMode}.`);
        await this.delay(1500);
        
        this.startGameplay();
    }

    removeCardFromHand(playerId, cardId) {
        const hand = this.players[playerId].hand;
        const index = hand.findIndex(c => c.id === cardId);
        return hand.splice(index, 1)[0];
    }

    startTrumpSelection() {
        this.phase = PHASES.TRUMP_SELECTION;
        if (this.players[this.declarerIndex].type === PLAYER_TYPES.HUMAN) {
            this.ui.showTrumpSelectionOverlay((trumpSuit) => {
                this.trumpMode = trumpSuit;
                this.ui.setTrump(this.trumpMode);
                // Resort hand based on new trump mode
                this.sortHand(this.players[this.declarerIndex].hand);
                this.ui.renderPlayerHand(this.players[this.declarerIndex].hand);
                this.startGameplay();
            });
        }
    }

    startGameplay() {
        this.phase = PHASES.PLAYING;
        this.turnIndex = this.forehandIndex;
        this.processTurn();
    }

    isTrump(card) {
        if (this.trumpMode === TRUMP_MODES.NULL) return false;
        
        // In German deck, U (Unter/Jack) is always trump unless Null
        if (card.rank === 'U') return true;
        
        if (this.trumpMode === TRUMP_MODES.GRAND) return false; // In Grand, only Unters are trumps
        
        return card.suit === this.trumpMode;
    }

    // Determine the effective suit of a card (Unters are considered the trump suit)
    getEffectiveSuit(card) {
        if (this.trumpMode !== TRUMP_MODES.NULL && card.rank === 'U') {
            return this.trumpMode !== TRUMP_MODES.GRAND ? this.trumpMode : 'Trump';
        }
        return card.suit;
    }

    getValidMoves(playerId) {
        const hand = this.players[playerId].hand;
        
        // If leading the trick, any card is valid
        if (this.currentTrick.cards.length === 0) {
            return hand;
        }

        const leadCard = this.currentTrick.cards[0].card;
        const leadSuitEffective = this.getEffectiveSuit(leadCard);
        
        // Must follow suit if possible
        const matchingSuitCards = hand.filter(c => this.getEffectiveSuit(c) === leadSuitEffective);
        
        if (matchingSuitCards.length > 0) {
            return matchingSuitCards;
        }
        
        // If void, can play anything
        return hand;
    }

    async processTurn() {
        if (this.phase !== PHASES.PLAYING) return;

        this.ui.updateTurn(this.turnIndex);

        const currentPlayer = this.players[this.turnIndex];
        const validMoves = this.getValidMoves(this.turnIndex);

        if (currentPlayer.type === PLAYER_TYPES.HUMAN) {
            this.ui.enablePlayerMoves(validMoves, (cardId) => {
                this.playCard(this.turnIndex, cardId);
            });
        } else {
            // Bot's turn
            await this.delay(800 + Math.random() * 500); // 0.8s - 1.3s delay
            const aiController = this.aiControllers[currentPlayer.id];
            const selectedCard = aiController.chooseCard(validMoves, this.currentTrick, this.trumpMode);
            this.playCard(this.turnIndex, selectedCard.id);
        }
    }

    playCard(playerId, cardId) {
        const card = this.removeCardFromHand(playerId, cardId);
        
        if (this.currentTrick.cards.length === 0) {
            this.currentTrick.leadSuit = this.getEffectiveSuit(card);
        }
        
        this.currentTrick.cards.push({ playerId, card });
        this.ui.renderPlayedCard(playerId, card);

        if (playerId === 2) {
            this.ui.renderPlayerHand(this.players[playerId].hand); // Update hand visually
        } else {
            this.ui.renderBotHand(playerId, this.players[playerId].hand.length); // Update bot card count
        }

        // Check if trick is full
        if (this.currentTrick.cards.length === 3) {
            this.resolveTrick();
        } else {
            // Next player
            this.turnIndex = (this.turnIndex + 1) % 3;
            this.processTurn();
        }
    }

    async resolveTrick() {
        await this.delay(1000); // Shorter wait before animating
        
        if (!this.animations) this.animations = new CardAnimations(this.ui);
        
        const winnerId = this.determineTrickWinner();
        
        // Animate trick collection
        await this.animations.animateCollectTrick(winnerId);
        
        const trickCards = this.currentTrick.cards.map(c => c.card);
        this.players[winnerId].tricks.push(...trickCards);
        
        this.ui.showMessage(`${this.players[winnerId].name} gewinnt den Stich!`);
        
        this.currentTrick = { cards: [], leadSuit: null };
        this.trickCount++;

        if (this.trumpMode === TRUMP_MODES.NULL && winnerId === this.declarerIndex) {
            this.endGame(false); // Null declarer loses immediately on winning a trick
            return;
        }

        if (this.trickCount === 10) {
            this.endGame(this.trumpMode === TRUMP_MODES.NULL ? true : null);
        } else {
            // Winner leads the next trick
            this.turnIndex = winnerId;
            this.processTurn();
        }
    }

    determineTrickWinner() {
        const leadCardOpt = this.currentTrick.cards[0];
        let highest = leadCardOpt;
        const rp = this.trumpMode === TRUMP_MODES.NULL ? NULL_RANK_POWER : RANK_POWER;
        
        for (let i = 1; i < 3; i++) {
            const current = this.currentTrick.cards[i];
            
            // Compare current vs highest
            if (this.isTrump(current.card) && !this.isTrump(highest.card)) {
                highest = current;
            } else if (this.isTrump(current.card) && this.isTrump(highest.card)) {
                // Both are trumps. 
                // In German deck, Unter are trumps. Eichel U > Grün U > Rot U > Schellen U.
                // If both are Unters:
                if (current.card.rank === 'U' && highest.card.rank === 'U') {
                    const order = [SUITS.SCHELLEN, SUITS.ROT, SUITS.GRUEN, SUITS.EICHEL]; // Index is power
                    if (order.indexOf(current.card.suit) > order.indexOf(highest.card.suit)) {
                        highest = current;
                    }
                } else if (current.card.rank === 'U') {
                    highest = current;
                } else if (highest.card.rank === 'U') {
                    // highest stays highest
                } else {
                    // Both are regular trumps, compare rank power
                    if (rp[current.card.rank] > rp[highest.card.rank]) {
                        highest = current;
                    }
                }
            } else if (!this.isTrump(current.card) && !this.isTrump(highest.card)) {
                // Must be of lead suit to win
                if (current.card.suit === highest.card.suit) {
                    if (rp[current.card.rank] > rp[highest.card.rank]) {
                        highest = current;
                    }
                }
            }
        }
        
        return highest.playerId;
    }

    endGame(immediateNullWin = null) {
        this.phase = PHASES.GAME_OVER;
        
        // Add skat to declarer's tricks
        if (this.declarerIndex !== -1) {
            this.players[this.declarerIndex].tricks.push(...this.skat);
        }

        // Calculate points
        let declarerPoints = 0;
        let opponentsPoints = 0;

        this.players.forEach(p => {
            const points = p.tricks.reduce((sum, card) => sum + card.value, 0);
            p.score = points;
            if (p.id === this.declarerIndex) {
                declarerPoints += points;
            } else {
                opponentsPoints += points;
            }
        });

        // 120 points total in the deck
        let declarerWon = declarerPoints > 60;
        if (immediateNullWin !== null) {
            declarerWon = immediateNullWin;
        }
        
        this.ui.showGameOver(declarerWon, declarerPoints, opponentsPoints);
        this.dealerIndex = (this.dealerIndex + 1) % 3; // Rotate dealer
    }

    endGamePassedIn() {
        this.phase = PHASES.GAME_OVER;
        this.ui.showGameOverPassedIn();
        this.dealerIndex = (this.dealerIndex + 1) % 3; // Rotate dealer
    }

    sortHand(hand) {
        // Sort: Trumps first (Unters => Trumps), then other suits (Rank order)
        const rp = this.trumpMode === TRUMP_MODES.NULL ? NULL_RANK_POWER : RANK_POWER;
        
        hand.sort((a, b) => {
            const aTrump = this.isTrump(a);
            const bTrump = this.isTrump(b);
            
            if (aTrump && !bTrump) return -1;
            if (!aTrump && bTrump) return 1;
            
            if (aTrump && bTrump) {
                if (a.rank === 'U' && b.rank !== 'U') return -1;
                if (a.rank !== 'U' && b.rank === 'U') return 1;
                if (a.rank === 'U' && b.rank === 'U') {
                    const order = [SUITS.SCHELLEN, SUITS.ROT, SUITS.GRUEN, SUITS.EICHEL];
                    return order.indexOf(b.suit) - order.indexOf(a.suit); // Eichel first
                }
                return rp[b.rank] - rp[a.rank];
            }
            
            // Neither is trump
            if (a.suit !== b.suit) {
                return a.suit.localeCompare(b.suit);
            }
            
            return rp[b.rank] - rp[a.rank];
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
