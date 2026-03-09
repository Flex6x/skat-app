/**
 * Skat Settings Manager
 * Handles loading, saving, and applying user settings via Local Storage.
 */

class Settings {

    static DEFAULTS = {
        theme: 'dark',
        animationSpeed: 0.45,
        showLiveScore: false
    };

    static SPEED_MAP = {
        'schnell': 0.3,
        'normal': 0.45,
        'langsam': 0.65
    };

    constructor() {
        this.current = this.load();
        this.apply();
    }

    /**
     * Loads settings from Local Storage, falling back to defaults.
     */
    load() {
        try {
            const stored = JSON.parse(localStorage.getItem('skatSettings'));
            if (stored) {
                return { ...Settings.DEFAULTS, ...stored };
            }
        } catch (e) {
            console.warn('Settings: Could not parse stored settings, using defaults.');
        }
        return { ...Settings.DEFAULTS };
    }

    /**
     * Saves current settings to Local Storage.
     */
    save() {
        localStorage.setItem('skatSettings', JSON.stringify(this.current));
    }

    /**
     * Applies all current settings to the app.
     */
    apply() {
        this.applyTheme(this.current.theme);
        this.applyAnimationSpeed(this.current.animationSpeed);
    }

    /**
     * Sets and applies the theme.
     */
    applyTheme(theme) {
        this.current.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Sets and applies the animation speed.
     * Speed is in seconds (e.g. 0.45).
     */
    applyAnimationSpeed(speed) {
        this.current.animationSpeed = speed;
        // Will be read by CardAnimations when needed
        document.documentElement.style.setProperty('--card-anim-speed', `${speed}s`);
    }

    /**
     * Sets the live score preference.
     */
    setShowLiveScore(enabled) {
        this.current.showLiveScore = enabled;
        this.save();
    }

    /**
     * Updates a setting, applies it, and saves.
     */
    set(key, value) {
        this.current[key] = value;

        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'animationSpeed':
                this.applyAnimationSpeed(value);
                break;
            case 'showLiveScore':
                // Applied at runtime by game logic
                break;
        }

        this.save();
    }

    /**
     * Returns the animation speed in milliseconds (for JS timers).
     */
    getAnimationSpeedMs() {
        return this.current.animationSpeed * 1000;
    }

    /**
     * Returns the speed label for the current speed.
     */
    getSpeedLabel() {
        for (const [label, speed] of Object.entries(Settings.SPEED_MAP)) {
            if (Math.abs(speed - this.current.animationSpeed) < 0.01) return label;
        }
        return 'normal';
    }
}
