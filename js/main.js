/**
 * Skat Main Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Settings
    window.appSettings = new Settings();

    // Initialize UI
    const ui = new UI();

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
    
    let sessionRounds = 0;
    let completedRounds = 0;
    let gameHistory = [];

    const saveSessionState = () => {
        const state = {
            sessionRounds,
            completedRounds,
            gameHistory
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
                        isOuvert: result.isOuvert
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

                ui.els.btnRestart.textContent = ui.getTranslation('back_to_menu');
                ui.els.btnRestart.onclick = () => {
                    ui.els.gameOverOverlay.classList.add('hidden');
                    window.location.href = 'index.html';
                };
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
                game.loserIndices.forEach(idx => totals[idx] -= 25);
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
                            // Grand Ouvert
                            if (game.isOuvert) {
                                gameTypeCounts.anzahlGrandOuvert++;
                            }
                            // Ohne 4: check matadors
                            if (game.matadors && game.matadors.type === 'ohne' && game.matadors.count >= 4) {
                                winGrandOhne4Count++;
                            }
                        } else if (game.trumpMode === 'Null') {
                            winNullCount++;
                            gameTypeCounts.anzahlNullSpiele++;
                            // Null Ouvert
                            if (game.isOuvert) {
                                gameTypeCounts.anzahlNullOuvert++;
                            }
                        }
                        
                        if (game.handGame) {
                            gameTypeCounts.anzahlHandspiele++;
                        }
                        
                        // Count both announced and actual Schneider/Schwarz (if won)
                        if (game.schwarz || game.announcedSchwarz) {
                            winSchwarzCount++;
                            gameTypeCounts.anzahlSchwarz++;
                        } else if (game.schneider || game.announcedSchneider) {
                            gameTypeCounts.anzahlSchneider++;
                        }
                        
                        // Big Busch: Hand Grand
                        if (game.handGame && game.trumpMode === 'Grand') {
                            gameTypeCounts.anzahlBigBusch++;
                        }
                        
                        // Rollmops: Hand Null
                        if (game.handGame && game.trumpMode === 'Null') {
                            winRollmopsCount++;
                            gameTypeCounts.anzahlRollmops++;
                        }
                    }
                }
            }
        });

        const listResult = {
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            scores: totals, // [bot2, bot1, player]
            rounds: history.length,
            ruleSet: window.appSettings.current.ruleSet,
            ...gameTypeCounts,
            // New Badge Fields
            winGrandCount,
            winNullCount,
            winSchwarzCount,
            winRollmopsCount,
            winRamschCount,
            maxGameValue,
            maxTrumpCount,
            winGrandOhne4Count,
            wonAllInList: (humanGamesPlayed > 0 && humanGamesPlayed === humanGamesWon)
        };

        let stats = JSON.parse(localStorage.getItem("skatListStats")) || [];
        stats.push(listResult);
        localStorage.setItem("skatListStats", JSON.stringify(stats));
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

