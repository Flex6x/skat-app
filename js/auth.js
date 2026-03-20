/**
 * auth.js - Supabase Authentication and Storage Service for Skat
 */

class StorageService {
    constructor(auth) {
        this.auth = auth;
        this.LOCAL_STATS_KEY = 'skatListStats';
        this.IMPORT_FLAG_KEY = 'skatStatsImported';
    }

    async saveGameResult(listResult) {
        if (this.auth.isLoggedIn()) {
            await this._saveToCloud(listResult);
        } else {
            this._saveToLocal(listResult);
        }
    }

    async getStats() {
        if (this.auth.isLoggedIn()) {
            const aggregated = await this._getFromCloud();
            const history = await this._getHistoryFromCloud();
            return { aggregated, history };
        } else {
            return this._getFromLocal();
        }
    }

    async getLeaderboard() {
        if (!this.auth.client) return [];
        try {
            // Fetch with * to be safe if the nickname column is not present in all rows/schema
            const { data, error } = await this.auth.client
                .from('stats')
                .select('*')
                .order('wins', { ascending: false });
            
            if (error) {
                console.error('Leaderboard error:', error);
                // Fallback to minimal selection if * fails
                const { data: fallbackData, error: fallbackError } = await this.auth.client
                    .from('stats')
                    .select('user_id, wins, lists_played');
                if (fallbackError) return [];
                return fallbackData;
            }

            return data || [];
        } catch (err) {
            console.error('getLeaderboard exception:', err);
            return [];
        }
    }

    _getLocalProfile() {
        const data = localStorage.getItem('skat_user_profile');
        return data ? JSON.parse(data) : { coins: 0, last_daily_claim: null, nickname: null };
    }

    _setLocalProfile(profile) {
        localStorage.setItem('skat_user_profile', JSON.stringify(profile));
    }

