/**
 * AIController - Server Version
 * 
 * Adapted for server-side play (no UI dependencies)
 * Bots use this to decide which card to play.
 */

// Card value constants (same as frontend)
const CARD_VALUES = {
    '7': 0, '8': 0, '9': 0,
    'K': 4, 'O': 3, 'U': 2, '10': 10, 'A': 11
};

const RANK_POWER = {
    '7': 1, '8': 2, '9': 3, 'O': 4, 'K': 5, '10': 6, 'A': 7
};

const NULL_RANK_POWER = {
    '7': 1, '8': 2, '9': 3, '10': 4, 'U': 5, 'O': 6, 'K': 7, 'A': 8
};

const SUITS = {
    EICHEL: 'Eichel',
    GRUEN: 'Grün',
    ROT: 'Rot',
    SCHELLEN: 'Schellen'
};

class AIController {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    /**
     * Wählt eine Karte aus der Liste der gültigen Züge
     */
    chooseCard(validMoves, currentTrick, trumpMode, declarerIndex, isRamsch = false, isOuvert = false, declarerHand = null) {
        if (validMoves.length === 1) return validMoves[0];

        const isDeclarer = (this.id === declarerIndex);

        // Perfect Information Mode if Ouvert
        if (isOuvert && declarerHand) {
            if (trumpMode === 'Null') {
                if (isDeclarer) {
                    return this.getLowestCard(validMoves, 'Null');
                } else {
                    return this.chooseNullDefensePerfectInfo(validMoves, currentTrick, declarerHand);
                }
            } else {
                // Suit or Grand Ouvert
                if (isDeclarer) {
                    return this.getHighestCard(validMoves, trumpMode);
                } else {
                    return this.chooseSuitDefensePerfectInfo(validMoves, currentTrick, declarerHand, trumpMode);
                }
            }
        }

        // Null game strategy
        if (trumpMode === 'Null') {
            if (isDeclarer) {
                return this.getLowestCard(validMoves, 'Null');
            } else {
                return this.chooseNullDefenseCard(validMoves, currentTrick);
            }
        }

        // Ramsch strategy
        if (isRamsch) {
            return this.chooseRamschCard(validMoves, currentTrick, trumpMode);
        }

        // Basic Heuristic:
        if (currentTrick.cards.length === 0) {
            return this.chooseLeadCard(validMoves, trumpMode);
        }

        const highestSoFar = this.getHighestCardLevel(currentTrick, trumpMode);
        const winningCards = validMoves.filter(card => this.beatsCard(card, highestSoFar, currentTrick.leadSuit, trumpMode));
        
        // Enhanced Tactical Logic for Defenders
        if (!isDeclarer && trumpMode !== 'Null') {
            const currentWinnerId = this.determineCurrentWinner(currentTrick, trumpMode);
            const partnerId = this.getPartnerId(this.id, declarerIndex);
            
            // Case A: Partner has already won
            if (currentWinnerId === partnerId && currentTrick.cards.length === 2) {
                return this.getHighestPointCard(validMoves);
            }
            
            // Case B: Declarer has won and we can't beat it
            if (currentWinnerId === declarerIndex && winningCards.length === 0) {
                return this.getLowestPointCard(validMoves);
            }

            // Case C: Tactical Trumping
            const isFollowingSuit = validMoves.every(c => this.getEffectiveSuit(c, trumpMode) === currentTrick.leadSuit);
            if (!isFollowingSuit && winningCards.length > 0) {
                const trumpAcesAndTens = winningCards.filter(c => (c.rank === 'A' || c.rank === '10') && this.isTrump(c, trumpMode));
                if (trumpAcesAndTens.length > 0) {
                    return this.getHighestPointCard(trumpAcesAndTens);
                }
            }
        }

        if (winningCards.length > 0) {
            if (isDeclarer && currentTrick.cards.length > 0) {
                const nonUnterWinning = winningCards.filter(c => c.rank !== 'U');
                if (nonUnterWinning.length > 0) {
                    return this.getLowestCard(nonUnterWinning, trumpMode);
                }
            }
            return this.getLowestCard(winningCards, trumpMode);
        } else {
            return this.getLowestCard(validMoves, trumpMode);
        }
    }

    /**
     * Null Defense mit Perfect Information
     */
    chooseNullDefensePerfectInfo(validMoves, currentTrick, declarerHand) {
        const leadSuit = currentTrick.leadSuit || this.getEffectiveSuit(validMoves[0], 'Null');
        
        if (currentTrick.cards.length === 0) {
            return this.getLowestCard(validMoves, 'Null');
        }

        const declarerCard = declarerHand.find(c => c.suit === leadSuit);
        if (declarerCard) {
            const declarerLowestInSuit = declarerHand
                .filter(c => c.suit === leadSuit)
                .reduce((min, cur) => NULL_RANK_POWER[cur.rank] < NULL_RANK_POWER[min.rank] ? cur : min, { rank: 'A' });
            
            const myLowerCards = validMoves.filter(c => c.suit === leadSuit && NULL_RANK_POWER[c.rank] < NULL_RANK_POWER[declarerLowestInSuit.rank]);
            if (myLowerCards.length > 0) {
                return this.getHighestCard(myLowerCards, 'Null');
            }
        }

        return this.chooseNullDefenseCard(validMoves, currentTrick);
    }

