/**
 * Skat DOM UI Manager
 */

class UI {
    constructor() {
        this.els = {
            player1Cards: document.querySelector('#bot1 .cards-container'),
            player0Cards: document.querySelector('#bot2 .cards-container'),
            player2Cards: document.querySelector('#player-hand'),
            
            trickBot2: document.getElementById('played-card-bot2'),
            trickBot1: document.getElementById('played-card-bot1'),
            trickPlayer: document.getElementById('played-card-player'),

            skatZone: document.getElementById('skat-zone'),
            skatDecisionOverlay: document.getElementById('skat-decision-overlay'),
            skatDiscardArea: document.getElementById('skat-discard-area'),
            skatDiscardSlots: document.querySelectorAll('.skat-slot'),
            
            biddingOverlay: document.getElementById('bidding-overlay'),
            trumpOverlay: document.getElementById('trump-overlay'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            
            currentTrump: document.getElementById('current-trump'),
            currentTurn: document.getElementById('current-turn'),
            
            btnPass: document.getElementById('btn-pass'),
            btnBid: document.getElementById('btn-bid'),
            btnSkatHand: document.getElementById('btn-skat-hand'),
            btnSkatTake: document.getElementById('btn-skat-take'),
            btnConfirmSkat: document.getElementById('btn-confirm-skat'),
            btnRestart: document.getElementById('btn-restart'),
            
            trumpBtns: document.querySelectorAll('.trump-btn'),
            
            bot1Speech: document.querySelector('#bot1 .speech-bubble'),
            bot2Speech: document.querySelector('#bot2 .speech-bubble'),
            playerSpeech: document.querySelector('#player-area .speech-bubble')
        };
        
        this.bindGlobalEvents();
    }
    
    bindGlobalEvents() {
        // Setup drop zones for trick
        this.els.trickPlayer.addEventListener('dragover', e => { e.preventDefault(); this.els.trickPlayer.classList.add('drag-over'); });
        this.els.trickPlayer.addEventListener('dragleave', () => this.els.trickPlayer.classList.remove('drag-over'));
        
        // Setup drop zones for skat discard
        this.els.skatDiscardSlots.forEach(slot => {
            slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
            slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
        });
    }

    showMessage(msg) {
        // Could be a toast in the middle. For now log and alert or set somewhere
        console.log(msg);
        this.showSpeechBubble(2, msg, 2000); // Show on player occasionally
    }

    showSpeechBubble(playerId, text, duration = 2000) {
        let el;
        if (playerId === 0) el = this.els.bot2Speech;
        else if (playerId === 1) el = this.els.bot1Speech;
        else el = this.els.playerSpeech;
        
        el.textContent = text;
        el.classList.remove('hidden');
        
        setTimeout(() => {
            el.classList.add('hidden');
        }, duration);
    }

    renderAllHands(players) {
        this.renderBotHand(0, players[0].hand.length);
        this.renderBotHand(1, players[1].hand.length);
        this.renderPlayerHand(players[2].hand);
    }

    renderBotHand(playerId, count) {
        const container = playerId === 0 ? this.els.player0Cards : this.els.player1Cards;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const cardBack = document.createElement('div');
            cardBack.classList.add('card', 'card-back');
            container.appendChild(cardBack);
        }
    }

    renderPlayerHand(hand) {
        this.els.player2Cards.innerHTML = '';
        hand.forEach(card => {
            const cardEl = card.createDOMElement();
            this.els.player2Cards.appendChild(cardEl);
        });
    }

    updateSkatZone(skatCards) {
        // Hidden by default until revealed at end of game or during discard
        const slots = this.els.skatZone.querySelectorAll('.card-slot');
        slots.forEach(s => s.innerHTML = '');
    }

    showBiddingOverlay(nextBidValue, onBid, onPass) {
        this.els.biddingOverlay.classList.remove('hidden');
        document.getElementById('bidding-status').textContent = `Reize auf ${nextBidValue} Punkte?`;
        this.els.btnBid.textContent = `Reizen (${nextBidValue})`;
        
        this.els.btnBid.onclick = () => { onBid(); };
        this.els.btnPass.onclick = () => { onPass(); };
    }

