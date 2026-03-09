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
        this.handGame = false;
        this.bidValue = 0;
        this.originalDeclarerHand = [];
        
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
        this.aborted = false;
        this.lastTrick = null;
        
        // Setup Last trick binding
        this.ui.showLastTrickBtn(() => {
            if (this.lastTrick) {
                this.ui.showLastTrick(this.lastTrick);
            }
        });
    }
    
    abort() {
        this.aborted = true;
        
        // Remove active elements/bindings quickly
        const cardEls = this.ui.els.player2Cards.querySelectorAll('.card-face');
        cardEls.forEach(el => {
            el.onclick = null;
            el.ondragstart = null;
            el.ondragend = null;
            el.draggable = false;
        });
        
        // Hide running overlays
        this.ui.hideBiddingOverlay();
        this.ui.els.skatDecisionOverlay.classList.add('hidden');
        this.ui.els.trumpOverlay.classList.add('hidden');
        this.ui.els.gameOverOverlay.classList.add('hidden');
        this.ui.els.skatDiscardArea.classList.add('hidden');
        
        // Cancel possible delays/bindings in bidding controller by signaling to bidding Engine indirectly 
        // (Usually handled natively if we don't re-trigger async await chains, or checking this.aborted frequently)
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
            this.bidValue = finalBid;
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
                    this.handGame = false;
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
                    this.handGame = true;
                    this.startTrumpSelection();
                }
            );
        } else {
            this.simulateBotSkatDecision();
        }
    }

    async simulateBotSkatDecision() {
        this.handGame = false;
        this.ui.showMessage(`${this.players[this.declarerIndex].name} nimmt den Skat auf.`);
        await this.delay(1500);
        
        const botHand = this.players[this.declarerIndex].hand;
        botHand.push(...this.skat);
        this.skat = [];
        
        // Use evaluated trump logic from bot Data
        const data = this.botBidding.evaluateHand(botHand);
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
        // Originale Karten des Alleinspielers sichern (Hand + Skat) für Spitzenberechnung
        this.originalDeclarerHand = [...this.players[this.declarerIndex].hand, ...this.skat];
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
        if (this.phase !== PHASES.PLAYING || this.aborted) return;

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
        if (this.aborted) return;
        await this.delay(1000); // Shorter wait before animating
        if (this.aborted) return;
        
        if (!this.animations) this.animations = new CardAnimations(this.ui);
        
        const winnerId = this.determineTrickWinner();
        
        // Save trick for "Last Trick" review before clearing
        this.lastTrick = [...this.currentTrick.cards];
        this.ui.showLastTrickBtn(() => {
            if (this.lastTrick) {
                this.ui.showLastTrick(this.lastTrick);
            }
        });
        
        // Animate trick collection
        await this.animations.animateCollectTrick(winnerId);
        if (this.aborted) return;
        
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

    calculatePoints(cards) {
        return cards.reduce((sum, card) => sum + (CARD_VALUES[card.rank] || 0), 0);
    }

    endGame(wonOverride = null) {
        this.phase = PHASES.GAME_OVER;
        
        // Count points
        let declarerPoints = 0;
        let defendersPoints = 0;
        let defenderTrickCount = 0;
        
        for (let i = 0; i < 3; i++) {
            const pts = this.calculatePoints(this.players[i].tricks);
            if (i === this.declarerIndex) {
                declarerPoints += pts;
            } else {
                defendersPoints += pts;
                defenderTrickCount += this.players[i].tricks.length;
            }
        }
        
        // Add skat points to declarer
        declarerPoints += this.calculatePoints(this.skat);
        
        // Determine if declarer won "normally" (before overbid check)
        const declarerWonNormally = wonOverride !== null ? wonOverride : (declarerPoints > 60);
        
        // --- Spielwertberechnung via GameValueEngine ---
        const evaluation = GameValueEngine.evaluateEndGame({
            trumpMode: this.trumpMode,
            declarerCards: this.originalDeclarerHand || [],
            skat: this.skat,
            bidValue: this.bidValue,
            handGame: this.handGame,
            declarerPoints,
            defenderPoints: defendersPoints,
            defenderTrickCount,
            declarerWonNormally
        });
        
        const won = evaluation.won;
        
        // Message construction
        let resultMsg;
        if (this.trumpMode === TRUMP_MODES.NULL) {
            resultMsg = won
                ? `${this.players[this.declarerIndex].name} gewinnt das Null-Spiel!`
                : `${this.players[this.declarerIndex].name} verliert das Null-Spiel!`;
        } else if (evaluation.overbid) {
            resultMsg = `${this.players[this.declarerIndex].name} hat überreizt! (Reizwert ${this.bidValue} > Spielwert ${evaluation.gameValue})`;
        } else {
            resultMsg = won 
                ? `${this.players[this.declarerIndex].name} gewinnt mit ${declarerPoints} Augen!` 
                : `Gegner gewinnen mit ${defendersPoints} Augen!`;
        }
            
        this.saveGameResult(
            won ? this.players[this.declarerIndex].name : "Die Gegner",
            won ? (this.trumpMode === TRUMP_MODES.NULL ? 0 : declarerPoints) : (this.trumpMode === TRUMP_MODES.NULL ? 0 : defendersPoints),
            this.trumpMode ? `${this.trumpMode}` : "Grand"
        );
            
        // Determine if the human player (id=2) won:
        // - If human is the declarer: human wins when declarer wins (won === true)
        // - If human is a defender: human wins when declarer loses (won === false)
        const humanWon = this.declarerIndex === 2 ? won : !won;
        this.ui.showGameOver(humanWon, resultMsg, declarerPoints, defendersPoints, evaluation);
        this.dealerIndex = (this.dealerIndex + 1) % 3; // Rotate dealer
    }
    
    saveGameResult(winner, score, gameType) {
        let stats = JSON.parse(localStorage.getItem("skatStats")) || [];
        stats.push({
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            winner: winner,
            score: score,
            gameType: gameType
        });
        
        // Keep only last 10 games
        if (stats.length > 10) {
            stats = stats.slice(-10);
        }
        
        localStorage.setItem("skatStats", JSON.stringify(stats));
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
