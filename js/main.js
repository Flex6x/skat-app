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
    
    // Initialize Game Engine (pass settings)
    const game = new Game(ui, aiControllers, window.appSettings);
    
    // Setup Restart Button (Game Over Overlay)
    ui.els.btnRestart.addEventListener('click', () => {
        ui.els.gameOverOverlay.classList.add('hidden');
        ui.clearTrickZone();
        game.reset();
        game.start();
    });
    
    // Setup Home Button (In-Game Menu Returning)
    ui.bindHomeButton(() => {
        if (window.confirm("Willst du wirklich das Spiel verlassen und ins Menü zurückkehren?")) {
            game.abort();
            ui.clearTrickZone();
            ui.showMainMenu(() => {
                game.reset();
                game.start();
            });
        }
    });

    // Start by showing the Main Menu
    ui.showMainMenu(() => {
        game.reset();
        game.start();
    });
});