    hideBiddingOverlay() {
        this.els.biddingOverlay.classList.add('hidden');
    }

    showSkatDecisionOverlay(onTake, onHand) {
        this.els.skatDecisionOverlay.classList.remove('hidden');
        this.els.skatDiscardArea.classList.add('hidden');
        this.els.btnSkatTake.style.display = 'block';
        this.els.btnSkatHand.style.display = 'block';
        
        this.els.btnSkatTake.onclick = () => { onTake(); };
        this.els.btnSkatHand.onclick = () => {
            this.els.skatDecisionOverlay.classList.add('hidden');
            onHand();
        };
    }

    // Handles picking up skat and discarding 2 cards
    showSkatDiscardUI(hand, onConfirm) {
        this.els.btnSkatTake.style.display = 'none';
        this.els.btnSkatHand.style.display = 'none';
        
        this.els.skatDiscardArea.classList.remove('hidden');
        
        // Reset slots
        this.els.skatDiscardSlots.forEach(s => {
            s.innerHTML = '';
            s.dataset.cardId = '';
        });
        
        const discardedIds = [];
        
        // Setup draggable on hand cards for skat targeting
        const cardEls = this.els.player2Cards.querySelectorAll('.card-face');
        cardEls.forEach(el => {
            el.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', el.dataset.id);
                el.classList.add('dragging');
            });
            el.addEventListener('dragend', () => el.classList.remove('dragging'));
        });

        // Setup dropping on skat slots
        this.els.skatDiscardSlots.forEach(slot => {
            slot.addEventListener('drop', e => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                const cardId = e.dataTransfer.getData('text/plain');
                if (!cardId) return;

                // Move visual card to slot
                const cardEl = document.querySelector(`[data-id="${cardId}"]`);
                if (cardEl && !slot.hasChildNodes()) {
                    slot.appendChild(cardEl);
                    slot.dataset.cardId = cardId;
                    
                    if (!discardedIds.includes(cardId)) {
                        discardedIds.push(cardId);
                    }
                    
                    if (discardedIds.length === 2) {
                        this.els.btnConfirmSkat.disabled = false;
                    }
                }
            });
        });

        // Allow taking card back
        this.els.player2Cards.addEventListener('dragover', e => e.preventDefault());
        this.els.player2Cards.addEventListener('drop', e => {
            e.preventDefault();
            const cardId = e.dataTransfer.getData('text/plain');
            if (!cardId) return;

            // Find if it came from skat slot
            const slot = Array.from(this.els.skatDiscardSlots).find(s => s.dataset.cardId === cardId);
            if (slot) {
                const cardEl = slot.querySelector('.card-face');
                this.els.player2Cards.appendChild(cardEl);
                slot.dataset.cardId = '';
                
                const index = discardedIds.indexOf(cardId);
                if (index > -1) discardedIds.splice(index, 1);
                
                this.els.btnConfirmSkat.disabled = true;
            }
        });

        this.els.btnConfirmSkat.onclick = () => {
             this.els.skatDecisionOverlay.classList.add('hidden');
             onConfirm(discardedIds);
        };
    }

    showTrumpSelectionOverlay(onSelect) {
        this.els.trumpOverlay.classList.remove('hidden');
        
        this.els.trumpBtns.forEach(btn => {
            // Remove previous listeners using clone node
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                this.els.trumpOverlay.classList.add('hidden');
                onSelect(newBtn.dataset.suit);
            });
        });
        
        // Update references after clone
        this.els.trumpBtns = document.querySelectorAll('.trump-btn');
    }

    setTrump(trump) {
        let symbol = trump;
        if (SUIT_SYMBOLS[trump]) {
            symbol = `${trump} ${SUIT_SYMBOLS[trump]}`;
        }
        this.els.currentTrump.textContent = `Trumpf: ${symbol}`;
    }

    updateTurn(turnIndex) {
        const names = ['Bot 2', 'Bot 1', 'Du'];
        this.els.currentTurn.textContent = `Zug: ${names[turnIndex]}`;
        
        // Highlight active player
        document.querySelectorAll('.player-zone').forEach(el => el.style.opacity = '0.5');
        if (turnIndex === 0) document.getElementById('bot2').style.opacity = '1';
        else if (turnIndex === 1) document.getElementById('bot1').style.opacity = '1';
        else document.getElementById('player-area').style.opacity = '1';
    }

    enablePlayerMoves(validCards, onPlay) {
        const validIds = validCards.map(c => c.id);
        const cardEls = this.els.player2Cards.querySelectorAll('.card-face');
        
        // Handle Drag & Drop logic for playing to trick on the entire table-area
        const tableArea = document.getElementById('table-area');
        
        // Clean up previous event listeners by cloning table area is dangerous since it holds overlays,
        // so we use named functions and attach/detach them instead.
        
        const removeListeners = () => {
            tableArea.removeEventListener('dragover', this._dragOverHandler);
            tableArea.removeEventListener('dragleave', this._dragLeaveHandler);
            tableArea.removeEventListener('drop', this._dropHandler);
        };
        
        removeListeners(); // Clean up if they existed
        
        this._dragOverHandler = (e) => { e.preventDefault(); tableArea.style.boxShadow = 'inset 0 0 50px rgba(255,255,255,0.2), 0 10px 30px rgba(0,0,0,0.5)'; };
        this._dragLeaveHandler = () => { tableArea.style.boxShadow = ''; };
        
        this._dropHandler = (e) => {
            e.preventDefault();
            tableArea.style.boxShadow = '';
            const cardId = e.dataTransfer.getData('text/plain');
            
            if (validIds.includes(cardId)) {
                removeListeners();
                onPlay(cardId);
            } else {
                this.showMessage("Karte darf nicht gespielt werden!");
            }
        };

        tableArea.addEventListener('dragover', this._dragOverHandler);
        tableArea.addEventListener('dragleave', this._dragLeaveHandler);
        tableArea.addEventListener('drop', this._dropHandler);

        // Make cards draggable / clickable
        cardEls.forEach(el => {
            const cardId = el.dataset.id;
            
            // Remove old listeners mostly via wiping innerText/HTML in renderPlayerHand, but let's be safe.
            el.draggable = validIds.includes(cardId);
            
            if (el.draggable) {
                el.classList.add('valid-move');
                el.classList.remove('invalid-move');
                
                el.ondragstart = (e) => {
                    e.dataTransfer.setData('text/plain', cardId);
                    el.classList.add('dragging');
                };
                el.ondragend = () => el.classList.remove('dragging');
                
                // Allow double click to play instantly
                el.ondblclick = () => onPlay(cardId);
            } else {
                el.classList.remove('valid-move');
                el.classList.add('invalid-move');
                el.ondragstart = (e) => e.preventDefault();
                el.ondblclick = null;
            }
        });
    }

    renderPlayedCard(playerId, card) {
        const cardEl = card.createDOMElement();
        cardEl.classList.add('played-card');
        cardEl.draggable = false;
        cardEl.classList.remove('valid-move', 'invalid-move');
        
        if (playerId === 0) {
            this.els.trickBot2.innerHTML = '';
            this.els.trickBot2.appendChild(cardEl);
        } else if (playerId === 1) {
            this.els.trickBot1.innerHTML = '';
            this.els.trickBot1.appendChild(cardEl);
        } else if (playerId === 2) {
            this.els.trickPlayer.innerHTML = '';
            this.els.trickPlayer.appendChild(cardEl);
            
            // Remove highlighting from hand immediately
            const cardEls = this.els.player2Cards.querySelectorAll('.card-face');
            cardEls.forEach(el => el.classList.remove('valid-move', 'invalid-move'));
        }
    }

    clearTrickZone() {
        this.els.trickBot2.innerHTML = '';
        this.els.trickBot1.innerHTML = '';
        this.els.trickPlayer.innerHTML = '';
    }

    showGameOver(won, declarerPoints, oppPoints) {
        this.els.gameOverOverlay.classList.remove('hidden');
        const resDiv = document.getElementById('results');
        
        resDiv.innerHTML = `
            <h3>${won ? 'Du hast gewonnen!' : 'Du hast verloren!'}</h3>
            <p>Deine Punkte: ${declarerPoints}</p>
            <p>Gegner Punkte: ${oppPoints}</p>
        `;
    }
}
