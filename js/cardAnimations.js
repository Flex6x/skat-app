/**
 * Card Animations for Skat
 * Handles Web Animations API sequences for dealing and collecting tricks.
 */

class CardAnimations {
    constructor(ui) {
        this.ui = ui;
        this.delayBetweenDeals = 50; // ms
        this.isAborted = false;
    }

    abort() {
        this.isAborted = true;
        // Clean up any cards currently moving in the body
        const floatingCards = document.querySelectorAll('body > .card');
        floatingCards.forEach(c => c.remove());
    }

    get dealDuration() {
        return (typeof appSettings !== 'undefined') ? appSettings.getAnimationSpeedMs() : 450;
    }

    get trickDuration() {
        return (typeof appSettings !== 'undefined') ? appSettings.getAnimationSpeedMs() * 0.67 : 300;
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
            if (this.isAborted) {
                resolve();
                return;
            }
            const startPos = this.getCenterPos(startEl);
            const endPos = this.getCenterPos(endEl);

            document.body.appendChild(cardElement);
            
            // ... (rest of setup)
            cardElement.style.position = 'fixed';
            cardElement.style.left = `${startPos.x - 40}px`;
            cardElement.style.top = `${startPos.y - 60}px`;
            cardElement.style.zIndex = '1000';
            cardElement.style.margin = '0';

            const deltaX = endPos.x - startPos.x;
            const deltaY = endPos.y - startPos.y;

            if (typeof cardElement.animate === 'function') {
                const animation = cardElement.animate([
                    { transform: `translate(0px, 0px) rotate(0deg)` },
                    { transform: `translate(${deltaX}px, ${deltaY}px) rotate(360deg)` }
                ], {
                    duration: duration,
                    easing: 'ease-out',
                    fill: 'forwards'
                });

                animation.onfinish = () => {
                    cardElement.remove();
                    resolve();
                };
                
                // If already aborted or aborted during animation setup
                if (this.isAborted) {
                    animation.cancel();
                    cardElement.remove();
                    resolve();
                }
            } else {
                cardElement.remove();
                resolve();
            }
        });
    }

    async animateDealSequence(forehandIndex, uiPlayers) {
        this.isAborted = false; // Reset on start
        const deckEl = document.getElementById('deck-zone');
        // ... (rest of initial setup)
        const skatSlots = this.ui.els.skatZone.querySelectorAll('.card-slot');

        this.ui.els.skatZone.classList.remove('hidden');
        deckEl.innerHTML = '';
        this.ui.els.player0Cards.innerHTML = '';
        this.ui.els.player1Cards.innerHTML = '';
        this.ui.els.player2Cards.innerHTML = '';
        skatSlots.forEach(s => s.innerHTML = '');

        const deckMockup = this.createTempCard();
        deckEl.appendChild(deckMockup);

        const dealOrder = [
            forehandIndex,
            (forehandIndex + 1) % 3,
            (forehandIndex + 2) % 3
        ];

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
            if (this.isAborted) break;
            
            // Play drag sound for each packet
            this.ui.playSound('drag');

            const tempPacket = this.createTempPacket(step.count);
            let targetEl;
            // ... (rest of loop)
            if (step.target === 'skat') {
                targetEl = skatSlots[skatReceived];
            } else {
                targetEl = step.target === 0 ? this.ui.els.player0Cards :
                    step.target === 1 ? this.ui.els.player1Cards :
                        this.ui.els.player2Cards;
            }

            if (targetEl) {
                await this.animateCardMove(tempPacket, deckEl, targetEl, this.dealDuration);
                if (this.isAborted) break;

                for (let i = 0; i < step.count; i++) {
                    if (step.target === 'skat') {
                        const placedCard = this.createTempCard();
                        placedCard.style.position = 'static';
                        placedCard.style.margin = '0';
                        placedCard.style.width = '100%';
                        placedCard.style.height = '100%';
                        skatSlots[skatReceived].appendChild(placedCard);
                        skatReceived++;
                    } else {
                        receivedCards[step.target]++;
                        if (step.target === 2) {
                            const indexOffset = receivedCards[step.target] - 1;
                            const hCard = uiPlayers[step.target].hand[indexOffset];
                            if (hCard) {
                                const cardDOM = hCard.createDOMElement();
                                this.ui.els.player2Cards.appendChild(cardDOM);
                            }
                        } else {
                            const botCard = document.createElement('div');
                            botCard.classList.add('card', 'card-back');
                            targetEl.appendChild(botCard);
                        }
                    }
                }
                await this.delay(this.delayBetweenDeals);
            }
        }

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
