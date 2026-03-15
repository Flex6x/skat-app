/**
 * auth.js - Supabase Authentication and Account System for Skat
 */

class Auth {
    constructor() {
        // These are your actual Supabase credentials
        this.supabaseUrl = window.SUPABASE_URL || 'https://wofiqfrnrwxwzsjyocxc.supabase.co';
        this.supabaseKey = window.SUPABASE_ANON_KEY || 'sb_publishable_yX7fYLj-F6D6BCAL5g74Bw_UFqCvUMt';
        
        if (this.supabaseUrl && this.supabaseUrl !== 'YOUR_SUPABASE_URL' && typeof supabase !== 'undefined') {
            this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
        } else {
            console.warn('Supabase client not initialized. Please provide SUPABASE_URL and SUPABASE_ANON_KEY.');
            this.client = null;
        }

        this.user = null;
        this.onAuthStateChangeCallbacks = [];
        
        this._init();
    }

    async _init() {
        if (!this.client) return;

        // Check current session
        const { data: { session } } = await this.client.auth.getSession();
        this.user = session?.user || null;

        // Listen for auth changes
        this.client.auth.onAuthStateChange((event, session) => {
            const newUser = session?.user || null;
            const changed = JSON.stringify(this.user) !== JSON.stringify(newUser);
            this.user = newUser;
            
            if (changed) {
                this._notifyAuthStateChange();
                this.updateUI();
                
                if (event === 'SIGNED_IN') {
                    this._checkAndShowImportPrompt();
                }
            }
        });

        // Initial UI update
        this.updateUI();
    }

    onAuthStateChange(callback) {
        this.onAuthStateChangeCallbacks.push(callback);
    }

    _notifyAuthStateChange() {
        this.onAuthStateChangeCallbacks.forEach(cb => cb(this.user));
    }

    isLoggedIn() {
        return !!this.user;
    }

