/* AUẞER BETRIEB */
/**
 * Skat Survey Manager
 * Handles showing the one-time survey and storing responses.
 */
class SkatSurvey {
    constructor() {
        this.SURVEY_KEY = 'skat_survey_completed_v1';
        this.init();
    }

    async init() {
        const isMainMenu = window.location.pathname.endsWith('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/');
        if (!isMainMenu) return;

        if (localStorage.getItem(this.SURVEY_KEY)) return;

        setTimeout(() => this.showModal(), 1500);
    }

    showModal() {
        if (document.getElementById('survey-modal-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'survey-modal-overlay';
        overlay.className = 'survey-modal-overlay';

        overlay.innerHTML = `
            <div class="survey-modal-container">
                <header class="survey-header">
                    <h2>Deine Meinung zählt! 🃏</h2>
                    <p>Hilf uns, Skat-König noch besser zu machen.</p>
                </header>

                <div class="survey-question-box">
                    <p>1. Soll ein expliziter <b>Ramsch Modus</b> integriert werden?</p>
                    <p class="survey-hint">Dieser ist ein Minigame und zählt somit nicht in die Statistiken.</p>
                    <div class="survey-radio-group">
                        <label class="survey-radio-label">
                            <input type="radio" name="ramsch" value="yes"> Ja
                        </label>
                        <label class="survey-radio-label">
                            <input type="radio" name="ramsch" value="no"> Nein
                        </label>
                    </div>
                </div>

                <div class="survey-question-box">
                    <p>2. Soll ein <b>Mini Store</b> implementiert werden?</p>
                    <p class="survey-hint">Dort können zum Beispiel weitere Kartendesigns durch eine neue Währung gekauft werden.</p>
                    <div class="survey-radio-group">
                        <label class="survey-radio-label">
                            <input type="radio" name="store" value="yes"> Ja
                        </label>
                        <label class="survey-radio-label">
                            <input type="radio" name="store" value="no"> Nein
                        </label>
                    </div>
                </div>

                <div class="survey-footer">
                    <button id="btn-submit-survey" class="btn primary btn-survey-finish" disabled>Umfrage absenden</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const btnSubmit = document.getElementById('btn-submit-survey');
        const radios = overlay.querySelectorAll('input[type="radio"]');

        const validate = () => {
            const r1 = overlay.querySelector('input[name="ramsch"]:checked');
            const r2 = overlay.querySelector('input[name="store"]:checked');
            btnSubmit.disabled = !(r1 && r2);
        };

        radios.forEach(r => r.addEventListener('change', validate));

        btnSubmit.onclick = async () => {
            const r1 = overlay.querySelector('input[name="ramsch"]:checked').value;
            const r2 = overlay.querySelector('input[name="store"]:checked').value;

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Wird gesendet...';

            try {
                await this.saveResponse(r1, r2);
                localStorage.setItem(this.SURVEY_KEY, 'true');
                document.body.removeChild(overlay);
            } catch (err) {
                console.error('Survey error:', err);
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Fehler! Erneut versuchen';
            }
        };
    }

    async saveResponse(ramsch, store) {
        if (window.auth && window.auth.client) {
            const { error } = await window.auth.client
                .from('survey_results')
                .insert([{
                    ramsch_mode: ramsch,
                    mini_store: store,
                    user_agent: navigator.userAgent
                }]);
            
            if (error) throw error;
        } else {
            console.warn('Supabase client not available.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.skatSurvey = new SkatSurvey();
});
