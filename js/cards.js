/**
 * Skat Deck Definition (Deutsches Blatt)
 */

const SUITS = {
    EICHEL: 'Eichel', // Acorns
    GRUEN: 'Grün',    // Leaves
    ROT: 'Rot',       // Hearts
    SCHELLEN: 'Schellen' // Bells
};

const SUIT_SYMBOLS = {
    'classic': {
        'Eichel': '<img src="media/eichel.png" class="suit-icon" alt="Eichel">',
        'Grün': '<img src="media/gruen.png" class="suit-icon" alt="Grün">',
        'Rot': '<img src="media/rot.png" class="suit-icon" alt="Rot">',
        'Schellen': '<img src="media/schellen.png" class="suit-icon" alt="Schellen">'
    },
    'turnier': {
        'Eichel': '<img src="media/kreuz_turnier.png" class="suit-icon smaller" alt="Kreuz">',
        'Grün': '<img src="media/peak_turnier.png" class="suit-icon" alt="Pik">',
        'Rot': '<img src="media/herz_turnier.png" class="suit-icon smaller" alt="Herz">',
        'Schellen': '<img src="media/karo_turnier.png" class="suit-icon" alt="Karo">'
    }
};

const RANKS = ['7', '8', '9', '10', 'U', 'O', 'K', 'A']; // Unter (Bube), Ober (Dame), König, Ass

// Standard Skat Values
const CARD_VALUES = {
    '7': 0, '8': 0, '9': 0,
    'K': 4, 'O': 3, 'U': 2, '10': 10, 'A': 11
};

// Base sorting power (higher is stronger) for a non-trump suit
const RANK_POWER = {
    '7': 1, '8': 2, '9': 3, 'O': 4, 'K': 5, '10': 6, 'A': 7
};

// Power specifically for Null games
const NULL_RANK_POWER = {
    '7': 1, '8': 2, '9': 3, '10': 4, 'U': 5, 'O': 6, 'K': 7, 'A': 8
};

class Card {
    constructor(suit, rank) {
        this.suit = suit;
        this.rank = rank;
        this.value = CARD_VALUES[rank];
        this.id = `${suit}-${rank}`;
    }

    // Helper to generate HTML element
    createDOMElement() {
        const el = document.createElement('div');
        el.classList.add('card-face');
        el.classList.add(`suit-${this.suit}`);
        el.dataset.id = this.id;
        el.draggable = true;

        const design = (window.appSettings && window.appSettings.current.cardDesign) || 'classic';
        el.classList.add(`design-${design}`);
        
        const symbol = SUIT_SYMBOLS[design][this.suit];

        el.innerHTML = `
            <div class="card-top-left">
                <span>${this.rank}</span>
            </div>
            <div class="card-center">${symbol}</div>
            <div class="card-bottom-right">
                <span>${this.rank}</span>
            </div>
        `;
        return el;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.initialize();
    }

    initialize() {
        this.cards = [];
        for (const suit of Object.values(SUITS)) {
            for (const rank of RANKS) {
                this.cards.push(new Card(suit, rank));
            }
        }
    }

    shuffle() {
        // Shuffle the deck 3 times to ensure complete randomness
        for (let s = 0; s < 3; s++) {
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
            }
        }
    }

    deal() {
        // Skat deal: 3 - 4 - 3. We'll just deal array chunks.
        // Player 1, Player 2, Player 3, Skat
        return {
            p1: [...this.cards.slice(0, 3), ...this.cards.slice(11, 15), ...this.cards.slice(23, 26)],
            p2: [...this.cards.slice(3, 6), ...this.cards.slice(15, 19), ...this.cards.slice(26, 29)],
            p3: [...this.cards.slice(6, 9), ...this.cards.slice(19, 23), ...this.cards.slice(29, 32)],
            skat: this.cards.slice(9, 11)
        };
    }
}
