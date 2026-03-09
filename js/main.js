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
            if (result && !result.passedIn) {
                gameHistory.push({
                    declarerId: result.declarerId,
                    value: result.gameValue,
                    won: result.won
                });
                ui.updateScoreboard(gameHistory);
            }
            completedRounds++;
            
            if (completedRounds >= sessionRounds) {
                // Session finished
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
