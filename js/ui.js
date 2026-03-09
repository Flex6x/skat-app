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
            statTotalGames: document.getElementById('stat-total-games'),
            statWinRatio: document.getElementById('stat-win-ratio'),
            statWinStreak: document.getElementById('stat-win-streak'),
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
            playerSpeech: document.querySelector('#player-area .speech-bubble'),
            
            // Scoreboard
            scoreboardDrawer: document.getElementById('scoreboard-drawer'),
            scoreboardBody: document.getElementById('scoreboard-body'),
            btnShowScoreboard: document.getElementById('btn-show-scoreboard'),
            btnCloseScoreboard: document.getElementById('btn-close-scoreboard'),
            totalPlayerNum: document.getElementById('total-player-num'), // We will use footer first cell for this
            totalPlayer0: document.getElementById('total-player0'),
            totalPlayer1: document.getElementById('total-player1'),
            totalPlayer2: document.getElementById('total-player2'),
            
            // Round selection
            roundSelectionView: document.getElementById('round-selection-view'),
            roundBtns: document.querySelectorAll('.round-btn'),
            btnCancelRounds: document.getElementById('btn-cancel-rounds'),
            
            // Settings
            settingsView: document.getElementById('settings-view'),
            btnShowSettings: document.getElementById('btn-show-settings'),
            btnBackSettings: document.getElementById('btn-back-settings'),
            btnDeleteStats: document.getElementById('btn-delete-stats'),
            liveScore: document.getElementById('live-score')
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

        // Scoreboard toggle
        this.els.btnShowScoreboard.onclick = () => {
            this.els.scoreboardDrawer.classList.toggle('hidden');
        };
        this.els.btnCloseScoreboard.onclick = () => {
            this.els.scoreboardDrawer.classList.add('hidden');
        };

        // Delete Stats Logic
        this.els.btnDeleteStats.onclick = () => {
            if (window.confirm("Möchtest du wirklich alle Statistiken unwiderruflich löschen?")) {
                localStorage.removeItem("skatStats");
                this.showMessage("Statistiken gelöscht.");
                this.renderStats();
            }
        };
    }

    showRoundSelection(onSelect, onCancel) {
        this.els.menuPrimary.classList.add('hidden');
        this.els.roundSelectionView.classList.remove('hidden');
        
        this.els.roundBtns.forEach(btn => {
            btn.onclick = () => {
                this.els.roundSelectionView.classList.add('hidden');
                onSelect(parseInt(btn.dataset.rounds));
            };
        });
        
        this.els.btnCancelRounds.onclick = () => {
            this.els.roundSelectionView.classList.add('hidden');
            this.els.menuPrimary.classList.remove('hidden');
            onCancel();
        };
    }

    updateScoreboard(history) {
        this.els.scoreboardBody.innerHTML = '';
        let totals = [0, 0, 0];

        history.forEach((game, index) => {
            const tr = document.createElement('tr');
            
            // Game Number column
            const tdNum = document.createElement('td');
            tdNum.textContent = index + 1;
            tdNum.style.fontWeight = 'bold';
            tdNum.style.color = '#888';
            tr.appendChild(tdNum);

            for (let i = 0; i < 3; i++) {
                const td = document.createElement('td');
                if (game.passedIn) {
                    td.textContent = '0';
                    td.style.color = '#666';
                } else if (game.declarerId === i) {
                    const val = game.won ? game.value : -game.value;
                    td.textContent = val;
                    td.className = val >= 0 ? 'score-pos' : 'score-neg';
                    totals[i] += val;
                } else {
                    td.textContent = '-';
                    td.style.color = '#444';
                }
                tr.appendChild(td);
            }
            this.els.scoreboardBody.appendChild(tr);
        });

        this.els.totalPlayer0.textContent = totals[0];
        this.els.totalPlayer1.textContent = totals[1];
        this.els.totalPlayer2.textContent = totals[2];

        // Apply same classes to totals
        this.els.totalPlayer0.className = totals[0] >= 0 ? 'score-pos' : 'score-neg';
        this.els.totalPlayer1.className = totals[1] >= 0 ? 'score-pos' : 'score-neg';
        this.els.totalPlayer2.className = totals[2] >= 0 ? 'score-pos' : 'score-neg';
    }

    resetScoreboard() {
        this.els.scoreboardBody.innerHTML = '';
        this.els.totalPlayer0.textContent = '0';
        this.els.totalPlayer1.textContent = '0';
        this.els.totalPlayer2.textContent = '0';
        this.els.totalPlayer0.className = '';
        this.els.totalPlayer1.className = '';
        this.els.totalPlayer2.className = '';
    }

    showMainMenu(onStart) {
        this.els.mainMenu.classList.remove('hidden');
        this.els.menuPrimary.classList.remove('hidden');
        this.els.statsView.classList.add('hidden');
        this.els.settingsView.classList.add('hidden');
        this.els.roundSelectionView.classList.add('hidden');
        this.els.gameContainer.classList.add('hidden');
        
        // Ensure old listeners are cleared by cloning the button if necessary or simply replacing onclick
        this.els.btnStartGame.onclick = () => {
            onStart();
        };
        
        this.els.btnShowStats.onclick = () => {
            this.showStatsView();
        };
        
        this.els.btnShowSettings.onclick = () => {
            this.showSettingsView();
        };
        
        this.els.btnBackMenu.onclick = () => {
             this.els.statsView.classList.add('hidden');
             this.els.menuPrimary.classList.remove('hidden');
        };
        
        this.els.btnBackSettings.onclick = () => {
             this.els.settingsView.classList.add('hidden');
             this.els.menuPrimary.classList.remove('hidden');
        };
    }
    
    showStatsView() {
        this.els.menuPrimary.classList.add('hidden');
        this.els.statsView.classList.remove('hidden');
        this.renderStats();
    }
    
    showSettingsView() {
        this.els.menuPrimary.classList.add('hidden');
        this.els.settingsView.classList.remove('hidden');
    }
    
    /**
     * Binds the settings form controls to a Settings instance.
     */
    bindSettingsForm(settings) {
        const s = settings.current;
        
        // Theme radios
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        themeRadios.forEach(r => {
            r.checked = (r.value === s.theme);
            r.addEventListener('change', () => {
                settings.set('theme', r.value);
            });
        });
        
        // Animation speed radios
        const speedRadios = document.querySelectorAll('input[name="animSpeed"]');
        speedRadios.forEach(r => {
            r.checked = (parseFloat(r.value) === s.animationSpeed);
            r.addEventListener('change', () => {
                settings.set('animationSpeed', parseFloat(r.value));
            });
        });
        
        // Live score toggle
        const liveScoreChk = document.getElementById('chk-live-score');
        liveScoreChk.checked = s.showLiveScore;
        liveScoreChk.addEventListener('change', () => {
            settings.set('showLiveScore', liveScoreChk.checked);
        });
    }
    
    /**
     * Updates the live score display during gameplay.
     */
    updateLiveScore(declarerPoints, defenderPoints, showLiveScore) {
        if (showLiveScore) {
            this.els.liveScore.classList.remove('hidden');
            this.els.liveScore.textContent = `Alleinspieler: ${declarerPoints} | Gegner: ${defenderPoints}`;
        } else {
            this.els.liveScore.classList.add('hidden');
        }
    }
    
    resetLiveScore() {
        this.els.liveScore.classList.add('hidden');
        this.els.liveScore.textContent = 'Punkte: -';
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
        const stats = JSON.parse(localStorage.getItem("skatListStats")) || [];
        this.els.statsTableBody.innerHTML = '';
        
        if (stats.length === 0) {
            this.els.statsTableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #666;">Noch keine Listen absolviert.</td></tr>';
            this.els.statTotalGames.textContent = '0';
            this.els.statWinRatio.textContent = '0%';
            this.els.statWinStreak.textContent = '0';
            return;
        }

        let totalLists = stats.length;
        let wins = 0;
        let currentStreak = 0;
        let bestStreak = 0;

        // Process Dashboard
        stats.forEach(list => {
            const playerPoints = list.scores[2];
            const isWinner = list.winner === 'Du';
            
            if (isWinner) {
                wins++;
                currentStreak++;
                if (currentStreak > bestStreak) bestStreak = currentStreak;
            } else {
                currentStreak = 0;
            }
        });

        this.els.statTotalGames.textContent = totalLists;
        this.els.statWinRatio.textContent = Math.round((wins / totalLists) * 100) + '%';
        this.els.statWinStreak.textContent = bestStreak;
        
        // Render Table (Newest first)
        [...stats].reverse().forEach(list => {
            const tr = document.createElement('tr');
            const isWinner = list.winner === 'Du';
            
            tr.innerHTML = `
                <td>${list.date}</td>
                <td style="font-weight: bold; color: ${isWinner ? '#4caf50' : '#fff'}">${list.winner}</td>
                <td>${list.scores[0]}</td>
                <td>${list.scores[1]}</td>
                <td>${list.scores[2]}</td>
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

    _initCardDragging(el, config) {
        let isDragging = false;
        let startX, startY;
        let initialRect;
        let currentDropTarget = null;
        let placeholder = null;

        const onStart = (e) => {
            if (e.button && e.button !== 0) return; // Only left click
            
            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            initialRect = el.getBoundingClientRect();
            
            const moveHandler = (moveEvent) => {
                const moveX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const moveY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
                
                const deltaX = moveX - startX;
                const deltaY = moveY - startY;

                if (!isDragging && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                    isDragging = true;
                    
                    // Create placeholder to keep hand layout
                    placeholder = el.cloneNode(true);
                    placeholder.style.opacity = '0';
                    placeholder.style.pointerEvents = 'none';
                    el.parentNode.insertBefore(placeholder, el);
                    
                    el.classList.add('dragging-active');
                    el.style.width = initialRect.width + 'px';
                    el.style.height = initialRect.height + 'px';
                    el.style.left = initialRect.left + 'px';
                    el.style.top = initialRect.top + 'px';
                }

                if (isDragging) {
                    if (moveEvent.cancelable) moveEvent.preventDefault();
                    
                    el.style.left = (initialRect.left + deltaX) + 'px';
                    el.style.top = (initialRect.top + deltaY) + 'px';

                    // Target detection
                    const target = document.elementFromPoint(moveX, moveY);
                    const dropTarget = config.getValidTarget(target);
                    
                    if (dropTarget !== currentDropTarget) {
                        if (currentDropTarget) currentDropTarget.classList.remove('drag-over');
                        currentDropTarget = dropTarget;
                        if (currentDropTarget) currentDropTarget.classList.add('drag-over');
                    }
                }
            };

            const endHandler = (endEvent) => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', endHandler);
                window.removeEventListener('touchmove', moveHandler);
                window.removeEventListener('touchend', endHandler);

                if (isDragging) {
                    el.classList.remove('dragging-active');
                    
                    if (currentDropTarget) {
                        if (placeholder) {
                            placeholder.remove();
                            placeholder = null;
                        }
                        currentDropTarget.classList.remove('drag-over');
                        config.execute(el, currentDropTarget);
                        // Reset styles
                        el.style.position = '';
                        el.style.left = '';
                        el.style.top = '';
                        el.style.width = '';
                        el.style.height = '';
                    } else {
                        // Return animation
                        el.classList.add('returning');
                        el.style.left = initialRect.left + 'px';
                        el.style.top = initialRect.top + 'px';
                        
                        const currentPlaceholder = placeholder;
                        placeholder = null;
                        
                        setTimeout(() => {
                            el.classList.remove('returning');
                            el.style.position = '';
                            el.style.left = '';
                            el.style.top = '';
                            el.style.width = '';
                            el.style.height = '';
                            if (currentPlaceholder) currentPlaceholder.remove();
                        }, 300);
                    }
                    isDragging = false;
                } else if (config.onClick) {
                    // It was a click, not a drag
                    config.onClick(el);
                }
            };

            window.addEventListener('mousemove', moveHandler, { passive: false });
            window.addEventListener('mouseup', endHandler);
            window.addEventListener('touchmove', moveHandler, { passive: false });
            window.addEventListener('touchend', endHandler);
        };

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });
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
            this._initCardDragging(el, {
                getValidTarget: (target) => {
                    const dropSlot = Array.from(this.els.skatDiscardSlots).find(s => s === target || s.contains(target));
                    if (dropSlot && !dropSlot.hasChildNodes() && !el.parentElement.classList.contains('skat-slot')) {
                        return dropSlot;
                    }
                    if ((target === handContainer || handContainer.contains(target)) && el.parentElement.classList.contains('skat-slot')) {
                        return handContainer;
                    }
                    return null;
                },
                execute: (cardEl, target) => {
                    const cardId = cardEl.dataset.id;
                    if (target.classList.contains('skat-slot')) {
                        target.appendChild(cardEl);
                        target.dataset.cardId = cardId;
                        if (!discardedIds.includes(cardId)) discardedIds.push(cardId);
                    } else if (target === handContainer) {
                        const parentSlot = cardEl.parentElement;
                        handContainer.appendChild(cardEl);
                        parentSlot.dataset.cardId = '';
                        const index = discardedIds.indexOf(cardId);
                        if (index > -1) discardedIds.splice(index, 1);
                    }
                    this.els.btnConfirmSkat.disabled = (discardedIds.length !== 2);
                },
                onClick: (cardEl) => {
                    const parentSlot = cardEl.parentElement;
                    if (parentSlot.classList.contains('skat-slot')) {
                        handContainer.appendChild(cardEl);
                        parentSlot.dataset.cardId = '';
                        const index = discardedIds.indexOf(cardEl.dataset.id);
                        if (index > -1) discardedIds.splice(index, 1);
                        this.els.btnConfirmSkat.disabled = true;
                    } else {
                        const emptySlot = Array.from(this.els.skatDiscardSlots).find(s => !s.dataset.cardId);
                        if (emptySlot) {
                            emptySlot.appendChild(cardEl);
                            emptySlot.dataset.cardId = cardEl.dataset.id;
                            discardedIds.push(cardEl.dataset.id);
                            this.els.btnConfirmSkat.disabled = (discardedIds.length !== 2);
                        } else {
                            this.showMessage("Drücke zuerst eine Karte zurück auf die Hand!");
                        }
                    }
                }
            });
        };

        // Bind all current hand cards
        const cardEls = handContainer.querySelectorAll('.card-face');
        cardEls.forEach(bindCardInteractable);

        // Bind the 2 newly created cards residing in the skat slots
        this.els.skatDiscardSlots.forEach(s => {
            const cardInSlot = s.querySelector('.card-face');
            if (cardInSlot) bindCardInteractable(cardInSlot);
        });

        // Confirmation Callback
        this.els.btnConfirmSkat.disabled = false; // Initially 2 cards are in the skat
        this.els.btnConfirmSkat.onclick = () => {
             this.els.skatDecisionOverlay.classList.add('hidden');
             
             // Extract physical cards from slots to form the final skat
             const finalSkatId1 = this.els.skatDiscardSlots[0].dataset.cardId;
             const finalSkatId2 = this.els.skatDiscardSlots[1].dataset.cardId;
             
             // Cleanly remove bindings before continuing
             const allCards = [...handContainer.querySelectorAll('.card-face'), ...document.querySelectorAll('.skat-slot .card-face')];
             allCards.forEach(c => { 
                 const newC = c.cloneNode(true);
                 c.parentNode.replaceChild(newC, c);
             });
             
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
        
        const tableArea = document.getElementById('table-area');
        
        // Make cards draggable / clickable / touchable
        cardEls.forEach(el => {
            const cardId = el.dataset.id;
            const isDraggable = validIds.includes(cardId);
            
            if (isDraggable) {
                el.classList.add('valid-move');
                el.classList.remove('invalid-move');
                
                this._initCardDragging(el, {
                    getValidTarget: (target) => {
                        if (target && (target.id === 'table-area' || target.closest('#table-area'))) {
                            return tableArea;
                        }
                        return null;
                    },
                    execute: (cardEl, target) => {
                        onPlay(cardId);
                    },
                    onClick: (cardEl) => {
                        onPlay(cardId);
                    }
                });
                
                // Allow double click to play instantly as well
                el.ondblclick = () => onPlay(cardId);
            } else {
                el.classList.remove('valid-move');
                el.classList.add('invalid-move');
                el.style.pointerEvents = 'none'; // Ensure invalid cards don't react at all
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

    showGameOver(won, resultMsg, declarerPoints, oppPoints, evaluation = null) {
        this.els.gameOverOverlay.classList.remove('hidden');
        const resDiv = document.getElementById('results');
        const overbidEl = document.getElementById('overbid-warning');
        const detailsEl = document.getElementById('game-value-details');
        const valueLine = document.getElementById('game-value-line');
        const badgesEl = document.getElementById('game-badges');
        
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
        
        // Reset elements
        overbidEl.classList.add('hidden');
        detailsEl.classList.add('hidden');
        badgesEl.innerHTML = '';
        
        if (evaluation) {
            // Show game value details
            detailsEl.classList.remove('hidden');
            valueLine.textContent = `Spielwert: ${evaluation.details}`;
            
            // Overbid warning
            if (evaluation.overbid) {
                overbidEl.classList.remove('hidden');
            }
            
            // Badges for schneider / schwarz / hand
            if (evaluation.schneider) {
                badgesEl.innerHTML += '<span class="badge badge-schneider">Schneider</span>';
            }
            if (evaluation.schwarz) {
                badgesEl.innerHTML += '<span class="badge badge-schwarz">Schwarz</span>';
            }
            if (evaluation.matadors && evaluation.matadors.count > 0) {
                badgesEl.innerHTML += `<span class="badge badge-matadors">${evaluation.matadors.type} ${evaluation.matadors.count}</span>`;
            }
        }
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
