/**
 * Daily Challenges System for Skat
 */

const CHALLENGE_POOLS = {
    POOL_10: [
        { id: 'schneider_meister', title: 'Der Schneider-Meister', desc: 'Bringe deine Gegner in einem Farbspiel in den Schneider (< 31 Augen).', target: 1, value: 10 },
        { id: 'sicher_ist_sicher', title: 'Sicher ist sicher', desc: 'Gewinne ein Spiel mit über 90 Augen.', target: 1, value: 10 },
        { id: 'eichel_experte', title: 'Eichel-Experte', desc: 'Gewinne 3 Spiele in der Farbe Eichel als Alleinspieler.', target: 3, value: 10 },
        { id: 'gruen_spezialist', title: 'Grün-Spezialist', desc: 'Gewinne 3 Spiele in der Farbe Grün als Alleinspieler.', target: 3, value: 10 },
        { id: 'herz_ass', title: 'Herz-Ass', desc: 'Gewinne 3 Spiele in der Farbe Rot als Alleinspieler.', target: 3, value: 10 },
        { id: 'schellen_koenig', title: 'Schellen-König', desc: 'Gewinne 3 Spiele in der Farbe Schellen als Alleinspieler.', target: 3, value: 10 },
        { id: 'null_runde', title: 'Null-Runde', desc: 'Gewinne insgesamt 2 Null-Spiele.', target: 2, value: 10 },
        { id: 'grand_meister', title: 'Grand-Meister', desc: 'Gewinne insgesamt 2 Grand-Spiele.', target: 2, value: 10 },
        { id: 'offene_karten', title: 'Offene Karten', desc: 'Gewinne ein Ouvert-Spiel deiner Wahl.', target: 1, value: 10 }
    ],
    POOL_20: [
        { id: 'vorsichtiger_solist', title: 'Der vorsichtige Solist', desc: 'Gewinne ein Grand-Spiel, ohne dass die Gegner mehr als 30 Augen erhalten.', target: 1, value: 20 },
        { id: 'die_unberuehrbaren', title: 'Die Unberührbaren', desc: 'Gewinne ein Farbspiel, bei dem du keinen Unter verlierst.', target: 1, value: 20 },
        { id: 'schellen_bonus', title: 'Der Schellen-Bonus', desc: 'Gewinne ein Spiel, in dem du die Schellen-Sieben im letzten Stich heimholst.', target: 1, value: 20 },
        { id: 'abraeumer_tag', title: 'Abräumer-Tag', desc: 'Gewinne ein Spiel als Alleinspieler mit exakt 61 Augen.', target: 1, value: 20 },
        { id: 'buben_power', title: 'Buben-Power', desc: 'Gewinne ein Spiel, bei dem du alle 4 Unter hattest.', target: 1, value: 20 },
        { id: 'skat_glueck', title: 'Skat-Glück', desc: 'Drücke >= 20 Augen in den Skat und gewinne.', target: 1, value: 20 },
        { id: 'luschen_sieg', title: 'Luschen-Sieg', desc: 'Gewinne ein Grandspiel ohne ein einziges Ass nach dem Drücken.', target: 1, value: 20 },
        { id: 'punktlandung_30', title: 'Punktlandung 30', desc: 'Halte die Gegner als Alleinspieler bei exakt 30 Augen.', target: 1, value: 20 },
        { id: 'schwarz_seher', title: 'Schwarz-Seher', desc: 'Gewinne ein Spiel, bei dem die Gegner keinen Stich machen.', target: 1, value: 20 },
        { id: 'marathon_sieg', title: 'Der Marathon-Sieg', desc: 'Gewinne drei Spiele in Folge als Alleinspieler.', target: 3, value: 20 }
    ]
};

class ChallengeManager {
    constructor(storageService) {
        this.storage = storageService;
        this.currentChallenges = [];
    }