    async getUserStats(userId) {
        if (!this.auth.isLoggedIn()) return null;
        
        // Use Promise.all with timeouts for all fetches
        const fetchWithTimeout = (promise, timeoutMs = 5000) => 
            Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))]);

        try {
            const [aggRes, histRes, profRes, claimRes] = await Promise.allSettled([
                fetchWithTimeout(this.auth.client.from('stats').select('*').eq('user_id', userId).single()),
                fetchWithTimeout(this.auth.client.from('history').select('*').eq('user_id', userId).order('id', { ascending: true })),
                fetchWithTimeout(this.auth.client.from('profiles').select('*').eq('id', userId).single()),
                fetchWithTimeout(this.auth.client.from('claimed_badges').select('badge_id').eq('user_id', userId))
            ]);

            const aggregated = aggRes.status === 'fulfilled' ? aggRes.value.data : null;
            const history = histRes.status === 'fulfilled' ? histRes.value.data : [];
            const profile = profRes.status === 'fulfilled' ? profRes.value.data : this._getLocalProfile();
            const claimedBadges = claimRes.status === 'fulfilled' ? (claimRes.value.data || []) : [];

            return { 
                aggregated, 
                history, 
                profile: profile || { coins: 0, last_daily_claim: null },
                claimedBadges: claimedBadges.map(b => b.badge_id)
            };
        } catch (err) {
            console.error('Error in getUserStats:', err);
            return null;
        }
    }

    async getProfile() {
        // 1. Start with local data for instant response
        let profile = this._getLocalProfile();

        if (!this.auth.isLoggedIn()) return { ...profile, id: null };

        try {
            // 2. Try to fetch from cloud with a tight timeout (3s)
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Cloud Timeout')), 3000));
            const cloudFetch = this.auth.client.from('profiles').select('*').eq('id', this.auth.user.id).single();
            
            const res = await Promise.race([cloudFetch, timeout]);
            
            if (res && res.data) {
                // Merge cloud data into local
                profile = {
                    ...profile,
                    coins: res.data.coins !== undefined ? res.data.coins : profile.coins,
                    last_daily_claim: res.data.last_daily_claim || profile.last_daily_claim,
                    nickname: res.data.nickname || profile.nickname
                };
                this._setLocalProfile(profile);
            }
        } catch (e) {
            console.warn('getProfile cloud fetch failed, using local fallback:', e.message);
        }

        return { id: this.auth.user ? this.auth.user.id : null, ...profile };
    }

    async _saveProfile(profileData) {
        // 1. Update Local Storage Immediately
        const currentLocal = this._getLocalProfile();
        const updatedLocal = { ...currentLocal, ...profileData };
        this._setLocalProfile(updatedLocal);

        if (!this.auth.isLoggedIn()) return { success: true, localOnly: true };

        const userId = this.auth.user.id;
        console.log('Syncing profile to cloud:', profileData);
        
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Sync Timeout')), 6000));
        
        try {
            const dbOp = (async () => {
                const updateData = { 
                    id: userId,
                    updated_at: new Date().toISOString(),
                    ...profileData
                };

                const { error } = await this.auth.client.from('profiles').upsert(updateData, { onConflict: 'id' });
                if (error) throw error;
                return { success: true };
            })();

            return await Promise.race([dbOp, timeout]);
        } catch (e) {
            console.error('Cloud sync failed, data saved locally only:', e);
            // We return success true because it IS saved locally and will work for the user
            return { success: true, cloudError: e.message || e };
        }
    }

    async claimDailyLogin() {
        if (!this.auth.isLoggedIn()) return { success: false, error: 'Not logged in' };
        
        try {
            const profile = await this.getProfile();
            const today = new Date().toISOString().split('T')[0];
            
            if (profile.last_daily_claim === today) {
                return { success: false, error: 'Already claimed today' };
            }

            const updatedCoins = (profile.coins || 0) + 20;
            const res = await this._saveProfile({
                coins: updatedCoins,
                last_daily_claim: today
            });

            // Even if there was a cloud error, we consider it a success for the UI session
            return { success: true, newCoins: updatedCoins };
        } catch (error) {
            console.error('Daily Login Process Error:', error);
            return { success: false, error: error.message };
        }
    }

    async claimBadgeReward(badgeId, amount) {
        if (!this.auth.isLoggedIn()) return { success: false, error: 'Not logged in' };
        
        try {
            // Check if already claimed in DB (this is the only part that needs cloud to be 100% sure, 
            // but we can trust the process if the insert succeeds)
            
            // 1. Mark as claimed in cloud
            const { error: claimError } = await this.auth.client.from('claimed_badges').insert({
                user_id: this.auth.user.id,
                badge_id: badgeId
            });
            
            if (claimError && !claimError.message.includes('unique')) {
                 throw claimError;
            }

            // 2. Update Coins (Local-First via _saveProfile)
            const profile = await this.getProfile();
            const updatedCoins = (profile.coins || 0) + amount;
            await this._saveProfile({
                coins: updatedCoins
            });

            return { success: true, newCoins: updatedCoins };
        } catch (error) {
            console.error('Badge Reward Process Error:', error);
            return { success: false, error: error.message };
        }
    }

    async getClaimedBadges() {
        if (!this.auth.isLoggedIn()) return [];
        const { data, error } = await this.auth.client.from('claimed_badges').select('badge_id').eq('user_id', this.auth.user.id);
        if (error) return [];
        return data.map(b => b.badge_id);
    }

    async updateNickname(nickname) {
        if (!this.auth.isLoggedIn() || !nickname) return;
        console.log('Attempting to update nickname in cloud:', nickname);
        try {
            // 1. Update Profile table
            await this._saveProfile({ nickname: nickname });

            // 2. Update Stats table for backward compatibility/leaderboard
            const updateData = {
                user_id: this.auth.user.id,
                nickname: nickname,
                updated_at: new Date().toISOString()
            };
            
            const { error } = await this.auth.client.from('stats').upsert(updateData, { onConflict: 'user_id' });
            if (error) {
                console.warn('Could not update nickname in stats (maybe column missing?):', error.message);
            } else {
                console.log('Nickname successfully updated in stats.');
            }
        } catch (err) {
            console.error('updateNickname error:', err);
        }
    }

    async _getFromCloud() {
        const { data, error } = await this.auth.client.from('stats').select('*').eq('user_id', this.auth.user.id).single();
        if (error && error.code !== 'PGRST116') console.error('Error fetching stats:', error);
        return data;
    }

    async _getHistoryFromCloud() {
        const { data, error } = await this.auth.client.from('history').select('*').eq('user_id', this.auth.user.id).order('id', { ascending: true });
        if (error) console.error('Error fetching history:', error);
        return data || [];
    }

    async _saveToCloud(listResult) {
        const current = await this._getFromCloud() || {
            games_played: 0, wins: 0, losses: 0, grand_wins: 0, null_wins: 0, ramsch_wins: 0, rollmops_wins: 0, big_busch: 0, trumpf_count: 0,
            schneider_wins: 0, schwarz_wins: 0, hand_wins: 0, grand_ouvert_wins: 0, null_ouvert_wins: 0, best_streak: 0, lists_played: 0,
            won_all_in_list_count: 0, win_grand_ohne_4_wins: 0
        };

        const isWin = listResult.scores && listResult.scores[2] > listResult.scores[0] && listResult.scores[2] > listResult.scores[1];
        
        // Try to get nickname from settings (both window.settings and window.appSettings might be used)
        const settings = window.settings || window.appSettings;
        const nickname = settings ? settings.current.nickname : null;

        const updated = {
            user_id: this.auth.user.id,
            nickname: nickname || current.nickname,
            lists_played: (current.lists_played || 0) + 1,
            games_played: (current.games_played || 0) + (listResult.rounds || 0),
            wins: (current.wins || 0) + (isWin ? 1 : 0),
            losses: (current.losses || 0) + (isWin ? 0 : 1),
            grand_wins: (current.grand_wins || 0) + (listResult.winGrandCount || 0),
            null_wins: (current.null_wins || 0) + (listResult.winNullCount || 0),
            ramsch_wins: (current.ramsch_wins || 0) + (listResult.winRamschCount || 0),
            rollmops_wins: (current.rollmops_wins || 0) + (listResult.winRollmopsCount || 0),
            big_busch: (current.big_busch || 0) + (listResult.anzahlBigBusch || 0),
            trumpf_count: Math.max(current.trumpf_count || 0, listResult.maxTrumpCount || 0),
            schneider_wins: (current.schneider_wins || 0) + (listResult.anzahlSchneider || 0),
            schwarz_wins: (current.schwarz_wins || 0) + (listResult.anzahlSchwarz || 0),
            hand_wins: (current.hand_wins || 0) + (listResult.anzahlHandspiele || 0),
            grand_ouvert_wins: (current.grand_ouvert_wins || 0) + (listResult.anzahlGrandOuvert || 0),
            null_ouvert_wins: (current.null_ouvert_wins || 0) + (listResult.anzahlNullOuvert || 0),
            won_all_in_list_count: (current.won_all_in_list_count || 0) + (listResult.wonAllInList ? 1 : 0),
            win_grand_ohne_4_wins: (current.win_grand_ohne_4_wins || 0) + (listResult.winGrandOhne4Count || 0),
            updated_at: new Date().toISOString()
        };

        await this.auth.client.from('stats').upsert(updated);

        await this.auth.client.from('history').insert({
            user_id: this.auth.user.id,
            date: listResult.date,
            rounds: listResult.rounds,
            rule_set: listResult.ruleSet,
            score_bot2: listResult.scores[0],
            score_bot1: listResult.scores[1],
            score_player: listResult.scores[2]
        });

        const badges = this._calculateBadges(updated);
        if (badges.length > 0) {
            const badgeRows = badges.map(id => ({ user_id: this.auth.user.id, badge_id: id }));
            await this.auth.client.from('badges').upsert(badgeRows);
        }
    }

    _getFromLocal() {
        return JSON.parse(localStorage.getItem(this.LOCAL_STATS_KEY)) || [];
    }

    _saveToLocal(listResult) {
        let stats = this._getFromLocal();
        stats.push(listResult);
        localStorage.setItem(this.LOCAL_STATS_KEY, JSON.stringify(stats));
    }

    async migrateManual() {
        if (!this.auth.isLoggedIn()) return { success: false, error: 'Not logged in' };
        try {
            await this._performImport();
            return { success: true };
        } catch (err) {
            console.error('Migration Error:', err);
            return { success: false, error: err.message };
        }
    }

    hasLocalDataToMigrate() {
        const stats = this._getFromLocal();
        return stats.length > 0;
    }

    async _performImport() {
        const localStats = this._getFromLocal();
        if (localStats.length === 0) return;
        
        const userId = this.auth.user.id;
        console.log('Starting radical overwrite for user:', userId);

        // 1. DELETE EVERYTHING (Radical Overwrite)
        const delHistory = await this.auth.client.from('history').delete().eq('user_id', userId);
        const delBadges = await this.auth.client.from('badges').delete().eq('user_id', userId);
        const delStats = await this.auth.client.from('stats').delete().eq('user_id', userId);

        if (delHistory.error || delBadges.error || delStats.error) {
            console.error('Delete failed. Check if DELETE policies are active in Supabase.');
            throw new Error('Could not clear old data. Please run the DELETE policy SQL in Supabase.');
        }

        // 2. Upload Aggregated
        const aggregated = this._aggregateStats(localStats);
        const { error: statsError } = await this.auth.client.from('stats').insert({ 
            user_id: userId, 
            ...aggregated, 
            updated_at: new Date().toISOString() 
        });
        if (statsError) throw statsError;

        // 3. Upload History
        const historyRows = localStats.map(list => ({
            user_id: userId,
            date: list.date,
            rounds: list.rounds,
            rule_set: list.ruleSet,
            score_bot2: list.scores[0],
            score_bot1: list.scores[1],
            score_player: list.scores[2]
        }));
        const { error: histError } = await this.auth.client.from('history').insert(historyRows);
        if (histError) throw histError;

        // 4. Badges
        const badges = this._calculateBadges(aggregated);
        if (badges.length > 0) {
            const badgeRows = badges.map(id => ({ user_id: userId, badge_id: id }));
            await this.auth.client.from('badges').insert(badgeRows);
        }
        
        // 5. Success
        this._clearLocalData();
        console.log('Migration completed successfully. Cloud is now a 1:1 copy of local.');
        
        // Hard refresh stats UI
        if (window.ui && typeof window.ui.renderStats === 'function') {
            await window.ui.renderStats();
        }
    }

    _clearLocalData() {
        localStorage.removeItem(this.LOCAL_STATS_KEY);
        localStorage.setItem(this.IMPORT_FLAG_KEY, 'true');
    }

    _aggregateStats(listStats) {
        const agg = { 
            lists_played: listStats.length,
            games_played: 0, wins: 0, losses: 0, grand_wins: 0, null_wins: 0, ramsch_wins: 0, rollmops_wins: 0, big_busch: 0, trumpf_count: 0,
            schneider_wins: 0, schwarz_wins: 0, hand_wins: 0, grand_ouvert_wins: 0, null_ouvert_wins: 0, best_streak: 0
        };
        let currentStreak = 0;
        listStats.forEach(list => {
            agg.games_played += (list.rounds || 0);
            const win = list.scores[2] > list.scores[0] && list.scores[2] > list.scores[1];
            if (win) {
                agg.wins++;
                currentStreak++;
                agg.best_streak = Math.max(agg.best_streak, currentStreak);
            } else {
                agg.losses++;
                currentStreak = 0;
            }
            agg.grand_wins += (list.winGrandCount || list.anzahlGrandSpiele || 0);
            agg.null_wins += (list.winNullCount || list.anzahlNullSpiele || 0);
            agg.ramsch_wins += (list.winRamschCount || list.anzahlRamsch || 0);
            agg.rollmops_wins += (list.winRollmopsCount || list.anzahlRollmops || 0);
            agg.big_busch += (list.anzahlBigBusch || 0);
            agg.trumpf_count = Math.max(agg.trumpf_count, list.maxTrumpCount || 0);
            agg.schneider_wins += (list.anzahlSchneider || 0);
            agg.schwarz_wins += (list.anzahlSchwarz || 0);
            agg.hand_wins += (list.anzahlHandspiele || 0);
            agg.grand_ouvert_wins += (list.anzahlGrandOuvert || 0);
            agg.null_ouvert_wins += (list.anzahlNullOuvert || 0);
        });
        return agg;
    }

    _calculateBadges(agg) {
        const unlocked = [];
        if (agg.grand_wins >= 10) unlocked.push('grandmeister');
        if (agg.null_wins >= 10) unlocked.push('null_ass');
        if (agg.rollmops_wins >= 3) unlocked.push('rollmops');
        if (agg.big_busch >= 1) unlocked.push('big_busch');
        if (agg.ramsch_wins >= 10) unlocked.push('ramsch_koenig');
        if (agg.trumpf_count >= 10) unlocked.push('trumpfmaschine');
        if (agg.games_played >= 10) unlocked.push('anfaenger');
        if (agg.games_played >= 50) unlocked.push('stammspieler');
        if (agg.games_played >= 200) unlocked.push('veteran');
        return unlocked;
    }
}

