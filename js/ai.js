/**
 * Skat Simple AI Controller
 */

class AIController {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    // Returns a Card object to play
    chooseCard(validMoves, currentTrick, trumpMode, declarerIndex, isRamsch = false) {
        if (validMoves.length === 1) return validMoves[0];

        // Null game strategy
        if (trumpMode === 'Null') {
            const isDeclarer = (this.id === declarerIndex);
            if (isDeclarer) {
                // As declarer: stay as low as possible
                return this.getLowestCard(validMoves, 'Null');
            } else {
                // As defender: force declarer to take trick
                return this.chooseNullDefenseCard(validMoves, currentTrick);
            }
        }

        // Ramsch strategy (similar to Null but with points consideration)
        if (isRamsch) {
            return this.chooseRamschCard(validMoves, currentTrick, trumpMode);
        }

        // Basic Heuristic:
        // 1. If leading, play non-trump high card or small trump.
        if (currentTrick.cards.length === 0) {
            return this.chooseLeadCard(validMoves, trumpMode);
        }

        // 2. If following, try to win if last player, or play lowest if can't win
        const highestSoFar = this.getHighestCardLevel(currentTrick, trumpMode);
        const winningCards = validMoves.filter(card => this.beatsCard(card, highestSoFar, currentTrick.leadSuit, trumpMode));
        
        // --- Enhanced Tactical Logic for Defenders ---
        const isDeclarer = (this.id === declarerIndex);
        if (!isDeclarer && trumpMode !== 'Null') {
            const currentWinnerId = this.determineCurrentWinner(currentTrick, trumpMode);
            const partnerId = this.getPartnerId(this.id, declarerIndex);
            
            // Case A: Partner has already won the trick (and we are 3rd player)
            if (currentWinnerId === partnerId && currentTrick.cards.length === 2) {
                // SCHMIEREN! Partner wins, so give them all the points we can spare
                return this.getHighestPointCard(validMoves);
            }
            
            // Case B: Declarer has already won the trick and we can't beat it
            if (currentWinnerId === declarerIndex && winningCards.length === 0) {
                // LUSCHEN! Declarer wins, so give them as few points as possible
                return this.getLowestPointCard(validMoves);
            }
        }

        if (winningCards.length > 0) {
            // TACTICAL IMPROVEMENT: Declarer should conserve high trumps (Unters) early in the game
            if (isDeclarer && currentTrick.cards.length > 0) {
                // If we have winning cards that are NOT Unters, use those first to conserve Unters
                const nonUnterWinning = winningCards.filter(c => c.rank !== 'U');
                if (nonUnterWinning.length > 0) {
                    return this.getLowestCard(nonUnterWinning, trumpMode);
                }
            }

            // Play lowest winning card to conserve high cards
            return this.getLowestCard(winningCards, trumpMode);
        } else {
            // Can't win, play absolute lowest rank to keep options open
            return this.getLowestCard(validMoves, trumpMode);
        }
    }

    determineCurrentWinner(trick, trumpMode) {
        if (trick.cards.length === 0) return null;
        let highest = trick.cards[0];
        for (let i = 1; i < trick.cards.length; i++) {
            if (this.beatsCard(trick.cards[i].card, highest.card, trick.leadSuit, trumpMode)) {
                highest = trick.cards[i];
            }
        }
        return highest.playerId;
    }

    getPartnerId(myId, declarerIndex) {
        // In 3-player Skat, if I'm not the declarer, the other non-declarer is my partner
        for (let i = 0; i < 3; i++) {
            if (i !== myId && i !== declarerIndex) return i;
        }
        return null;
    }

    getLowestPointCard(cards) {
        return cards.reduce((lowest, current) => {
            const pCurrent = CARD_VALUES[current.rank] || 0;
            const pLowest = CARD_VALUES[lowest.rank] || 0;
            if (pCurrent < pLowest) return current;
            if (pCurrent === pLowest) {
                const rp = RANK_POWER;
                return rp[current.rank] < rp[lowest.rank] ? current : lowest;
            }
            return lowest;
        }, cards[0]);
    }

    chooseRamschCard(validMoves, currentTrick, trumpMode) {
        // If leading, play a low card (lowest rank)
        if (currentTrick.cards.length === 0) {
            return this.getLowestCard(validMoves, trumpMode);
        }

        // If following
        const leadSuit = currentTrick.leadSuit;
        const canFollow = validMoves.some(c => this.getEffectiveSuit(c, trumpMode) === leadSuit);
        
        if (canFollow) {
            // Must follow suit. Try to play BELOW the current highest to avoid winning.
            const highestInTrick = this.getHighestCardLevel(currentTrick, trumpMode);
            const lowerCards = validMoves.filter(c => 
                this.getEffectiveSuit(c, trumpMode) === leadSuit && 
                !this.beatsCard(c, highestInTrick, leadSuit, trumpMode)
            );
            
            if (lowerCards.length > 0) {
                // Play highest of the lower cards (staying under but as high as possible)
                // This gets rid of cards without winning the trick
                return this.getHighestCard(lowerCards, trumpMode);
            } else {
                // Must win the trick or no lower cards: win with absolute LOWEST card possible
                return this.getLowestCard(validMoves, trumpMode);
            }
        } else {
            // Cannot follow suit: Abwerfen!
            // Prefer discarding high-POINT cards (Ace, 10, King) to get rid of them safely
            return this.getHighestPointCard(validMoves);
        }
    }

