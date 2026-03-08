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

// ==========================================
// TEST-BEISPIELE
// Zur Veranschaulichung der reinen Logik
// ==========================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BiddingEngine; // Falls später für Node-Tests benötigt
}

// Kleine Test-Ausgaben in der Konsole
const engine = new BiddingEngine();

console.log("--- Bidding Engine Tests ---");

// Test 1: isValidBid
console.log("Ist 18 ein gültiger Reizwert?", engine.isValidBid(18) ? "✅ Ja" : "❌ Nein"); // Erwartet: Ja
console.log("Ist 19 ein gültiger Reizwert?", engine.isValidBid(19) ? "✅ Ja" : "❌ Nein"); // Erwartet: Nein
console.log("Ist 59 ein gültiger Reizwert?", engine.isValidBid(59) ? "✅ Ja" : "❌ Nein"); // Erwartet: Ja

// Test 2: getNextBid
console.log("Nächster Reizwert nach 0 (Start):", engine.getNextBid(0));   // Erwartet: 18
console.log("Nächster Reizwert nach 18:", engine.getNextBid(18)); // Erwartet: 20
console.log("Nächster Reizwert nach 24:", engine.getNextBid(24)); // Erwartet: 27
console.log("Nächster Reizwert nach 264:", engine.getNextBid(264)); // Erwartet: null

// Test 3: isHigherBid
console.log("Ist 22 höher als 20?", engine.isHigherBid(22, 20) ? "✅ Ja" : "❌ Nein"); // Erwartet: Ja
console.log("Ist 18 höher als 18?", engine.isHigherBid(18, 18) ? "✅ Ja" : "❌ Nein"); // Erwartet: Nein

// Test 4: getAllBids
const all = engine.getAllBids();
console.log(`Es gibt insgesamt ${all.length} gültige Reizwerte. Erster: ${all[0]}, Letzter: ${all[all.length - 1]}`);
