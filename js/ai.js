/**
 * Skat Simple AI Controller
 */

class AIController {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    // Returns a Card object to play
    chooseCard(validMoves, currentTrick, trumpMode) {
        if (validMoves.length === 1) return validMoves[0];

        // Basic Heuristic:
        // 1. If leading, play non-trump high card or small trump.
        if (currentTrick.cards.length === 0) {
            return this.chooseLeadCard(validMoves, trumpMode);
        }

        // 2. If following, try to win if last player, or play lowest if can't win
        const highestSoFar = this.getHighestCardLevel(currentTrick, trumpMode);
        
        // Filter winning cards
        const winningCards = validMoves.filter(card => this.beatsCard(card, highestSoFar, currentTrick.leadSuit, trumpMode));
        
        if (winningCards.length > 0) {
            // Play lowest winning card to conserve high cards
            return this.getLowestCard(winningCards, trumpMode);
        } else {
            // Can't win (or don't want to waste high card), play absolute lowest
            return this.getLowestCard(validMoves, trumpMode);
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
