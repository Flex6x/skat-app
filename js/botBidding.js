/**
 * Skat Bot Bidding Logic
 * 
 * Beinhaltet die Heuristiken und Entscheidungsregeln für die Bots während der Reizphase.
 * Unabhängig von UI oder Game-Loop.
 */

class BotBidding {
    constructor() {
        // Skat-Grundwerte für Farbspiele
        this.suitBaseValues = {
            'Eichel': 12, // Kreuz
            'Grün': 11,   // Pik
            'Rot': 10,    // Herz
            'Schellen': 9 // Karo
        };
    }

    /**
     * Analysiert die Hand und entscheidet, ob ein Farbspiel möglich ist
     * und bis zu welchem Wert (maxBid) der Bot reizen würde.
     * 
     * @param {Array} hand Array von Card-Objekten ({suit: '...', rank: '...', ...})
     * @returns {Object} Analyse-Ergebnis mit { willBid, trumpSuit, maxBid, strengthScore }
     */
    evaluateHand(hand) {
        // Evaluate all three options
        const regularData = this.evaluateSuitHand(hand);
        const nullData = this.evaluateNullHand(hand);
        const grandData = this.evaluateGrandHand(hand);
        
        let best = regularData;

        // Compare Grand vs Suit
        if (grandData.willBid) {
            if (!best.willBid || grandData.maxBid > best.maxBid || (grandData.strengthScore >= 8 && best.strengthScore < 8)) {
                best = grandData;
            }
        }

        // Compare with Null (Null is fixed at 23, so only pick if other options are weak or not bidding)
        if (nullData.willBid) {
            if (!best.willBid || (best.maxBid <= 23 && best.strengthScore < 7)) {
                best = nullData;
            }
        }

        return best;
    }

    evaluateGrandHand(hand) {
        let jacks = 0;
        let highCards = 0; // Aces and 10s
        
        hand.forEach(card => {
            if (card.rank === 'U') jacks++;
            else if (card.rank === 'A' || card.rank === '10') highCards++;
        });

        // Tighter Probability model
        let prob = 0;
        if (jacks <= 1) {
            prob = 0;
        } else if (jacks === 2) {
            // Very cautious with only 2 jacks
            if (highCards >= 3) prob = 0.15;
            if (highCards >= 5) prob = 0.40;
        } else if (jacks === 3) {
            // 3 Jacks is better, but still needs backup
            prob = 0.30;
            if (highCards >= 2) prob += 0.30;
            if (highCards >= 4) prob += 0.20;
        } else if (jacks === 4) {
            // 4 Jacks is usually a go, but not 100% without points
            prob = 0.80;
            if (highCards >= 2) prob = 0.95;
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
            strengthScore: jacks + (highCards * 0.6), // Slightly higher weight for high cards in Grand
            type: 'grand'
        };
    }

