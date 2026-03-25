/**
 * TITLE SCREEN - Generated Street Fighter style
 * Features: animated title, character preview sprites, blinking "PRESS START"
 * Sound is MUTED by default - press M to toggle
 */

var TitleBackgroundLayer = cc.Layer.extend({
    ctor: function () {
        this._super();
        this.init();
    },
    init: function () {
        this._super();
        var ws = cc.director.getWinSize();

        // Dark dramatic background
        var bg = new cc.DrawNode();
        bg.drawRect(cc.p(0, 0), cc.p(ws.width, ws.height), cc.color(8, 2, 18), 0, cc.color(0,0,0));
        this.addChild(bg, 0);

        // Radial glow from center-top
        var glowCenter = new cc.DrawNode();
        glowCenter.drawDot(cc.p(ws.width / 2, ws.height * 0.7), 200, cc.color(80, 20, 10, 40));
        this.addChild(glowCenter, 1);
        var glowCenter2 = new cc.DrawNode();
        glowCenter2.drawDot(cc.p(ws.width / 2, ws.height * 0.7), 130, cc.color(120, 30, 10, 35));
        this.addChild(glowCenter2, 1);

        // Diagonal slash lines for drama
        var slashes = new cc.DrawNode();
        var slashColor = cc.color(255, 60, 20, 25);
        for (var i = 0; i < 12; i++) {
            var x = -50 + i * 55;
            slashes.drawSegment(cc.p(x, 0), cc.p(x + 180, ws.height), 1.5, slashColor);
        }
        this.addChild(slashes, 2);

        // Bottom gradient bar
        var bottomBar = new cc.DrawNode();
        bottomBar.drawRect(cc.p(0, 0), cc.p(ws.width, 55), cc.color(0, 0, 0, 200), 0, cc.color(0,0,0));
        this.addChild(bottomBar, 3);

        // Top accent line
        var topLine = new cc.DrawNode();
        topLine.drawSegment(cc.p(0, ws.height - 2), cc.p(ws.width, ws.height - 2), 2, cc.color(255, 180, 0, 180));
        this.addChild(topLine, 3);

        // Bottom accent line
        var botLine = new cc.DrawNode();
        botLine.drawSegment(cc.p(0, 56), cc.p(ws.width, 56), 1.5, cc.color(255, 80, 20, 150));
        this.addChild(botLine, 3);

        return true;
    }
});

