/**
 * Skat Game Logic
 */

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

class Game {
    constructor(ui, aiControllers, settings) {
        this.ui = ui;
        this.aiControllers = aiControllers; // Array of AI instances
        this.settings = settings;
        this.dealerIndex = Math.floor(Math.random() * 3); // Randomly choose first dealer
        
        this.reset();
    }

    reset() {
        this.deck = new Deck();
        const playerName = (this.settings && this.settings.current.nickname) || 'Du';
        this.players = [
            { id: 0, type: PLAYER_TYPES.BOT, name: 'Aicore', hand: [], score: 0, tricks: [] },
            { id: 1, type: PLAYER_TYPES.BOT, name: 'Aiden', hand: [], score: 0, tricks: [] },
            { id: 2, type: PLAYER_TYPES.HUMAN, name: playerName, hand: [], score: 0, tricks: [] }
        ]; // Player 2 is the human for easier indexing locally
        this.skat = [];
        this.handGame = false;
        this.bidValue = 0;
        this.originalDeclarerHand = [];
        this.announcedSchneider = false;
        this.announcedSchwarz = false;
        this.isOuvert = false;
        
        this.phase = PHASES.DEALING;
        // Compute roles relative to dealer
        this.forehandIndex = (this.dealerIndex + 1) % 3;
        const mittelhandIndex = (this.dealerIndex + 2) % 3;
        const hinterhandIndex = this.dealerIndex;
        this.ui.updatePlayerRoles(this.forehandIndex, mittelhandIndex, hinterhandIndex);

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
        this.inputLocked = false;
        this.claimRejectedThisRound = false;
        
        this.ui.resetLiveScore();
        this.ui.resetTrumpUI();
        // Setup Last trick binding
        this.ui.showLastTrickBtn(() => {
            if (this.lastTrick) {
                this.ui.showLastTrick(this.lastTrick);
            }
        });
    }

    saveGameState() {
        if (this.phase === PHASES.GAME_OVER || this.aborted) {
            localStorage.removeItem("skatGameState");
            return;
        }

        const state = {
            dealerIndex: this.dealerIndex,
            players: this.players.map(p => ({
                id: p.id,
                type: p.type,
                name: p.name,
                hand: p.hand,
                score: p.score,
                tricks: p.tricks
            })),
            skat: this.skat,
            initialSkat: this.initialSkat,
            handGame: this.handGame,
            bidValue: this.bidValue,
            originalDeclarerHand: this.originalDeclarerHand,
            announcedSchneider: this.announcedSchneider,
            announcedSchwarz: this.announcedSchwarz,
            isOuvert: this.isOuvert,
            phase: this.phase,
            forehandIndex: this.forehandIndex,
            turnIndex: this.turnIndex,
            declarerIndex: this.declarerIndex,
            trumpMode: this.trumpMode,
            currentTrick: this.currentTrick,
            trickCount: this.trickCount,
            lastTrick: this.lastTrick,
            biddingState: this.biddingController ? this.biddingController.getState() : null
        };

        localStorage.setItem("skatGameState", JSON.stringify(state));
    }

