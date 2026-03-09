/**
 * Skat Main Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Settings
    window.appSettings = new Settings();

    // Initialize UI
    const ui = new UI();
    ui.bindSettingsForm(window.appSettings);
    
    // Initialize AI Controllers
    const aiControllers = [
        new AIController(0, 'Bot 2'),
        new AIController(1, 'Bot 1')
    ];
    
    // Session State
    let sessionRounds = 0;
    let completedRounds = 0;
    let gameHistory = []; // { declarerId, value, won }

    // Initialize Game Engine (pass settings)
    const game = new Game(ui, aiControllers, window.appSettings);
    
    const startNewSession = () => {
        ui.showRoundSelection((rounds) => {
            sessionRounds = rounds;
            completedRounds = 0;
            gameHistory = [];
            ui.resetScoreboard();
            ui.hideMainMenu();
            startNewGame();
        }, () => {
            // Cancelled
        });
    };

    const startNewGame = () => {
        game.reset();
        game.start((result) => {
            // Callback when game ends
            if (result) {
                if (result.passedIn) {
                    gameHistory.push({ passedIn: true });
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

                ui.els.btnRestart.textContent = 'Session beenden';
                ui.els.btnRestart.onclick = () => {
                    ui.els.gameOverOverlay.classList.add('hidden');
                    ui.showMainMenu(startNewSession);
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
            if (!game.passedIn) {
                const val = game.won ? game.value : -game.value;
                totals[game.declarerId] += val;
            }
        });

        // Determine winner
        const playerName = window.appSettings.current.nickname || 'Du';
        let winnerName = 'Aicore';
        if (totals[1] > totals[0] && totals[1] > totals[2]) winnerName = 'Aiden';
        if (totals[2] > totals[0] && totals[2] > totals[1]) winnerName = playerName;
        if (totals[0] === totals[1] && totals[0] === totals[2]) winnerName = 'Unentschieden';

        const listResult = {
            date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            winner: winnerName,
            scores: totals, // [bot2, bot1, player]
            rounds: history.length
        };

        let stats = JSON.parse(localStorage.getItem("skatListStats")) || [];
        stats.push(listResult);
        localStorage.setItem("skatListStats", JSON.stringify(stats));
    };
    
    // Setup Home Button (In-Game Menu Returning)
    ui.bindHomeButton(() => {
        if (window.confirm("Willst du wirklich das Spiel verlassen? Der Fortschritt in dieser Liste geht verloren.")) {
            game.abort();
            ui.clearTrickZone();
            ui.showMainMenu(startNewSession);
        }
    });

    // Start by showing the Main Menu
    ui.showMainMenu(startNewSession);
});