class Auth {
    constructor() {
        this.supabaseUrl = 'https://wofiqfrnrwxwzsjyocxc.supabase.co';
        this.supabaseKey = 'sb_publishable_yX7fYLj-F6D6BCAL5g74Bw_UFqCvUMt';
        this.client = (typeof supabase !== 'undefined') ? supabase.createClient(this.supabaseUrl, this.supabaseKey) : null;
        this.user = null;
        this.storage = new StorageService(this);
        this._init();
    }

    async _init() {
        if (!this.client) return;
        try {
            const { data: { session } } = await this.client.auth.getSession();
            this.user = session?.user || null;
            if (this.user) {
                this.syncNicknameFromCloud().catch(err => console.error('Initial sync error:', err));
            }
        } catch (err) {
            console.error('Auth init error:', err);
        }
        
        this.updateUI();
        if (window.ui && typeof window.ui.refreshTransferButton === 'function') window.ui.refreshTransferButton();

        this.client.auth.onAuthStateChange(async (event, session) => {
            this.user = session?.user || null;
            if (this.user) {
                this.syncNicknameFromCloud().catch(err => console.error('Auth change sync error:', err));
            }
            this.updateUI();
            if (window.ui) {
                if (typeof window.ui.refreshTransferButton === 'function') window.ui.refreshTransferButton();
                if (typeof window.ui.renderStats === 'function') window.ui.renderStats();
            }
        });
    }

