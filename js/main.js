/**
 * Skat Main Initialization
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI
    const ui = new UI();
    
    // Initialize AI Controllers
    const aiControllers = [
        new AIController(0, 'Bot 2'),
        new AIController(1, 'Bot 1')
    ];
    
    // Initialize Game Engine
    const game = new Game(ui, aiControllers);
    
    // Setup Restart Button
    ui.els.btnRestart.addEventListener('click', () => {
        ui.els.gameOverOverlay.classList.add('hidden');
        ui.clearTrickZone();
        game.reset();
        game.start();
    });
    
    // Start first game
    game.start();
});
