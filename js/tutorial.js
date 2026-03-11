/**
 * Skat Interactive Tutorial
 */

class Tutorial {
    constructor(ui) {
        this.ui = ui;
        this.currentStep = 0;
        this.isActive = false;
        
        this.steps = [
            {
                element: '#player-hand',
                textKey: 'tut_step1',
                position: 'top'
            },
            {
                element: '#bidding-overlay',
                textKey: 'tut_step2',
                position: 'right',
                onShow: () => this.ui.els.biddingOverlay.classList.remove('hidden')
            },
            {
                element: '#trump-overlay',
                textKey: 'tut_step3',
                position: 'left',
                onShow: () => {
                    this.ui.els.biddingOverlay.classList.add('hidden');
                    this.ui.els.trumpOverlay.classList.remove('hidden');
                }
            },
            {
                element: '#trick-zone',
                textKey: 'tut_step4',
                position: 'top',
                onShow: () => this.ui.els.trumpOverlay.classList.add('hidden')
            },
            {
                element: '.game-info-container',
                textKey: 'tut_step5',
                position: 'bottom'
            },
            {
                element: '.menu-header',
                textKey: 'tut_step6',
                position: 'bottom'
            }
        ];

        this.overlay = document.getElementById('tutorial-overlay');
        this.spotlight = document.getElementById('tutorial-spotlight');
        this.card = document.getElementById('tutorial-card');
        this.text = document.getElementById('tutorial-text');
        
        this.btnNext = document.getElementById('btn-next-tutorial');
        this.btnPrev = document.getElementById('btn-prev-tutorial');

        this.initEvents();
    }

    initEvents() {
        this.btnNext.onclick = () => this.next();
        this.btnPrev.onclick = () => this.prev();
    }

    start() {
        this.isActive = true;
        this.currentStep = 0;
        if (this.overlay) this.overlay.classList.remove('hidden');
        if (this.ui.els.gameContainer) this.ui.els.gameContainer.classList.remove('hidden');
        if (this.ui.els.mainMenu) this.ui.els.mainMenu.classList.add('hidden');
        this.showStep();
    }

    stop() {
        this.isActive = false;
        if (this.overlay) this.overlay.classList.add('hidden');
        if (this.ui.els.gameContainer) this.ui.els.gameContainer.classList.add('hidden');
        if (this.ui.els.mainMenu) this.ui.els.mainMenu.classList.remove('hidden');
        if (this.ui.els.biddingOverlay) this.ui.els.biddingOverlay.classList.add('hidden');
        if (this.ui.els.trumpOverlay) this.ui.els.trumpOverlay.classList.add('hidden');
        localStorage.setItem('skat_tutorial_completed', 'true');
        
        if (this.finish) this.finish();
    }

    next() {
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep();
        } else {
            this.stop();
        }
    }

    prev() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }

    showStep() {
        const step = this.steps[this.currentStep];
        const el = document.querySelector(step.element);
        
        if (step.onShow) step.onShow();

        // Update Text
        this.text.textContent = this.ui.getTranslation(step.textKey);
        
        // Spotlight
        if (el) {
            const rect = el.getBoundingClientRect();
            const padding = 10;
            this.spotlight.style.width = `${rect.width + padding * 2}px`;
            this.spotlight.style.height = `${rect.height + padding * 2}px`;
            this.spotlight.style.left = `${rect.left - padding}px`;
            this.spotlight.style.top = `${rect.top - padding}px`;
            this.spotlight.style.opacity = '1';

            // Position Card
            this.positionCard(rect, step.position);
        } else {
            // Center spotlight if no element
            this.spotlight.style.width = '0';
            this.spotlight.style.height = '0';
            this.spotlight.style.left = '50%';
            this.spotlight.style.top = '50%';
            this.spotlight.style.opacity = '0';
            this.card.style.left = '50%';
            this.card.style.top = '50%';
            this.card.style.transform = 'translate(-50%, -50%)';
        }

        this.btnPrev.disabled = (this.currentStep === 0);
        this.btnNext.textContent = this.currentStep === this.steps.length - 1 ? 
            this.ui.getTranslation('finish') : this.ui.getTranslation('next');
    }

    positionCard(targetRect, preferredPos) {
        const cardWidth = 320;
        const padding = 20;
        let left, top;

        if (preferredPos === 'top') {
            left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
            top = targetRect.top - 250;
        } else if (preferredPos === 'bottom') {
            left = targetRect.left + (targetRect.width / 2) - (cardWidth / 2);
            top = targetRect.bottom + padding;
        } else if (preferredPos === 'left') {
            left = targetRect.left - cardWidth - padding;
            top = targetRect.top + (targetRect.height / 2) - 150;
        } else if (preferredPos === 'right') {
            left = targetRect.right + padding;
            top = targetRect.top + (targetRect.height / 2) - 150;
        } else {
            // Center
            left = window.innerWidth / 2 - cardWidth / 2;
            top = window.innerHeight / 2 - 100;
        }

        // Bounds check
        left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - 300 - padding));

        this.card.style.left = `${left}px`;
        this.card.style.top = `${top}px`;
        this.card.style.transform = 'none';
    }
}
