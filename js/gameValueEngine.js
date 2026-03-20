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
     * Bonusstufen bei Hand: Hand(1), Schneider(1), Schneider angesagt(1), Schwarz(1), Schwarz angesagt(1), Ouvert(1)
     * Neu: Wenn gewonnen wurde, zählen Schneider/Schwarz nur, wenn sie erreicht wurden.
     * Wenn verloren wurde, zählen Schneider/Schwarz für den Multiplikator, wenn die GEGNER sie erreicht haben.
     */
    static calculateMultiplier({ matadors, handGame, schneider, schwarz, announcedSchneider, announcedSchwarz, isOuvert, won, declarerPoints, defenderPoints }) {
        let multiplier = matadors.count + 1; // Spitze(n) + Spiel

        if (handGame) {
            multiplier += 1; // +1 Hand
            
            // In Hand games, announcements imply all previous stages
            const hasSchneider = schneider || announcedSchneider || announcedSchwarz || isOuvert;
            const hasAnnouncedSchneider = announcedSchneider || announcedSchwarz || isOuvert;
            const hasSchwarz = schwarz || announcedSchwarz || isOuvert;
            const hasAnnouncedSchwarz = announcedSchwarz || isOuvert;

            if (hasSchneider) multiplier += 1;
            if (hasAnnouncedSchneider) multiplier += 1;
            if (hasSchwarz) multiplier += 1;
            if (hasAnnouncedSchwarz) multiplier += 1;
            if (isOuvert) multiplier += 1;
        } else {
            // Wenn der Alleinspieler verliert, können die Gegner Schneider (31+ Augen) oder Schwarz (alle Stiche) gemacht haben.
            // Der User möchte, dass Schneider/Schwarz-Verlust des Alleinspielers den Wert erhöht (noch mehr Minus).
            if (schneider) multiplier += 1;
            if (schwarz) multiplier += 1;
            if (isOuvert) multiplier += 1; 
        }

        return multiplier;
    }

    static calculateGameValue(trumpMode, multiplier) {
        const baseValue = this.BASE_VALUES[trumpMode];
        if (!baseValue) return 0;
        return baseValue * multiplier;
    }

    static getNullGameValue(handGame, isOuvert) {
        if (isOuvert) {
            return handGame ? this.NULL_VALUES.ouvertHand : this.NULL_VALUES.ouvert;
        }
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
        isOuvert = false,
        announcedSchneider = false,
        announcedSchwarz = false,
        declarerPoints,
        defenderPoints,
        defenderTrickCount,
        declarerWonNormally
    }) {

        const getT = (key) => {
            if (typeof TRANSLATIONS !== 'undefined') {
                const lang = (window.appSettings && window.appSettings.current.language) || 'de';
                return TRANSLATIONS[lang][key] || key;
            }
            return key;
        };

        if (trumpMode === 'Null') {
            const gameValue = this.getNullGameValue(handGame, isOuvert);
            const overbid = this.checkOverbid(bidValue, gameValue);
            const won = overbid ? false : declarerWonNormally;
            
            let details = 'Null';
            if (isOuvert) {
                details += handGame ? ` ${getT('null_ouvert_hand')}` : ` ${getT('null_ouvert')}`;
            } else if (handGame) {
                details += ` ${getT('hand')}`;
            }

            return {
                baseGameValue: gameValue,
                gameValue: won ? gameValue : gameValue * 2,
                matadors: { count: 0, type: '-' },
                multiplier: 0,
                schneider: false,
                schwarz: false,
                overbid,
                won,
                details: `${details} = ${gameValue}`,
                handGame,
                isOuvert
            };
        }

        // --- MATADOR CALCULATION ---
        const matadors = this.calculateMatadors(declarerCards);

        // Schneider/Schwarz-Check
        // Wenn der Alleinspieler gewinnt: Schneider = Gegner <= 30
        // Wenn der Alleinspieler verliert: Schneider = Alleinspieler <= 30
        let schneider = false;
        let schwarz = false;

        if (declarerWonNormally) {
            schneider = defenderPoints <= 30;
            schwarz = defenderTrickCount === 0;
        } else {
            // Alleinspieler hat verloren. Haben die Gegner Schneider/Schwarz geschafft?
            schneider = declarerPoints <= 30;
            schwarz = (10 - defenderTrickCount) === 0; // Declarer has 0 tricks
        }

        const multiplier = this.calculateMultiplier({
            matadors,
            handGame,
            schneider,
            schwarz,
            announcedSchneider,
            announcedSchwarz,
            isOuvert
        });

        const gameValue = this.calculateGameValue(trumpMode, multiplier);
        const overbid = this.checkOverbid(bidValue, gameValue);

        let won = overbid ? false : declarerWonNormally;
        if (announcedSchneider && !schneider && declarerWonNormally) won = false;
        if (announcedSchwarz && !schwarz && declarerWonNormally) won = false;
        if (isOuvert && !schwarz && declarerWonNormally) won = false; 

        const matadorType = getT(matadors.type); 
        const matadorCount = matadors.count;

        let currentMult = matadorCount + 1; // 1. Spiel
        const parts = [`${matadorType} ${matadorCount}`, `${getT('game')} ${currentMult}`];
        
        if (handGame) {
            currentMult += 1; // 2. Hand
            parts.push(`${getT('hand')} ${currentMult}`);
            
            const hasSchneider = schneider || announcedSchneider || announcedSchwarz || isOuvert;
            const hasAnnouncedSchneider = announcedSchneider || announcedSchwarz || isOuvert;
            const hasSchwarz = schwarz || announcedSchwarz || isOuvert;
            const hasAnnouncedSchwarz = announcedSchwarz || isOuvert;

            if (hasSchneider) {
                currentMult += 1;
                parts.push(`${getT('schneider')} ${currentMult}`);
            }
            if (hasAnnouncedSchneider) {
                currentMult += 1;
                parts.push(`${getT('schneider_announced')} ${currentMult}`);
            }
            if (hasSchwarz) {
                currentMult += 1;
                parts.push(`${getT('schwarz')} ${currentMult}`);
            }
            if (hasAnnouncedSchwarz) {
                currentMult += 1;
                parts.push(`${getT('schwarz_announced')} ${currentMult}`);
            }
            if (isOuvert) {
                currentMult += 1;
                parts.push(`${getT('ouvert')} ${currentMult}`);
            }
        } else {
            if (schneider) {
                currentMult += 1;
                parts.push(`${getT('schneider')} ${currentMult}`);
            }
            if (schwarz) {
                currentMult += 1;
                parts.push(`${getT('schwarz')} ${currentMult}`);
            }
            if (isOuvert) {
                currentMult += 1;
                parts.push(`${getT('ouvert')} ${currentMult}`);
            }
        }

        const baseValue = this.BASE_VALUES[trumpMode];
        const details = `${parts.join(', ')} | ${currentMult} × ${baseValue} = ${gameValue}`;

        return {
            baseGameValue: gameValue,
            gameValue: won ? gameValue : gameValue * 2,
            matadors,
            multiplier: currentMult,
            schneider,
            schwarz,
            overbid,
            won,
            details,
            handGame,
            isOuvert
        };
    }
}