    async syncNicknameFromCloud() {
        if (!this.user) return;
        try {
            const profile = await this.storage.getProfile();
            if (profile && profile.nickname) {
                // Update local settings if they exist
                if (window.settings) {
                    window.settings.set('nickname', profile.nickname);
                } else if (window.appSettings) {
                    window.appSettings.set('nickname', profile.nickname);
                }
            } else {
                // Fallback to stats if profile has no nickname
                const stats = await this.storage._getFromCloud();
                if (stats && stats.nickname) {
                    if (window.settings) window.settings.set('nickname', stats.nickname);
                    else if (window.appSettings) window.appSettings.set('nickname', stats.nickname);
                    // Also sync to profile table for future consistency
                    await this.storage.updateNickname(stats.nickname);
                } else {
                    // If logged in but no nickname in cloud, push local one
                    const localNickname = (window.settings || window.appSettings)?.current?.nickname;
                    if (localNickname && localNickname !== 'Du') {
                        await this.storage.updateNickname(localNickname);
                    }
                }
            }
        } catch (err) {
            console.error('Error in syncNicknameFromCloud:', err);
        }
    }

    isLoggedIn() { return !!this.user; }

    async loginWithMagicLink(email) {
        if (!this.client) return { error: 'Client not initialized' };
        const redirectOptions = window.location.protocol === 'file:' ? {} : { options: { emailRedirectTo: 'https://flex6x.github.io/skat-app/' } };
        return await this.client.auth.signInWithOtp({ email, ...redirectOptions });
    }

