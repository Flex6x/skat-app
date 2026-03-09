/**
 * Skat Game Value Engine (Spielwertberechnung)
 * 
 * Berechnet den tatsächlichen Spielwert, Spitzen (Matadore),
 * Multiplikator, und prüft auf Überreizung.
 */

class GameValueEngine {

    /**
     * Grundwerte für Farbspiele und Grand
     */
    static BASE_VALUES = {
        'Eichel': 12,
        'Grün': 11,
        'Rot': 10,
        'Schellen': 9,
        'Grand': 24
    };

    /**
     * Feste Spielwerte für Null-Spiele
     */
    static NULL_VALUES = {
        normal: 23,
        hand: 35,
        ouvert: 46,
        ouvertHand: 59
    };

    /**
     * Unter-Reihenfolge für Spitzenberechnung (höchster zuerst)
     */
    static UNTER_ORDER = ['Eichel', 'Grün', 'Rot', 'Schellen'];

    /**
     * Berechnet die Spitzen (Matadore) des Alleinspielers.
     * 
     * Zählt wie viele Unter der Alleinspieler in ununterbrochener Folge
     * besitzt ("mit X") oder nicht besitzt ("ohne X"), beginnend beim
     * Eichel-Unter.
     * 
     * @param {Card[]} declarerCards - Alle Karten des Alleinspielers (Hand + Skat)
     * @returns {{ count: number, type: string }} Anzahl und Typ ("mit"/"ohne")
     */
    static calculateMatadors(declarerCards) {
        const declarerUnterSuits = declarerCards
            .filter(c => c.rank === 'U')
            .map(c => c.suit);

        const hasEichelUnter = declarerUnterSuits.includes('Eichel');

        let count = 0;

        if (hasEichelUnter) {
            // "Mit X" — zähle durchgehende Unter von oben
            for (const suit of this.UNTER_ORDER) {
                if (declarerUnterSuits.includes(suit)) {
                    count++;
                } else {
                    break;
                }
            }
            return { count, type: 'mit' };
        } else {
            // "Ohne X" — zähle fehlende Unter von oben bis zum ersten vorhandenen
            for (const suit of this.UNTER_ORDER) {
                if (!declarerUnterSuits.includes(suit)) {
                    count++;
                } else {
                    break;
                }
            }
            return { count, type: 'ohne' };
        }
    }

    /**
     * Berechnet den Multiplikator.
     * 
     * multiplier = matadors + 1 (Spiel) + handGame + schneider + schwarz
     * 
     * @param {{ matadors: number, handGame: boolean, schneider: boolean, schwarz: boolean }} params
     * @returns {number} Der Gesamtmultiplikator
     */
    static calculateMultiplier({ matadors, handGame, schneider, schwarz }) {
        let multiplier = matadors + 1; // Spitze(n) + Spiel

        if (handGame) multiplier += 1;
        if (schneider) multiplier += 1;
        if (schwarz) multiplier += 1;

        return multiplier;
    }

    /**
     * Berechnet den Spielwert für Farbspiele und Grand.
     * 
     * @param {string} trumpMode - Spielart ("Eichel", "Grün", "Rot", "Schellen", "Grand")
     * @param {number} multiplier - Der berechnete Multiplikator
     * @returns {number} Der Spielwert
     */
    static calculateGameValue(trumpMode, multiplier) {
        const baseValue = this.BASE_VALUES[trumpMode];
        if (!baseValue) return 0;
        return baseValue * multiplier;
    }

    /**
     * Gibt den festen Spielwert für ein Null-Spiel zurück.
     * 
     * @param {boolean} handGame - Ob Hand gespielt wurde
     * @returns {number} Der Null-Spielwert
     */
    static getNullGameValue(handGame) {
        return handGame ? this.NULL_VALUES.hand : this.NULL_VALUES.normal;
    }

    /**
     * Prüft, ob überreizt wurde.
     * 
     * @param {number} bidValue - Der Reizwert
     * @param {number} gameValue - Der tatsächliche Spielwert
     * @returns {boolean} True wenn überreizt
     */
    static checkOverbid(bidValue, gameValue) {
        return gameValue < bidValue;
    }

    /**
     * Hauptfunktion: Wertet das Spielende komplett aus.
     * 
     * @param {{
     *   trumpMode: string,
     *   declarerCards: Card[],
     *   skat: Card[],
     *   bidValue: number,
     *   handGame: boolean,
     *   declarerPoints: number,
     *   defenderPoints: number,
     *   defenderTrickCount: number
     * }} params
     * @returns {{
     *   gameValue: number,
     *   matadors: { count: number, type: string },
     *   multiplier: number,
     *   schneider: boolean,
     *   schwarz: boolean,
     *   overbid: boolean,
     *   won: boolean,
     *   details: string
     * }}
     */
    static evaluateEndGame({
        trumpMode,
        declarerCards,
        skat,
        bidValue,
        handGame,
        declarerPoints,
        defenderPoints,
        defenderTrickCount,
        declarerWonNormally
    }) {

        // --- Null-Spiel Sonderbehandlung ---
        if (trumpMode === 'Null') {
            const gameValue = this.getNullGameValue(handGame);
            const overbid = this.checkOverbid(bidValue, gameValue);
            // Bei Null: won wird extern (wonOverride) bestimmt. Überreizen übersteuert immer.
            const won = overbid ? false : declarerWonNormally;

            const details = handGame ? 'Null Hand' : 'Null';

            return {
                gameValue,
                matadors: { count: 0, type: '-' },
                multiplier: 0,
                schneider: false,
                schwarz: false,
                overbid,
                won,
                details: `${details} = ${gameValue}`
            };
        }

        // --- Farbspiel / Grand ---
        const allDeclarerCards = [...declarerCards, ...skat];
        const matadors = this.calculateMatadors(allDeclarerCards);

        const schneider = defenderPoints <= 30;
        const schwarz = defenderTrickCount === 0;

        const multiplier = this.calculateMultiplier({
            matadors: matadors.count,
            handGame,
            schneider,
            schwarz
        });

        const gameValue = this.calculateGameValue(trumpMode, multiplier);
        const overbid = this.checkOverbid(bidValue, gameValue);

        // Überreizen → automatisch verloren, auch wenn >60 Augen
        const won = overbid ? false : declarerWonNormally;

        // Details-String für die Anzeige
        const parts = [`${matadors.type} ${matadors.count}`];
        parts.push('Spiel');
        if (handGame) parts.push('Hand');
        if (schneider) parts.push('Schneider');
        if (schwarz) parts.push('Schwarz');

        const baseValue = this.BASE_VALUES[trumpMode];
        const details = `${parts.join(', ')} = ${multiplier} × ${baseValue} = ${gameValue}`;

        return {
            gameValue,
            matadors,
            multiplier,
            schneider,
            schwarz,
            overbid,
            won,
            details
        };
    }
}
