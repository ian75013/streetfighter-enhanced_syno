/**
 * Sound Effects system - SFII Turbo authentic sounds
 * MUTED by default. Press M to toggle sound.
 * Hadoken always plays regardless of mute state.
 */
var SoundEffects = {
    enabled: true,
    musicPlaying: false,
    volume: 0.7,
    musicVolume: 0.35,

    ensureStarted: function () {
        return true;
    },

    isEnabled: function () {
        return this.enabled;
    },

    setEnabled: function (val) {
        this.enabled = !!val;
        if (!this.enabled) {
            this.stopAmbience();
        }
    },

    toggleMute: function () {
        this.setEnabled(!this.enabled);
        return this.enabled;
    },

    // --- Music / Ambience ---

    startAmbience: function () {
        if (!this.enabled || this.musicPlaying) return;
        try {
            cc.audioEngine.playMusic(res.sfx_crowd, true);
            cc.audioEngine.setMusicVolume(this.musicVolume);
            this.musicPlaying = true;
        } catch (e) {
            cc.log("Music error: " + e);
        }
    },

    startTitleMusic: function () {
        if (!this.enabled || this.musicPlaying) return;
        try {
            cc.audioEngine.playMusic(res.sfx_music, true);
            cc.audioEngine.setMusicVolume(this.musicVolume * 0.8);
            this.musicPlaying = true;
        } catch (e) {}
    },

    stopAmbience: function () {
        if (!this.musicPlaying) return;
        try {
            cc.audioEngine.stopMusic();
            this.musicPlaying = false;
        } catch (e) {}
    },

    hardMute: function () {
        this.stopAmbience();
    },

    // --- SFX playback ---

    _play: function (sfxRes, forcePlay) {
        if (!this.enabled && !forcePlay) return;
        try {
            cc.audioEngine.playEffect(sfxRes, false);
        } catch (e) {}
    },

    // --- Combat sounds ---

    playHit: function ()       { this._play(res.sfx_hit); },
    playFierceHit: function () { this._play(res.sfx_fierce); },
    playHardAttack: function (){ this._play(res.sfx_hard); },
    playHitGround: function () { this._play(res.sfx_hitground); },
    playClash: function ()     { this._play(res.sfx_clash); },
    playImpact: function ()    { this._play(res.sfx_fierce); },

    // Hadoken ALWAYS plays (forcePlay = true)
    playHadoken: function ()   { this._play(res.sfx_hadoken, true); },
    playShoryuken: function () { this._play(res.sfx_shoryuken); },
    playUppercut: function ()  { this._play(res.sfx_shoryuken); },
    playJump: function ()      { this._play(res.sfx_jump); },
    playPunch: function ()     { this._play(res.sfx_punch); },

    // --- Announcer sounds ---

    playRoundStart: function () { this._play(res.sfx_round, true); },
    playOne: function ()        { this._play(res.sfx_one, true); },
    playFight: function ()      { this._play(res.sfx_fight, true); },
    playYouWin: function ()     { this._play(res.sfx_youwin, true); },
    playYouLose: function ()    { this._play(res.sfx_youlose, true); },
    playPerfect: function ()    { this._play(res.sfx_perfect, true); },
    playKO: function ()         { this._play(res.sfx_ko, true); },

    // --- Countdown sounds ---

    playCount3: function () { this._play(res.sfx_count3, true); },
    playCount2: function () { this._play(res.sfx_count2, true); },
    playCount1: function () { this._play(res.sfx_count1, true); },
    playCountdownTick: function () { this._play(res.sfx_countdown, true); },

    // --- UI sounds ---

    playSelect: function () { this._play(res.sfx_select, true); },
    playCursor: function () { this._play(res.sfx_cursor, true); }
};
