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
    
    const game = new Game(ui, aiControllers, window.appSettings);
    
    let sessionRounds = 0;
    let completedRounds = 0;
    let gameHistory = [];

    const startNewSession = () => {
        ui.showRoundSelection((rounds) => {
            sessionRounds = rounds;
            completedRounds = 0;
            gameHistory = [];
            ui.resetScoreboard();
            ui.hideMainMenu();
            startNewGame();
        }, () => {
            // Cancelled -> Go back to index
            window.location.href = 'index.html';
        });
    };

    const startNewGame = () => {
        game.reset();
        game.start((result) => {
            // Callback when game ends
            if (result) {
                if (result.passedIn) {
                    gameHistory.push({ passedIn: true });
                } else if (result.isRamsch) {
                    gameHistory.push({
                        isRamsch: true,
                        loserIndices: result.loserIndices
                    });
                } else {
                    gameHistory.push({
                        declarerId: result.declarerId,
                        value: result.gameValue,
                        won: result.won,
                        passedIn: false
                    });
                }
                ui.updateScoreboard(gameHistory);
            }
            completedRounds++;
            
            if (completedRounds >= sessionRounds) {
                // Session finished -> SAVE TO STATS
                saveListToStats(gameHistory);

                ui.els.btnRestart.textContent = ui.getTranslation('back_to_menu');
                ui.els.btnRestart.onclick = () => {
                    ui.els.gameOverOverlay.classList.add('hidden');
                    window.location.href = 'index.html';
                };
            } else {
                ui.els.btnRestart.textContent = `Nächstes Spiel (${completedRounds + 1}/${sessionRounds})`;
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
        history.forEach(game => {
            if (game.passedIn) return;
            
            if (game.isRamsch) {
                game.loserIndices.forEach(idx => totals[idx] -= 25);
            } else {
                const val = game.won ? game.value : -game.value;
                totals[game.declarerId] += val;
            }
        });

        // Determine winner
        const playerName = window.appSettings.current.nickname || 'Du';
        
        const listResult = {
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            scores: totals, // [bot2, bot1, player]
            rounds: history.length,
            ruleSet: window.appSettings.current.ruleSet
        };

        let stats = JSON.parse(localStorage.getItem("skatListStats")) || [];
        stats.push(listResult);
        localStorage.setItem("skatListStats", JSON.stringify(stats));
    };
    
    // Setup Home Button (In-Game Menu Returning)
    ui.bindHomeButton(() => {
        const msg = ui.getTranslation('home_confirm');
        if (window.confirm(msg)) {
            window.location.href = 'index.html';
        }
    });

    // Start by showing the Round Selection (since we are on play.html)
    ui.updateLanguageUI();
    startNewSession();
});

