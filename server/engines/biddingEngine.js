/**
 * Skat Bidding Engine (Reiz-Engine)
 * 
 * Diese Datei beinhaltet ausschließlich die Logik für die offiziellen
 * Skat-Reizwerte und zugehörige Hilfsfunktionen. Keine UI-Abhängigkeiten.
 */

class BiddingEngine {
    constructor() {
        // Offizielle Skat-Reizwerte in aufsteigender Reihenfolge
        this.validBids = [
            18, 20, 22, 23, 24, 27, 30, 33, 35, 36, 40, 44, 45, 46, 48, 50, 54,
            55, 59, 60, 63, 66, 70, 72, 77, 80, 81, 84, 88, 90, 96,
            99, 100, 108, 110, 117, 120, 121, 126, 130, 132, 135,
            140, 143, 144, 150, 153, 154, 156, 160, 162, 165,
            168, 170, 171, 176, 180, 187, 192, 198, 204, 216,
            220, 231, 240, 264
        ];
    }

    /**
     * Gibt die komplette Liste aller gültigen Reizwerte zurück.
     * @returns {number[]} Array mit allen gültigen Reizwerten
     */
    getAllBids() {
        return [...this.validBids];
    }

    /**
     * Prüft, ob ein gegebener Wert ein offizieller Reizwert ist.
     * @param {number} value - Der zu prüfende Wert
     * @returns {boolean} True, wenn der Wert gültig ist, sonst False
     */
    isValidBid(value) {
        return this.validBids.includes(value);
    }

    /**
     * Ermittelt den nächsthöheren gültigen Reizwert ausgehend vom aktuellen Wert.
     * @param {number} currentBid - Der aktuelle Reizwert (muss nicht zwingend ein gültiger Wert sein, z.B. 0 beim Start)
     * @returns {number|null} Der nächste Reizwert oder null, wenn es keinen höheren mehr gibt
     */
    getNextBid(currentBid) {
        for (let bid of this.validBids) {
            if (bid > currentBid) {
                return bid;
            }
        }
        return null; // Kein höheres Gebot möglich
    }

    /**
     * Prüft, ob Gebot A höher ist als Gebot B.
     * @param {number} bidA - Das erste Gebot
     * @param {number} bidB - Das zweite Gebot (Referenz)
     * @returns {boolean} True, wenn bidA höher ist als bidB
     */
    isHigherBid(bidA, bidB) {
        return bidA > bidB;
    }
}

module.exports = BiddingEngine;
