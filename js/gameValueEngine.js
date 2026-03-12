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
     */
    static calculateMatadors(declarerCards) {
        const declarerUnterSuits = declarerCards
            .filter(c => c.rank === 'U')
            .map(c => c.suit);

        const hasEichelUnter = declarerUnterSuits.includes('Eichel');

        let count = 0;

        if (hasEichelUnter) {
            for (const suit of this.UNTER_ORDER) {
                if (declarerUnterSuits.includes(suit)) count++;
                else break;
            }
            return { count, type: 'mit' };
        } else {
            for (const suit of this.UNTER_ORDER) {
                if (!declarerUnterSuits.includes(suit)) count++;
                else break;
            }
            return { count, type: 'ohne' };
        }
    }

    /**
     * Berechnet den Multiplikator.
     * Bonusstufen bei Hand: Hand(1), Schneider(1), Schneider angesagt(1), Schwarz(1), Schwarz angesagt(1)
     */
    static calculateMultiplier({ matadors, handGame, schneider, schwarz, announcedSchneider, announcedSchwarz }) {
        let multiplier = matadors + 1; // Spitze(n) + Spiel

        if (handGame) {
            multiplier += 1; // +1 Hand
            if (schneider) multiplier += 1; // +1 Schneider erreicht
            if (announcedSchneider) multiplier += 1; // +1 Schneider angesagt
            if (schwarz) multiplier += 1; // +1 Schwarz erreicht
            if (announcedSchwarz) multiplier += 1; // +1 Schwarz angesagt
        } else {
            if (schneider) multiplier += 1;
            if (schwarz) multiplier += 1;
        }

        return multiplier;
    }

    static calculateGameValue(trumpMode, multiplier) {
        const baseValue = this.BASE_VALUES[trumpMode];
        if (!baseValue) return 0;
        return baseValue * multiplier;
    }

    static getNullGameValue(handGame) {
        return handGame ? this.NULL_VALUES.hand : this.NULL_VALUES.normal;
    }

    static checkOverbid(bidValue, gameValue) {
        return gameValue < bidValue;
    }

    /**
     * Hauptfunktion: Wertet das Spielende komplett aus.
     */
    static evaluateEndGame({
        trumpMode,
        declarerCards,
        skat,
        bidValue,
        handGame,
        announcedSchneider = false,
        announcedSchwarz = false,
        declarerPoints,
        defenderPoints,
        defenderTrickCount,
        declarerWonNormally
    }) {

        const getT = (key) => {
            if (typeof UI !== 'undefined' && UI.TRANSLATIONS) {
                const lang = (window.appSettings && window.appSettings.current.language) || 'de';
                return UI.TRANSLATIONS[lang][key] || key;
            }
            return key;
        };

        if (trumpMode === 'Null') {
            const gameValue = this.getNullGameValue(handGame);
            const overbid = this.checkOverbid(bidValue, gameValue);
            const won = overbid ? false : declarerWonNormally;
            const details = handGame ? `Null ${getT('hand_game')}` : 'Null';

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

        const allDeclarerCards = [...declarerCards, ...skat];
        const matadors = this.calculateMatadors(allDeclarerCards);

        const schneider = defenderPoints <= 30;
        const schwarz = defenderTrickCount === 0;

        const multiplier = this.calculateMultiplier({
            matadors: matadors.count,
            handGame,
            schneider,
            schwarz,
            announcedSchneider,
            announcedSchwarz
        });

        const gameValue = this.calculateGameValue(trumpMode, multiplier);
        const overbid = this.checkOverbid(bidValue, gameValue);

        let won = overbid ? false : declarerWonNormally;
        if (announcedSchneider && !schneider) won = false;
        if (announcedSchwarz && !schwarz) won = false;

        const matadorType = matadors.type; // 'mit' or 'ohne'
        const matadorCount = matadors.count;

        let currentMult = matadorCount + 1; // Spitzen + 1 (Spiel)
        const parts = [`${matadorType} ${matadorCount}`, `Spiel ${currentMult}`];
        
        if (handGame) {
            currentMult += 1;
            parts.push(`Hand ${currentMult}`);
            
            if (schneider) {
                currentMult += 1;
                parts.push(`Schneider ${currentMult}`);
            }
            if (announcedSchneider) {
                currentMult += 1;
                parts.push(`Schneider angesagt ${currentMult}`);
            }
            if (schwarz) {
                currentMult += 1;
                parts.push(`Schwarz ${currentMult}`);
            }
            if (announcedSchwarz) {
                currentMult += 1;
                parts.push(`Schwarz angesagt ${currentMult}`);
            }
        } else {
            if (schneider) {
                currentMult += 1;
                parts.push(`Schneider ${currentMult}`);
            }
            if (schwarz) {
                currentMult += 1;
                parts.push(`Schwarz ${currentMult}`);
            }
        }

        const baseValue = this.BASE_VALUES[trumpMode];
        const details = `${parts.join(', ')}, ${currentMult} × ${baseValue} = ${gameValue}`;

        return {
            gameValue,
            matadors,
            multiplier: currentMult,
            schneider,
            schwarz,
            overbid,
            won,
            details
        };
    }
}
