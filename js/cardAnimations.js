/**
 * Card Animations for Skat
 * Handles Web Animations API sequences for dealing and collecting tricks.
 */

class CardAnimations {
    constructor(ui) {
        this.ui = ui;
        this.dealDuration = 450; // ms
        this.trickDuration = 300; // ms
        this.delayBetweenDeals = 50; // ms
    }

    /**
     * Helper to get global center position of an element
     */
    getCenterPos(el) {
        if (!el) return { x: 0, y: 0 };
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    /**
     * Creates a generic visual card (back) for deal animations
     */
    createTempCard() {
        const cardBack = document.createElement('div');
        cardBack.classList.add('card', 'card-back');
        cardBack.style.width = '80px';
        cardBack.style.height = '120px';
        // Match the CSS from style.css for bot-cards
        cardBack.style.background = 'repeating-linear-gradient(45deg, #444, #444 10px, #333 10px, #333 20px)';
        cardBack.style.border = '2px solid #fff';
        cardBack.style.borderRadius = '6px';
        cardBack.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
        return cardBack;
    }

    /**
     * Creates a stack of cards for dealing packets
     */
    createTempPacket(count) {
        const container = document.createElement('div');
        container.style.position = 'relative';
        container.style.width = '80px';
        container.style.height = '120px';

        for (let i = 0; i < count; i++) {
            const cardBack = this.createTempCard();
            cardBack.style.position = 'absolute';
            // Slight offset for stacked look
            cardBack.style.top = `${-i * 2}px`;
            cardBack.style.left = `${-i * 2}px`;
            container.appendChild(cardBack);
        }
        return container;
    }

    /**
     * Wait for ms
     */
    delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    /**
     * Animates a single card DOM element moving from start to end
     */
    animateCardMove(cardElement, startEl, endEl, duration) {
        return new Promise(resolve => {
            const startPos = this.getCenterPos(startEl);
            const endPos = this.getCenterPos(endEl);

            document.body.appendChild(cardElement);

            // Initial positioning using inline styles for absolute position
            cardElement.style.position = 'fixed';
            cardElement.style.left = `${startPos.x - 40}px`; // 40 is half card width
            cardElement.style.top = `${startPos.y - 60}px`; // 60 is half card height
            cardElement.style.zIndex = '1000';
            cardElement.style.margin = '0';

            const deltaX = endPos.x - startPos.x;
            const deltaY = endPos.y - startPos.y;

            if (typeof cardElement.animate === 'function') {
                const animation = cardElement.animate([
                    { transform: `translate(0px, 0px) rotate(0deg)` },
                    { transform: `translate(${deltaX}px, ${deltaY}px) rotate(360deg)` } // Adds a spin effect
                ], {
                    duration: duration,
                    easing: 'ease-out',
                    fill: 'forwards'
                });

                animation.onfinish = () => {
                    cardElement.remove();
                    resolve();
                };
            } else {
                // Fallback: Just snap to end (no animation)
                cardElement.remove();
                resolve();
            }
        });
    }

    /**
     * Deals cards according to the specific 3 -> Skat -> 4 -> 3 sequence
     */
    async animateDealSequence(forehandIndex, uiPlayers) {
        const deckEl = document.getElementById('deck-zone');
        const skatSlots = this.ui.els.skatZone.querySelectorAll('.card-slot');

        // Ensure #skat-zone is not hidden and clear old cards
        this.ui.els.skatZone.classList.remove('hidden');
        deckEl.innerHTML = '';
        this.ui.els.player0Cards.innerHTML = '';
        this.ui.els.player1Cards.innerHTML = '';
        this.ui.els.player2Cards.innerHTML = '';
        skatSlots.forEach(s => s.innerHTML = '');

        // Show full deck at start
        const deckMockup = this.createTempCard();
        deckEl.appendChild(deckMockup);

        const dealOrder = [
            forehandIndex,           // a) Spieler direkt links vom Geber
            (forehandIndex + 1) % 3, // b) nächster Spieler
            (forehandIndex + 2) % 3  // c) letzter Spieler (oft Geber)
        ];

        // The exact dealing logic step-by-step
        const sequence = [
            { target: dealOrder[0], count: 3 },
            { target: dealOrder[1], count: 3 },
            { target: dealOrder[2], count: 3 },
            { target: 'skat', count: 2 },
            { target: dealOrder[0], count: 4 },
            { target: dealOrder[1], count: 4 },
            { target: dealOrder[2], count: 4 },
            { target: dealOrder[0], count: 3 },
            { target: dealOrder[1], count: 3 },
            { target: dealOrder[2], count: 3 }
        ];

        const receivedCards = { 0: 0, 1: 0, 2: 0 };
        let skatReceived = 0;

        for (const step of sequence) {
            const tempPacket = this.createTempPacket(step.count);
            let targetEl;

            if (step.target === 'skat') {
                targetEl = skatSlots[skatReceived]; // target the first empty slot for packet drop
            } else {
                targetEl = step.target === 0 ? this.ui.els.player0Cards :
                    step.target === 1 ? this.ui.els.player1Cards :
                        this.ui.els.player2Cards;
            }

            if (targetEl) {
                await this.animateCardMove(tempPacket, deckEl, targetEl, this.dealDuration);

                // Once the packet arrives, instantiate the actual individual cards there
                for (let i = 0; i < step.count; i++) {
                    if (step.target === 'skat') {
                        // Place a static back card in the Skat zone in the correct slot
                        const placedCard = this.createTempCard();
                        placedCard.style.position = 'static';
                        placedCard.style.margin = '0';
                        placedCard.style.width = '100%';
                        placedCard.style.height = '100%';
                        skatSlots[skatReceived].appendChild(placedCard);
                        skatReceived++;
                    } else {
                        // Place appropriately in the player hand
                        receivedCards[step.target]++;
                        if (step.target === 2) {
                            // Find the physical card object
                            const indexOffset = receivedCards[step.target] - 1;
                            const hCard = uiPlayers[step.target].hand[indexOffset];
                            if (hCard) {
                                const cardDOM = hCard.createDOMElement();
                                this.ui.els.player2Cards.appendChild(cardDOM);
                            }
                        } else {
                            // Bot gets a back card
                            const botCard = document.createElement('div');
                            botCard.classList.add('card', 'card-back');
                            targetEl.appendChild(botCard);
                        }
                    }
                }
                await this.delay(this.delayBetweenDeals);
            }
        }

        // Remove the deck mockup when dealing is finished
        deckEl.innerHTML = '';
    }

    /**
     * Animates gathering a trick to the winner's area
     */
    async animateCollectTrick(winnerId) {
        const trickZones = [
            this.ui.els.trickBot2.firstElementChild, // slot 0 might be under another bot? 
            this.ui.els.trickBot1.firstElementChild,
            this.ui.els.trickPlayer.firstElementChild
        ];

        const winnerContainer = winnerId === 0 ? document.getElementById('bot2') :
            winnerId === 1 ? document.getElementById('bot1') :
                document.getElementById('player-area');

        const animations = [];

        trickZones.forEach(el => {
            if (el) {
                // Clone the played card for animation
                const animatedCard = el.cloneNode(true);
                // Hide the static played card
                el.style.opacity = '0';

                // Animate the cloned card
                animations.push(this.animateCardMove(animatedCard, el.parentElement, winnerContainer, this.trickDuration));
            }
        });

        // Resolve when all three cards have reached the winner
        await Promise.all(animations);
        // Clear the trick zone actually after animations are done
        this.ui.clearTrickZone();
    }
}