    loadGameState(state) {
        this.dealerIndex = state.dealerIndex;
        this.biddingState = state.biddingState;
        
        // Reconstruct Cards
        const reconstructCards = (cards) => cards.map(c => new Card(c.suit, c.rank));
        
        this.players = state.players.map(p => ({
            ...p,
            hand: reconstructCards(p.hand),
            tricks: reconstructCards(p.tricks)
        }));
        
        this.skat = reconstructCards(state.skat);
        this.initialSkat = reconstructCards(state.initialSkat);
        this.handGame = state.handGame;
        this.bidValue = state.bidValue;
        this.originalDeclarerHand = reconstructCards(state.originalDeclarerHand);
        this.announcedSchneider = state.announcedSchneider;
        this.announcedSchwarz = state.announcedSchwarz;
        this.isOuvert = state.isOuvert || false;
        this.phase = state.phase;
        this.forehandIndex = state.forehandIndex;
        this.turnIndex = state.turnIndex;
        this.declarerIndex = state.declarerIndex;
        this.trumpMode = state.trumpMode;
        this.currentTrick = {
            cards: state.currentTrick.cards.map(tc => ({
                playerId: tc.playerId,
                card: new Card(tc.card.suit, tc.card.rank)
            })),
            leadSuit: state.currentTrick.leadSuit
        };
        this.trickCount = state.trickCount;
        this.lastTrick = state.lastTrick ? state.lastTrick.map(tc => ({
            playerId: tc.playerId,
            card: new Card(tc.card.suit, tc.card.rank)
        })) : null;

        // Re-render UI
        this.ui.resetAllOverlays();
        
        // Update roles
        const mittelhandIndex = (this.dealerIndex + 2) % 3;
        const hinterhandIndex = this.dealerIndex;
        this.ui.updatePlayerRoles(this.forehandIndex, mittelhandIndex, hinterhandIndex);
        
        if (this.declarerIndex !== -1) {
            const declarerName = this.players[this.declarerIndex].name;
            this.ui.setDeclarer(declarerName, this.bidValue, this.declarerIndex);
        }
        
        if (this.trumpMode) {
            this.ui.setTrump(this.trumpMode, this.handGame, this.announcedSchneider, this.announcedSchwarz, this.isOuvert);
        }
        
        this.ui.renderAllHands(this.players);
        
        if (this.isOuvert && this.phase === PHASES.PLAYING) {
            this.revealDeclarerCards();
        }

        this.updateLiveScore();
        
        if (this.currentTrick.cards.length > 0) {
            this.currentTrick.cards.forEach(tc => {
                this.ui.renderPlayedCard(tc.playerId, tc.card);
            });
        }
        
        if (this.trickCount > 0) {
            this.ui.updateTrickPiles(this.players, this.declarerIndex, this.phase === PHASES.RAMSCH);
        }

        if (this.lastTrick) {
            this.ui.showLastTrickBtn(() => {
                if (this.lastTrick) {
                    this.ui.showLastTrick(this.lastTrick);
                }
            });
        }
    }

    async resume(state) {
        this.loadGameState(state);
        
        if (!this.animations) {
            this.animations = new CardAnimations(this.ui);
        }

        // Determine where to pick up
        switch (this.phase) {
            case PHASES.BIDDING:
                this.startBiddingPhase(this.biddingState);
                break;
            case PHASES.SKAT_DECISION:
                this.startSkatDecision(this.bidValue);
                break;
            case PHASES.TRUMP_SELECTION:
                this.startTrumpSelection();
                break;
            case PHASES.ANNOUNCEMENT:
                this.startAnnouncement();
                break;
            case PHASES.PLAYING:
            case PHASES.RAMSCH:
                this.processTurn();
                break;
            default:
                // If it was dealing or game over, just start fresh or something
                this.ui.showMainMenu(() => this.start(this.onGameEnd));
                break;
        }
    }
    
    abort() {
        this.aborted = true;
        if (this.animations) {
            this.animations.abort();
        }
        
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

    async start(onGameEnd) {
        this.onGameEnd = onGameEnd;
        if (!this.animations) {
            this.animations = new CardAnimations(this.ui);
        }

        // Play shuffle sound and wait 1.5s as requested
        this.ui.playSound('shuffle');
        await this.delay(1500);

        this.deck.initialize();
        this.deck.shuffle();
        const dealt = this.deck.deal();
        
        this.players[0].hand = dealt.p1;
        this.players[1].hand = dealt.p2;
        this.players[2].hand = dealt.p3;
        this.skat = dealt.skat;
        this.initialSkat = [...dealt.skat]; // Capture initial skat
        
        this.ui.setDeclarer('-');
        
        // Animate sequence (uses the raw unsorted hand for visual dealing)
        await this.animations.animateDealSequence(this.forehandIndex, this.players);

        // Sort hands AFTER animation
        this.players.forEach(p => this.sortHand(p.hand));

        // Re-render all hands in their sorted state
        this.ui.renderAllHands(this.players);

        this.phase = PHASES.BIDDING;
        this.saveGameState();
        this.startBiddingPhase();
    }

    async startBiddingPhase(savedState = null) {
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
            },
            savedState
        );

