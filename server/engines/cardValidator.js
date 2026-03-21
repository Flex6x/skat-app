/**
 * Card Validator
 * 
 * Hilfsklasse für Karten-Validierung im Zusammenhang mit Skat-Regeln.
 * Wird von SkatEngine verwendet.
 */

class CardValidator {
    
    /**
     * Validiert, ob eine Karte gespielt werden darf
     * (kombiniert mehrere Checks)
     */
    validatePlayCard(card, hand, validCards) {
        // Ist die Karte in der Hand?
        if (!hand.some(c => c.id === card.id)) {
            return { valid: false, reason: 'Card not in hand' };
        }

        // Ist die Karte in den erlaubten Zügen?
        if (!validCards.some(c => c.id === card.id)) {
            return { valid: false, reason: 'Card violates suit or trump obligation' };
        }

        return { valid: true, value: card };
    }

    /**
     * Prüft Bedienpflicht (Suit Obligation)
     * Wenn eine Farbe gelegt wurde und der Spieler hat diese Farbe,
     * muss er bedienen.
     */
    checkSuitObligation(card, hand, leadSuit, trumpMode) {
        if (!leadSuit) {
            // Erste Karte - keine Bedienpflicht
            return true;
        }

        const cardSuit = this._getEffectiveSuit(card, trumpMode);

        if (cardSuit === leadSuit) {
            // Spieler bedient die Farbe
            return true;
        }

        // Spieler bedient nicht - hat er überhaupt diese Farbe?
        const hasLeadSuit = hand.some(c => this._getEffectiveSuit(c, trumpMode) === leadSuit);

        if (hasLeadSuit) {
            // Spieler hat die Farbe aber bedient nicht - FEHLER!
            return false;
        }

        // Spieler hat die Farbe nicht - Trumpf-Pflicht prüfen
        return true;
    }

    /**
     * Prüft Trumpf-Pflicht (Trump Obligation)
     * Wenn Spieler kann nicht bedienen, muss er Trumpf spielen (falls vorhanden)
     */
    checkTrumpObligation(card, hand, leadSuit, trumpMode) {
        if (trumpMode === 'Null') {
            // Bei Null gibt es keine Trumpf-Pflicht
            return true;
        }

        const cardSuit = this._getEffectiveSuit(card, trumpMode);
        const isCardTrump = this._isTrump(card, trumpMode);

        // Lead-Suit bedienen?
        if (cardSuit === leadSuit) {
            return true; // OK
        }

        // Nicht bedient - muss Trumpf sein
        if (isCardTrump) {
            return true; // OK - ist Trumpf
        }

        // Nicht bedient und kein Trumpf - aber hat er Trumpf?
        const hasTrump = hand.some(c => this._isTrump(c, trumpMode));

        if (hasTrump) {
            // Hat Trumpf aber spielte keinen - FEHLER!
            return false;
        }

        // Hat kein Trumpf - alles erlaubt
        return true;
    }

    /**
     * ========================================================================
     * HILFSFUNKTIONEN (private)
     * ========================================================================
     */

    /**
     * Ist die Karte ein Trumpf?
     */
    _isTrump(card, trumpMode) {
        if (trumpMode === 'Grand') {
            return card.rank === 'U'; // Nur Unters sind Trumpf
        }
        if (trumpMode === 'Null') {
            return false; // Keine Trumpf bei Null
        }
        return card.suit === trumpMode; // Farbtrumpf
    }

    /**
     * Gibt die effektive Farbe einer Karte zurück
     */
    _getEffectiveSuit(card, trumpMode) {
        if (trumpMode === 'Grand' && card.rank === 'U') {
            return 'Grand'; // Pseudo-Suit für Unters
        }
        return card.suit;
    }
}

export default CardValidator;