    getHighestPointCard(cards) {
        return cards.reduce((highest, current) => {
            const pCurrent = CARD_VALUES[current.rank] || 0;
            const pHighest = CARD_VALUES[highest.rank] || 0;
            if (pCurrent > pHighest) return current;
            // If points same, use rank power as secondary
            if (pCurrent === pHighest) {
                const rp = RANK_POWER;
                return rp[current.rank] > rp[highest.rank] ? current : highest;
            }
            return highest;
        }, cards[0]);
    }

    chooseNullDefenseCard(validMoves, currentTrick) {
        // If leading, play a low card to see if declarer has to win it
        if (currentTrick.cards.length === 0) {
            return this.getLowestCard(validMoves, 'Null');
        }

        // If following
        const rp = NULL_RANK_POWER;
        const leadSuit = currentTrick.leadSuit;
        
        // Can we follow suit?
        const canFollow = validMoves.some(c => c.suit === leadSuit);
        
        if (canFollow) {
            // Try to play BELOW the highest card in trick if possible, or play lowest
            const highestInTrick = this.getHighestCardLevel(currentTrick, 'Null');
            const lowerCards = validMoves.filter(c => c.suit === leadSuit && rp[c.rank] < rp[highestInTrick.rank]);
            
            if (lowerCards.length > 0) {
                // Play highest of the lower cards (staying under but as high as possible)
                return this.getHighestCard(lowerCards, 'Null');
            } else {
                // Must play higher than current highest or no lower cards
                return this.getLowestCard(validMoves, 'Null');
            }
        } else {
            // Can't follow suit: throw away high cards to increase chance declarer wins lead suit
            return this.getHighestCard(validMoves, 'Null');
        }
    }

    chooseLeadCard(validMoves, trumpMode) {
        // Try to play highest non-trump
        const nonTrumps = validMoves.filter(c => !this.isTrump(c, trumpMode));
        if (nonTrumps.length > 0) {
            return this.getHighestCard(nonTrumps, trumpMode);
        }
        // Else play lowest trump to pull trumps
        return this.getLowestCard(validMoves, trumpMode);
    }

    isTrump(card, trumpMode) {
        if (trumpMode === 'Null') return false;
        if (card.rank === 'U') return true;
        if (trumpMode === 'Grand') return false;
        return card.suit === trumpMode;
    }

    getEffectiveSuit(card, trumpMode) {
        if (trumpMode !== 'Null' && card.rank === 'U') return 'Trump';
        return card.suit;
    }

    getLowestCard(cards, trumpMode) {
        const rp = trumpMode === 'Null' ? NULL_RANK_POWER : RANK_POWER;
        return cards.reduce((lowest, current) => {
            if (this.isTrump(lowest, trumpMode) && !this.isTrump(current, trumpMode)) return current; // non-trump lower
            if (!this.isTrump(lowest, trumpMode) && this.isTrump(current, trumpMode)) return lowest; // non-trump lower
            const pLowest = rp[lowest.rank] || 0;
            const pCurrent = rp[current.rank] || 0;
            return pLowest < pCurrent ? lowest : current;
        }, cards[0]);
    }

    getHighestCard(cards, trumpMode) {
        const rp = trumpMode === 'Null' ? NULL_RANK_POWER : RANK_POWER;
        return cards.reduce((highest, current) => {
             // Basic rank comparison
             const powerCurrent = rp[current.rank] || 0;
             const powerHighest = rp[highest.rank] || 0;
             return powerCurrent > powerHighest ? current : highest;
        }, cards[0]);
    }

    getHighestCardLevel(trick, trumpMode) {
        let highest = trick.cards[0].card;
        for (let i = 1; i < trick.cards.length; i++) {
            if (this.beatsCard(trick.cards[i].card, highest, trick.leadSuit, trumpMode)) {
                highest = trick.cards[i].card;
            }
        }
        return highest;
    }

    beatsCard(candidate, currentHighest, leadSuit, trumpMode) {
        const rp = trumpMode === 'Null' ? NULL_RANK_POWER : RANK_POWER;
        if (this.isTrump(candidate, trumpMode) && !this.isTrump(currentHighest, trumpMode)) return true;
        if (this.isTrump(candidate, trumpMode) && this.isTrump(currentHighest, trumpMode)) {
            // Both trumps.
            if (candidate.rank === 'U' && currentHighest.rank === 'U') {
                const order = [SUITS.SCHELLEN, SUITS.ROT, SUITS.GRUEN, SUITS.EICHEL];
                return order.indexOf(candidate.suit) > order.indexOf(currentHighest.suit);
            }
            if (candidate.rank === 'U') return true;
            if (currentHighest.rank === 'U') return false;
            
            return rp[candidate.rank] > rp[currentHighest.rank];
        }
        // Neither is trump
        if (this.getEffectiveSuit(candidate, trumpMode) === leadSuit && this.getEffectiveSuit(currentHighest, trumpMode) !== leadSuit) return true;
        if (this.getEffectiveSuit(candidate, trumpMode) === leadSuit && this.getEffectiveSuit(currentHighest, trumpMode) === leadSuit) {
            return rp[candidate.rank] > rp[currentHighest.rank];
        }
        return false;
    }
}