        this.biddingController.start();
    }

    async onBiddingComplete(declarerId, finalBid) {
        if (declarerId === null) {
            // No winner found
            if (this.settings.current.ruleSet === 'pub') {
                this.ui.showMessage('Ramsch!');
                await this.delay(1500);
                this.startRamsch();
            } else {
                this.declarerIndex = -1;
                this.ui.setDeclarer('-');
                this.ui.showMessage(`${this.ui.getTranslation('passed_in')} ${this.ui.getTranslation('nobody_bid')}`);
                await this.delay(1500);
                this.endGamePassedIn();
            }
        } else {
            // Winner found
            this.declarerIndex = declarerId;
            this.bidValue = finalBid;

            // Check if bot needs to play 'Hand' to justify the bid
            if (this.players[declarerId].type === PLAYER_TYPES.BOT) {
                const botData = this.biddingController.botData[declarerId];
                if (botData && finalBid > botData.maxBid) {
                    this.handGame = true;
                } else {
                    this.handGame = false;
                }
            }

            this.ui.setDeclarer(this.players[this.declarerIndex].name, finalBid, this.declarerIndex);
            this.ui.showMessage(`${this.players[this.declarerIndex].name} spielt (${finalBid}).`);
            await this.delay(1500);
            this.phase = PHASES.SKAT_DECISION;
            this.saveGameState();
            this.startSkatDecision(finalBid);
        }
    }

    startRamsch() {
        this.phase = PHASES.RAMSCH;
        this.trumpMode = TRUMP_MODES.GRAND; // Ramsch is often played like Grand (only Jacks are trump)
        this.ui.setTrump('Ramsch');
        this.ui.setDeclarer('Ramsch', null, -1);

        // Sorting hands for Grand
        this.players.forEach(p => this.sortHand(p.hand));
        this.ui.renderAllHands(this.players);

        this.turnIndex = this.forehandIndex;
        this.processTurn();
    }


    startSkatDecision(finalBid) {
        if (this.players[this.declarerIndex].type === PLAYER_TYPES.HUMAN) {
            this.ui.showSkatDecisionOverlay(
                // Take Skat
                () => {
                    this.handGame = false;
                    this.isOuvert = false; // Will be set in trump selection if they choose Null Ouvert
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
                        this.saveGameState();
                        
                        // Hide skat pile after skat has been taken and discarded
                        this.ui.updateSkatPile(false);
                        
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
        if (this.handGame) {
            this.ui.showMessage(`${this.players[this.declarerIndex].name} spielt Hand.`);
            await this.delay(1500);
            
            const botHand = this.players[this.declarerIndex].hand;
            const data = this.botBidding.evaluateHand(botHand);
            this.trumpMode = data.trumpSuit; 
            
            // Bot logic for Ouvert: Only if win prob is 100%
            // For now, let's say they never do it unless we implement 100% check
            this.isOuvert = false; 

            this.ui.setTrump(this.trumpMode, this.handGame, false, false, this.isOuvert);
            this.ui.showMessage(`${this.players[this.declarerIndex].name} spielt ${this.trumpMode} (Hand).`);

            // Resort player hand based on bot's trump choice
            this.sortHand(this.players[2].hand);
            this.ui.renderPlayerHand(this.players[2].hand);

            this.saveGameState();
            await this.delay(1500);
            this.startGameplay();
            return;
        }

        this.ui.showMessage(`${this.players[this.declarerIndex].name} nimmt den Skat auf.`);
        await this.delay(1500);
        
        const botHand = this.players[this.declarerIndex].hand;
        botHand.push(...this.skat);
        this.skat = [];
        
        // Use evaluated trump logic from bot Data
        const data = this.botBidding.evaluateHand(botHand);
        this.trumpMode = data.trumpSuit; 
        this.isOuvert = false;
        
        this.ui.setTrump(this.trumpMode, this.handGame, false, false, this.isOuvert);
        
        this.sortHand(botHand);
        
        // Discard logic
        let d1, d2;
        if (this.trumpMode === TRUMP_MODES.NULL) {
            // In Null games, discard the two HIGHEST cards to avoid winning tricks
            botHand.sort((a, b) => NULL_RANK_POWER[b.rank] - NULL_RANK_POWER[a.rank]);
            d1 = botHand.shift();
            d2 = botHand.shift();
        } else {
            // In Suit/Grand games, discard two non-trump cards (usually lowest or according to some logic)
            // For now, keep the simple pop() which usually removes cards from the end of sorted hand
            d1 = botHand.pop();
            d2 = botHand.pop();
        }
        
        this.skat.push(d1, d2);
        this.sortHand(botHand); // Resort after discarding
        
        this.ui.renderBotHand(this.declarerIndex, botHand.length);
        this.ui.showMessage(`${this.players[this.declarerIndex].name} spielt ${this.trumpMode}.`);

        // Resort player hand based on bot's trump choice
        this.sortHand(this.players[2].hand);
        this.ui.renderPlayerHand(this.players[2].hand);

        this.saveGameState();
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
            this.ui.showTrumpSelectionOverlay(this.handGame, (trumpSuit, ouvert = false) => {
                this.trumpMode = trumpSuit;
                this.isOuvert = ouvert;
                
                if (this.isOuvert && this.trumpMode === TRUMP_MODES.NULL) {
                    this.ui.setTrump(this.trumpMode, this.handGame, false, false, true);
                    this.sortHand(this.players[this.declarerIndex].hand);
                    this.ui.renderPlayerHand(this.players[this.declarerIndex].hand);
                    this.saveGameState();
                    this.startGameplay();
                } else if (this.isOuvert && this.trumpMode === TRUMP_MODES.GRAND) {
                    // Grand Ouvert implies Schwarz angesagt
                    this.announcedSchneider = true;
                    this.announcedSchwarz = true;
                    this.ui.setTrump(this.trumpMode, this.handGame, true, true, true);
                    this.sortHand(this.players[this.declarerIndex].hand);
                    this.ui.renderPlayerHand(this.players[this.declarerIndex].hand);
                    this.saveGameState();
                    this.startGameplay();
                } else {
                    this.ui.setTrump(this.trumpMode, this.handGame, false, false, false);
                    this.sortHand(this.players[this.declarerIndex].hand);
                    this.ui.renderPlayerHand(this.players[this.declarerIndex].hand);
                    this.saveGameState();
                    if (this.handGame) {
                        this.startAnnouncement();
                    } else {
                        this.startGameplay();
                    }
                }
            });
        }
    }

    startAnnouncement() {
        this.phase = PHASES.ANNOUNCEMENT;
        this.ui.showAnnouncementOverlay((schneider, schwarz) => {
            this.announcedSchneider = schneider;
            this.announcedSchwarz = schwarz;
            
            // Update UI display with suffixes
            this.ui.setTrump(this.trumpMode, this.handGame, this.announcedSchneider, this.announcedSchwarz, this.isOuvert);
            
            // Hide skat pile after announcement in hand games
            this.ui.updateSkatPile(false);
            
            this.saveGameState();
            this.startGameplay();
        });
    }

    startGameplay() {
        this.phase = PHASES.PLAYING;
        // Nur die 10 Handkarten sichern für Spitzenberechnung (wie vom User gewünscht)
        // Die gedrückten Karten (skat) zählen nicht mehr für Matadore
        this.originalDeclarerHand = [...this.players[this.declarerIndex].hand];
        
        // Count trumps for badges
        this.declarerTrumpCount = this.originalDeclarerHand.filter(c => this.isTrump(c)).length;

        // Visuals: Hide skat pile (only if not already hidden in hand games)
        // For non-hand games, hide it now. For hand games, it was already hidden in startAnnouncement
        if (!this.handGame) {
            this.ui.updateSkatPile(false);
        }
        
        if (this.isOuvert) {
            this.revealDeclarerCards();
        }
        
        this.saveGameState();
        this.turnIndex = this.forehandIndex;
        this.processTurn();
    }

    revealDeclarerCards() {
        this.ui.revealDeclarerCards(this.declarerIndex, this.players[this.declarerIndex].hand);
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
        if ((this.phase !== PHASES.PLAYING && this.phase !== PHASES.RAMSCH) || this.aborted) return;

        this.ui.updateTurn(this.turnIndex);

        const currentPlayer = this.players[this.turnIndex];
        const validMoves = this.getValidMoves(this.turnIndex);

        if (currentPlayer.type === PLAYER_TYPES.HUMAN) {
            this.inputLocked = false;

            // Show claim button if human is declarer and phase is PLAYING and tricks > 1 remaining
            if (this.phase === PHASES.PLAYING && this.declarerIndex === 2 && this.trickCount < 9 && !this.claimRejectedThisRound) {
                this.ui.showClaimRestBtn(() => this.claimRemainingTricks());
            } else {
                this.ui.hideClaimRestBtn();
            }

            this.ui.enablePlayerMoves(validMoves, async (cardId) => {
                if (this.inputLocked || this.turnIndex !== 2) return;
                this.inputLocked = true;
                await this.playCard(this.turnIndex, cardId);
            });
        } else {
            // Bot's turn
            await this.delay(800 + Math.random() * 500); // 0.8s - 1.3s delay
            const aiController = this.aiControllers[currentPlayer.id];
            const isRamsch = (this.phase === PHASES.RAMSCH);
            
            // Perfect Information for Bots if isOuvert is true
            const declarerHand = this.isOuvert ? this.players[this.declarerIndex].hand : null;
            
            const selectedCard = aiController.chooseCard(
                validMoves, 
                this.currentTrick, 
                this.trumpMode, 
                this.declarerIndex, 
                isRamsch, 
                this.isOuvert, 
                declarerHand
            );
            await this.playCard(this.turnIndex, selectedCard.id);
        }
    }

    async claimRemainingTricks() {
        if (this.phase !== PHASES.PLAYING || this.declarerIndex !== 2 || this.claimRejectedThisRound) return;

        this.ui.showMessage(this.ui.getTranslation('claim_rest') + '!');
        this.ui.disableClaimRestBtn();
        await this.delay(1000);

        // Bots evaluate
        let rejected = false;
        let rejectingBotId = -1;

        for (let i = 0; i < 2; i++) {
            const botAi = this.aiControllers[i];
            const canWin = botAi.canStillWinTrick(
                this.players,
                this.trumpMode,
                this.declarerIndex,
                this.currentTrick,
                this.trickCount
            );
            if (canWin) {
                rejected = true;
                rejectingBotId = i;
                break;
            }
        }

        if (rejected) {
            this.claimRejectedThisRound = true;
            this.ui.showBotSpeech(rejectingBotId, "Nein.");
            await this.delay(2000);
            this.ui.hideBotSpeech(rejectingBotId);
            this.ui.hideClaimRestBtn();
        } else {
            this.ui.showMessage("Bots akzeptieren – restliche Stiche gehen an den Alleinspieler.");
            await this.delay(2000);
            this.awardRemainingTricksToDeclarer();
        }
    }

    awardRemainingTricksToDeclarer() {
        // Collect all cards from hands
        this.players.forEach(p => {
            this.players[this.declarerIndex].tricks.push(...p.hand);
            p.hand = [];
        });

        // Add skat if not already added (usually skat is handled at end of game)
        // In Skat, the declarer gets the skat eyes regardless.
        
        this.trickCount = 10;
        this.ui.renderAllHands(this.players);
        this.ui.updateTrickPiles(this.players, this.declarerIndex, false);
        this.updateLiveScore();
        this.endGame(this.trumpMode === TRUMP_MODES.NULL ? true : null);
    }

    async playCard(playerId, cardId) {
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
            if (this.isOuvert && playerId === this.declarerIndex) {
                this.revealDeclarerCards(); // Keep cards revealed
            }
        }

        this.saveGameState();

        // Check if trick is full
        if (this.currentTrick.cards.length === 3) {
            await this.resolveTrick();
        } else {
            // Next player
            this.turnIndex = (this.turnIndex + 1) % 3;
            await this.processTurn();
        }
    }

    async resolveTrick() {
        if (this.aborted) return;
        const isBatterySaver = (typeof appSettings !== 'undefined') && appSettings.current.batterySaver;
        await this.delay(isBatterySaver ? 400 : 1000); // Shorter wait before animating
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
        
        this.ui.showMessage(`${this.players[winnerId].name} ${this.ui.getTranslation('trick_winner_msg')}`);
        
        // Update visual trick piles on table
        this.ui.updateTrickPiles(this.players, this.declarerIndex, this.phase === PHASES.RAMSCH);
        
        this.currentTrick = { cards: [], leadSuit: null };
        this.trickCount++;

        // Update live score if enabled
        this.updateLiveScore();

        this.saveGameState();

        if (this.trumpMode === TRUMP_MODES.NULL && winnerId === this.declarerIndex) {
            this.endGame(false); // Null declarer loses immediately on winning a trick
            return;
        }

        if (this.trickCount === 10) {
            if (this.phase === PHASES.RAMSCH) {
                this.resolveRamsch();
            } else {
                this.endGame(this.trumpMode === TRUMP_MODES.NULL ? true : null);
            }
        } else {
            // Winner leads the next trick
            this.turnIndex = winnerId;
            await this.processTurn();
        }
    }

    resolveRamsch() {
        this.phase = PHASES.GAME_OVER;
        this.saveGameState();
        
        let playerPoints = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            playerPoints[i] = this.calculatePoints(this.players[i].tricks);
        }
        
        // Find the loser (most points)
        const maxPoints = Math.max(...playerPoints);
        const loserIndices = [];
        playerPoints.forEach((pts, idx) => {
            if (pts === maxPoints) loserIndices.push(idx);
        });

        // If everyone has 40 points, it's a draw, but usually someone loses.
        // We just pick the loser(s) and give -25.
        
        let resultMsg = this.ui.getTranslation('ramsch_msg') + ' ';
        loserIndices.forEach(idx => {
            const loserMsg = this.ui.getTranslation('ramsch_loser_msg').replace('{pts}', playerPoints[idx]);
            resultMsg += `${this.players[idx].name} ${loserMsg} `;
        });

        this.ui.showGameOver(
            !loserIndices.includes(2), // Human won if they are not the loser
            resultMsg,
            playerPoints[2], // Score of player 2
            Math.max(playerPoints[0], playerPoints[1]), 
            null,
            this.initialSkat,
            [],
            playerPoints // Passing full array for individual display
        );

        this.dealerIndex = (this.dealerIndex + 1) % 3;

        if (this.onGameEnd) {
            this.onGameEnd({
                isRamsch: true,
                loserIndices: loserIndices,
                trumpMode: this.trumpMode,
                handGame: this.handGame,
                announcedSchneider: this.announcedSchneider,
                announcedSchwarz: this.announcedSchwarz
            });
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
        this.saveGameState();
        
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
            isOuvert: this.isOuvert,
            announcedSchneider: this.announcedSchneider,
            announcedSchwarz: this.announcedSchwarz,
            declarerPoints,
            defenderPoints: defendersPoints,
            defenderTrickCount,
            declarerWonNormally
        });
        
        const won = evaluation.won;
        
        // Message construction
        let resultMsg;
        const declarerName = this.players[this.declarerIndex].name;
        if (this.trumpMode === TRUMP_MODES.NULL) {
            resultMsg = won
                ? `${declarerName} ${this.ui.getTranslation('null_win')}`
                : `${declarerName} ${this.ui.getTranslation('null_lose')}`;
        } else if (evaluation.overbid) {
            resultMsg = `${declarerName} ${this.ui.getTranslation('overbid_msg').replace('{bid}', this.bidValue).replace('{val}', evaluation.baseGameValue)}`;
        } else {
            resultMsg = won 
                ? `${declarerName} ${this.ui.getTranslation('declarer_win').replace('{pts}', declarerPoints)}` 
                : `${this.ui.getTranslation('opponents_win').replace('{pts}', defendersPoints)}`;
        }
            
        this.saveGameResult(
            won ? this.players[this.declarerIndex].name : this.ui.getTranslation('opponents'),
            won ? (this.trumpMode === TRUMP_MODES.NULL ? 0 : declarerPoints) : (this.trumpMode === TRUMP_MODES.NULL ? 0 : defendersPoints),
            this.trumpMode ? `${this.trumpMode}` : "Grand"
        );
            
        // Determine if the human player (id=2) won:
        // - If human is the declarer: human wins when declarer wins (won === true)
        // - If human is a defender: human wins when declarer loses (won === false)
        const humanWon = this.declarerIndex === 2 ? won : !won;
        this.ui.showGameOver(humanWon, resultMsg, declarerPoints, defendersPoints, evaluation, this.initialSkat, this.skat);
        this.dealerIndex = (this.dealerIndex + 1) % 3; // Rotate dealer

        // Visual: Return all cards to deck
        if (this.animations) {
            this.animations.animateReturnToDeck();
        }

        if (this.onGameEnd) {
            this.onGameEnd({
                passedIn: false,
                declarerId: this.declarerIndex,
                gameValue: evaluation.gameValue,
                won: evaluation.won,
                trumpMode: this.trumpMode,
                handGame: this.handGame,
                schneider: evaluation.schneider,
                schwarz: evaluation.schwarz,
                announcedSchneider: this.announcedSchneider,
                announcedSchwarz: this.announcedSchwarz,
                isOuvert: this.isOuvert,
                declarerTrumpCount: this.declarerTrumpCount,
                matadors: evaluation.matadors
            });
        }
    }
    
    saveGameResult(winner, score, gameType) {
        // Individual game stats tracking removed in favor of session/list tracking in main.js
    }

    endGamePassedIn() {
        this.phase = PHASES.GAME_OVER;
        this.saveGameState();
        this.ui.showGameOverPassedIn(this.initialSkat);
        this.dealerIndex = (this.dealerIndex + 1) % 3; // Rotate dealer

        if (this.onGameEnd) {
            this.onGameEnd({
                passedIn: true,
                trumpMode: this.trumpMode,
                handGame: this.handGame,
                announcedSchneider: this.announcedSchneider,
                announcedSchwarz: this.announcedSchwarz
            });
        }
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

    /**
     * Calculates the current points for declarer and defenders and updates the UI.
     */
    updateLiveScore() {
        let declarerPoints = 0;
        let defenderPoints = 0;

        this.players.forEach(p => {
            const pts = this.calculatePoints(p.tricks);
            if (p.id === this.declarerIndex) {
                declarerPoints += pts;
            } else {
                defenderPoints += pts;
            }
        });

        // Add skat points to declarer if they are the declarer
        const skatPoints = this.calculatePoints(this.skat);
        const totalDeclarerPoints = declarerPoints + (this.declarerIndex !== -1 ? skatPoints : 0);

        this.ui.updateLiveScore(totalDeclarerPoints, defenderPoints, this.settings.current.showLiveScore);
    }
}
