/**
 * Skat DOM UI Manager
 */

const TRANSLATIONS = {
    de: {
        select_rounds: "Rundenanzahl wählen",
        how_many_games: "Wie viele Spiele sollen absolviert werden?",
        cancel: "Abbrechen",
        statistics: "Statistik",
        total_lists: "Listen Gesamt",
        win_ratio: "Siegquote",
        best_streak: "Beste Serie",
        date: "Datum",
        winner: "Gewinner",
        rounds: "Runden",
        rule_set: "Regeln",
        tournament: "Turnier",
        pub: "Kneipe",
        ramsch: "Ramsch",
        mit: "mit",
        ohne: "ohne",
        game: "Spiel",
        hand: "Hand",
        hand_game: "Hand spielen",
        schneider: "Schneider",
        schwarz: "Schwarz",
        pts_aicore: "Aicore",
        pts_aiden: "Aiden",
        back_to_menu: "Hauptmenü",
        settings: "Einstellungen",
        nickname: "Nickname",
        language: "Sprache",
        theme: "Theme",
        card_animation: "Kartenanimation",
        fast: "Schnell",
        normal: "Normal",
        slow: "Langsam",
        show_live_points: "Punkte live anzeigen",
        activate_sounds: "Sounds aktivieren",
        drag_drop: "Drag & Drop aktivieren",
        battery_saver: "Akkusparmodus",
        data: "Daten",
        delete_stats: "Statistiken löschen",
        back: "Zurück",
        game_list: "Spielliste",
        total: "Gesamt",
        home_confirm: "Willst du wirklich das Spiel verlassen? Der Fortschritt in dieser Liste geht verloren.",
        delete_confirm: "Möchtest du wirklich alle Statistiken unwiderruflich löschen?",
        stats_deleted: "Statistiken gelöscht.",
        no_lists: "Noch keine Listen absolviert.",
        draw: "Unentschieden",
        passed_in: "Eingepasst!",
        nobody_bid: "Niemand hat gereizt. Das Spiel wird neu gegeben.",
        game_won: "Spiel gewonnen!",
        game_lost: "Spiel verloren!",
        declarer: "Alleinspieler",
        opponents: "Gegner",
        eyes: "Augen",
        game_value: "Spielwert",
        overbid: "Überreizt!",
        play_now: "Jetzt Spielen",
        wait_bidding: "Warte auf Reiz-Phase...",
        your_turn_bid: "Du bist dran zu reizen!",
        you_must_answer: "Du musst antworten!",
        pass: "Passe",
        yes: "Ja",
        bid: "Reize",
        take_skat: "Skat aufnehmen?",
        hand_game: "Hand spielen",
        take: "Aufnehmen",
        discard_info: "Lege 2 Karten in den Skat (Drag & Drop oder Klick)",
        confirm: "Bestätigen",
        announce: "Ansagen",
        choose_trump: "Trumpf wählen",
        last_trick: "Letzter Stich",
        close_info: "Klicke irgendwo zum Schließen",
        turn: "Zug",
        bid_value: "Reizwert",
        trump: "Trumpf",
        ouvert: "Ouvert",
        null_ouvert: "Null Ouvert",
        null_ouvert_hand: "Null Ouvert Hand",
        grand_ouvert: "Grand Ouvert*",
        original_skat: "Original Skat",
        discarded_cards: "Gedrückt",
        announce_schneider: "Schneider ansagen",
        announce_schwarz: "Schwarz ansagen",
        tutorial: "Tutorial",
        skip_tutorial: "Überspringen",
        next: "Weiter",
        finish: "Fertig",
        step: "Schritt",
        announced: "angesagt",
        bid_value_table: "Reizwerttabelle",
        formula: "Formel",
        example: "Beispiel",
        spitzen: "Spitzen",
        ground_value: "Grundwert",
        schneider_announced: "Schneider angesagt*",
        schwarz_announced: "Schwarz angesagt*",
        hand_only_info: "* nur bei Handspiel möglich",
        new_game: "Neues Spiel",
        game_over: "Spiel beendet",
        back_home_title: "Zurück zum Hauptmenü",
        show_list_title: "Spielliste anzeigen",
        show_reiztabelle_title: "Reizwerttabelle anzeigen",
        view_last_trick_title: "Letzten Stich ansehen",
        placeholder_nickname: "Dein Name",
        theme_dark: "Dunkel",
        theme_light: "Hell",
        preferences: "Präferenzen",
        suit_eichel: "Eichel",
        suit_gruen: "Grün",
        suit_rot: "Rot",
        suit_schellen: "Schellen",
        suit_grand: "Grand",
        suit_null: "Null",
        game_won_msg: "gewinnt das Spiel.",
        game_lost_msg: "verliert das Spiel.",
        overbid_msg: "hat überreizt! (Reizwert {bid} > Spielwert {val})",
        ramsch_msg: "Ramsch beendet.",
        ramsch_loser_msg: "verliert mit {pts} Augen.",
        trick_winner_msg: "gewinnt den Stich!",
        playing_msg: "spielt",
        take_skat_msg: "nimmt den Skat auf.",
        hand_msg: "spielt Hand.",
        plays_suit_msg: "spielt",
        plays_suit_hand_msg: "spielt",
        you: "Du",
        opponents_win: "Gegner gewinnen mit {pts} Augen!",
        declarer_win: "gewinnt mit {pts} Augen!",
        null_win: "gewinnt das Null-Spiel!",
        null_lose: "verliert das Null-Spiel!",
        tut_step1: "Hier siehst du deine Karten. Du nutzt sie, um Stiche zu machen und zu entscheiden, ob du reizen möchtest.",

        tut_step2: "Dies ist das Reiz-Fenster. Wer am höchsten reizt, wird Alleinspieler und darf den Skat aufnehmen.",
        tut_step3: "Als Alleinspieler wählst du hier den Spieltyp (Farbe, Grand oder Null).",
        tut_step4: "In der Mitte des Tisches werden die Karten ausgespielt. Wer die höchste Karte legt, gewinnt den Stich.",
        tut_step5: "Hier oben findest du alle wichtigen Infos zum aktuellen Spiel, inklusive der Punkte.",
        tut_step6: "Über das Logo kommst du immer zurück. Hier findest du auch die Liste und Statistiken.",
        overview: "Übersicht",
        game_history: "Spielverlauf",
        badges: "Badges",
        unlocked: "Freigeschaltet",
        locked: "Gesperrt",
        badge_unbesiegbar: "Unbesiegbar",
        badge_unbesiegbar_desc: "Gewinne 5-mal Schwarz.",
        badge_seriensieger: "Seriensieger",
        badge_seriensieger_desc: "Gewinne alle Spiele in einer Liste.",
        badge_grandmeister: "Grandmeister",
        badge_grandmeister_desc: "Gewinne 10 Grand-Spiele.",
        badge_null_ass: "Null-Ass",
        badge_null_ass_desc: "Gewinne 10 Null-Spiele.",
        badge_rollmops: "Rollmops",
        badge_rollmops_desc: "Gewinne 3-mal mit einem Rollmops-Blatt.",
        badge_big_busch: "Big Busch",
        badge_big_busch_desc: "Erreiche einen Spielwert von 264 (Grand Ouvert).",
        badge_ramsch_koenig: "Ramsch König",
        badge_ramsch_koenig_desc: "Gewinne 10-mal Ramsch.",
        badge_trumpfmaschine: "Trumpfmaschine",
        badge_trumpfmaschine_desc: "Habe 10 Trumpfkarten in einem Spiel.",
        badge_anfaenger: "Anfänger",
        badge_anfaenger_desc: "Absolviere 10 Spiele.",
        badge_stammspieler: "Stammspieler",
        badge_stammspieler_desc: "Absolviere 50 Spiele.",
        badge_veteran: "Skat Veteran",
        badge_veteran_desc: "Absolviere 200 Spiele.",
        badge_ohne_4: "Ohne 4",
        badge_ohne_4_desc: "Gewinne einen Grand \"ohne 4\".",
        login: "Login",
        logout: "Logout",
        profile: "Profil",
        view_stats: "Statistiken",
        account_login: "Account Login",
        login_subtitle: "Speichere deine Stats in der Cloud.",
        import_stats_title: "Lokale Statistiken gefunden",
        import_stats_desc: "Wir haben lokale Spielstatistiken auf diesem Gerät gefunden. Möchtest du sie in deinen Account importieren?",
        transfer_stats: "Stats auf Acc übertragen",
        transfer_success: "Statistiken erfolgreich übertragen!",
        transfer_error: "Fehler beim Übertragen: "
    },
    en: {
        select_rounds: "Select Rounds",
        how_many_games: "How many games should be played?",
        cancel: "Cancel",
        statistics: "Statistics",
        total_lists: "Total Lists",
        win_ratio: "Win Ratio",
        best_streak: "Best Streak",
        date: "Date",
        winner: "Winner",
        rounds: "Rounds",
        rule_set: "Rules",
        tournament: "Tournament",
        pub: "Pub",
        ramsch: "Ramsch",
        mit: "with",
        ohne: "without",
        game: "Game",
        hand: "Hand",
        pts_aicore: "Aicore",
        pts_aiden: "Aiden",
        back_to_menu: "Main Menu",
        settings: "Settings",
        nickname: "Nickname",
        language: "Language",
        theme: "Theme",
        card_animation: "Animation",
        fast: "Fast",
        normal: "Normal",
        slow: "Slow",
        show_live_points: "Show live points",
        activate_sounds: "Enable sounds",
        drag_drop: "Enable Drag & Drop",
        battery_saver: "Battery Saver",
        data: "Data",
        delete_stats: "Delete Statistics",
        back: "Back",
        game_list: "Game List",
        total: "Total",
        home_confirm: "Do you really want to leave? Progress in this list will be lost.",
        delete_confirm: "Do you really want to delete all statistics permanently?",
        stats_deleted: "Statistics deleted.",
        no_lists: "No lists completed yet.",
        draw: "Draw",
        passed_in: "Passed In!",
        nobody_bid: "Nobody bid. The game will be redealt.",
        game_won: "Game Won!",
        game_lost: "Game Lost!",
        declarer: "Declarer",
        opponents: "Opponents",
        eyes: "Points",
        game_value: "Game Value",
        overbid: "Overbid!",
        play_now: "Play Now",
        wait_bidding: "Waiting for bidding...",
        your_turn_bid: "Your turn to bid!",
        you_must_answer: "You must answer!",
        pass: "Pass",
        yes: "Yes",
        bid: "Bid",
        take_skat: "Take Skat?",
        hand_game: "Play Hand",
        take: "Take",
        discard_info: "Put 2 cards in Skat (Drag & Drop or Click)",
        confirm: "Confirm",
        announce: "Announce",
        choose_trump: "Choose Trump",
        last_trick: "Last Trick",
        close_info: "Click anywhere to close",
        turn: "Turn",
        bid_value: "Bid Value",
        trump: "Trump",
        original_skat: "Original Skat",
        discarded_cards: "Discarded",
        announce_schneider: "Announce Schneider",
        announce_schwarz: "Announce Schwarz",
        tutorial: "Tutorial",
        skip_tutorial: "Skip",
        next: "Next",
        finish: "Finish",
        step: "Step",
        announced: "announced",
        bid_value_table: "Bidding Table",
        formula: "Formula",
        example: "Example",
        spitzen: "Matadors",
        ground_value: "Base Value",
        schneider_announced: "Schneider announced*",
        schwarz_announced: "Schwarz announced*",
        hand_only_info: "* only possible in Hand games",
        new_game: "New Game",
        game_over: "Game Over",
        back_home_title: "Back to Main Menu",
        show_list_title: "Show Game List",
        show_reiztabelle_title: "Show Bidding Table",
        view_last_trick_title: "View Last Trick",
        placeholder_nickname: "Your Name",
        theme_dark: "Dark",
        theme_light: "Light",
        preferences: "Preferences",
        suit_eichel: "Acorns",
        suit_gruen: "Leaves",
        suit_rot: "Hearts",
        suit_schellen: "Bells",
        suit_grand: "Grand",
        suit_null: "Null",
        game_won_msg: "wins the game.",
        game_lost_msg: "loses the game.",
        overbid_msg: "overbid! (Bid {bid} > Value {val})",
        ramsch_msg: "Ramsch finished.",
        ramsch_loser_msg: "loses with {pts} points.",
        trick_winner_msg: "wins the trick!",
        playing_msg: "plays",
        take_skat_msg: "takes the Skat.",
        hand_msg: "plays Hand.",
        plays_suit_msg: "plays",
        plays_suit_hand_msg: "plays",
        you: "You",
        opponents_win: "Opponents win with {pts} points!",
        declarer_win: "wins with {pts} points!",
        null_win: "wins the Null game!",
        null_lose: "loses the Null game!",
        tut_step1: "Here you see your cards. You use them to play tricks and decide whether you want to bid.",
        tut_step2: "This is the bidding window. The highest bidder becomes the declarer and can take the Skat.",
        tut_step3: "As declarer, you choose the game type here (Suit, Grand, or Null).",
        tut_step4: "Cards are played in the center of the table. The highest card wins the trick.",
        tut_step5: "Up here you'll find all important game info, including current points.",
        tut_step6: "Use the logo to return home. You can also find the game list and statistics here.",
        overview: "Overview",
        game_history: "Game History",
        badges: "Badges",
        unlocked: "Unlocked",
        locked: "Locked",
        badge_unbesiegbar: "Invincible",
        badge_unbesiegbar_desc: "Win Schwarz 5 times.",
        badge_seriensieger: "Serial Winner",
        badge_seriensieger_desc: "Win all games within a single Liste.",
        badge_grandmeister: "Grand Master",
        badge_grandmeister_desc: "Win 10 Grand games.",
        badge_null_ass: "Null Ace",
        badge_null_ass_desc: "Successfully play Null 10 times.",
        badge_rollmops: "Rollmops",
        badge_rollmops_desc: "Win 3 games with a Rollmops hand.",
        badge_big_busch: "Big Busch",
        badge_big_busch_desc: "Achieve a game value of at least 264 (Grand Ouvert).",
        badge_ramsch_koenig: "Ramsch King",
        badge_ramsch_koenig_desc: "Win Ramsch 10 times.",
        badge_trumpfmaschine: "Trump Machine",
        badge_trumpfmaschine_desc: "Have 10 trump cards in a game.",
        badge_anfaenger: "Beginner",
        badge_anfaenger_desc: "Play 10 games.",
        badge_stammspieler: "Regular",
        badge_stammspieler_desc: "Play 50 games.",
        badge_veteran: "Skat Veteran",
        badge_veteran_desc: "Play 200 games.",
        badge_ohne_4: "Without 4",
        badge_ohne_4_desc: "Win a Grand 'without 4'.",
        login: "Login",
        logout: "Logout",
        profile: "Profile",
        view_stats: "Statistics",
        account_login: "Account Login",
        login_subtitle: "Save your stats in the cloud.",
        import_stats_title: "Local statistics found",
        import_stats_desc: "We found local game statistics on this device. Do you want to import them into your account?",
        transfer_stats: "Transfer stats to account",
        transfer_success: "Statistics successfully transferred!",
        transfer_error: "Error during transfer: "
    }
};

