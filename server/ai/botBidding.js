/**
 * Skat Bot Bidding Logic - Server Version
 * 
 * Beinhaltet die Heuristiken und Entscheidungsregeln für die Bots während der Reizphase.
 * Unabhängig von UI oder Game-Loop.
 * 
 * ANGEPASST FÜR NODE.JS
 */

class BotBidding {
    constructor() {
        this.suitBaseValues = {
            'Eichel': 12,
            'Grün': 11,
            'Rot': 10,
            'Schellen': 9
        };
    }

    /**
     * Hauptmethode: Analysiert die Hand und gibt Bidding-Daten zurück
     */
    evaluateHand(hand) {
        const regularData = this.evaluateSuitHand(hand);
        const nullData = this.evaluateNullHand(hand);
        const grandData = this.evaluateGrandHand(hand);
        
        let best = regularData;

        if (grandData.willBid) {
            if (!best.willBid || grandData.maxBid > best.maxBid || (grandData.strengthScore >= 8 && best.strengthScore < 8)) {
                best = grandData;
            }
        }

        if (nullData.willBid) {
            if (!best.willBid || (best.maxBid <= 23 && best.strengthScore < 7)) {
                best = nullData;
            }
        }

        return best;
    }

    /**
     * Grand Hand Evaluation
     */
    evaluateGrandHand(hand) {
        let jacks = 0;
        let highCards = 0;
        
        hand.forEach(card => {
            if (card.rank === 'U') jacks++;
            else if (card.rank === 'A' || card.rank === '10') highCards++;
        });

        let prob = 0;
        if (jacks <= 1) {
            prob = 0;
        } else if (jacks === 2) {
            if (highCards >= 3) prob = 0.10;
            if (highCards >= 5) prob = 0.30;
        } else if (jacks === 3) {
            prob = 0.20;
            if (highCards >= 2) prob += 0.25;
            if (highCards >= 4) prob += 0.20;
        } else if (jacks === 4) {
            prob = 0.70;
            if (highCards >= 2) prob = 0.90;
        }

        const willBid = Math.random() < prob;
        const matadors = this.countMatadors(hand, 'Grand');
        const maxBidNormal = 24 * (matadors + 1);
        const maxBidHand = 24 * (matadors + 2);

        return {
            willBid: willBid,
            trumpSuit: 'Grand',
            maxBid: maxBidNormal,
            maxBidHand: maxBidHand,
            strengthScore: jacks + (highCards * 0.6),
            type: 'grand'
        };
    }

    /**
     * Suit Hand Evaluation
     */
    evaluateSuitHand(hand) {
        let numberOfJacks = 0;
        let suitCounts = {
            'Eichel': 0,
            'Grün': 0,
            'Rot': 0,
            'Schellen': 0
        };
        let extraAces = 0;

        hand.forEach(card => {
            if (card.rank === 'U') {
                numberOfJacks++;
            } else {
                if (suitCounts[card.suit] !== undefined) {
                    suitCounts[card.suit]++;
                }
            }
        });

        let bestSuit = null;
        let maxCardsInSuit = -1;

        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count > maxCardsInSuit) {
                maxCardsInSuit = count;
                bestSuit = suit;
            }
        }

        hand.forEach(card => {
            if (card.rank === 'A' && card.suit !== bestSuit && card.rank !== 'U') {
                extraAces++;
            }
        });

        const strengthScore = numberOfJacks + maxCardsInSuit + extraAces;

        let bidProbability = 0;
        if (strengthScore <= 4) bidProbability = 0.0;
        else if (strengthScore === 5) bidProbability = 0.20;
        else if (strengthScore === 6) bidProbability = 0.55;
        else if (strengthScore === 7) bidProbability = 0.90;
        else if (strengthScore >= 8) bidProbability = 1.00;

        let willBid = false;
        if (strengthScore >= 5) {
            willBid = Math.random() < bidProbability;
        }

        let maxBidNormal = 0;
        let maxBidHand = 0;
        const baseValue = this.suitBaseValues[bestSuit];
        const matadors = this.countMatadors(hand, bestSuit);
        
        maxBidNormal = baseValue * (matadors + 1);
        maxBidHand = baseValue * (matadors + 2);

        return {
            willBid: willBid,
            trumpSuit: bestSuit,
            maxBid: maxBidNormal,
            maxBidHand: maxBidHand,
            strengthScore: strengthScore,
            type: 'suit'
        };
    }

    /**
     * Null Hand Evaluation
     */
    evaluateNullHand(hand) {
        const luschenRanks = ['7', '8', '9'];
        const highRanks = ['A', '10', 'K'];
        
        let luschenCount = 0;
        let dangerousHighCards = 0;
        
        const suitGroups = {
            'Eichel': [],
            'Grün': [],
            'Rot': [],
            'Schellen': []
        };
        
        hand.forEach(card => {
            if (luschenRanks.includes(card.rank)) {
                luschenCount++;
            }
            suitGroups[card.suit].push(card);
        });
        
        for (const suit in suitGroups) {
            const group = suitGroups[suit];
            if (group.length > 0 && group.length <= 2) {
                const hasHigh = group.some(c => highRanks.includes(c.rank));
                if (hasHigh) dangerousHighCards++;
            }
        }
        
        let prob = 0;
        if (luschenCount <= 4) prob = 0;
        else if (luschenCount === 5) prob = 0.15;
        else if (luschenCount === 6) prob = 0.40;
        else if (luschenCount === 7) prob = 0.70;
        else if (luschenCount >= 8) prob = 0.90;
        
        prob = Math.max(0, prob - (dangerousHighCards * 0.25));
        
        const willBid = Math.random() < prob;
        
        return {
            willBid: willBid,
            trumpSuit: 'Null',
            maxBid: 23,
            maxBidHand: 35,
            strengthScore: luschenCount,
            type: 'null'
        };
    }

    /**
     * Entscheidet, ob der Bot bei einem aktuellen Reizwert weiter mitgeht oder passt
     */
    decideBid(currentBid, botData) {
        if (!botData.willBid) return false;

        if (currentBid <= botData.maxBid) return true;

        if (botData.strengthScore >= 7.5 && currentBid <= botData.maxBidHand) {
            return true;
        }

        return false;
    }

    /**
     * Zählt die Matadore für Bieterung
     */
    countMatadors(hand, trumpMode) {
        const jacks = hand.filter(c => c.rank === 'U');
        const hasJack = (suit) => jacks.some(j => j.suit === suit);
        
        const order = ['Eichel', 'Grün', 'Rot', 'Schellen'];
        let count = 0;
        const withJacks = hasJack(order[0]);

        if (withJacks) {
            for (let i = 0; i < order.length; i++) {
                if (hasJack(order[i])) count++;
                else break;
            }
        } else {
            for (let i = 0; i < order.length; i++) {
                if (!hasJack(order[i])) count++;
                else break;
            }
        }
        return count;
    }
}

module.exports = BotBidding;