    countMatadors(hand, trumpMode) {
        // Simplified matador count for bidding
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

    evaluateSuitHand(hand) {
        let numberOfJacks = 0;
        let suitCounts = {
            'Eichel': 0,
            'Grün': 0,
            'Rot': 0,
            'Schellen': 0
        };
        let extraAces = 0;

        // 1. Zähle Unter (Jacks) und die Karten pro Farbe (ohne Unter)
        hand.forEach(card => {
            if (card.rank === 'U') {
                numberOfJacks++;
            } else {
                if (suitCounts[card.suit] !== undefined) {
                    suitCounts[card.suit]++;
                }
            }
        });

        // 2. Finde die stärkste Farbe (die mit den meisten Karten)
        let bestSuit = null;
        let maxCardsInSuit = -1;

        for (const [suit, count] of Object.entries(suitCounts)) {
            if (count > maxCardsInSuit) {
                maxCardsInSuit = count;
                bestSuit = suit;
            }
        }

        // 3. Zähle zusätzliche Asse
        hand.forEach(card => {
            if (card.rank === 'A' && card.suit !== bestSuit && card.rank !== 'U') {
                extraAces++;
            }
        });

        // 4. Berechne Strength Score
        const strengthScore = numberOfJacks + maxCardsInSuit + extraAces;

        // 5. Bestimme Wahrscheinlichkeit zum Reizen
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
        
        // Multiplier = Matadors + 1 (Spiel)
        maxBidNormal = baseValue * (matadors + 1);
        // Hand Multiplier = Matadors + 1 (Spiel) + 1 (Hand)
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
        
        // Check for dangerous cards (high cards in short suits)
        for (const suit in suitGroups) {
            const group = suitGroups[suit];
            if (group.length > 0 && group.length <= 2) {
                const hasHigh = group.some(c => highRanks.includes(c.rank));
                if (hasHigh) dangerousHighCards++;
            }
        }
        
        // Probability based on luschenCount and dangerous cards
        let prob = 0;
        if (luschenCount <= 4) prob = 0;
        else if (luschenCount === 5) prob = 0.15;
        else if (luschenCount === 6) prob = 0.40;
        else if (luschenCount === 7) prob = 0.70;
        else if (luschenCount >= 8) prob = 0.90;
        
        // Decrease probability for each dangerous card
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
     * Entscheidet, ob der Bot bei einem aktuellen Reizwert weiter mitgeht oder passt.
     */
    decideBid(currentBid, botData) {
        if (!botData.willBid) return false;

        // Normal check
        if (currentBid <= botData.maxBid) return true;

        // Hand upgrade check: If hand is very strong (strengthScore >= 7.5),
        // we might upgrade to Hand game if the bid requires it.
        if (botData.strengthScore >= 7.5 && currentBid <= botData.maxBidHand) {
            return true;
        }

        return false;
    }
}

// ==========================================
// TEST-BEISPIELE
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BotBidding };
}

// Kleine Test-Ausführung
if (typeof require !== 'undefined' && require.main === module) {
    console.log("--- Bot Bidding Logic Tests ---");
    const botBidding = new BotBidding();

    // Mock Hand 1: 2 Unter, 4 Eichel, kein extra Ass (Score = 2 + 4 + 0 = 6) -> 55% Chance, Eichel(12) * (2+1)=3 = 36 maxBid
    const hand1 = [
        { suit: 'Eichel', rank: 'U' },
        { suit: 'Grün', rank: 'U' },
        { suit: 'Eichel', rank: '10' },
        { suit: 'Eichel', rank: 'K' },
        { suit: 'Eichel', rank: '9' },
        { suit: 'Eichel', rank: '8' },
        { suit: 'Rot', rank: '7' },
        { suit: 'Schellen', rank: '9' },
        { suit: 'Schellen', rank: '10' },
        { suit: 'Rot', rank: 'K' }
    ];

    // Wir setzen random temporär auf 0.5 für deterministische Tests (55% Chance -> 0.5 < 0.55 -> willBid = true)
    const originalRandom = Math.random;
    Math.random = () => 0.5;

    const eval1 = botBidding.evaluateHand(hand1);
    console.log("Evaluierung Hand 1:", eval1);
    // Erwartet: { willBid: true, trumpSuit: 'Eichel', maxBid: 36, strengthScore: 6 }

    console.log("Bot hält 18?", botBidding.decideBid(18, eval1)); // Erwartet: true
    console.log("Bot hält 36?", botBidding.decideBid(36, eval1)); // Erwartet: true
    console.log("Bot hält 40?", botBidding.decideBid(40, eval1)); // Erwartet: false

    Math.random = originalRandom; // Reset

    // Mock Hand 2: Schwache Hand (Score = 0 Unter, 3 Rot, 0 Extra Asse = 3) -> willBid: false
    const hand2 = [
        { suit: 'Rot', rank: '10' },
        { suit: 'Rot', rank: '9' },
        { suit: 'Rot', rank: '7' },
        { suit: 'Grün', rank: 'K' },
        { suit: 'Grün', rank: '9' },
        { suit: 'Schellen', rank: '10' },
        { suit: 'Schellen', rank: '8' },
        { suit: 'Eichel', rank: '8' },
        { suit: 'Eichel', rank: '9' },
        { suit: 'Eichel', rank: '7' }
    ];
    const eval2 = botBidding.evaluateHand(hand2);
    console.log("\nEvaluierung Hand 2:", eval2);
    // Erwartet: { willBid: false, trumpSuit: 'Eichel'/'Rot' (equal max), maxBid: 0, strengthScore: 3 }
    console.log("Bot hält 18?", botBidding.decideBid(18, eval2)); // Erwartet: false
}