    /**
     * Suit Defense mit Perfect Information
     */
    chooseSuitDefensePerfectInfo(validMoves, currentTrick, declarerHand, trumpMode) {
        return this.chooseCard(validMoves, currentTrick, trumpMode, -1);
    }

    /**
     * Ramsch-Kartenwahl
     */
    chooseRamschCard(validMoves, currentTrick, trumpMode) {
        if (currentTrick.cards.length === 0) {
            return this.getLowestCard(validMoves, trumpMode);
        }

        const leadSuit = currentTrick.leadSuit;
        const canFollow = validMoves.some(c => this.getEffectiveSuit(c, trumpMode) === leadSuit);
        
        if (canFollow) {
            const highestInTrick = this.getHighestCardLevel(currentTrick, trumpMode);
            const lowerCards = validMoves.filter(c => 
                this.getEffectiveSuit(c, trumpMode) === leadSuit && 
                !this.beatsCard(c, highestInTrick, leadSuit, trumpMode)
            );
            
            if (lowerCards.length > 0) {
                return this.getHighestCard(lowerCards, trumpMode);
            } else {
                return this.getLowestCard(validMoves, trumpMode);
            }
        } else {
            return this.getHighestPointCard(validMoves);
        }
    }

    /**
     * Null Defense
     */
    chooseNullDefenseCard(validMoves, currentTrick) {
        if (currentTrick.cards.length === 0) {
            return this.getLowestCard(validMoves, 'Null');
        }

        const rp = NULL_RANK_POWER;
        const leadSuit = currentTrick.leadSuit;
        
        const canFollow = validMoves.some(c => c.suit === leadSuit);
        
        if (canFollow) {
            const highestInTrick = this.getHighestCardLevel(currentTrick, 'Null');
            const lowerCards = validMoves.filter(c => c.suit === leadSuit && rp[c.rank] < rp[highestInTrick.rank]);
            
            if (lowerCards.length > 0) {
                return this.getHighestCard(lowerCards, 'Null');
            } else {
                return this.getLowestCard(validMoves, 'Null');
            }
        } else {
            return this.getHighestCard(validMoves, 'Null');
        }
    }

    /**
     * Lead Card-Auswahl
     */
    chooseLeadCard(validMoves, trumpMode) {
        let nonTrumps = validMoves.filter(c => !this.isTrump(c, trumpMode));
        
        if (nonTrumps.length > 0) {
            const safeLeads = nonTrumps.filter(c => {
                if (c.rank === '10') {
                    return nonTrumps.some(ace => ace.suit === c.suit && ace.rank === 'A');
                }
                return true;
            });

            if (safeLeads.length > 0) {
                return this.getHighestCard(safeLeads, trumpMode);
            }
            
            const smallCards = nonTrumps.filter(c => c.rank !== '10' && c.rank !== 'A');
            if (smallCards.length > 0) {
                return this.getHighestCard(smallCards, trumpMode);
            }

            return this.getHighestCard(nonTrumps, trumpMode);
        }
        return this.getLowestCard(validMoves, trumpMode);
    }

    /**
     * ========================================================================
     * HILFSFUNKTIONEN
     * ========================================================================
     */

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
                return RANK_POWER[current.rank] < RANK_POWER[lowest.rank] ? current : lowest;
            }
            return lowest;
        }, cards[0]);
    }

    getHighestPointCard(cards) {
        return cards.reduce((highest, current) => {
            const pCurrent = CARD_VALUES[current.rank] || 0;
            const pHighest = CARD_VALUES[highest.rank] || 0;
            if (pCurrent > pHighest) return current;
            if (pCurrent === pHighest) {
                return RANK_POWER[current.rank] > RANK_POWER[highest.rank] ? current : highest;
            }
            return highest;
        }, cards[0]);
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
            if (this.isTrump(lowest, trumpMode) && !this.isTrump(current, trumpMode)) return current;
            if (!this.isTrump(lowest, trumpMode) && this.isTrump(current, trumpMode)) return lowest;
            const pLowest = rp[lowest.rank] || 0;
            const pCurrent = rp[current.rank] || 0;
            return pLowest < pCurrent ? lowest : current;
        }, cards[0]);
    }

    getHighestCard(cards, trumpMode) {
        const rp = trumpMode === 'Null' ? NULL_RANK_POWER : RANK_POWER;
        return cards.reduce((highest, current) => {
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
            if (candidate.rank === 'U' && currentHighest.rank === 'U') {
                const order = [SUITS.SCHELLEN, SUITS.ROT, SUITS.GRUEN, SUITS.EICHEL];
                return order.indexOf(candidate.suit) > order.indexOf(currentHighest.suit);
            }
            if (candidate.rank === 'U') return true;
            if (currentHighest.rank === 'U') return false;
            return rp[candidate.rank] > rp[currentHighest.rank];
        }
        if (this.getEffectiveSuit(candidate, trumpMode) === leadSuit && this.getEffectiveSuit(currentHighest, trumpMode) !== leadSuit) return true;
        if (this.getEffectiveSuit(candidate, trumpMode) === leadSuit && this.getEffectiveSuit(currentHighest, trumpMode) === leadSuit) {
            return rp[candidate.rank] > rp[currentHighest.rank];
        }
        return false;
    }
}

export default AIController;
