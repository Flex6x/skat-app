/**
 * Skat Main Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Settings
    window.appSettings = new Settings();

    // Initialize UI
    window.ui = new UI();
    const ui = window.ui;

    // Only proceed if we are on a page with a game container
    if (!ui.els.gameContainer) {
        ui.updateLanguageUI();
        return;
    }

    ui.bindSettingsForm(window.appSettings);
    
    // Initialize AI Controllers
    const aiControllers = [
        new AIController(0, 'Bot 2'),
        new AIController(1, 'Bot 1')
    ];
    
    window.game = new Game(ui, aiControllers, window.appSettings);
    const game = window.game;
    
    // Check for Ramsch Mode in URL
    const urlParams = new URLSearchParams(window.location.search);
    const isRamschMode = urlParams.get('mode') === 'ramsch';
    if (isRamschMode) {
        game.isRamschMode = true;
    }
    
    let sessionRounds = 0;
    let completedRounds = 0;
    let gameHistory = [];

    const saveSessionState = () => {
        const state = {
            sessionRounds,
            completedRounds,
            gameHistory,
            isRamschMode
        };
        localStorage.setItem('skatSessionState', JSON.stringify(state));
    };

    const startNewSession = () => {
        const savedSession = localStorage.getItem('skatSessionState');
        const savedGame = localStorage.getItem('skatGameState');

        if (savedSession && savedGame) {
            const session = JSON.parse(savedSession);
            const gameData = JSON.parse(savedGame);
            
            // Restore session automatically
            sessionRounds = session.sessionRounds;
            completedRounds = session.completedRounds;
            gameHistory = session.gameHistory;
            if (session.isRamschMode) {
                game.isRamschMode = true;
            }
            
            ui.hideMainMenu();
            ui.updateScoreboard(gameHistory);
            
            // Initialize game and resume
            game.resume(gameData);
            return;
        }

        ui.showRoundSelection((rounds) => {
            sessionRounds = rounds;
            completedRounds = 0;
            gameHistory = [];
            ui.resetScoreboard();
            ui.hideMainMenu();
            saveSessionState();
            startNewGame();
        }, () => {
            // Cancelled -> Go back to index
            window.location.href = 'index.html';
        });
    };

    const startNewGame = () => {
        game.reset();
        saveSessionState();
        game.start((result) => {
            // Callback when game ends
            localStorage.removeItem('skatGameState');
            if (result) {
                if (result.passedIn) {
                    gameHistory.push({ passedIn: true });
                } else if (result.isRamsch) {
                    gameHistory.push({
                        isRamsch: true,
                        loserIndices: result.loserIndices,
                        individualScores: result.individualScores,
                        trumpMode: result.trumpMode,
                        handGame: result.handGame,
                        schneider: result.schneider,
                        schwarz: result.schwarz,
                        announcedSchneider: result.announcedSchneider,
                        announcedSchwarz: result.announcedSchwarz,
                        declarerTrumpCount: result.declarerTrumpCount,
                        matadors: result.matadors
                    });
                } else {
                    gameHistory.push({
                        declarerId: result.declarerId,
                        value: result.gameValue,
                        won: result.won,
                        passedIn: false,
                        trumpMode: result.trumpMode,
                        handGame: result.handGame,
                        schneider: result.schneider,
                        schwarz: result.schwarz,
                        announcedSchneider: result.announcedSchneider,
                        announcedSchwarz: result.announcedSchwarz,
                        declarerTrumpCount: result.declarerTrumpCount,
                        matadors: result.matadors,
                        isOuvert: result.isOuvert,
                        playerRollmops: result.playerRollmops
                    });
                }
                ui.updateScoreboard(gameHistory);
            }
            completedRounds++;
            saveSessionState();
            
            if (completedRounds >= sessionRounds) {
                // Session finished -> SAVE TO STATS
                saveListToStats(gameHistory);
                localStorage.removeItem('skatSessionState');

                // CALCULATE TOTALS FOR SUMMARY
                const finalTotals = [0, 0, 0];
                gameHistory.forEach(g => {
                    if (g.passedIn) return;
                    if (g.isRamsch) {
                        // flat -25 in NORMAL mode, actual individualScores in pure mode
                        if (isRamschMode && g.individualScores) {
                             g.individualScores.forEach((pts, i) => finalTotals[i] -= pts);
                        } else {
                             g.loserIndices.forEach(idx => finalTotals[idx] -= 25);
                        }
                    } else {
                        const val = g.won ? g.value : -g.value;
                        finalTotals[g.declarerId] += val;
                    }
                });

                // Show Session Summary Overlay
                ui.showSessionSummary(gameHistory, finalTotals, () => {
                    window.location.href = 'index.html';
                });
            } else {
                const nextGameLabel = ui.getTranslation('new_game');
                ui.els.btnRestart.textContent = `${nextGameLabel} (${completedRounds + 1}/${sessionRounds})`;
                ui.els.btnRestart.onclick = () => {
                    ui.els.gameOverOverlay.classList.add('hidden');
                    ui.clearTrickZone();
                    startNewGame();
                };
            }
        });
    };

    const saveListToStats = (history) => {
        // Skip global stats for standalone Ramsch Mode
        if (isRamschMode) return;

        let totals = [0, 0, 0];
        
        // For badge tracking across the list
        let winGrandCount = 0;
        let winNullCount = 0;
        let winSchwarzCount = 0;
        let winRollmopsCount = 0;
        let winRamschCount = 0;
        let maxGameValue = 0;
        let maxTrumpCount = 0;
        let winGrandOhne4Count = 0;
        let winNullNo7Count = 0;
        let winEichelCount = 0;
        let winGruenCount = 0;
        let winRotCount = 0;
        let winSchellenCount = 0;
        let winRamschZeroCount = 0;
        let humanGamesPlayed = 0;
        let humanGamesWon = 0;

        // Initialize game type counters (User specific)
        let gameTypeCounts = {
            anzahlGrandSpiele: 0,
            anzahlNullSpiele: 0,
            anzahlHandspiele: 0,
            anzahlSchneider: 0,
            anzahlSchwarz: 0,
            anzahlRollmops: 0,
            anzahlRamsch: 0,
            anzahlBigBusch: 0,
            anzahlGrandOuvert: 0,
            anzahlNullOuvert: 0
        };
        
        history.forEach(game => {
            if (game.passedIn) return;
            
            if (game.isRamsch) {
                // Scoring in history totals: 
                // In Normal Mode we ALWAYS use flat -25 (as requested).
                // (Note: isRamschMode is true ONLY in pure Ramsch mode, where we skip saveListToStats anyway)
                game.loserIndices.forEach(idx => totals[idx] -= 25);

                // Ramsch Zero Points (Jungfrau) - Check if user (index 2) got 0 points
                // In Normal mode, points are not tracked in individualScores, so we can't fully check this 
                // UNLESS we store points even in normal mode. 
                // However, "Jungfrau" usually means taking no tricks/points.
                // Assuming `individualScores` might be present even if we use flat -25 for totals.
                if (game.individualScores && game.individualScores[2] === 0) {
                    winRamschZeroCount++;
                }

                if (!game.loserIndices.includes(2)) {
                    winRamschCount++;
                }
                gameTypeCounts.anzahlRamsch++;
            } else {
                const val = game.won ? game.value : -game.value;
                totals[game.declarerId] += val;
                
                // ONLY count game type stats if the HUMAN player (id 2) was the declarer
                if (game.declarerId === 2) {
                    humanGamesPlayed++;
                    if (game.won) {
                        humanGamesWon++;
                        maxGameValue = Math.max(maxGameValue, game.value);
                        maxTrumpCount = Math.max(maxTrumpCount, game.declarerTrumpCount || 0);

                        if (game.trumpMode === 'Grand') {
                            winGrandCount++;
                            gameTypeCounts.anzahlGrandSpiele++;
                            if (game.handGame && game.isOuvert) {
                                gameTypeCounts.anzahlGrandOuvert++;
                            }
                            if (game.matadors && game.matadors.type === 'ohne' && game.matadors.count >= 4) {
                                winGrandOhne4Count++;
                            }
                        } else if (game.trumpMode === 'Null') {
                            winNullCount++;
                            gameTypeCounts.anzahlNullSpiele++;
                            if (game.isOuvert) {
                                gameTypeCounts.anzahlNullOuvert++;
                            }
                            // Führer Badge: Null without 7
                            // We need to know if player had a 7. 
                            // Since we don't store the full hand in history, we rely on a flag or assume check.
                            // We will add `hasSeven` to game result in next step.
                            if (game.playerHasSeven === false) {
                                winNullNo7Count++;
                            }
                        } else {
                            // Suit Games
                            if (game.trumpMode === 'Eichel') winEichelCount++;
                            else if (game.trumpMode === 'Grün') winGruenCount++;
                            else if (game.trumpMode === 'Rot') winRotCount++;
                            else if (game.trumpMode === 'Schellen') winSchellenCount++;
                        }
                        
                        if (game.handGame) {
                            gameTypeCounts.anzahlHandspiele++;
                        }
                        
                        if (game.schwarz || game.announcedSchwarz) {
                            winSchwarzCount++;
                            gameTypeCounts.anzahlSchwarz++;
                        } else if (game.schneider || game.announcedSchneider) {
                            gameTypeCounts.anzahlSchneider++;
                        }
                        
                        if (game.value === 264 && game.won) {
                            gameTypeCounts.anzahlBigBusch++;
                        }
                    }
                }

                const humanWonThisGame = (game.declarerId === 2) ? game.won : !game.won;
                if (!game.isRamsch && game.playerRollmops && game.playerRollmops[2] && humanWonThisGame) {
                    winRollmopsCount++;
                    gameTypeCounts.anzahlRollmops++;
                }
            }
        });

        const listResult = {
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            scores: totals, // [bot2, bot1, player]
            rounds: history.length,
            ruleSet: window.appSettings.current.ruleSet,
            isPureRamschList: isRamschMode, 
            ...gameTypeCounts,
            // New Badge Fields
            winGrandCount,
            winNullCount,
            winSchwarzCount,
            winRollmopsCount,
            winRamschCount: winRamschCount + (isRamschMode && (totals[2] === Math.max(...totals)) ? 1 : 0),
            maxGameValue,
            maxTrumpCount,
            winGrandOhne4Count,
            winNullNo7Count,
            winEichelCount,
            winGruenCount,
            winRotCount,
            winSchellenCount,
            winRamschZeroCount,
            wonAllInList: (humanGamesPlayed > 0 && humanGamesPlayed === humanGamesWon)
        };

        if (window.storageService) {
            window.storageService.saveGameResult(listResult);
        } else {
            let stats = JSON.parse(localStorage.getItem("skatListStats")) || [];
            stats.push(listResult);
            localStorage.setItem("skatListStats", JSON.stringify(stats));
        }
    };
    
    // Setup Home Button (In-Game Menu Returning)
    ui.bindHomeButton(() => {
        const msg = ui.getTranslation('home_confirm');
        if (window.confirm(msg)) {
            localStorage.removeItem('skatSessionState');
            localStorage.removeItem('skatGameState');
            window.location.href = 'index.html';
        }
    });

    // Start by showing the Round Selection (since we are on play.html)
    ui.updateLanguageUI();
    startNewSession();
});