var TitleLayer = cc.Layer.extend({
    titleLabel: null,
    subtitleLabel: null,
    pressStartLabel: null,
    blinkTimer: 0,
    muteLabel: null,
    kenSprite: null,
    akumaSprite: null,
    vsLabel: null,
    canStart: false,
    startTimer: 0,

    ctor: function () {
        this._super();
        this.init();
    },

    init: function () {
        this._super();
        var ws = cc.director.getWinSize();
        var cx = ws.width / 2;

        // ========== TITLE TEXT ==========

        // "STREET FIGHTER" main title - shadow
        var titleShadow = new cc.LabelTTF("STREET FIGHTER", "Impact", 42);
        titleShadow.setColor(cc.color(0, 0, 0));
        titleShadow.setPosition(cx + 2, ws.height * 0.78 - 2);
        titleShadow.setOpacity(180);
        this.addChild(titleShadow, 5);

        // "STREET FIGHTER" main title
        this.titleLabel = new cc.LabelTTF("STREET FIGHTER", "Impact", 42);
        this.titleLabel.setColor(cc.color(255, 220, 50));
        this.titleLabel.setPosition(cx, ws.height * 0.78);
        this.addChild(this.titleLabel, 6);

        // "II TURBO" subtitle
        this.subtitleLabel = new cc.LabelTTF("II  TURBO", "Impact", 22);
        this.subtitleLabel.setColor(cc.color(255, 100, 30));
        this.subtitleLabel.setPosition(cx, ws.height * 0.65);
        this.addChild(this.subtitleLabel, 6);

        // Decorative line under title
        var titleLine = new cc.DrawNode();
        titleLine.drawSegment(cc.p(cx - 140, ws.height * 0.60), cc.p(cx + 140, ws.height * 0.60), 1.5, cc.color(255, 200, 50, 180));
        this.addChild(titleLine, 5);

        // ========== CHARACTER PREVIEW ==========

        // Load sprite frames
        cc.spriteFrameCache.addSpriteFrames(res.runner_plist);
        cc.spriteFrameCache.addSpriteFrames(res.akuma_plist);

        // Ken sprite (idle frame)
        this.kenSprite = new cc.Sprite("#ken_01.png");
        this.kenSprite.setPosition(cx - 100, ws.height * 0.35);
        this.kenSprite.setScale(1.8);
        this.kenSprite.setScaleX(-1.8); // face right
        this.addChild(this.kenSprite, 10);

        // Ken name label
        var kenName = new cc.LabelTTF("KEN", "Impact", 14);
        kenName.setColor(cc.color(255, 180, 60));
        kenName.setPosition(cx - 100, ws.height * 0.14);
        this.addChild(kenName, 10);

        // VS label
        this.vsLabel = new cc.LabelTTF("VS", "Impact", 28);
        this.vsLabel.setColor(cc.color(255, 50, 30));
        this.vsLabel.setPosition(cx, ws.height * 0.35);
        this.addChild(this.vsLabel, 11);

        // VS glow
        var vsGlow = new cc.DrawNode();
        vsGlow.drawDot(cc.p(cx, ws.height * 0.35), 30, cc.color(255, 40, 10, 30));
        this.addChild(vsGlow, 9);

        // Akuma sprite (idle frame)
        this.akumaSprite = new cc.Sprite("#akuma_01.png");
        this.akumaSprite.setPosition(cx + 100, ws.height * 0.35);
        this.akumaSprite.setScale(1.8);
        this.addChild(this.akumaSprite, 10);

        // Akuma name label
        var akumaName = new cc.LabelTTF("AKUMA", "Impact", 14);
        akumaName.setColor(cc.color(180, 80, 255));
        akumaName.setPosition(cx + 100, ws.height * 0.14);
        this.addChild(akumaName, 10);

        // ========== PRESS START ==========

        this.pressStartLabel = new cc.LabelTTF("PRESS  ENTER  TO  START", "Impact", 16);
        this.pressStartLabel.setColor(cc.color(255, 255, 255));
        this.pressStartLabel.setPosition(cx, 32);
        this.addChild(this.pressStartLabel, 15);

        // ========== MUTE INDICATOR ==========

        this.muteLabel = new cc.LabelTTF("[M] SOUND: OFF", "Helvetica", 10);
        this.muteLabel.setColor(cc.color(180, 180, 180));
        this.muteLabel.setAnchorPoint(1, 1);
        this.muteLabel.setPosition(ws.width - 8, ws.height - 8);
        this.addChild(this.muteLabel, 20);
        this.updateMuteLabel();

        // ========== KEYBOARD LISTENER ==========

        var self = this;
        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (key) {
                if (key === 77) { // M key
                    SoundEffects.toggleMute();
                    self.updateMuteLabel();
                    if (SoundEffects.isEnabled()) {
                        SoundEffects.startTitleMusic();
                    }
                }
                if (key === 13 || key === 32) { // Enter or Space
                    if (self.canStart) {
                        self.onStart();
                    }
                }
            }
        }, this);

        // Touch listener for mobile
        cc.eventManager.addListener(cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function () {
                if (self.canStart) {
                    self.onStart();
                }
                return true;
            }
        }), this);

        // ========== ENTRANCE ANIMATIONS ==========

        // Title drops in
        this.titleLabel.setScale(2.5);
        this.titleLabel.setOpacity(0);
        this.titleLabel.runAction(cc.spawn(
            cc.scaleTo(0.5, 1).easing(cc.easeBackOut()),
            cc.fadeIn(0.4)
        ));
        titleShadow.setScale(2.5);
        titleShadow.setOpacity(0);
        titleShadow.runAction(cc.spawn(
            cc.scaleTo(0.5, 1).easing(cc.easeBackOut()),
            cc.fadeTo(0.4, 180)
        ));

        // Subtitle fades in after title
        this.subtitleLabel.setOpacity(0);
        this.subtitleLabel.runAction(cc.sequence(
            cc.delayTime(0.5),
            cc.fadeIn(0.3)
        ));

        // Ken slides in from left
        this.kenSprite.setPositionX(-60);
        this.kenSprite.setOpacity(0);
        this.kenSprite.runAction(cc.sequence(
            cc.delayTime(0.7),
            cc.spawn(
                cc.moveTo(0.4, cx - 100, ws.height * 0.35).easing(cc.easeOut(2)),
                cc.fadeIn(0.3)
            )
        ));

        // Akuma slides in from right
        this.akumaSprite.setPositionX(ws.width + 60);
        this.akumaSprite.setOpacity(0);
        this.akumaSprite.runAction(cc.sequence(
            cc.delayTime(0.7),
            cc.spawn(
                cc.moveTo(0.4, cx + 100, ws.height * 0.35).easing(cc.easeOut(2)),
                cc.fadeIn(0.3)
            )
        ));

        // VS pulses in
        this.vsLabel.setScale(0);
        this.vsLabel.runAction(cc.sequence(
            cc.delayTime(1.1),
            cc.scaleTo(0.2, 1.4).easing(cc.easeBackOut()),
            cc.scaleTo(0.15, 1.0)
        ));

        // Enable start after animations
        this.startTimer = 0;
        this.canStart = false;
        this.pressStartLabel.setOpacity(0);

        // Start title music if sound enabled
        SoundEffects.startTitleMusic();

        this.scheduleUpdate();
        return true;
    },

    update: function (dt) {
        // Enable start after intro animations
        this.startTimer += dt;
        if (!this.canStart && this.startTimer > 1.5) {
            this.canStart = true;
        }

        // Blink "PRESS START"
        if (this.canStart) {
            this.blinkTimer += dt;
            var alpha = (Math.sin(this.blinkTimer * 4) + 1) * 0.5;
            this.pressStartLabel.setOpacity(Math.floor(80 + alpha * 175));
        }

        // Subtle VS pulse
        if (this.vsLabel && this.startTimer > 1.3) {
            var vsPulse = 1.0 + Math.sin(this.startTimer * 3) * 0.06;
            this.vsLabel.setScale(vsPulse);
        }
    },

    updateMuteLabel: function () {
        if (SoundEffects.isEnabled()) {
            this.muteLabel.setString("[M] SOUND: ON");
            this.muteLabel.setColor(cc.color(100, 255, 100));
        } else {
            this.muteLabel.setString("[M] SOUND: OFF");
            this.muteLabel.setColor(cc.color(180, 180, 180));
        }
    },

    onStart: function () {
        if (!this.canStart) return;
        this.canStart = false;
        SoundEffects.playSelect();
        SoundEffects.stopAmbience();

        // Flash effect then transition
        var ws = cc.director.getWinSize();
        var flash = new cc.DrawNode();
        flash.drawRect(cc.p(0, 0), cc.p(ws.width, ws.height), cc.color(255, 255, 255, 0), 0, cc.color(255, 255, 255, 0));
        flash.setOpacity(0);
        this.addChild(flash, 100);
        flash.runAction(cc.sequence(
            cc.fadeTo(0.1, 200),
            cc.fadeTo(0.3, 0),
            cc.callFunc(function () {
                cc.director.runScene(new PlayScene());
            })
        ));
    }
});

var TitleScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        this.addChild(new TitleBackgroundLayer());
        this.addChild(new TitleLayer());
    }
});

// Keep MenuScene as alias for compatibility but redirect to TitleScene
var MenuLayer = cc.Layer.extend({
    ctor: function () { this._super(); },
    init: function () { this._super(); return true; }
});

var MenuScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        // Redirect to new TitleScene
        cc.director.runScene(new TitleScene());
    }
});