    async loginWithMagicLink(email) {
        if (!this.client) return { error: 'Client not initialized' };
        return await this.client.auth.signInWithOtp({ 
            email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
    }

    async loginWithEmail(email, password) {
        if (!this.client) return { error: 'Client not initialized' };
        return await this.client.auth.signInWithPassword({ email, password });
    }

    async signUp(email, password) {
        if (!this.client) return { error: 'Client not initialized' };
        return await this.client.auth.signUp({ email, password });
    }

    async logout() {
        if (!this.client) return;
        await this.client.auth.signOut();
        window.location.reload(); // Simplest way to reset state
    }

    updateUI() {
        // Find or create the login container in the header
        const headerRight = document.querySelector('.header-right');
        if (!headerRight) return;

        let authContainer = document.getElementById('auth-container');
        if (!authContainer) {
            authContainer = document.createElement('div');
            authContainer.id = 'auth-container';
            authContainer.className = 'auth-container';
            headerRight.appendChild(authContainer);
        }

        if (this.isLoggedIn()) {
            const email = this.user.email;
            const shortEmail = email.split('@')[0];
            authContainer.innerHTML = `
                <div class="profile-dropdown">
                    <button class="nav-link profile-btn" id="btn-profile">
                        <span class="user-icon">👤</span> ${shortEmail}
                    </button>
                    <div class="dropdown-content hidden" id="profile-dropdown-content">
                        <button onclick="window.location.href='stats.html'" data-i18n="view_stats">Stats</button>
                        <button id="btn-logout" data-i18n="logout">Logout</button>
                    </div>
                </div>
            `;
            
            // Add dropdown toggle logic
            const btnProfile = document.getElementById('btn-profile');
            const dropdown = document.getElementById('profile-dropdown-content');
            if (btnProfile && dropdown) {
                btnProfile.onclick = (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                };
                
                document.addEventListener('click', () => {
                    dropdown.classList.add('hidden');
                });
            }

            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) btnLogout.onclick = () => this.logout();

        } else {
            authContainer.innerHTML = `
                <button class="nav-link login-btn" id="btn-open-login" data-i18n="login">Login</button>
            `;
            
            const btnOpenLogin = document.getElementById('btn-open-login');
            if (btnOpenLogin) btnOpenLogin.onclick = () => this.showLoginModal();
        }
    }

    showLoginModal() {
        const modalId = 'login-modal-overlay';
        if (document.getElementById(modalId)) return;

        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'menu-overlay';
        overlay.innerHTML = `
            <div class="menu-content login-modal">
                <button class="btn-close-modal" id="btn-close-login">×</button>
                <h2 data-i18n="account_login">Account Login</h2>
                <p class="subtitle" data-i18n="login_subtitle">Save your stats in the cloud.</p>
                
                <div class="login-tabs">
                    <button class="login-tab-btn active" data-tab="magic-link">Magic Link</button>
                    <button class="login-tab-btn" data-tab="password">Password</button>
                </div>

                <div id="magic-link-section" class="auth-section">
                    <input type="email" id="login-email-magic" placeholder="Email" class="nickname-input" style="margin-bottom: 15px;">
                    <button id="btn-send-magic" class="btn primary large-btn" style="width: 100%;">Send Login Link</button>
                    <p class="auth-note">We'll email you a link to log in instantly.</p>
                </div>

                <div id="password-section" class="auth-section hidden">
                    <input type="email" id="login-email" placeholder="Email" class="nickname-input" style="margin-bottom: 10px;">
                    <input type="password" id="login-password" placeholder="Password" class="nickname-input" style="margin-bottom: 15px;">
                    <div style="display: flex; gap: 10px;">
                        <button id="btn-login-pass" class="btn primary" style="flex: 1;">Login</button>
                        <button id="btn-signup-pass" class="btn" style="flex: 1;">Sign Up</button>
                    </div>
                </div>

                <div id="auth-status" class="auth-status hidden"></div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Modal Close logic
        const closeBtn = document.getElementById('btn-close-login');
        closeBtn.onclick = () => document.body.removeChild(overlay);
        overlay.onclick = (e) => {
            if (e.target === overlay) document.body.removeChild(overlay);
        };

        // Tab switching logic
        const tabs = overlay.querySelectorAll('.login-tab-btn');
        const magicSection = document.getElementById('magic-link-section');
        const passSection = document.getElementById('password-section');

        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.dataset.tab === 'magic-link') {
                    magicSection.classList.remove('hidden');
                    passSection.classList.add('hidden');
                } else {
                    magicSection.classList.add('hidden');
                    passSection.classList.remove('hidden');
                }
            };
        });

        // Auth actions
        const statusEl = document.getElementById('auth-status');
        const showStatus = (msg, isError = false) => {
            statusEl.innerText = msg;
            statusEl.className = 'auth-status ' + (isError ? 'error' : 'success');
            statusEl.classList.remove('hidden');
        };

        document.getElementById('btn-send-magic').onclick = async () => {
            const email = document.getElementById('login-email-magic').value;
            if (!email) return showStatus('Please enter email', true);
            const { error } = await this.loginWithMagicLink(email);
            if (error) showStatus(error.message, true);
            else showStatus('Check your email for the login link!');
        };

        document.getElementById('btn-login-pass').onclick = async () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            if (!email || !pass) return showStatus('Please enter email and password', true);
            const { error } = await this.loginWithEmail(email, pass);
            if (error) showStatus(error.message, true);
            else document.body.removeChild(overlay);
        };

        document.getElementById('btn-signup-pass').onclick = async () => {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            if (!email || !pass) return showStatus('Please enter email and password', true);
            const { error } = await this.signUp(email, pass);
            if (error) showStatus(error.message, true);
            else showStatus('Signup successful! Please check your email.');
        };
    }

    async _checkAndShowImportPrompt() {
        const localStats = localStorage.getItem('skatListStats');
        const alreadyImported = localStorage.getItem('skatStatsImported') === 'true';
        
        if (localStats && !alreadyImported) {
            this.showImportPrompt();
        }
    }

    showImportPrompt() {
        const overlay = document.createElement('div');
        overlay.className = 'menu-overlay';
        overlay.style.zIndex = '3000';
        overlay.innerHTML = `
            <div class="menu-content import-modal">
                <h2 data-i18n="import_stats_title">Found local statistics</h2>
                <p class="subtitle" data-i18n="import_stats_desc">We found local game statistics on this device. Do you want to import them into your account?</p>
                <div class="menu-buttons" style="display: flex; gap: 20px; width: 100%;">
                    <button id="btn-import-stats" class="btn primary large-btn" style="flex: 1;">Import Stats</button>
                    <button id="btn-skip-import" class="btn large-btn" style="flex: 1;">Skip</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('btn-import-stats').onclick = async () => {
            await this.importLocalStats();
            localStorage.setItem('skatStatsImported', 'true');
            document.body.removeChild(overlay);
        };

        document.getElementById('btn-skip-import').onclick = () => {
            localStorage.setItem('skatStatsImported', 'true');
            document.body.removeChild(overlay);
        };
    }

    async importLocalStats() {
        const localStats = JSON.parse(localStorage.getItem('skatListStats')) || [];
        if (localStats.length === 0) return;

        // Aggregate for the 'stats' table
        const aggregated = this._aggregateStats(localStats);
        
        try {
            // Update stats table
            const { error: statsError } = await this.client
                .from('stats')
                .upsert({
                    user_id: this.user.id,
                    ...aggregated,
                    updated_at: new Date().toISOString()
                });

            if (statsError) throw statsError;

            // Also import list history if we want to support it (optional, but good for History tab)
            // For now, let's just stick to the user's requested tables.
            
            // Check for badges
            const badges = this._calculateBadges(aggregated);
            if (badges.length > 0) {
                const badgeRows = badges.map(id => ({ user_id: this.user.id, badge_id: id }));
                const { error: badgeError } = await this.client
                    .from('badges')
                    .upsert(badgeRows);
                if (badgeError) console.error('Error importing badges:', badgeError);
            }

            console.log('Stats imported successfully');
        } catch (err) {
            console.error('Failed to import stats:', err);
            alert('Failed to import stats: ' + err.message);
        }
    }

    _aggregateStats(listStats) {
        const agg = {
            games_played: 0,
            wins: 0,
            losses: 0,
            grand_wins: 0,
            null_wins: 0,
            ramsch_wins: 0,
            rollmops_wins: 0,
            big_busch: 0,
            trumpf_count: 0
        };

        listStats.forEach(list => {
            agg.games_played += (list.rounds || 0);
            
            // Heuristic for wins/losses based on player score (index 2)
            // In a real app we'd have more precise data, but let's use what we have
            if (list.scores && list.scores[2] > list.scores[0] && list.scores[2] > list.scores[1]) {
                agg.wins++;
            } else {
                agg.losses++;
            }

            agg.grand_wins += (list.winGrandCount || list.anzahlGrandSpiele || 0);
            agg.null_wins += (list.winNullCount || list.anzahlNullSpiele || 0);
            agg.ramsch_wins += (list.winRamschCount || list.anzahlRamsch || 0);
            agg.rollmops_wins += (list.winRollmopsCount || list.anzahlRollmops || 0);
            agg.big_busch += (list.anzahlBigBusch || 0);
            agg.trumpf_count = Math.max(agg.trumpf_count, list.maxTrumpCount || 0);
        });

        return agg;
    }

    _calculateBadges(agg) {
        const unlocked = [];
        if (agg.winSchwarzCount >= 5) unlocked.push('unbesiegbar');
        if (agg.wonAllInListCount >= 1) unlocked.push('seriensieger');
        if (agg.grand_wins >= 10) unlocked.push('grandmeister');
        if (agg.null_wins >= 10) unlocked.push('null_ass');
        if (agg.rollmops_wins >= 3) unlocked.push('rollmops');
        if (agg.big_busch >= 1) unlocked.push('big_busch');
        if (agg.ramsch_wins >= 10) unlocked.push('ramsch_koenig');
        if (agg.trumpf_count >= 10) unlocked.push('trumpfmaschine');
        if (agg.games_played >= 10) unlocked.push('anfaenger');
        if (agg.games_played >= 50) unlocked.push('stammspieler');
        if (agg.games_played >= 200) unlocked.push('veteran');
        // 'ohne_4' needs specific flag from history, maybe skip for simple import
        return unlocked;
    }

    /**
     * Data Storage Abstraction
     */
    async getStats() {
        if (this.isLoggedIn()) {
            const { data, error } = await this.client
                .from('stats')
                .select('*')
                .eq('user_id', this.user.id)
                .single();
            if (error && error.code !== 'PGRST116') console.error('Error fetching stats:', error);
            return data;
        } else {
            return JSON.parse(localStorage.getItem('skatListStats')) || [];
        }
    }

    async saveListResult(listResult) {
        // Always save to local storage for offline support/backup
        let localStats = JSON.parse(localStorage.getItem('skatListStats')) || [];
        localStats.push(listResult);
        localStorage.setItem('skatListStats', JSON.stringify(localStats));

        if (this.isLoggedIn()) {
            // Update cloud stats (incrementally)
            // For simplicity in this demo, we'll fetch then update
            const current = await this.getStats() || {
                games_played: 0, wins: 0, losses: 0, grand_wins: 0, null_wins: 0,
                ramsch_wins: 0, rollmops_wins: 0, big_busch: 0, trumpf_count: 0
            };

            const isWin = listResult.scores && listResult.scores[2] > listResult.scores[0] && listResult.scores[2] > listResult.scores[1];
            
            const updated = {
                user_id: this.user.id,
                games_played: (current.games_played || 0) + (listResult.rounds || 0),
                wins: (current.wins || 0) + (isWin ? 1 : 0),
                losses: (current.losses || 0) + (isWin ? 0 : 1),
                grand_wins: (current.grand_wins || 0) + (listResult.winGrandCount || 0),
                null_wins: (current.null_wins || 0) + (listResult.winNullCount || 0),
                ramsch_wins: (current.ramsch_wins || 0) + (listResult.winRamschCount || 0),
                rollmops_wins: (current.rollmops_wins || 0) + (listResult.winRollmopsCount || 0),
                big_busch: (current.big_busch || 0) + (listResult.anzahlBigBusch || 0),
                trumpf_count: Math.max(current.trumpf_count || 0, listResult.maxTrumpCount || 0),
                updated_at: new Date().toISOString()
            };

            await this.client.from('stats').upsert(updated);
            
            // Check and save badges if unlocked
            const newBadges = this._calculateBadges(updated);
            if (newBadges.length > 0) {
                const badgeRows = newBadges.map(id => ({ user_id: this.user.id, badge_id: id }));
                await this.client.from('badges').upsert(badgeRows);
            }
        }
    }
}

// Initialize Auth
window.auth = new Auth();
