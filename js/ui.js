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
            biddingStatus: document.getElementById('bidding-status'),
            biddingControls: document.getElementById('bidding-controls'),
            trumpOverlay: document.getElementById('trump-overlay'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            
            currentTrump: document.getElementById('current-trump'),
            currentTurn: document.getElementById('current-turn'),
            currentDeclarer: document.getElementById('current-declarer'),
            currentBid: document.getElementById('current-bid'),
            
            mainMenu: document.getElementById('main-menu'),
            menuPrimary: document.getElementById('menu-primary'),
            statsView: document.getElementById('stats-view'),
            statsTableBody: document.getElementById('stats-table-body'),
            gameContainer: document.getElementById('game-container'),
            
            btnStartGame: document.getElementById('btn-start-game'),
            btnShowStats: document.getElementById('btn-show-stats'),
            btnBackMenu: document.getElementById('btn-back-menu'),
            btnHome: document.getElementById('btn-home'),
            btnLastTrick: document.getElementById('btn-last-trick'),
            
            lastTrickOverlay: document.getElementById('last-trick-overlay'),
            lastTrickCards: document.getElementById('last-trick-cards'),
            
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

    showMainMenu(onStart) {
        this.els.mainMenu.classList.remove('hidden');
        this.els.menuPrimary.classList.remove('hidden');
        this.els.statsView.classList.add('hidden');
        this.els.gameContainer.classList.add('hidden');
        
        // Ensure old listeners are cleared by cloning the button if necessary or simply replacing onclick
        this.els.btnStartGame.onclick = () => {
            this.hideMainMenu();
            onStart();
        };
        
        this.els.btnShowStats.onclick = () => {
            this.showStatsView();
        };
        
        this.els.btnBackMenu.onclick = () => {
             this.els.statsView.classList.add('hidden');
             this.els.menuPrimary.classList.remove('hidden');
        };
    }
    
    showStatsView() {
        this.els.menuPrimary.classList.add('hidden');
        this.els.statsView.classList.remove('hidden');
        this.renderStats();
    }
    
    // --- Last Trick UI Methods ---
    showLastTrickBtn(onClick) {
        this.els.btnLastTrick.classList.remove('hidden');
        this.els.btnLastTrick.onclick = () => onClick();
    }
    
    hideLastTrickBtn() {
        this.els.btnLastTrick.classList.add('hidden');
    }
    
    showLastTrick(cardsArray) {
        this.els.lastTrickOverlay.classList.remove('hidden');
        this.els.lastTrickCards.innerHTML = '';
        
        cardsArray.forEach(trickItem => {
            // trickItem could just be the physical Card object, we create DOM
            // Usually the game engine gives us {playerId, card}
            const c = trickItem.card || trickItem; 
            const el = c.createDOMElement();
            // Prevent dragging from the viewer
            el.draggable = false;
            this.els.lastTrickCards.appendChild(el);
        });
        
        // Close on click anywhere
        this.els.lastTrickOverlay.onclick = () => {
             this.els.lastTrickOverlay.classList.add('hidden');
        };
    }
    
    renderStats() {
        const stats = JSON.parse(localStorage.getItem("skatStats")) || [];
        this.els.statsTableBody.innerHTML = '';
        
        if (stats.length === 0) {
            this.els.statsTableBody.innerHTML = '<tr><td colspan="4">Noch keine Spiele absolviert.</td></tr>';
            return;
        }
        
        // Show newest first
        [...stats].reverse().forEach(game => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${game.date}</td>
                <td>${game.winner}</td>
                <td>${game.score}</td>
                <td>${game.gameType}</td>
            `;
            this.els.statsTableBody.appendChild(tr);
        });
    }

    hideMainMenu() {
        this.els.mainMenu.classList.add('hidden');
        this.els.gameContainer.classList.remove('hidden');
    }

    bindHomeButton(onHomeClick) {
        this.els.btnHome.onclick = () => onHomeClick();
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
        const slots = this.els.skatZone.querySelectorAll('.card-slot');
        slots.forEach(s => {
            s.innerHTML = '';
            const cardBack = document.createElement('div');
            cardBack.classList.add('card', 'card-back');
            cardBack.style.width = '100%';
            cardBack.style.height = '100%';
            s.appendChild(cardBack);
        });
    }

    showBiddingOverlay(nextBid, onBid, onPass) {
        // Kept for backwards compatibility if needed, though we replace it
        this.showAdvancedBiddingOverlay(nextBid, true, false, onBid, onPass);
    }

    showAdvancedBiddingOverlay(targetBid, canBid, canHold, onActionBid, onActionPass) {
        this.els.biddingOverlay.classList.remove('hidden');
        this.els.biddingStatus.textContent = canBid ? 'Du bist dran zu reizen!' : 'Du musst antworten!';
        
        this.els.biddingControls.innerHTML = `
            <div class="button-group">
                <button id="btn-pass" class="btn">Passe</button>
                ${canHold ? `<button id="btn-hold" class="btn primary">Ja (${targetBid})</button>` : ''}
                ${canBid ? `<button id="btn-bid" class="btn primary">Reize ${targetBid}</button>` : ''}
            </div>
        `;
        
        document.getElementById('btn-pass').onclick = onActionPass;
        if (canHold) document.getElementById('btn-hold').onclick = onActionBid;
        if (canBid) document.getElementById('btn-bid').onclick = onActionBid;
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

    showSkatDiscardUI(hand, skatCards, onConfirm) {
        this.els.btnSkatTake.style.display = 'none';
        this.els.btnSkatHand.style.display = 'none';
        
        this.els.skatDiscardArea.classList.remove('hidden');
        
        // Render Skat Cards onto the slots completely fresh
        this.els.skatDiscardSlots.forEach((s, index) => {
            s.innerHTML = '';
            if (skatCards[index]) {
                const cardEl = skatCards[index].createDOMElement();
                s.appendChild(cardEl);
                s.dataset.cardId = skatCards[index].id;
            } else {
                s.dataset.cardId = '';
            }
        });
        
        const discardedIds = [skatCards[0].id, skatCards[1].id]; // Initially both are in Skat
        const handContainer = this.els.player2Cards;
        
        // Function to make a single card fully interactive (Drag & Click toggle)
        const bindCardInteractable = (el) => {
            el.draggable = true;
            
            // Re-bind nicely without stacking listeners
            el.ondragstart = e => {
                e.dataTransfer.setData('text/plain', el.dataset.id);
                el.classList.add('dragging');
            };
            el.ondragend = () => el.classList.remove('dragging');

            el.onclick = () => {
                const parentSlot = el.parentElement;
                if (parentSlot.classList.contains('skat-slot')) {
                    // Move from skat exactly to hand
                    handContainer.appendChild(el);
                    parentSlot.dataset.cardId = '';
                    
                    const index = discardedIds.indexOf(el.dataset.id);
                    if (index > -1) discardedIds.splice(index, 1);
                    this.els.btnConfirmSkat.disabled = true;
                } else {
                    // Move from hand exactly to the first available skat slot
                    const emptySlot = Array.from(this.els.skatDiscardSlots).find(s => !s.dataset.cardId);
                    if (emptySlot) {
                        emptySlot.appendChild(el);
                        emptySlot.dataset.cardId = el.dataset.id;
                        discardedIds.push(el.dataset.id);
                        if (discardedIds.length === 2) {
                            this.els.btnConfirmSkat.disabled = false;
                        }
                    } else {
                        this.showMessage("Drücke zuerst eine Karte zurück auf die Hand!");
                    }
                }
            };
        };

        // Bind all current hand cards
        const cardEls = handContainer.querySelectorAll('.card-face');
        cardEls.forEach(bindCardInteractable);

        // Bind the 2 newly created cards residing in the skat slots
        this.els.skatDiscardSlots.forEach(s => {
            const cardInSlot = s.querySelector('.card-face');
            if (cardInSlot) bindCardInteractable(cardInSlot);
        });

        // Setup drop zones for the skat slots
        this.els.skatDiscardSlots.forEach(slot => {
            slot.ondragover = e => { e.preventDefault(); slot.classList.add('drag-over'); };
            slot.ondragleave = () => slot.classList.remove('drag-over');
            slot.ondrop = e => {
                e.preventDefault();
                slot.classList.remove('drag-over');
                
                const cardId = e.dataTransfer.getData('text/plain');
                if (!cardId) return;

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
            };
        });

        // Allow taking card back to hand via drag and drop
        handContainer.ondragover = e => e.preventDefault();
        handContainer.ondrop = e => {
            e.preventDefault();
            const cardId = e.dataTransfer.getData('text/plain');
            if (!cardId) return;

            // Only act if the card came from a skat slot
            const slot = Array.from(this.els.skatDiscardSlots).find(s => s.dataset.cardId === cardId);
            if (slot) {
                const cardEl = slot.querySelector('.card-face');
                if (cardEl) {
                    handContainer.appendChild(cardEl);
                    slot.dataset.cardId = '';
                    
                    const index = discardedIds.indexOf(cardId);
                    if (index > -1) discardedIds.splice(index, 1);
                    
                    this.els.btnConfirmSkat.disabled = true;
                }
            }
        };

        // Confirmation Callback
        this.els.btnConfirmSkat.disabled = false; // Initially 2 cards are in the skat
        this.els.btnConfirmSkat.onclick = () => {
             this.els.skatDecisionOverlay.classList.add('hidden');
             
             // Extract physical cards from slots to form the final skat
             const finalSkatId1 = this.els.skatDiscardSlots[0].dataset.cardId;
             const finalSkatId2 = this.els.skatDiscardSlots[1].dataset.cardId;
             
             // Cleanly remove bindings before continuing
             const allCards = [...handContainer.querySelectorAll('.card-face'), ...document.querySelectorAll('.skat-slot .card-face')];
             allCards.forEach(c => { c.onclick = null; c.ondragstart = null; c.ondragend = null; });
             handContainer.ondragover = null; handContainer.ondrop = null;
             
             this.updateSkatZone(); 
             onConfirm([finalSkatId1, finalSkatId2]);
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
        this.els.currentTrump.innerHTML = `Trumpf: ${symbol}`;
    }

    updateTurn(turnIndex) {
        const names = ['Aicore', 'Aiden', 'Du'];
        this.els.currentTurn.textContent = `Zug: ${names[turnIndex]}`;
        
        // Highlight active player
        document.querySelectorAll('.player-zone').forEach(el => el.style.opacity = '0.5');
        if (turnIndex === 0) document.getElementById('bot2').style.opacity = '1';
        else if (turnIndex === 1) document.getElementById('bot1').style.opacity = '1';
        else document.getElementById('player-area').style.opacity = '1';
    }

    setDeclarer(name, bidValue) {
        this.els.currentDeclarer.textContent = `Alleinspieler: ${name}`;
        if (bidValue) {
            this.els.currentBid.textContent = `Reizwert: ${bidValue}`;
        } else {
            this.els.currentBid.textContent = `Reizwert: -`;
        }
    }

    updatePlayerRoles(vorhandId, mittelhandId, hinterhandId) {
        const roles = [];
        roles[vorhandId] = ' (V)';
        roles[mittelhandId] = ' (M)';
        roles[hinterhandId] = ' (H)';
        
        // Find player name divs
        const bot2Name = document.querySelector('#bot2 .player-info');
        const bot1Name = document.querySelector('#bot1 .player-info');
        const playerName = document.querySelector('#player-area .player-info');
        
        // This resets the text while keeping HTML structure like score span and ai-text
        const updateName = (el, baseHtml, roleStr) => {
            // we have to reconstruct since innerHTML wipes out children if we aren't careful
            // For now, simpler approach, we just know what the text is
        };
        
        bot2Name.innerHTML = `<span class="ai-text">Ai</span>core${roles[0]} <span class="score">${document.querySelector('#bot2 .score').textContent}</span>`;
        bot1Name.innerHTML = `<span class="ai-text">Ai</span>den${roles[1]} <span class="score">${document.querySelector('#bot1 .score').textContent}</span>`;
        playerName.innerHTML = `Du${roles[2]} <span class="score">${document.querySelector('#player-area .score').textContent}</span>`;
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

    showGameOver(won, resultMsg, declarerPoints, oppPoints) {
        this.els.gameOverOverlay.classList.remove('hidden');
        const resDiv = document.getElementById('results');
        
        // Use the title based on won
        const title = won ? 'Spiel gewonnen!' : 'Spiel verloren!';
        document.getElementById('game-result-msg').textContent = title;
        
        resDiv.innerHTML = `
            <p class="result-summary">${resultMsg}</p>
            <div class="result-details">
                <p>Alleinspieler: ${declarerPoints} Augen</p>
                <p>Gegner: ${oppPoints} Augen</p>
            </div>
        `;
    }

    showGameOverPassedIn() {
        this.els.gameOverOverlay.classList.remove('hidden');
        document.getElementById('game-result-msg').textContent = 'Eingepasst!';
        const resDiv = document.getElementById('results');
        
        resDiv.innerHTML = `
            <p>Niemand hat gereizt. Das Spiel wird neu gegeben.</p>
        `;
    }
}