    async loginWithEmail(email, password) { return await this.client.auth.signInWithPassword({ email, password }); }
    async signUp(email, password) { 
        if (!this.client) return { error: 'Client not initialized' };
        const options = window.location.protocol === 'file:' ? {} : { emailRedirectTo: 'https://flex6x.github.io/skat-app/' };
        return await this.client.auth.signUp({ email, password, options }); 
    }
    async logout() { await this.client.auth.signOut(); window.location.reload(); }

    updateUI() {
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
            // Priority: Local settings nickname -> Cloud nickname -> Email prefix
            const settings = window.settings || window.appSettings;
            let displayName = settings ? settings.current.nickname : null;
            
            if (!displayName || displayName === 'Du') {
                displayName = this.user.email.split('@')[0];
            }

            authContainer.innerHTML = `
                <div class="profile-dropdown">
                    <button class="nav-link profile-btn" id="btn-profile"><span class="user-icon">👤</span> ${displayName}</button>
                    <div class="dropdown-content hidden" id="profile-dropdown-content">
                        <button onclick="window.location.href='stats.html'" data-i18n="view_stats">Stats</button>
                        <button id="btn-logout" data-i18n="logout">Logout</button>
                    </div>
                </div>`;
            const btnProfile = document.getElementById('btn-profile');
            const dropdown = document.getElementById('profile-dropdown-content');
            if (btnProfile) btnProfile.onclick = (e) => { e.stopPropagation(); dropdown.classList.toggle('hidden'); };
            document.addEventListener('click', () => { if (dropdown) dropdown.classList.add('hidden'); });
            const logoutBtn = document.getElementById('btn-logout');
            if (logoutBtn) logoutBtn.onclick = () => this.logout();
        } else {
            authContainer.innerHTML = `<button class="nav-link login-btn" id="btn-open-login" data-i18n="login">Login</button>`;
            const loginBtn = document.getElementById('btn-open-login');
            if (loginBtn) loginBtn.onclick = () => this.showLoginModal();
        }