    /**
     * Seeded random based on user ID and date (UTC)
     */
    getDailySeed(userId) {
        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const seedStr = userId + dateStr;
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    async getOrAssignChallenges(userId) {
        if (!userId) return [];
        
        // 1. Try to fetch from DB
        let challenges = await this.storage.getDailyChallenges(userId);
        
        if (challenges && challenges.length > 0) {
            this.currentChallenges = challenges;
            return challenges;
        }

        // 2. Assign new challenges if none found for today
        const seed = this.getDailySeed(userId);
        const idx10 = Math.floor(this.seededRandom(seed) * CHALLENGE_POOLS.POOL_10.length);
        const idx20 = Math.floor(this.seededRandom(seed + 1) * CHALLENGE_POOLS.POOL_20.length);
        
        const c10 = CHALLENGE_POOLS.POOL_10[idx10];
        const c20 = CHALLENGE_POOLS.POOL_20[idx20];
        
        const newChallenges = [
            { user_id: userId, challenge_id: c10.id, pool: 10, progress: 0, target: c10.target, is_completed: false },
            { user_id: userId, challenge_id: c20.id, pool: 20, progress: 0, target: c20.target, is_completed: false }
        ];

        const assigned = await this.storage.saveDailyChallenges(newChallenges);
        this.currentChallenges = assigned || newChallenges;
        return this.currentChallenges;
    }

    async trackGameResult(userId, gameResult) {
        if (!userId || !this.currentChallenges.length) return;

        let updated = false;
        for (const challenge of this.currentChallenges) {
            if (challenge.is_completed) continue;

            const isMet = this.checkChallenge(challenge.challenge_id, gameResult);
            if (isMet) {
                challenge.progress++;
                if (challenge.progress >= challenge.target) {
                    challenge.is_completed = true;
                    // Note: Reward logic (Taler) can be added here or in the UI later
                }
                updated = true;
            } else if (challenge.challenge_id === 'marathon_sieg') {
                // Special case: reset streak if not won or not as Alleinspieler
                const wonAsDeclarer = gameResult.won && gameResult.declarerId === 2;
                if (!wonAsDeclarer && challenge.progress > 0) {
                    challenge.progress = 0;
                    updated = true;
                }
            }
        }

        if (updated) {
            await this.storage.updateChallenges(userId, this.currentChallenges);
        }
    }

    checkChallenge(id, result) {
        const won = result.won;
        const isDeclarer = result.declarerId === 2;
        const wonAsDeclarer = won && isDeclarer;
        const pts = result.declarerPoints;
        const oppPts = result.defenderPoints;
        const trump = result.trumpMode;

        switch (id) {
            // Pool 10
            case 'schneider_meister':
                return wonAsDeclarer && (trump !== 'Null' && trump !== 'Grand') && result.schneider;
            case 'sicher_ist_sicher':
                return wonAsDeclarer && pts > 90;
            case 'eichel_experte':
                return wonAsDeclarer && trump === 'Eichel';
            case 'gruen_spezialist':
                return wonAsDeclarer && trump === 'Grün';
            case 'herz_ass':
                return wonAsDeclarer && trump === 'Rot';
            case 'schellen_koenig':
                return wonAsDeclarer && trump === 'Schellen';
            case 'null_runde':
                return wonAsDeclarer && trump === 'Null';
            case 'grand_meister':
                return wonAsDeclarer && trump === 'Grand';
            case 'offene_karten':
                return wonAsDeclarer && result.isOuvert;

            // Pool 20
            case 'vorsichtiger_solist':
                return wonAsDeclarer && trump === 'Grand' && oppPts < 31;
            case 'die_unberuehrbaren':
                return wonAsDeclarer && (trump !== 'Null' && trump !== 'Grand') && !result.lostJack;
            case 'schellen_bonus':
                return wonAsDeclarer && result.lastTrickHasSeven;
            case 'abraeumer_tag':
                return wonAsDeclarer && pts === 61;
            case 'buben_power':
                return wonAsDeclarer && result.hadAllJacks;
            case 'skat_glueck':
                return wonAsDeclarer && result.skatPoints >= 20;
            case 'luschen_sieg':
                return wonAsDeclarer && trump === 'Grand' && result.noAcesInHand;
            case 'punktlandung_30':
                return wonAsDeclarer && oppPts === 30;
            case 'schwarz_seher':
                return wonAsDeclarer && result.schwarz;
            case 'marathon_sieg':
                return wonAsDeclarer;

            default:
                return false;
        }
    }
}

window.ChallengeManager = ChallengeManager;