class UI {
    constructor() {
        this.els = {
            player1Cards: document.querySelector('#bot1 .cards-container'),
            player0Cards: document.querySelector('#bot2 .cards-container'),
            player2Cards: document.querySelector('#player-hand'),
            
            trickBot2: document.getElementById('played-card-bot2'),
            trickBot1: document.getElementById('played-card-bot1'),
            trickPlayer: document.getElementById('played-card-player'),

            skatDecisionOverlay: document.getElementById('skat-decision-overlay'),
            skatDiscardArea: document.getElementById('skat-discard-area'),
            skatDiscardSlots: document.querySelectorAll('.skat-slot'),
            
            biddingOverlay: document.getElementById('bidding-overlay'),
            biddingStatus: document.getElementById('bidding-status'),
            biddingControls: document.getElementById('bidding-controls'),
            trumpOverlay: document.getElementById('trump-overlay'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            reiztabelleOverlay: document.getElementById('reiztabelle-overlay'),
            
            currentTrump: document.getElementById('current-trump'),
            currentTurn: document.getElementById('current-turn'),
            currentDeclarer: document.getElementById('current-declarer'),
            currentBid: document.getElementById('current-bid'),
            
            mainMenu: document.getElementById('main-menu'),
            menuPrimary: document.getElementById('menu-primary'),
            statsView: document.getElementById('stats-view'),
            statsTableBody: document.getElementById('stats-table-body'),
            statTotalGames: document.getElementById('stat-total-games'),
            statWinRatio: document.getElementById('stat-win-ratio'),
            statWinStreak: document.getElementById('stat-win-streak'),
            gameContainer: document.getElementById('game-container'),
            
            btnLogoHome: document.getElementById('btn-logo-home'),
            btnStartGame: document.getElementById('btn-start-game'),
            btnShowStats: document.getElementById('btn-show-stats'),
            btnBackMenu: document.getElementById('btn-back-menu'),
            btnHome: document.getElementById('btn-home'),
            btnLastTrick: document.getElementById('btn-last-trick'),
            btnShowReiztabelle: document.getElementById('btn-show-reiztabelle'),
            btnCloseReiztabelle: document.getElementById('btn-close-reiztabelle'),
            
            lastTrickOverlay: document.getElementById('last-trick-overlay'),
            lastTrickCards: document.getElementById('last-trick-cards'),
            
            btnPass: document.getElementById('btn-pass'),
            btnBid: document.getElementById('btn-bid'),
            btnSkatHand: document.getElementById('btn-skat-hand'),
            btnSkatTake: document.getElementById('btn-skat-take'),
            btnConfirmSkat: document.getElementById('btn-confirm-skat'),
            btnRestart: document.getElementById('btn-restart'),
            
            trumpBtns: document.querySelectorAll('.trump-btn'),
            
            bot1Speech: document.querySelector('#bot1 .speech-bubble'),
            bot2Speech: document.querySelector('#bot2 .speech-bubble'),
            playerSpeech: document.querySelector('#player-area .speech-bubble'),
            
            // Scoreboard
            scoreboardDrawer: document.getElementById('scoreboard-drawer'),
            scoreboardBody: document.getElementById('scoreboard-body'),
            btnShowScoreboard: document.getElementById('btn-show-scoreboard'),
            btnCloseScoreboard: document.getElementById('btn-close-scoreboard'),
            totalPlayerNum: document.getElementById('total-player-num'), 
            totalPlayer0: document.getElementById('total-player0'),
            totalPlayer1: document.getElementById('total-player1'),
            totalPlayer2: document.getElementById('total-player2'),
            
            // Round selection
            roundSelectionView: document.getElementById('round-selection-view'),
            roundBtns: document.querySelectorAll('.round-btn'),
            btnCancelRounds: document.getElementById('btn-cancel-rounds'),
            
            // Settings
            settingsView: document.getElementById('settings-view'),
            btnShowSettings: document.getElementById('btn-show-settings'),
            btnBackSettings: document.getElementById('btn-back-settings'),
            btnDeleteStats: document.getElementById('btn-delete-stats'),
            inputNickname: document.getElementById('input-nickname'),
            chkLanguage: document.getElementById('chk-language'),
            liveScore: document.getElementById('live-score'),

            // Named refs for names
            playerNameInGame: document.querySelector('#player-area .player-info'),
            playerNameInStatsHead: document.getElementById('stats-player-name-head'),
            playerNameInListHead: document.getElementById('player2-name-list')
        };
        
        this.bindGlobalEvents();
    }
    
    bindGlobalEvents() {
        // Setup drop zones for trick
        if (this.els.trickPlayer) {
            this.els.trickPlayer.addEventListener('dragover', e => { e.preventDefault(); this.els.trickPlayer.classList.add('drag-over'); });
            this.els.trickPlayer.addEventListener('dragleave', () => this.els.trickPlayer.classList.remove('drag-over'));
        }
        
        // Setup drop zones for skat discard
        if (this.els.skatDiscardSlots) {
            this.els.skatDiscardSlots.forEach(slot => {
                slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('drag-over'); });
                slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
            });
        }

        // Scoreboard toggle
        if (this.els.btnShowScoreboard) {
            this.els.btnShowScoreboard.onclick = () => {
                this.els.scoreboardDrawer.classList.toggle('hidden');
            };
        }
        if (this.els.btnCloseScoreboard) {
            this.els.btnCloseScoreboard.onclick = () => {
                this.els.scoreboardDrawer.classList.add('hidden');
            };
        }

        // Delete Stats Logic
        if (this.els.btnDeleteStats) {
            this.els.btnDeleteStats.onclick = () => {
                const msg = this.getTranslation('delete_confirm');
                if (window.confirm(msg)) {
                    localStorage.removeItem("skatListStats");
                    this.showMessage(this.getTranslation('stats_deleted'));
                    this.renderStats();
                }
            };
        }