        // Always call renderTalerGroup, it will handle the logged-in check internally
        this.renderTalerGroup();
    }

    async renderTalerGroup() {
        const isStorePage = window.location.pathname.includes('store.html');
        const heroSection = document.getElementById('menu-primary');
        
        // Handle Store Page - Access Check
        if (isStorePage && !this.isLoggedIn()) {
            const container = document.querySelector('.store-container');
            if (container) {
                container.innerHTML = `<div class="not-logged-in-msg">Nur für eingeloggte Nutzer.</div>`;
            }
            return;
        }

        // Fetch fresh profile data
        let profile = { coins: 0, last_daily_claim: null };
        try { 
            profile = await this.storage.getProfile() || profile; 
        } catch(e){
            console.error('Failed to fetch profile in renderTalerGroup:', e);
        }

        // 1. Handle Main Menu (index.html)
        if (heroSection) {
            let group = document.getElementById('taler-group');
            if (!group) {
                group = document.createElement('div');
                group.id = 'taler-group';
                group.className = 'taler-main-menu-btns';
                heroSection.appendChild(group);
            }

            if (!this.isLoggedIn()) {
                // Guest View: Only Bug Report
                group.innerHTML = `
                    <button class="floating-btn" onclick="if(window.ui) window.ui.showBugReportModal()" title="Bug melden">
                        🐞
                    </button>
                `;
                return;
            }

            const today = new Date().toISOString().split('T')[0];
            const canClaimDaily = profile.last_daily_claim !== today;

            group.innerHTML = `
                <button id="btn-daily-login" class="floating-btn ${canClaimDaily ? 'glow-yellow' : 'claimed'}" title="Täglicher Bonus">
                    ${canClaimDaily ? '+20' : '✓'}
                </button>
                <button class="floating-btn" onclick="window.location.href='store.html'" title="Store">
                    🏪
                </button>
                <button class="floating-btn" onclick="if(window.ui) window.ui.showBugReportModal()" title="Bug melden">
                    🐞
                </button>
            `;

            const btnDaily = document.getElementById('btn-daily-login');
            if (btnDaily && canClaimDaily) {
                btnDaily.onclick = async (e) => {
                    e.stopPropagation();
                    btnDaily.disabled = true; // Prevent double clicks
                    btnDaily.classList.remove('glow-yellow');
                    btnDaily.textContent = '...';
                    const res = await this.storage.claimDailyLogin();
                    if (res.success) {
                        // Crucial: Full re-render with fresh data
                        await this.renderTalerGroup();
                    } else {
                        btnDaily.disabled = false;
                        btnDaily.classList.add('glow-yellow');
                        btnDaily.textContent = '+20';
                        console.error('Claim failed:', res.error);
                    }
                };
            }
        }

        // 2. Handle Store Balance (store.html)
        if (isStorePage) {
            let balanceDisplay = document.getElementById('store-balance-header');
            if (!balanceDisplay) {
                const headerRight = document.querySelector('.header-right');
                if (headerRight) {
                    balanceDisplay = document.createElement('div');
                    balanceDisplay.id = 'store-balance-header';
                    balanceDisplay.className = 'store-balance-large';
                    headerRight.prepend(balanceDisplay);
                }
            }

            if (balanceDisplay) {
                balanceDisplay.innerHTML = `
                    <img src="media/coin.png" class="taler-icon-large">
                    <span>${profile.coins || 0}</span>
                `;
            }
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
                <div class="login-tabs">
                    <button class="login-tab-btn active" data-tab="magic-link">Magic Link</button>
                    <button class="login-tab-btn" data-tab="password">Password</button>
                </div>
                <div id="magic-link-section" class="auth-section">
                    <input type="email" id="login-email-magic" placeholder="Email" class="nickname-input" style="margin-bottom: 15px;">
                    <button id="btn-send-magic" class="btn primary large-btn" style="width: 100%;">Send Login Link</button>
                </div>
                <div id="password-section" class="auth-section hidden">
                    <input type="email" id="login-email" placeholder="Email" class="nickname-input" style="margin-bottom: 10px;">
                    <input type="password" id="login-password" placeholder="Password" class="nickname-input" style="margin-bottom: 15px;">
                    <div style="display: flex; gap: 10px;"><button id="btn-login-pass" class="btn primary" style="flex: 1;">Login</button><button id="btn-signup-pass" class="btn" style="flex: 1;">Sign Up</button></div>
                </div>
                <div id="auth-status" class="auth-status hidden"></div>
            </div>`;
        document.body.appendChild(overlay);
        document.getElementById('btn-close-login').onclick = () => document.body.removeChild(overlay);
        const tabs = overlay.querySelectorAll('.login-tab-btn');
        tabs.forEach(tab => tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById('magic-link-section').classList.toggle('hidden', tab.dataset.tab !== 'magic-link');
            document.getElementById('password-section').classList.toggle('hidden', tab.dataset.tab === 'magic-link');
        });
        const statusEl = document.getElementById('auth-status');
        const showStatus = (msg, isError = false) => { statusEl.innerText = msg; statusEl.className = 'auth-status ' + (isError ? 'error' : 'success'); statusEl.classList.remove('hidden'); };
        document.getElementById('btn-send-magic').onclick = async () => {
            const { error } = await this.loginWithMagicLink(document.getElementById('login-email-magic').value);
            if (error) showStatus(error.message, true); else showStatus('Check your email!');
        };
        document.getElementById('btn-login-pass').onclick = async () => {
            const { error } = await this.loginWithEmail(document.getElementById('login-email').value, document.getElementById('login-password').value);
            if (error) showStatus(error.message, true); else document.body.removeChild(overlay);
        };
        document.getElementById('btn-signup-pass').onclick = async () => {
            const { error } = await this.signUp(document.getElementById('login-email').value, document.getElementById('login-password').value);
            if (error) showStatus(error.message, true); else showStatus('Check your email!');
        };
    }
}

window.auth = new Auth();
window.storageService = window.auth.storage;