        // Logo Home Navigation
        if (this.els.btnLogoHome && !this.els.btnLogoHome.onclick) {
            this.els.btnLogoHome.onclick = () => {
                window.location.href = 'index.html';
            };
        }

        // Reiztabelle toggle
        if (this.els.btnShowReiztabelle) {
            this.els.btnShowReiztabelle.onclick = (e) => {
                e.stopPropagation();
                this.toggleReiztabelle();
            };
        }
        if (this.els.btnCloseReiztabelle) {
            this.els.btnCloseReiztabelle.onclick = () => {
                this.els.reiztabelleOverlay.classList.add('hidden');
            };
        }
        if (this.els.reiztabelleOverlay) {
            this.els.reiztabelleOverlay.onclick = (e) => {
                if (e.target === this.els.reiztabelleOverlay) {
                    this.els.reiztabelleOverlay.classList.add('hidden');
                }
            };
        }
    }

    resetAllOverlays() {
        const overlays = [
            this.els.biddingOverlay,
            this.els.skatDecisionOverlay,
            this.els.skatDiscardArea,
            this.els.trumpOverlay,
            this.els.gameOverOverlay,
            this.els.lastTrickOverlay,
            this.els.scoreboardDrawer,
            this.els.reiztabelleOverlay
        ];
        overlays.forEach(o => {
            if (o) o.classList.add('hidden');
        });
        
        // Also hide speech bubbles
        if (this.els.bot1Speech) this.els.bot1Speech.classList.add('hidden');
        if (this.els.bot2Speech) this.els.bot2Speech.classList.add('hidden');
        if (this.els.playerSpeech) this.els.playerSpeech.classList.add('hidden');
    }

    handleHashNavigation() {
        // Obsolete in MPA
    }

    _switchView(viewEl) {
        if (!viewEl) return;
        
        // List of all possible menu views
        const views = [
            this.els.menuPrimary,
            this.els.statsView,
            this.els.settingsView,
            this.els.roundSelectionView
        ].filter(v => !!v);
        
        views.forEach(v => {
            if (v === viewEl) v.classList.remove('hidden');
            else v.classList.add('hidden');
        });

        // Always ensure main menu overlay is visible when switching these internal views
        if (this.els.mainMenu) this.els.mainMenu.classList.remove('hidden');
        if (this.els.gameContainer) this.els.gameContainer.classList.add('hidden');
    }


    showHeroView() {
        this._switchView(this.els.menuPrimary);
    }

    getTranslation(key) {
        const lang = (window.appSettings && window.appSettings.current.language) || 'de';
        return TRANSLATIONS[lang][key] || key;
    }

    updateLanguageUI() {
        const lang = (window.appSettings && window.appSettings.current.language) || 'de';
        const dict = TRANSLATIONS[lang];
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (dict[key]) {
                el.textContent = dict[key];
            }
        });

        // Update titles and placeholders
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.dataset.i18nTitle;
            if (dict[key]) {
                el.title = dict[key];
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (dict[key]) {
                el.placeholder = dict[key];
            }
        });

        // Update "Play Now" button specifically because it's in hero
        const playBtn = document.getElementById('btn-start-game');
        if (playBtn) playBtn.textContent = dict.play_now;

        this.updateNicknames();
    }

    updateNicknames() {
        const name = (window.appSettings && window.appSettings.current.nickname) || 'Du';
        
        // Update in game area
        if (this.els.playerNameInGame) {
            this.els.playerNameInGame.textContent = name;
        }

        // Update in Stats header
        if (this.els.playerNameInStatsHead) {
            this.els.playerNameInStatsHead.textContent = name;
        }

        // Update in Game List header
        if (this.els.playerNameInListHead) {
            this.els.playerNameInListHead.textContent = name;
        }
    }

    showRoundSelection(onSelect, onCancel) {
        if (this.els.mainMenu) this.els.mainMenu.classList.remove('hidden');
        if (this.els.gameContainer) this.els.gameContainer.classList.add('hidden');
        if (this.els.menuPrimary) this.els.menuPrimary.classList.add('hidden');
        if (this.els.roundSelectionView) this.els.roundSelectionView.classList.remove('hidden');
        
        if (this.els.roundBtns) {
            this.els.roundBtns.forEach(btn => {
                btn.onclick = () => {
                    if (this.els.roundSelectionView) this.els.roundSelectionView.classList.add('hidden');
                    onSelect(parseInt(btn.dataset.rounds));
                };
            });
        }
        
        if (this.els.btnCancelRounds) {
            this.els.btnCancelRounds.onclick = () => {
                if (this.els.roundSelectionView) this.els.roundSelectionView.classList.add('hidden');
                if (this.els.menuPrimary) this.els.menuPrimary.classList.remove('hidden');
                onCancel();
            };
        }
    }

    updateScoreboard(history) {
        this.els.scoreboardBody.innerHTML = '';
        let totals = [0, 0, 0];
        const names = ['Aicore', 'Aiden', (window.appSettings && window.appSettings.current.nickname) || 'Du'];

        history.forEach((game, index) => {
            const tr = document.createElement('tr');
            
            // Game Number column
            const tdNum = document.createElement('td');
            tdNum.textContent = index + 1;
            tdNum.style.fontWeight = 'bold';
            tdNum.style.color = '#888';
            tr.appendChild(tdNum);

            for (let i = 0; i < 3; i++) {
                const td = document.createElement('td');
                if (game.passedIn) {
                    td.textContent = '0';
                    td.style.color = '#666';
                } else if (game.isRamsch) {
                    const isLoser = game.loserIndices.includes(i);
                    td.textContent = isLoser ? '-25' : '0';
                    td.className = isLoser ? 'score-neg' : '';
                    if (isLoser) totals[i] -= 25;
                } else if (game.declarerId === i) {
                    const val = game.won ? game.value : -game.value;
                    td.textContent = val;
                    td.className = val >= 0 ? 'score-pos' : 'score-neg';
                    totals[i] += val;
                } else {
                    td.textContent = '-';
                    td.style.color = '#444';
                }
                tr.appendChild(td);
            }
            this.els.scoreboardBody.appendChild(tr);
        });

        this.els.totalPlayer0.textContent = totals[0];
        this.els.totalPlayer1.textContent = totals[1];
        this.els.totalPlayer2.textContent = totals[2];

        // Apply same classes to totals
        this.els.totalPlayer0.className = totals[0] >= 0 ? 'score-pos' : 'score-neg';
        this.els.totalPlayer1.className = totals[1] >= 0 ? 'score-pos' : 'score-neg';
        this.els.totalPlayer2.className = totals[2] >= 0 ? 'score-pos' : 'score-neg';
        
        this.els.totalPlayerNum.textContent = this.getTranslation('total');
    }

    resetScoreboard() {
        this.els.scoreboardBody.innerHTML = '';
        this.els.totalPlayer0.textContent = '0';
        this.els.totalPlayer1.textContent = '0';
        this.els.totalPlayer2.textContent = '0';
        this.els.totalPlayer0.className = '';
        this.els.totalPlayer1.className = '';
        this.els.totalPlayer2.className = '';
    }

    showMainMenu(onStart) {
        this.els.mainMenu.classList.remove('hidden');
        this.els.menuPrimary.classList.remove('hidden');
        this.els.statsView.classList.add('hidden');
        this.els.settingsView.classList.add('hidden');
        this.els.roundSelectionView.classList.add('hidden');
        this.els.gameContainer.classList.add('hidden');
        
        this.updateLanguageUI();

        // Ensure old listeners are cleared by cloning the button if necessary or simply replacing onclick
        this.els.btnStartGame.onclick = () => {
            onStart();
        };
        
        this.els.btnShowStats.onclick = () => {
            this.showStatsView();
        };
        
        this.els.btnShowSettings.onclick = () => {
            this.showSettingsView();
        };
        
        this.els.btnBackMenu.onclick = () => {
             this.els.statsView.classList.add('hidden');
             this.els.menuPrimary.classList.remove('hidden');
        };
        
        this.els.btnBackSettings.onclick = () => {
             this.els.settingsView.classList.add('hidden');
             this.els.menuPrimary.classList.remove('hidden');
        };
    }
    
    showStatsView() {
        this.els.menuPrimary.classList.add('hidden');
        this.els.statsView.classList.remove('hidden');
        this.renderStats();
    }
    
    showSettingsView() {
        this.els.menuPrimary.classList.add('hidden');
        this.els.settingsView.classList.remove('hidden');
    }
    
    /**
     * Binds the settings form controls to a Settings instance.
     */
    bindSettingsForm(settings) {
        const s = settings.current;
        
        // Nickname
        if (this.els.inputNickname) {
            this.els.inputNickname.value = s.nickname;
            this.els.inputNickname.oninput = () => {
                settings.set('nickname', this.els.inputNickname.value || 'Du');
                this.updateNicknames();
            };
        }

        // Language toggle
        if (this.els.chkLanguage) {
            this.els.chkLanguage.checked = (s.language === 'en');
            this.els.chkLanguage.onchange = () => {
                settings.set('language', this.els.chkLanguage.checked ? 'en' : 'de');
                this.updateLanguageUI();
            };
        }

        // Theme radios
        const themeRadios = document.querySelectorAll('input[name="theme"]');
        if (themeRadios.length > 0) {
            themeRadios.forEach(r => {
                r.checked = (r.value === s.theme);
                r.addEventListener('change', () => {
                    settings.set('theme', r.value);
                });
            });
        }
        
        // Animation speed radios
        const speedRadios = document.querySelectorAll('input[name="animSpeed"]');
        if (speedRadios.length > 0) {
            speedRadios.forEach(r => {
                r.checked = (parseFloat(r.value) === s.animationSpeed);
                r.addEventListener('change', () => {
                    settings.set('animationSpeed', parseFloat(r.value));
                });
            });
        }

        // Rule Set radios
        const ruleRadios = document.querySelectorAll('input[name="ruleSet"]');
        if (ruleRadios.length > 0) {
            ruleRadios.forEach(r => {
                r.checked = (r.value === s.ruleSet);
                r.addEventListener('change', () => {
                    settings.set('ruleSet', r.value);
                });
            });
        }
        
        // Live score toggle
        const liveScoreChk = document.getElementById('chk-live-score');
        if (liveScoreChk) {
            liveScoreChk.checked = s.showLiveScore;
            liveScoreChk.addEventListener('change', () => {
                settings.set('showLiveScore', liveScoreChk.checked);
            });
        }

        // Sound toggle
        const soundChk = document.getElementById('chk-sound');
        if (soundChk) {
            soundChk.checked = s.soundEnabled;
            soundChk.addEventListener('change', () => {
                settings.set('soundEnabled', soundChk.checked);
            });
        }

        // Drag & Drop toggle
        const dragDropChk = document.getElementById('chk-drag-drop');
        if (dragDropChk) {
            dragDropChk.checked = s.dragDropEnabled;
            dragDropChk.addEventListener('change', () => {
                settings.set('dragDropEnabled', dragDropChk.checked);
            });
        }

        // Battery Saver toggle
        const batterySaverChk = document.getElementById('chk-battery-saver');
        if (batterySaverChk) {
            batterySaverChk.checked = s.batterySaver;
            batterySaverChk.addEventListener('change', () => {
                settings.set('batterySaver', batterySaverChk.checked);
            });
        }

        // Stats Transfer Logic
        const transferBtn = document.getElementById('btn-transfer-stats');
        if (transferBtn) {
            const canMigrate = window.auth && window.auth.isLoggedIn() && window.storageService.hasLocalDataToMigrate();
            if (canMigrate) {
                transferBtn.classList.remove('hidden');
            } else {
                transferBtn.classList.add('hidden');
            }

            transferBtn.onclick = async () => {
                const result = await window.storageService.migrateManual();
                if (result.success) {
                    this.showMessage(this.getTranslation('transfer_success'));
                    transferBtn.classList.add('hidden');
                } else {
                    this.showMessage(this.getTranslation('transfer_error') + result.error);
                }
            };
        }
    }

    refreshTransferButton() {
        const transferBtn = document.getElementById('btn-transfer-stats');
        if (transferBtn) {
            const canMigrate = window.auth && window.auth.isLoggedIn() && window.storageService.hasLocalDataToMigrate();
            if (canMigrate) {
                transferBtn.classList.remove('hidden');
            } else {
                transferBtn.classList.add('hidden');
            }
        }
    }

    playSound(name) {
        if (!window.appSettings || !window.appSettings.current.soundEnabled) return;
        
        const audio = new Audio(`media/${name}.mp3`);
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Audio play blocked", e));
    }
    
    /**
     * Updates the live score display during gameplay.
     */
    updateLiveScore(declarerPoints, defenderPoints, showLiveScore) {
        if (showLiveScore) {
            this.els.liveScore.classList.remove('hidden');
            const declLabel = this.getTranslation('declarer');
            const oppLabel = this.getTranslation('opponents');
            this.els.liveScore.textContent = `${declLabel}: ${declarerPoints} | ${oppLabel}: ${defenderPoints}`;
        } else {
            this.els.liveScore.classList.add('hidden');
        }
    }
    
    resetLiveScore() {
        this.els.liveScore.classList.add('hidden');
        this.els.liveScore.textContent = `${this.getTranslation('eyes')}: -`;
    }

    resetTrumpUI() {
        this.els.currentTrump.textContent = `${this.getTranslation('trump')}: -`;
    }
    
    // --- Last Trick UI Methods ---
    showLastTrickBtn(onClick) {
        this.els.btnLastTrick.classList.remove('hidden');
        this.els.btnLastTrick.onclick = () => onClick();
    }
    
    hideLastTrickBtn() {
        this.els.btnLastTrick.classList.add('hidden');
    }
    
    showLastTrick(cardsArray) {
        this.els.lastTrickOverlay.classList.remove('hidden');
        this.els.lastTrickCards.innerHTML = '';

        cardsArray.forEach(trickItem => {
            // trickItem: {playerId, card}
            const c = trickItem.card;
            const el = c.createDOMElement();
            el.draggable = false;

            // Assign position class based on player
            const posClass = trickItem.playerId === 0 ? 'pos-bot2' :
                             trickItem.playerId === 1 ? 'pos-bot1' : 'pos-player';
            el.classList.add(posClass);

            this.els.lastTrickCards.appendChild(el);
        });

        // Close on click anywhere
        this.els.lastTrickOverlay.onclick = () => {
             this.els.lastTrickOverlay.classList.add('hidden');
        };
    }
    async renderStats() {
        let aggregatedFromCloud = null;
        let historyArray = [];

        if (window.storageService) {
            const data = await window.storageService.getStats();
            if (Array.isArray(data)) {
                // Local Guest Path
                historyArray = data;
            } else if (data) {
                // Cloud Path: data is { aggregated, history }
                aggregatedFromCloud = data.aggregated;
                historyArray = data.history || [];
                
                // For history rendering, we need to map cloud column names back to expected object format
                historyArray = historyArray.map(h => ({
                    date: h.date,
                    rounds: h.rounds,
                    ruleSet: h.rule_set,
                    scores: [h.score_bot2, h.score_bot1, h.score_player]
                }));
            }
        }

        const playerName = (window.appSettings && window.appSettings.current.nickname) || 'Du';

        // Render Overview & Badges
        if (aggregatedFromCloud) {
            this._renderStatsOverviewFromCloud(aggregatedFromCloud, playerName);
            this._renderStatsBadgesFromCloud(aggregatedFromCloud);
        } else {
            this._renderStatsOverview(historyArray, playerName);
            this._renderStatsBadges(historyArray);
        }

        // Render History (Works for both now)
        this._renderStatsHistory(historyArray, playerName);

        // Show overview tab by default
        this.switchStatsTab('overview');
    }

    _renderStatsOverviewFromCloud(agg, playerName) {
        const mainDashboardEl = document.getElementById('stats-main-dashboard');
        if (!mainDashboardEl) return;

        const totalLists = agg.lists_played || 0;
        const ratio = totalLists > 0 ? Math.round(((agg.wins || 0) / totalLists) * 100) : 0;
        const streak = agg.best_streak || 0;

        // Generate the primary cards (identical to local version)
        mainDashboardEl.innerHTML = `
            <div class="stat-card">
                <span class="stat-label" data-i18n="total_lists">Total Lists</span>
                <span class="stat-value">${totalLists}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label" data-i18n="win_ratio">Win Ratio</span>
                <span class="stat-value">${ratio}%</span>
            </div>
            <div class="stat-card">
                <span class="stat-label" data-i18n="best_streak">Best Streak</span>
                <span class="stat-value">${streak}</span>
            </div>
        `;

        // Map secondary stats (existing elements in stats.html)
        const map = {
            'stat-total-grand': agg.grand_wins,
            'stat-total-null': agg.null_wins,
            'stat-total-ramsch': agg.ramsch_wins,
            'stat-total-rollmops': agg.rollmops_wins,
            'stat-total-bigbusch': agg.big_busch,
            'stat-total-grand-ouvert': agg.grand_ouvert_wins,
            'stat-total-null-ouvert': agg.null_ouvert_wins,
            'stat-total-hand': agg.hand_wins,
            'stat-total-schneider': agg.schneider_wins,
            'stat-total-schwarz': agg.schwarz_wins
        };

        for (const [id, val] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (el) el.innerText = val !== undefined ? val : 0;
        }

        // Re-apply translations for the newly created labels
        this.updateLanguageUI();
    }

    _renderStatsBadgesFromCloud(agg) {
        const grid = document.getElementById('badges-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const badgeDefinitions = [
            { id: 'unbesiegbar', icon: '🛡️', title: this.getTranslation('badge_unbesiegbar'), desc: this.getTranslation('badge_unbesiegbar_desc'), target: 5, current: agg.winSchwarzCount || 0 },
            { id: 'seriensieger', icon: '🏆', title: this.getTranslation('badge_seriensieger'), desc: this.getTranslation('badge_seriensieger_desc'), target: 1, current: agg.wonAllInListCount || 0 },
            { id: 'grandmeister', icon: '👑', title: this.getTranslation('badge_grandmeister'), desc: this.getTranslation('badge_grandmeister_desc'), target: 10, current: agg.grand_wins },
            { id: 'null_ass', icon: '🃏', title: this.getTranslation('badge_null_ass'), desc: this.getTranslation('badge_null_ass_desc'), target: 10, current: agg.null_wins },
            { id: 'rollmops', icon: '🐟', title: this.getTranslation('badge_rollmops'), desc: this.getTranslation('badge_rollmops_desc'), target: 3, current: agg.rollmops_wins },
            { id: 'big_busch', icon: '🔥', title: this.getTranslation('badge_big_busch'), desc: this.getTranslation('badge_big_busch_desc'), target: 1, current: agg.big_busch },
            { id: 'ramsch_koenig', icon: '🧹', title: this.getTranslation('badge_ramsch_koenig'), desc: this.getTranslation('badge_ramsch_koenig_desc'), target: 10, current: agg.ramsch_wins },
            { id: 'trumpfmaschine', icon: '⚙️', title: this.getTranslation('badge_trumpfmaschine'), desc: this.getTranslation('badge_trumpfmaschine_desc'), target: 1, current: agg.trumpf_count >= 10 ? 1 : 0 },
            { id: 'anfaenger', icon: '🌱', title: this.getTranslation('badge_anfaenger'), desc: this.getTranslation('badge_anfaenger_desc'), target: 10, current: agg.games_played },
            { id: 'stammspieler', icon: '🌳', title: this.getTranslation('badge_stammspieler'), desc: this.getTranslation('badge_stammspieler_desc'), target: 50, current: agg.games_played },
            { id: 'veteran', icon: '🏅', title: this.getTranslation('badge_veteran'), desc: this.getTranslation('badge_veteran_desc'), target: 200, current: agg.games_played }
        ];

        badgeDefinitions.forEach(badge => {
            const isUnlocked = badge.current >= badge.target;
            const item = document.createElement('div');
            item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            const progressText = `${Math.min(badge.current, badge.target)} / ${badge.target}`;

            item.innerHTML = `
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-title">${badge.title}</span>
                <span class="badge-description">${badge.desc}</span>
                <div class="badge-status-container" style="margin-top: 10px; width: 100%;">
                    <span class="badge-progress" style="font-size: 0.8rem; color: ${isUnlocked ? '#4caf50' : '#888'}; font-weight: bold;">${progressText}</span>
                </div>
                <div class="badge-status">${isUnlocked ? 'Unlocked' : 'Locked'}</div>
            `;
            grid.appendChild(item);
        });
    }


    _renderStatsOverview(stats, playerName) {
        const mainDashboardEl = document.getElementById('stats-main-dashboard');
        
        // References for secondary stats
        const els = {
            grand: document.getElementById('stat-total-grand'),
            null: document.getElementById('stat-total-null'),
            hand: document.getElementById('stat-total-hand'),
            schneider: document.getElementById('stat-total-schneider'),
            schwarz: document.getElementById('stat-total-schwarz'),
            rollmops: document.getElementById('stat-total-rollmops'),
            ramsch: document.getElementById('stat-total-ramsch'),
            bigbusch: document.getElementById('stat-total-bigbusch')
        };

        if (!mainDashboardEl) return;

        if (stats.length === 0) {
            mainDashboardEl.innerHTML = `
                <div class="stat-card">
                    <span class="stat-label" data-i18n="total_lists">Total Lists</span>
                    <span class="stat-value">0</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label" data-i18n="win_ratio">Win Ratio</span>
                    <span class="stat-value">0%</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label" data-i18n="best_streak">Best Streak</span>
                    <span class="stat-value">0</span>
                </div>
            `;
            Object.values(els).forEach(el => { if(el) el.textContent = '0'; });
            return;
        }

        // Calculate statistics
        let totalLists = stats.length;
        let wins = 0;
        let currentStreak = 0;
        let bestStreak = 0;

        let totalsSum = {
            grand: 0, null: 0, hand: 0, schneider: 0, schwarz: 0, rollmops: 0, ramsch: 0, bigbusch: 0, grandouvert: 0, nullouvert: 0
        };

        stats.forEach(list => {
            const scores = list.scores;
            const maxScore = Math.max(...scores);
            const isWinner = scores[2] === maxScore; // Player is index 2

            if (isWinner) {
                wins++;
                currentStreak++;
                if (currentStreak > bestStreak) bestStreak = currentStreak;
            } else {
                currentStreak = 0;
            }

            // Aggregate totals from each list
            totalsSum.grand += (list.anzahlGrandSpiele || 0);
            totalsSum.null += (list.anzahlNullSpiele || 0);
            totalsSum.hand += (list.anzahlHandspiele || 0);
            totalsSum.schneider += (list.anzahlSchneider || 0);
            totalsSum.schwarz += (list.anzahlSchwarz || 0);
            totalsSum.rollmops += (list.anzahlRollmops || 0);
            totalsSum.ramsch += (list.anzahlRamsch || 0);
            totalsSum.bigbusch += (list.anzahlBigBusch || 0);
            totalsSum.grandouvert += (list.anzahlGrandOuvert || 0);
            totalsSum.nullouvert += (list.anzahlNullOuvert || 0);
        });

        // Render primary dashboard
        mainDashboardEl.innerHTML = `
            <div class="stat-card">
                <span class="stat-label" data-i18n="total_lists">Total Lists</span>
                <span class="stat-value">${totalLists}</span>
            </div>
            <div class="stat-card">
                <span class="stat-label" data-i18n="win_ratio">Win Ratio</span>
                <span class="stat-value">${Math.round((wins / totalLists) * 100)}%</span>
            </div>
            <div class="stat-card">
                <span class="stat-label" data-i18n="best_streak">Best Streak</span>
                <span class="stat-value">${bestStreak}</span>
            </div>
        `;

        // Update secondary stats UI
        if (els.grand) els.grand.textContent = totalsSum.grand;
        if (els.null) els.null.textContent = totalsSum.null;
        if (els.hand) els.hand.textContent = totalsSum.hand;
        if (els.schneider) els.schneider.textContent = totalsSum.schneider;
        if (els.schwarz) els.schwarz.textContent = totalsSum.schwarz;
        if (els.rollmops) els.rollmops.textContent = totalsSum.rollmops;
        if (els.ramsch) els.ramsch.textContent = totalsSum.ramsch;
        if (els.bigbusch) els.bigbusch.textContent = totalsSum.bigbusch;
    }

    _renderStatsHistory(stats, playerName) {
        const tableBody = this.els.statsTableBody;
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (stats.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 40px; color: #666;">${this.getTranslation('no_lists')}</td></tr>`;
            return;
        }

        // Render Table (Newest first)
        [...stats].reverse().forEach(list => {
            const tr = document.createElement('tr');
            const scores = list.scores;
            const names = ['Aicore', 'Aiden', playerName];

            // Find max score
            const maxScore = Math.max(...scores);
            const winnersIndices = [];
            scores.forEach((s, i) => {
                if (s === maxScore) winnersIndices.push(i);
            });

            let winnerDisplay = '';
            let isUserWinner = winnersIndices.includes(2);

            if (winnersIndices.length === 3) {
                winnerDisplay = this.getTranslation('draw');
            } else {
                winnerDisplay = winnersIndices.map(i => names[i]).join(' & ');
            }

            tr.innerHTML = `
                <td>${list.date}</td>
                <td style="font-weight: bold; color: ${isUserWinner ? '#4caf50' : '#fff'}">${winnerDisplay}</td>
                <td>${list.rounds || '-'}</td>
                <td>${this.getTranslation(list.ruleSet || 'tournament')}</td>
                <td>${scores[0]}</td>
                <td>${scores[1]}</td>
                <td>${scores[2]}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    _renderStatsBadges(stats) {
        const grid = document.getElementById('badges-grid');
        if (!grid) return;
        grid.innerHTML = '';

        // Aggregate stats across all lists for badge checking
        const aggregated = {
            totalGames: 0,
            winSchwarzCount: 0,
            wonAllInListCount: 0,
            winGrandCount: 0,
            winNullCount: 0,
            winRollmopsCount: 0,
            maxGameValue: 0,
            winRamschCount: 0,
            maxTrumpCount: 0,
            winGrandOhne4Count: 0
        };

        stats.forEach(list => {
            aggregated.totalGames += (list.rounds || 0);
            aggregated.winSchwarzCount += (list.winSchwarzCount || 0);
            if (list.wonAllInList) aggregated.wonAllInListCount++;
            aggregated.winGrandCount += (list.winGrandCount || 0);
            aggregated.winNullCount += (list.winNullCount || 0);
            aggregated.winRollmopsCount += (list.winRollmopsCount || 0);
            aggregated.maxGameValue = Math.max(aggregated.maxGameValue, list.maxGameValue || 0);
            aggregated.winRamschCount += (list.winRamschCount || 0);
            aggregated.maxTrumpCount = Math.max(aggregated.maxTrumpCount, list.maxTrumpCount || 0);
            aggregated.winGrandOhne4Count += (list.winGrandOhne4Count || 0);

            // Legacy support / inference if new fields don't exist yet
            if (list.winSchwarzCount === undefined) aggregated.winSchwarzCount += (list.anzahlSchwarz || 0);
            if (list.winGrandCount === undefined) aggregated.winGrandCount += (list.anzahlGrandSpiele || 0);
            if (list.winNullCount === undefined) aggregated.winNullCount += (list.anzahlNullSpiele || 0);
            if (list.winRollmopsCount === undefined) aggregated.winRollmopsCount += (list.anzahlRollmops || 0);
            if (list.winRamschCount === undefined) aggregated.winRamschCount += (list.anzahlRamsch || 0);
        });

        const badgeDefinitions = [
            { id: 'unbesiegbar', icon: '🛡️', title: this.getTranslation('badge_unbesiegbar'), desc: this.getTranslation('badge_unbesiegbar_desc'), target: 5, current: aggregated.winSchwarzCount },
            { id: 'seriensieger', icon: '🏆', title: this.getTranslation('badge_seriensieger'), desc: this.getTranslation('badge_seriensieger_desc'), target: 1, current: aggregated.wonAllInListCount },
            { id: 'grandmeister', icon: '👑', title: this.getTranslation('badge_grandmeister'), desc: this.getTranslation('badge_grandmeister_desc'), target: 10, current: aggregated.winGrandCount },
            { id: 'null_ass', icon: '🃏', title: this.getTranslation('badge_null_ass'), desc: this.getTranslation('badge_null_ass_desc'), target: 10, current: aggregated.winNullCount },
            { id: 'rollmops', icon: '🐟', title: this.getTranslation('badge_rollmops'), desc: this.getTranslation('badge_rollmops_desc'), target: 3, current: aggregated.winRollmopsCount },
            { id: 'big_busch', icon: '🔥', title: this.getTranslation('badge_big_busch'), desc: this.getTranslation('badge_big_busch_desc'), target: 1, current: aggregated.maxGameValue >= 264 ? 1 : 0 },
            { id: 'ramsch_koenig', icon: '🧹', title: this.getTranslation('badge_ramsch_koenig'), desc: this.getTranslation('badge_ramsch_koenig_desc'), target: 10, current: aggregated.winRamschCount },
            { id: 'trumpfmaschine', icon: '⚙️', title: this.getTranslation('badge_trumpfmaschine'), desc: this.getTranslation('badge_trumpfmaschine_desc'), target: 1, current: aggregated.maxTrumpCount >= 10 ? 1 : 0 },
            { id: 'anfaenger', icon: '🌱', title: this.getTranslation('badge_anfaenger'), desc: this.getTranslation('badge_anfaenger_desc'), target: 10, current: aggregated.totalGames },
            { id: 'stammspieler', icon: '🌳', title: this.getTranslation('badge_stammspieler'), desc: this.getTranslation('badge_stammspieler_desc'), target: 50, current: aggregated.totalGames },
            { id: 'veteran', icon: '🏅', title: this.getTranslation('badge_veteran'), desc: this.getTranslation('badge_veteran_desc'), target: 200, current: aggregated.totalGames },
            { id: 'ohne_4', icon: '⚡', title: this.getTranslation('badge_ohne_4'), desc: this.getTranslation('badge_ohne_4_desc'), target: 1, current: aggregated.winGrandOhne4Count }
        ];

        badgeDefinitions.forEach(badge => {
            const isUnlocked = badge.current >= badge.target;
            const item = document.createElement('div');
            item.className = `badge-item ${isUnlocked ? 'unlocked' : 'locked'}`;
            
            const progressText = `${Math.min(badge.current, badge.target)} / ${badge.target}`;

            item.innerHTML = `
                <span class="badge-icon">${badge.icon}</span>
                <span class="badge-title">${badge.title}</span>
                <span class="badge-description">${badge.desc}</span>
                <div class="badge-status-container" style="margin-top: 10px; width: 100%;">
                    <span class="badge-progress" style="font-size: 0.8rem; color: ${isUnlocked ? '#4caf50' : '#888'}; font-weight: bold;">${progressText}</span>
                </div>
            `;
            grid.appendChild(item);
        });
    }

    switchStatsTab(tabName) {
        const overviewEl = document.getElementById('stats-overview');
        const historyEl = document.getElementById('stats-history');
        const badgesEl = document.getElementById('stats-badges');
        const overviewBtn = document.querySelector('[data-tab="overview"]');
        const historyBtn = document.querySelector('[data-tab="history"]');
        const badgesBtn = document.querySelector('[data-tab="badges"]');

        [overviewEl, historyEl, badgesEl].forEach(el => { if(el) el.classList.add('hidden'); });
        [overviewBtn, historyBtn, badgesBtn].forEach(btn => { if(btn) btn.classList.remove('active'); });

        if (tabName === 'overview') {
            if (overviewEl) overviewEl.classList.remove('hidden');
            if (overviewBtn) overviewBtn.classList.add('active');
        } else if (tabName === 'history') {
            if (historyEl) historyEl.classList.remove('hidden');
            if (historyBtn) historyBtn.classList.add('active');
        } else if (tabName === 'badges') {
            if (badgesEl) badgesEl.classList.remove('hidden');
            if (badgesBtn) badgesBtn.classList.add('active');
        }
    }

    hideMainMenu() {
        this.els.mainMenu.classList.add('hidden');
        this.els.gameContainer.classList.remove('hidden');
    }

    bindHomeButton(onHomeClick) {
        this.els.btnHome.onclick = () => onHomeClick();
    }

    showMessage(msg) {
        // Could be a toast in the middle. For now log and alert or set somewhere
        console.log(msg);
        this.showSpeechBubble(2, msg, 2000); // Show on player occasionally
    }

    showSpeechBubble(playerId, text, duration = 2000) {
        let el;
        if (playerId === 0) el = this.els.bot2Speech;
        else if (playerId === 1) el = this.els.bot1Speech;
        else el = this.els.playerSpeech;
        
        // Translate common short responses
        let displayMsg = text;
        if (text === 'Passe') displayMsg = this.getTranslation('pass');
        if (text === 'Ja') displayMsg = this.getTranslation('yes');
        if (text.startsWith('Reize')) {
            const val = text.split(' ')[1];
            displayMsg = `${this.getTranslation('bid')} ${val}`;
        }

        el.textContent = displayMsg;
        el.classList.remove('hidden');
        
        setTimeout(() => {
            el.classList.add('hidden');
        }, duration);
    }

    renderAllHands(players) {
        this.renderBotHand(0, players[0].hand.length);
        this.renderBotHand(1, players[1].hand.length);
        this.renderPlayerHand(players[2].hand);
    }

    renderBotHand(playerId, count) {
        const container = playerId === 0 ? this.els.player0Cards : this.els.player1Cards;
        container.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const cardBack = document.createElement('div');
            cardBack.classList.add('card', 'card-back');
            container.appendChild(cardBack);
        }
    }

    renderPlayerHand(hand) {
        this.els.player2Cards.innerHTML = '';
        hand.forEach(card => {
            const cardEl = card.createDOMElement();
            this.els.player2Cards.appendChild(cardEl);
        });
    }

    showBiddingOverlay(nextBid, onBid, onPass) {
        // Kept for backwards compatibility if needed, though we replace it
        this.showAdvancedBiddingOverlay(nextBid, true, false, onBid, onPass);
    }

    showAdvancedBiddingOverlay(targetBid, canBid, canHold, onActionBid, onActionPass) {
        this.els.biddingOverlay.classList.remove('hidden');
        this.els.biddingStatus.textContent = canBid ? this.getTranslation('your_turn_bid') : this.getTranslation('you_must_answer');
        
        this.els.biddingControls.innerHTML = `
            <div class="button-group">
                <button id="btn-pass" class="btn">${this.getTranslation('pass')}</button>
                ${canHold ? `<button id="btn-hold" class="btn primary">${this.getTranslation('yes')} (${targetBid})</button>` : ''}
                ${canBid ? `<button id="btn-bid" class="btn primary">${this.getTranslation('bid')} ${targetBid}</button>` : ''}
            </div>
        `;
        
        document.getElementById('btn-pass').onclick = onActionPass;
        if (canHold) document.getElementById('btn-hold').onclick = onActionBid;
        if (canBid) document.getElementById('btn-bid').onclick = onActionBid;
    }

    hideBiddingOverlay() {
        this.els.biddingOverlay.classList.add('hidden');
    }

    _initCardDragging(el, config) {
        let isDragging = false;
        let startX, startY;
        let initialRect;
        let currentDropTarget = null;
        let placeholder = null;

        const onStart = (e) => {
            if (e.button && e.button !== 0) return; // Only left click
            
            // Only allow dragging if enabled in settings
            const dragEnabled = (window.appSettings && window.appSettings.current.dragDropEnabled);
            
            this.playSound('drag');

            const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
            const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            initialRect = el.getBoundingClientRect();
            
            const moveHandler = (moveEvent) => {
                if (!dragEnabled) return; // Ignore movement if drag is disabled
                
                const moveX = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientX : moveEvent.clientX;
                const moveY = moveEvent.type === 'touchmove' ? moveEvent.touches[0].clientY : moveEvent.clientY;
                
                const deltaX = moveX - startX;
                const deltaY = moveY - startY;

                if (!isDragging && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
                    isDragging = true;
                    
                    // Create placeholder to keep hand layout
                    placeholder = el.cloneNode(true);
                    placeholder.style.opacity = '0';
                    placeholder.style.pointerEvents = 'none';
                    el.parentNode.insertBefore(placeholder, el);
                    
                    el.classList.add('dragging-active');
                    el.style.width = initialRect.width + 'px';
                    el.style.height = initialRect.height + 'px';
                    el.style.left = initialRect.left + 'px';
                    el.style.top = initialRect.top + 'px';
                }

                if (isDragging) {
                    if (moveEvent.cancelable) moveEvent.preventDefault();
                    
                    el.style.left = (initialRect.left + deltaX) + 'px';
                    el.style.top = (initialRect.top + deltaY) + 'px';

                    // Target detection
                    const target = document.elementFromPoint(moveX, moveY);
                    const dropTarget = config.getValidTarget(target);
                    
                    if (dropTarget !== currentDropTarget) {
                        if (currentDropTarget) currentDropTarget.classList.remove('drag-over');
                        currentDropTarget = dropTarget;
                        if (currentDropTarget) currentDropTarget.classList.add('drag-over');
                    }
                }
            };

            const endHandler = (endEvent) => {
                window.removeEventListener('mousemove', moveHandler);
                window.removeEventListener('mouseup', endHandler);
                window.removeEventListener('touchmove', moveHandler);
                window.removeEventListener('touchend', endHandler);

                if (isDragging) {
                    el.classList.remove('dragging-active');
                    
                    if (currentDropTarget) {
                        if (placeholder) {
                            placeholder.remove();
                            placeholder = null;
                        }
                        currentDropTarget.classList.remove('drag-over');
                        config.execute(el, currentDropTarget);
                        // Reset styles
                        el.style.position = '';
                        el.style.left = '';
                        el.style.top = '';
                        el.style.width = '';
                        el.style.height = '';
                    } else {
                        // Return animation
                        el.classList.add('returning');
                        el.style.left = initialRect.left + 'px';
                        el.style.top = initialRect.top + 'px';
                        
                        const currentPlaceholder = placeholder;
                        placeholder = null;
                        
                        setTimeout(() => {
                            el.classList.remove('returning');
                            el.style.position = '';
                            el.style.left = '';
                            el.style.top = '';
                            el.style.width = '';
                            el.style.height = '';
                            if (currentPlaceholder) currentPlaceholder.remove();
                        }, 300);
                    }
                    isDragging = false;
                } else if (config.onClick) {
                    // It was a click, not a drag
                    config.onClick(el);
                }
            };

            window.addEventListener('mousemove', moveHandler, { passive: false });
            window.addEventListener('mouseup', endHandler);
            window.addEventListener('touchmove', moveHandler, { passive: false });
            window.addEventListener('touchend', endHandler);
        };

        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });
    }

    showSkatDecisionOverlay(onTake, onHand) {
        this.els.skatDecisionOverlay.classList.remove('hidden');
        this.els.skatDiscardArea.classList.add('hidden');
        
        const h2 = this.els.skatDecisionOverlay.querySelector('h2');
        h2.textContent = this.getTranslation('take_skat');

        // Reset display
        this.els.btnSkatTake.style.display = 'block';
        this.els.btnSkatHand.style.display = 'block';
        
        // Remove extra buttons if they exist from previous calls
        const extraBtn = document.getElementById('btn-skat-null-ouvert');
        if (extraBtn) extraBtn.remove();

        this.els.btnSkatTake.textContent = this.getTranslation('take');
        this.els.btnSkatHand.textContent = this.getTranslation('hand_game');

        this.els.btnSkatTake.onclick = () => { 
            // When taking skat, we need to show the discard UI first
            onTake(); 
        };

        this.els.btnSkatHand.onclick = () => {
            this.els.skatDecisionOverlay.classList.add('hidden');
            onHand();
        };
    }

    showAnnouncementOverlay(onSelect) {
        this.els.skatDecisionOverlay.classList.remove('hidden');
        const h2 = this.els.skatDecisionOverlay.querySelector('h2');
        h2.textContent = this.getTranslation('announce_schneider') + "?";

        // Hide original buttons and discard area
        this.els.btnSkatTake.classList.add('hidden');
        this.els.btnSkatHand.classList.add('hidden');
        this.els.skatDiscardArea.classList.add('hidden');

        const container = document.getElementById('hand-announcements');
        container.classList.remove('hidden');

        const chkSchneider = document.getElementById('chk-announce-schneider');
        const chkSchwarz = document.getElementById('chk-announce-schwarz');
        const btnAnnounce = document.getElementById('btn-confirm-announcement');

        chkSchneider.checked = false;
        chkSchwarz.checked = false;

        // Auto-check Schneider if Schwarz is checked
        chkSchwarz.onchange = () => {
            if (chkSchwarz.checked) chkSchneider.checked = true;
        };
        chkSchneider.onchange = () => {
            if (!chkSchneider.checked) chkSchwarz.checked = false;
        };

        btnAnnounce.onclick = () => {
            this.els.skatDecisionOverlay.classList.add('hidden');
            container.classList.add('hidden');
            
            // Reset visibility for next time
            this.els.btnSkatTake.classList.remove('hidden');
            this.els.btnSkatHand.classList.remove('hidden');
            
            onSelect(chkSchneider.checked, chkSchwarz.checked);
        };
    }

    showSkatDiscardUI(hand, skatCards, onConfirm) {
        this.els.btnSkatTake.style.display = 'none';
        this.els.btnSkatHand.style.display = 'none';
        
        this.els.skatDiscardArea.classList.remove('hidden');
        
        const p = this.els.skatDiscardArea.querySelector('p');
        p.textContent = this.getTranslation('discard_info');
        this.els.btnConfirmSkat.textContent = this.getTranslation('confirm');

        // Render Skat Cards onto the slots completely fresh
        this.els.skatDiscardSlots.forEach((s, index) => {
            s.innerHTML = '';
            if (skatCards[index]) {
                const cardEl = skatCards[index].createDOMElement();
                s.appendChild(cardEl);
                s.dataset.cardId = skatCards[index].id;
            } else {
                s.dataset.cardId = '';
            }
        });
        
        const discardedIds = [skatCards[0].id, skatCards[1].id]; // Initially both are in Skat
        const handContainer = this.els.player2Cards;
        
        // Function to make a single card fully interactive (Drag & Click toggle)
        const bindCardInteractable = (el) => {
            this._initCardDragging(el, {
                getValidTarget: (target) => {
                    const dropSlot = Array.from(this.els.skatDiscardSlots).find(s => s === target || s.contains(target));
                    if (dropSlot && !dropSlot.hasChildNodes() && !el.parentElement.classList.contains('skat-slot')) {
                        return dropSlot;
                    }
                    if ((target === handContainer || handContainer.contains(target)) && el.parentElement.classList.contains('skat-slot')) {
                        return handContainer;
                    }
                    return null;
                },
                execute: (cardEl, target) => {
                    const cardId = cardEl.dataset.id;
                    if (target.classList.contains('skat-slot')) {
                        target.appendChild(cardEl);
                        target.dataset.cardId = cardId;
                        if (!discardedIds.includes(cardId)) discardedIds.push(cardId);
                    } else if (target === handContainer) {
                        const parentSlot = cardEl.parentElement;
                        handContainer.appendChild(cardEl);
                        parentSlot.dataset.cardId = '';
                        const index = discardedIds.indexOf(cardId);
                        if (index > -1) discardedIds.splice(index, 1);
                    }
                    this.els.btnConfirmSkat.disabled = (discardedIds.length !== 2);
                },
                onClick: (cardEl) => {
                    const parentSlot = cardEl.parentElement;
                    if (parentSlot.classList.contains('skat-slot')) {
                        handContainer.appendChild(cardEl);
                        parentSlot.dataset.cardId = '';
                        const index = discardedIds.indexOf(cardEl.dataset.id);
                        if (index > -1) discardedIds.splice(index, 1);
                        this.els.btnConfirmSkat.disabled = true;
                    } else {
                        const emptySlot = Array.from(this.els.skatDiscardSlots).find(s => !s.dataset.cardId);
                        if (emptySlot) {
                            emptySlot.appendChild(cardEl);
                            emptySlot.dataset.cardId = cardEl.dataset.id;
                            discardedIds.push(cardEl.dataset.id);
                            this.els.btnConfirmSkat.disabled = (discardedIds.length !== 2);
                        } else {
                            this.showMessage(this.getTranslation('discard_info'));
                        }
                    }
                }
            });
        };

        // Bind all current hand cards
        const cardEls = handContainer.querySelectorAll('.card-face');
        cardEls.forEach(bindCardInteractable);

        // Bind the 2 newly created cards residing in the skat slots
        this.els.skatDiscardSlots.forEach(s => {
            const cardInSlot = s.querySelector('.card-face');
            if (cardInSlot) bindCardInteractable(cardInSlot);
        });

        // Confirmation Callback
        this.els.btnConfirmSkat.disabled = false; // Initially 2 cards are in the skat
        this.els.btnConfirmSkat.onclick = () => {
             this.els.skatDecisionOverlay.classList.add('hidden');
             
             // Extract physical cards from slots to form the final skat
             const finalSkatId1 = this.els.skatDiscardSlots[0].dataset.cardId;
             const finalSkatId2 = this.els.skatDiscardSlots[1].dataset.cardId;
             
             // Cleanly remove bindings before continuing
             const allCards = [...handContainer.querySelectorAll('.card-face'), ...document.querySelectorAll('.skat-slot .card-face')];
             allCards.forEach(c => { 
                 const newC = c.cloneNode(true);
                 c.parentNode.replaceChild(newC, c);
             });
             
             onConfirm([finalSkatId1, finalSkatId2]);
        };
    }

    showTrumpSelectionOverlay(isHand, onSelect) {
        this.els.trumpOverlay.classList.remove('hidden');
        const h2 = this.els.trumpOverlay.querySelector('h2');
        h2.textContent = this.getTranslation('choose_trump');
        
        const btnGrandOuvert = document.getElementById('btn-grand-ouvert');
        const btnNullOuvert = document.getElementById('btn-null-ouvert');

        // Hand game rules: Grand Ouvert and Null Ouvert allowed
        // Skat taken rules: Only Null Ouvert allowed (standard Skat)
        if (isHand) {
            btnGrandOuvert.style.display = 'inline-block';
            btnNullOuvert.style.display = 'inline-block';
            btnNullOuvert.textContent = this.getTranslation('null_ouvert_hand');
        } else {
            btnGrandOuvert.style.display = 'none';
            btnNullOuvert.style.display = 'inline-block';
            btnNullOuvert.textContent = this.getTranslation('null_ouvert');
        }

        this.els.trumpBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            
            newBtn.addEventListener('click', () => {
                this.els.trumpOverlay.classList.add('hidden');
                const isOuvert = newBtn.dataset.ouvert === 'true';
                onSelect(newBtn.dataset.suit, isOuvert);
            });
        });
        
        this.els.trumpBtns = document.querySelectorAll('.trump-btn');
    }

    setTrump(trump, hand = false, schneider = false, schwarz = false, ouvert = false) {
        let symbol = trump;
        if (SUIT_SYMBOLS[trump]) {
            symbol = `${trump} ${SUIT_SYMBOLS[trump]}`;
        }
        
        let suffix = "";
        const parts = [];
        if (hand) parts.push(this.getTranslation('hand'));
        if (ouvert) parts.push(this.getTranslation('ouvert'));
        if (schwarz) parts.push(this.getTranslation('schwarz'));
        else if (schneider) parts.push(this.getTranslation('schneider'));
        
        if (parts.length > 0) {
            suffix = ` (${parts.join(', ')})`;
        }

        this.els.currentTrump.innerHTML = `${this.getTranslation('trump')}: ${symbol}${suffix}`;
    }

    revealDeclarerCards(declarerIndex, hand) {
        const container = declarerIndex === 0 ? this.els.player0Cards : 
                         declarerIndex === 1 ? this.els.player1Cards : 
                         this.els.player2Cards;
        
        if (!container) return;
        
        container.innerHTML = '';
        container.classList.add('revealed-hand');
        
        hand.forEach(card => {
            const el = card.createDOMElement();
            el.classList.add('revealed-card');
            container.appendChild(el);
        });
    }

    updateTurn(turnIndex) {
        const playerName = (window.appSettings && window.appSettings.current.nickname) || 'Du';
        const names = ['Aicore', 'Aiden', playerName];
        this.els.currentTurn.textContent = `${this.getTranslation('turn')}: ${names[turnIndex]}`;
        
        // Highlight active player
        document.querySelectorAll('.player-zone').forEach(el => el.style.opacity = '0.5');
        if (turnIndex === 0) document.getElementById('bot2').style.opacity = '1';
        else if (turnIndex === 1) document.getElementById('bot1').style.opacity = '1';
        else document.getElementById('player-area').style.opacity = '1';
    }

    setDeclarer(name, bidValue, declarerIndex = -1) {
        const displayName = name === 'Du' ? ((window.appSettings && window.appSettings.current.nickname) || 'Du') : name;
        this.els.currentDeclarer.textContent = `${this.getTranslation('declarer')}: ${displayName}`;
        if (bidValue) {
            this.els.currentBid.textContent = `${this.getTranslation('bid_value')}: ${bidValue}`;
        } else {
            this.els.currentBid.textContent = `${this.getTranslation('bid_value')}: -`;
        }

        // --- Visual Piles Initialization ---
        // Hide all first
        const allPiles = document.querySelectorAll('.trick-pile');
        allPiles.forEach(p => {
            p.classList.add('hidden');
            p.classList.remove('has-cards', 'pos-bottom', 'pos-bot2', 'pos-bot1', 'pos-center', 'pos-top', 'pos-right', 'pos-left');
            p.innerHTML = '';
        });

        if (declarerIndex === -1 && name === 'Ramsch') {
            // Ramsch: use p0, p1, p2
            document.getElementById('pile-p0').classList.remove('hidden');
            document.getElementById('pile-p1').classList.remove('hidden');
            document.getElementById('pile-p2').classList.remove('hidden');
        } else if (declarerIndex !== -1) {
            // Regular Game
            const pDeclarer = document.getElementById('pile-declarer');
            const pDefenders = document.getElementById('pile-defenders');
            const pSkat = document.getElementById('pile-skat');

            pDeclarer.classList.remove('hidden');
            pDefenders.classList.remove('hidden');
            pSkat.classList.remove('hidden');

            if (declarerIndex === 2) { // Human
                pDeclarer.classList.add('pos-bottom');
                pDefenders.classList.add('pos-top');
                pSkat.classList.add('pos-bottom');
            } else if (declarerIndex === 0) { // Bot 2 (Top Left)
                pDeclarer.classList.add('pos-bot2');
                pDefenders.classList.add('pos-right');
                pSkat.classList.add('pos-bot2');
            } else if (declarerIndex === 1) { // Bot 1 (Top Right)
                pDeclarer.classList.add('pos-bot1');
                pDefenders.classList.add('pos-left');
                pSkat.classList.add('pos-bot1');
            }
        }
    }

    updateTrickPiles(players, declarerIndex, isRamsch = false) {
        if (isRamsch) {
            for (let i = 0; i < 3; i++) {
                this.renderPileCards(`pile-p${i}`, players[i].tricks.length / 3);
            }
        } else {
            // Declarer pile: 2 skat cards + trickCount
            const declarer = players[declarerIndex];
            this.renderPileCards('pile-declarer', declarer.tricks.length / 3, 2);

            // Defenders pile (shared)
            let defenderTricks = 0;
            players.forEach((p, idx) => {
                if (idx !== declarerIndex) defenderTricks += p.tricks.length;
            });
            this.renderPileCards('pile-defenders', defenderTricks / 3);
        }
    }

    updateSkatPile(visible = true) {
        const pSkat = document.getElementById('pile-skat');
        if (!pSkat) return;
        
        if (visible) {
            pSkat.innerHTML = '';
            pSkat.className = 'trick-pile pos-center'; // Ensure it is centered initially
            // Chaotic look here too
            for (let i = 0; i < 2; i++) {
                const back = document.createElement('div');
                back.classList.add('card', 'card-back');
                
                const rot = (Math.random() * 10) - 5;
                const ox = (Math.random() * 4) - 2;
                const oy = (Math.random() * 4) - 2;
                back.style.transform = `translate(${ox}px, ${oy}px) rotate(${rot}deg)`;
                
                pSkat.appendChild(back);
            }
            pSkat.classList.remove('hidden');
            pSkat.classList.add('has-cards');
        } else {
            // Clear DOM elements and classes when hiding to prevent stale elements
            pSkat.innerHTML = '';
            pSkat.classList.add('hidden');
            pSkat.classList.remove('has-cards');
        }
    }

    renderPileCards(pileId, trickCount, extraCards = 0) {
        const el = document.getElementById(pileId);
        if (!el) return;
        
        const totalCards = trickCount + extraCards;
        const targetVisualCount = Math.min(totalCards, 6);
        const currentVisualCount = el.querySelectorAll('.card-back').length;
        
        if (targetVisualCount > 0) {
            el.classList.add('has-cards');
            
            // Only add cards if we haven't reached the target visual count yet
            for (let i = currentVisualCount; i < targetVisualCount; i++) {
                const back = document.createElement('div');
                back.classList.add('card', 'card-back');
                
                // Chaotic Natural Vibe:
                let rotation = (Math.random() * 30) - 15;
                const offsetX = (Math.random() * 6) - 3;
                const offsetY = (Math.random() * 6) - 3;
                
                if (Math.random() > 0.75) {
                    rotation += (Math.random() > 0.5 ? 90 : -90);
                }
                
                back.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
                back.style.zIndex = i;
                
                el.appendChild(back);
            }
        } else {
            el.innerHTML = '';
            el.classList.remove('has-cards');
        }
    }

    updatePlayerRoles(vorhandId, mittelhandId, hinterhandId) {
        const roles = [];
        roles[vorhandId] = ' (V)';
        roles[mittelhandId] = ' (M)';
        roles[hinterhandId] = ' (H)';
        
        const playerName = (window.appSettings && window.appSettings.current.nickname) || 'Du';

        // Find player name divs
        const bot2Name = document.querySelector('#bot2 .player-info');
        const bot1Name = document.querySelector('#bot1 .player-info');
        const playerInfoEl = document.querySelector('#player-area .player-info');
        
        bot2Name.innerHTML = `<span class="ai-text">Ai</span>core${roles[0]}`;
        bot1Name.innerHTML = `<span class="ai-text">Ai</span>den${roles[1]}`;
        playerInfoEl.textContent = `${playerName}${roles[2]}`;
    }

    enablePlayerMoves(validCards, onPlay) {
        const validIds = validCards.map(c => c.id);
        const cardEls = this.els.player2Cards.querySelectorAll('.card-face');
        
        const tableArea = document.getElementById('table-area');

        // KEYBOARD SUPPORT: Remove old handler if exists
        if (this._activeKeyHandler) {
            document.removeEventListener('keydown', this._activeKeyHandler);
        }

        // New key handler
        this._activeKeyHandler = (e) => {
            let index = -1;
            // Keys 1-9 (codes 49-57)
            if (e.keyCode >= 49 && e.keyCode <= 57) {
                index = e.keyCode - 49;
            } 
            // Key 0 (code 48) for the 10th card
            else if (e.keyCode === 48) {
                index = 9;
            }

            if (index !== -1 && index < cardEls.length) {
                const targetCardEl = cardEls[index];
                const cardId = targetCardEl.dataset.id;
                if (validIds.includes(cardId)) {
                    // Play card
                    document.removeEventListener('keydown', this._activeKeyHandler);
                    this._activeKeyHandler = null;
                    onPlay(cardId);
                }
            }
        };
        document.addEventListener('keydown', this._activeKeyHandler);
        
        // Make cards draggable / clickable / touchable
        cardEls.forEach(el => {
            const cardId = el.dataset.id;
            const isDraggable = validIds.includes(cardId);
            
            if (isDraggable) {
                el.classList.add('valid-move');
                el.classList.remove('invalid-move');
                
                this._initCardDragging(el, {
                    getValidTarget: (target) => {
                        if (target && (target.id === 'table-area' || target.closest('#table-area'))) {
                            return tableArea;
                        }
                        return null;
                    },
                    execute: (cardEl, target) => {
                        onPlay(cardId);
                    },
                    onClick: (cardEl) => {
                        onPlay(cardId);
                    }
                });
                
                // Allow double click to play instantly as well
                el.ondblclick = () => onPlay(cardId);
            } else {
                el.classList.remove('valid-move');
                el.classList.add('invalid-move');
                el.style.pointerEvents = 'none'; // Ensure invalid cards don't react at all
            }
        });
    }

    renderPlayedCard(playerId, card) {
        const cardEl = card.createDOMElement();
        cardEl.classList.add('played-card');
        cardEl.draggable = false;
        cardEl.classList.remove('valid-move', 'invalid-move');
        
        if (playerId === 0) {
            this.els.trickBot2.innerHTML = '';
            this.els.trickBot2.appendChild(cardEl);
        } else if (playerId === 1) {
            this.els.trickBot1.innerHTML = '';
            this.els.trickBot1.appendChild(cardEl);
        } else if (playerId === 2) {
            this.els.trickPlayer.innerHTML = '';
            this.els.trickPlayer.appendChild(cardEl);
            
            // Remove highlighting from hand immediately
            const cardEls = this.els.player2Cards.querySelectorAll('.card-face');
            cardEls.forEach(el => el.classList.remove('valid-move', 'invalid-move'));
        }
    }

    clearTrickZone() {
        this.els.trickBot2.innerHTML = '';
        this.els.trickBot1.innerHTML = '';
        this.els.trickPlayer.innerHTML = '';
    }

    showGameOver(won, resultMsg, declarerPoints, oppPoints, evaluation = null, initialSkat = [], finalSkat = [], individualScores = null) {
        this.els.gameOverOverlay.classList.remove('hidden');
        const resDiv = document.getElementById('results');
        const overbidEl = document.getElementById('overbid-warning');
        const detailsEl = document.getElementById('game-value-details');
        const valueLine = document.getElementById('game-value-line');
        const badgesEl = document.getElementById('game-badges');
        
        // Skat Summary elements
        const originalSkatContainer = document.getElementById('original-skat-cards');
        const finalSkatContainer = document.getElementById('final-skat-cards');
        
        // Use the title based on won
        const titleKey = won ? 'game_won' : 'game_lost';
        document.getElementById('game-result-msg').textContent = this.getTranslation(titleKey);
        
        if (individualScores) {
            // RAMSCH Layout: Show all 3 players
            const names = ['Aicore', 'Aiden', (window.appSettings && window.appSettings.current.nickname) || 'Du'];
            const eyesLabel = this.getTranslation('eyes');
            
            let scoresHtml = '<div class="result-details individual-scores">';
            individualScores.forEach((pts, idx) => {
                scoresHtml += `<p>${names[idx]}: ${pts} ${eyesLabel}</p>`;
            });
            scoresHtml += '</div>';

            resDiv.innerHTML = `
                <p class="result-summary">${resultMsg}</p>
                ${scoresHtml}
            `;
            
            // Hide "Discarded" cards group for Ramsch
            finalSkatContainer.parentElement.classList.add('hidden');
        } else {
            // NORMAL Layout
            const declLabel = this.getTranslation('declarer');
            const oppLabel = this.getTranslation('opponents');
            const eyesLabel = this.getTranslation('eyes');

            resDiv.innerHTML = `
                <p class="result-summary">${resultMsg}</p>
                <div class="result-details">
                    <p>${declLabel}: ${declarerPoints} ${eyesLabel}</p>
                    <p>${oppLabel}: ${oppPoints} ${eyesLabel}</p>
                </div>
            `;
            finalSkatContainer.parentElement.classList.remove('hidden');
        }
        
        // Render Skat Summary (Original always shown)
        originalSkatContainer.innerHTML = '';
        initialSkat.forEach(c => originalSkatContainer.appendChild(c.createDOMElement()));
        originalSkatContainer.parentElement.classList.remove('hidden');

        if (!individualScores) {
            finalSkatContainer.innerHTML = '';
            finalSkat.forEach(c => finalSkatContainer.appendChild(c.createDOMElement()));
            
            // Hide "Discarded" cards group for Hand games
            if (evaluation && evaluation.handGame) {
                finalSkatContainer.parentElement.classList.add('hidden');
            } else {
                finalSkatContainer.parentElement.classList.remove('hidden');
            }
        }

        // Reset elements
        overbidEl.classList.add('hidden');
        detailsEl.classList.add('hidden');
        badgesEl.innerHTML = '';
        
        if (evaluation) {
            // Show game value details
            detailsEl.classList.remove('hidden');
            valueLine.textContent = `${this.getTranslation('game_value')}: ${evaluation.details}`;
            
            // Overbid warning
            if (evaluation.overbid) {
                overbidEl.classList.remove('hidden');
            }
            
            // Badges for schneider / schwarz / hand
            if (evaluation.schneider) {
                badgesEl.innerHTML += '<span class="badge badge-schneider">Schneider</span>';
            }
            if (evaluation.schwarz) {
                badgesEl.innerHTML += '<span class="badge badge-schwarz">Schwarz</span>';
            }
            if (evaluation.matadors && evaluation.matadors.count > 0) {
                badgesEl.innerHTML += `<span class="badge badge-matadors">${evaluation.matadors.type} ${evaluation.matadors.count}</span>`;
            }
        }
    }

    showGameOverPassedIn(initialSkat = []) {
        this.els.gameOverOverlay.classList.remove('hidden');
        document.getElementById('game-result-msg').textContent = this.getTranslation('passed_in');
        const resDiv = document.getElementById('results');
        
        resDiv.innerHTML = `
            <p>${this.getTranslation('nobody_bid')}</p>
        `;

        // Skat Summary elements
        const originalSkatContainer = document.getElementById('original-skat-cards');
        const finalSkatContainer = document.getElementById('final-skat-cards');
        const skatSummary = document.getElementById('skat-summary');
        
        // Render Skat Summary (only original)
        skatSummary.classList.remove('hidden');
        originalSkatContainer.innerHTML = '';
        initialSkat.forEach(c => originalSkatContainer.appendChild(c.createDOMElement()));
        
        // Hide final skat group for passed in
        finalSkatContainer.parentElement.classList.add('hidden');
        originalSkatContainer.parentElement.classList.remove('hidden');

        // Hide other details
        document.getElementById('overbid-warning').classList.add('hidden');
        document.getElementById('game-value-details').classList.add('hidden');
    }

    toggleReiztabelle() {
        if (!this.els.reiztabelleOverlay) return;
        this.els.reiztabelleOverlay.classList.toggle('hidden');
    }
}
