var KEY_CODES = {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    HADOKEN: 65
};

var BUTTON_POSITIONS = {
    // D-pad: compact bottom-left
    left: cc.p(30, 28),
    right: cc.p(78, 28),
    // Action buttons: compact triangle bottom-right
    jump: cc.p(440, 55),
    hadoken: cc.p(416, 22),
    crouch: cc.p(458, 22)
};

/**
 * Game phases:
 *   "countdown" - Characters visible and idle, "Round 1" then 3..2..1..FIGHT!
 *   "fighting"  - Normal gameplay
 *   "ko"        - One fighter is KO'd, show result
 *   "restart"   - Brief pause before restarting
 */

var AnimationLayer = cc.Layer.extend({
    controlsLayer: null,
    projectileLayer: null,
    overlayLayer: null,
    leftButton: null,
    rightButton: null,
    jumpButton: null,
    hadokenButton: null,
    crouchButton: null,
    playerFighter: null,
    cpuFighter: null,
    projectiles: null,
    cpuInputState: null,
    aiState: null,
    statusLayer: null,
    activeActionButtons: null,

    // Phase management
    gamePhase: "countdown",
    phaseTimer: 0,
    countdownStep: 0,
    roundNumber: 1,

    // Countdown overlay elements
    countdownLabel: null,
    roundLabel: null,
    fightLabel: null,
    overlayDimmer: null,

    // Result overlay
    resultLabel: null,
    resultSubLabel: null,

    // Mute label
    muteLabel: null,

    ctor: function (options) {
        this._super();

        options = options || {};

        this.inputState = this.createInputState();
        this.cpuInputState = this.createInputState();
        this.projectiles = [];
        this.aiState = {
            attackCooldown: 0.6,
            jumpCooldown: 1.4,
            decisionTimer: 0,
            crouchTimer: 0
        };
        this.statusLayer = options.statusLayer || null;

        this.init();
    },

    init: function () {
        this._super();

        this.setupControls();
        this.setupProjectileLayer();
        this.setupFighter();
        this.setupOverlayLayer();
        this.setupMuteLabel();

        SoundEffects.ensureStarted();

        // Start countdown phase
        this.gamePhase = "countdown";
        this.phaseTimer = 0;
        this.countdownStep = 0;

        // Controls hint - fades out
        var ws = cc.director.getWinSize();
        var hint = new cc.LabelTTF("Arrows: Move  |  A: Punch  |  Up: Jump  |  Down: Crouch  |  M: Sound", "Helvetica", 8);
        hint.setColor(cc.color(200, 200, 200));
        hint.setPosition(ws.width / 2, 8);
        hint.setOpacity(200);
        this.addChild(hint, 99);
        hint.runAction(cc.sequence(
            cc.delayTime(4.5),
            cc.fadeOut(1.0),
            cc.removeSelf(true)
        ));

        this.scheduleUpdate();
        return true;
    },

    createInputState: function () {
        return {
            moveLeft: false,
            moveRight: false,
            jump: false,
            crouch: false,
            up: false,
            hadoken: false
        };
    },

    // ========== OVERLAY SETUP ==========

    setupOverlayLayer: function () {
        var ws = cc.director.getWinSize();
        var cx = ws.width / 2;
        var cy = ws.height / 2;

        this.overlayLayer = cc.Layer.create();
        this.addChild(this.overlayLayer, 50);

        // Semi-transparent dimmer (LayerColor handles opacity transitions properly)
        this.overlayDimmer = new cc.LayerColor(cc.color(0, 0, 0, 150), ws.width, ws.height);
        this.overlayLayer.addChild(this.overlayDimmer, 0);

        // "ROUND 1" label
        this.roundLabel = new cc.LabelTTF("ROUND  1", "Impact", 32);
        this.roundLabel.setColor(cc.color(255, 220, 50));
        this.roundLabel.setPosition(cx, cy + 50);
        this.roundLabel.setOpacity(0);
        this.overlayLayer.addChild(this.roundLabel, 10);

        // Countdown number label (3, 2, 1)
        this.countdownLabel = new cc.LabelTTF("", "Impact", 64);
        this.countdownLabel.setColor(cc.color(255, 255, 255));
        this.countdownLabel.setPosition(cx, cy);
        this.countdownLabel.setOpacity(0);
        this.overlayLayer.addChild(this.countdownLabel, 10);

        // "FIGHT!" label
        this.fightLabel = new cc.LabelTTF("FIGHT!", "Impact", 48);
        this.fightLabel.setColor(cc.color(255, 60, 20));
        this.fightLabel.setPosition(cx, cy);
        this.fightLabel.setOpacity(0);
        this.overlayLayer.addChild(this.fightLabel, 10);

        // Result labels (hidden initially)
        this.resultLabel = new cc.LabelTTF("", "Impact", 36);
        this.resultLabel.setColor(cc.color(255, 220, 50));
        this.resultLabel.setPosition(cx, cy + 30);
        this.resultLabel.setOpacity(0);
        this.overlayLayer.addChild(this.resultLabel, 10);

        this.resultSubLabel = new cc.LabelTTF("", "Impact", 16);
        this.resultSubLabel.setColor(cc.color(200, 200, 200));
        this.resultSubLabel.setPosition(cx, cy - 20);
        this.resultSubLabel.setOpacity(0);
        this.overlayLayer.addChild(this.resultSubLabel, 10);
    },

    setupMuteLabel: function () {
        var ws = cc.director.getWinSize();
        this.muteLabel = new cc.LabelTTF("[M] SOUND: OFF", "Helvetica", 9);
        this.muteLabel.setColor(cc.color(180, 180, 180));
        this.muteLabel.setAnchorPoint(1, 1);
        this.muteLabel.setPosition(ws.width - 5, ws.height - 5);
        this.addChild(this.muteLabel, 100);
        this.updateMuteLabel();
    },

    updateMuteLabel: function () {
        if (!this.muteLabel) return;
        if (SoundEffects.isEnabled()) {
            this.muteLabel.setString("[M] SOUND: ON");
            this.muteLabel.setColor(cc.color(100, 255, 100));
        } else {
            this.muteLabel.setString("[M] SOUND: OFF");
            this.muteLabel.setColor(cc.color(180, 180, 180));
        }
    },

    // ========== COUNTDOWN PHASE ==========

    updateCountdownPhase: function (dt) {
        this.phaseTimer += dt;

        // Timeline:
        // 0.0 - 1.2: "ROUND 1" appears
        // 1.2 - 1.9: "3" with sound
        // 1.9 - 2.6: "2" with sound
        // 2.6 - 3.3: "1" with sound
        // 3.3 - 4.0: "FIGHT!" with sound
        // 4.0+: transition to fighting

        if (this.countdownStep === 0 && this.phaseTimer >= 0.1) {
            this.countdownStep = 1;
            // Show ROUND 1
            this.roundLabel.setOpacity(0);
            this.roundLabel.setScale(1.8);
            this.roundLabel.runAction(cc.spawn(
                cc.fadeIn(0.25),
                cc.scaleTo(0.3, 1.0).easing(cc.easeBackOut())
            ));
            SoundEffects.playRoundStart();
            // Play "One" shortly after
            this.scheduleOnce(function () {
                SoundEffects.playOne();
            }, 0.4);
        }

        if (this.countdownStep === 1 && this.phaseTimer >= 1.2) {
            this.countdownStep = 2;
            this.roundLabel.runAction(cc.fadeOut(0.2));
            this.showCountdownNumber("3");
            SoundEffects.playCount3();
        }

        if (this.countdownStep === 2 && this.phaseTimer >= 1.9) {
            this.countdownStep = 3;
            this.showCountdownNumber("2");
            SoundEffects.playCount2();
        }

        if (this.countdownStep === 3 && this.phaseTimer >= 2.6) {
            this.countdownStep = 4;
            this.showCountdownNumber("1");
            SoundEffects.playCount1();
        }

        if (this.countdownStep === 4 && this.phaseTimer >= 3.3) {
            this.countdownStep = 5;
            this.countdownLabel.setOpacity(0);

            // Show FIGHT!
            this.fightLabel.setOpacity(0);
            this.fightLabel.setScale(2.5);
            this.fightLabel.runAction(cc.spawn(
                cc.fadeIn(0.1),
                cc.scaleTo(0.2, 1.0).easing(cc.easeBackOut())
            ));
            SoundEffects.playFight();

            // Dim overlay fades out then hides
            var dimRef = this.overlayDimmer;
            this.overlayDimmer.runAction(cc.sequence(
                cc.fadeOut(0.35),
                cc.callFunc(function () { dimRef.setVisible(false); })
            ));
        }

        if (this.countdownStep === 5 && this.phaseTimer >= 4.0) {
            this.countdownStep = 6;
            this.fightLabel.runAction(cc.sequence(
                cc.spawn(
                    cc.scaleTo(0.15, 1.5),
                    cc.fadeOut(0.15)
                )
            ));

            // Transition to fighting — hide entire overlay
            this.gamePhase = "fighting";
            this.phaseTimer = 0;
            this.overlayDimmer.setVisible(false);
            this.overlayDimmer.setOpacity(0);

            // Start ambience music
            SoundEffects.startAmbience();
        }
    },

    showCountdownNumber: function (num) {
        this.countdownLabel.setString(num);
        this.countdownLabel.setScale(2.0);
        this.countdownLabel.setOpacity(255);
        this.countdownLabel.runAction(cc.sequence(
            cc.scaleTo(0.15, 1.0).easing(cc.easeOut(2)),
            cc.delayTime(0.3),
            cc.spawn(
                cc.scaleTo(0.15, 0.6),
                cc.fadeOut(0.15)
            )
        ));
    },

    // ========== KO PHASE ==========

    enterKOPhase: function (playerWon) {
        this.gamePhase = "ko";
        this.phaseTimer = 0;

        var playerHealth = this.playerFighter.getHealthRatio();
        var cpuHealth = this.cpuFighter.getHealthRatio();

        // Play KO sound
        SoundEffects.playKO();

        // Show dimmer
        this.overlayDimmer.setVisible(true);
        this.overlayDimmer.setOpacity(0);
        this.overlayDimmer.runAction(cc.fadeTo(0.3, 140));

        // Determine result text
        var resultText = playerWon ? "YOU  WIN!" : "YOU  LOSE";
        var resultColor = playerWon ? cc.color(255, 220, 50) : cc.color(255, 60, 60);

        // Check for perfect (winner took no damage)
        var isPerfect = false;
        if (playerWon && playerHealth >= 1.0) {
            isPerfect = true;
        } else if (!playerWon && cpuHealth >= 1.0) {
            isPerfect = true;
        }

        // Play result sounds after brief delay
        var self = this;
        this.scheduleOnce(function () {
            if (isPerfect) {
                SoundEffects.playPerfect();
            }
        }, 0.8);

        this.scheduleOnce(function () {
            if (playerWon) {
                SoundEffects.playYouWin();
            } else {
                SoundEffects.playYouLose();
            }
        }, isPerfect ? 1.6 : 0.8);

        // Show result text with animation
        this.resultLabel.setString(resultText);
        this.resultLabel.setColor(resultColor);
        this.resultLabel.setScale(2.0);
        this.resultLabel.setOpacity(0);
        this.resultLabel.runAction(cc.sequence(
            cc.delayTime(0.6),
            cc.spawn(
                cc.fadeIn(0.2),
                cc.scaleTo(0.3, 1.0).easing(cc.easeBackOut())
            )
        ));

        // Sub label
        var subText = isPerfect ? "PERFECT!" : "PRESS  ENTER  TO  RESTART";
        if (isPerfect) {
            this.resultSubLabel.setString("PERFECT!");
            this.resultSubLabel.setColor(cc.color(255, 220, 50));
            this.resultSubLabel.setOpacity(0);
            this.resultSubLabel.runAction(cc.sequence(
                cc.delayTime(1.0),
                cc.fadeIn(0.2),
                cc.delayTime(1.2),
                cc.callFunc(function () {
                    self.resultSubLabel.setString("PRESS  ENTER  TO  RESTART");
                    self.resultSubLabel.setColor(cc.color(200, 200, 200));
                })
            ));
        } else {
            this.resultSubLabel.setString(subText);
            this.resultSubLabel.setColor(cc.color(200, 200, 200));
            this.resultSubLabel.setOpacity(0);
            this.resultSubLabel.runAction(cc.sequence(
                cc.delayTime(1.5),
                cc.fadeIn(0.3)
            ));
        }
    },

    updateKOPhase: function (dt) {
        this.phaseTimer += dt;

        // Blink restart text after enough time
        if (this.phaseTimer > 2.5) {
            var alpha = (Math.sin(this.phaseTimer * 4) + 1) * 0.5;
            this.resultSubLabel.setOpacity(Math.floor(80 + alpha * 175));
        }
    },

    restartFight: function () {
        SoundEffects.stopAmbience();
        SoundEffects.playSelect();
        cc.director.runScene(new PlayScene());
    },

    goToTitle: function () {
        SoundEffects.stopAmbience();
        cc.director.runScene(new TitleScene());
    },

    // ========== CONTROLS SETUP ==========

    setupControls: function () {
        var self = this;

        cc.eventManager.addListener({
            event: cc.EventListener.KEYBOARD,
            onKeyPressed: function (key) {
                // M key toggles mute in any phase
                if (key === 77) {
                    SoundEffects.toggleMute();
                    self.updateMuteLabel();
                    if (SoundEffects.isEnabled() && self.gamePhase === "fighting") {
                        SoundEffects.startAmbience();
                    }
                    return;
                }

                // Escape goes back to title
                if (key === 27) {
                    self.goToTitle();
                    return;
                }

                // In KO phase, Enter restarts
                if (self.gamePhase === "ko" && self.phaseTimer > 1.5) {
                    if (key === 13 || key === 32) {
                        self.restartFight();
                        return;
                    }
                }

                // Only process game inputs during fighting phase
                if (self.gamePhase === "fighting") {
                    self.setInputForKey(key, true);
                }
            },
            onKeyReleased: function (key) {
                if (self.gamePhase === "fighting") {
                    self.setInputForKey(key, false);
                }
            }
        }, this);

        this.controlsLayer = cc.Layer.create();
        this.addChild(this.controlsLayer);
        this.activeActionButtons = {};

        this.leftButton = this.createControlButton("left", BUTTON_POSITIONS.left);
        this.rightButton = this.createControlButton("right", BUTTON_POSITIONS.right);

        this.jumpButton = this.createActionButton("J", BUTTON_POSITIONS.jump, "jump");
        this.hadokenButton = this.createActionButton("P", BUTTON_POSITIONS.hadoken, "hadoken");
        this.crouchButton = this.createActionButton("C", BUTTON_POSITIONS.crouch, "crouch");

        cc.eventManager.addListener(cc.EventListener.create({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: false,
            onTouchBegan: function (touch) {
                // In KO phase, touch restarts
                if (self.gamePhase === "ko" && self.phaseTimer > 1.5) {
                    self.restartFight();
                    return true;
                }
                if (self.gamePhase !== "fighting") return true;

                var touchLocation = touch.getLocation();
                if (self.handleActionButtonTouch(touchLocation, true)) {
                    return true;
                }
                self.handleTouchDirection(touchLocation.x < FighterPhysics.touchSplitX ? "left" : "right");
                return true;
            },
            onTouchEnded: function (touch) {
                if (self.gamePhase !== "fighting") return;
                var touchLocation = touch.getLocation();
                self.handleActionButtonTouch(touchLocation, false);
                self.resetTouchDirection();
            }
        }), this);
    },

    setupProjectileLayer: function () {
        this.projectileLayer = cc.Layer.create();
        this.addChild(this.projectileLayer, 2);
    },

    setupFighter: function () {
        this.playerFighter = new Fighter({
            id: "player",
            character: "ken",
            startX: 20,
            facing: "right"
        });
        this.cpuFighter = new Fighter({
            id: "cpu",
            character: "akuma",
            startX: 220,
            facing: "left"
        });

        this.addChild(this.playerFighter);
        this.addChild(this.cpuFighter);

        if (this.statusLayer) {
            this.statusLayer.setFighters(this.playerFighter, this.cpuFighter);
        }
    },

    createControlButton: function (direction, position) {
        // Draw small arrow using DrawNode instead of large PNG
        var button = cc.Node.create();
        button.setPosition(position);
        button._direction = direction;

        var bg = new cc.DrawNode();
        bg.drawDot(cc.p(0, 0), 13, cc.color(40, 40, 40, 100));
        button.addChild(bg, 0);
        button._bg = bg;

        var arrow = new cc.DrawNode();
        var s = 6; // arrow half-size
        if (direction === "left") {
            arrow.drawPoly([cc.p(-s, 0), cc.p(s * 0.5, s), cc.p(s * 0.5, -s)],
                cc.color(220, 220, 220, 160), 0, cc.color(0,0,0,0));
        } else {
            arrow.drawPoly([cc.p(s, 0), cc.p(-s * 0.5, s), cc.p(-s * 0.5, -s)],
                cc.color(220, 220, 220, 160), 0, cc.color(0,0,0,0));
        }
        button.addChild(arrow, 1);

        button.setOpacity(80);
        this.controlsLayer.addChild(button, 0);
        return button;
    },

    createActionButton: function (label, position, actionName) {
        var buttonGroup = cc.Node.create();
        buttonGroup.setPosition(position);
        buttonGroup._actionName = actionName;
        buttonGroup._isPressed = false;

        var buttonBg = new cc.DrawNode();
        buttonBg.drawCircle(cc.p(0, 0), 14, 0, 20, false, 1, cc.color(80, 80, 80, 120));
        buttonGroup.addChild(buttonBg, 0);

        var buttonLabel = new cc.LabelTTF(label, "Impact", 10);
        buttonLabel.setColor(cc.color(255, 255, 255, 180));
        buttonLabel.setAnchorPoint(0.5, 0.5);
        buttonGroup.addChild(buttonLabel, 1);

        buttonGroup._buttonBg = buttonBg;
        buttonGroup._buttonLabel = buttonLabel;
        this.controlsLayer.addChild(buttonGroup, 0);

        return buttonGroup;
    },

    handleActionButtonTouch: function (touchLocation, isPressed) {
        var buttons = [this.jumpButton, this.hadokenButton, this.crouchButton];
        var hitButton = null;

        for (var i = 0; i < buttons.length; i++) {
            var button = buttons[i];
            var buttonPos = button.getPosition();
            var dx = touchLocation.x - buttonPos.x;
            var dy = touchLocation.y - buttonPos.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= 20) {
                hitButton = button;
                break;
            }
        }

        if (!hitButton) return false;

        if (isPressed) {
            this.inputState[hitButton._actionName] = true;
            hitButton._isPressed = true;
            this.updateActionButtonVisual(hitButton, true);
        } else {
            this.inputState[hitButton._actionName] = false;
            hitButton._isPressed = false;
            this.updateActionButtonVisual(hitButton, false);
        }
        return true;
    },

    updateActionButtonVisual: function (button, isActive) {
        var bgColor = isActive ? cc.color(200, 150, 50, 200) : cc.color(80, 80, 80, 120);
        button._buttonBg.clear();
        button._buttonBg.drawCircle(cc.p(0, 0), 14, 0, 20, false, isActive ? 2 : 1, bgColor);
    },

    setInputForKey: function (key, isPressed) {
        var inputName = this.resolveInputNameForKey(key);
        if (!inputName) return;
        this.inputState[inputName] = isPressed;
        this.refreshTouchFeedback();
    },

    resolveInputNameForKey: function (key) {
        switch (key) {
            case KEY_CODES.LEFT:    return "moveLeft";
            case KEY_CODES.RIGHT:   return "moveRight";
            case KEY_CODES.UP:      return "jump";
            case KEY_CODES.DOWN:    return "crouch";
            case KEY_CODES.HADOKEN: return "hadoken";
            default: return null;
        }
    },

    handleTouchDirection: function (direction) {
        this.inputState.moveLeft = direction === "left";
        this.inputState.moveRight = direction === "right";
        this.refreshTouchFeedback();
    },

    resetTouchDirection: function () {
        this.inputState.moveLeft = false;
        this.inputState.moveRight = false;
        this.refreshTouchFeedback();
    },

    refreshTouchFeedback: function () {
        // D-pad arrows - redraw background with different color on press
        if (this.leftButton && this.leftButton._bg) {
            this.leftButton._bg.clear();
            this.leftButton._bg.drawDot(cc.p(0, 0), 13,
                this.inputState.moveLeft ? cc.color(200, 150, 50, 180) : cc.color(40, 40, 40, 100));
        }
        if (this.rightButton && this.rightButton._bg) {
            this.rightButton._bg.clear();
            this.rightButton._bg.drawDot(cc.p(0, 0), 13,
                this.inputState.moveRight ? cc.color(200, 150, 50, 180) : cc.color(40, 40, 40, 100));
        }
        if (this.jumpButton) this.updateActionButtonVisual(this.jumpButton, this.inputState.jump);
        if (this.hadokenButton) this.updateActionButtonVisual(this.hadokenButton, this.inputState.hadoken);
        if (this.crouchButton) this.updateActionButtonVisual(this.crouchButton, this.inputState.crouch);
    },

    // ========== CPU AI ==========

    clearCpuInputState: function () {
        this.cpuInputState.moveLeft = false;
        this.cpuInputState.moveRight = false;
        this.cpuInputState.jump = false;
        this.cpuInputState.crouch = false;
        this.cpuInputState.up = false;
        this.cpuInputState.hadoken = false;
    },

    updateCpuAi: function (dt) {
        var playerX = this.playerFighter.getCenterX();
        var cpuX = this.cpuFighter.getCenterX();
        var distanceX = playerX - cpuX;
        var absoluteDistance = Math.abs(distanceX);
        var movingTowardPlayer = distanceX < 0 ? "moveLeft" : "moveRight";
        var movingAwayFromPlayer = distanceX < 0 ? "moveRight" : "moveLeft";
        var canAct = this.cpuFighter.isGrounded() && !this.cpuFighter.isBusy();
        var playerHasAttack = !!this.playerFighter.getActiveHitBox() || this.hasIncomingProjectileThreat(this.cpuFighter);
        var cpuLowHealth = this.cpuFighter.getHealthRatio() < 0.35;

        this.aiState.attackCooldown = Math.max(0, this.aiState.attackCooldown - dt);
        this.aiState.jumpCooldown = Math.max(0, this.aiState.jumpCooldown - dt);
        this.aiState.decisionTimer = Math.max(0, this.aiState.decisionTimer - dt);
        this.aiState.crouchTimer = Math.max(0, this.aiState.crouchTimer - dt);

        this.clearCpuInputState();

        if (this.aiState.crouchTimer > 0) {
            this.cpuInputState.crouch = true;
        }

        if (!canAct) return;

        if (playerHasAttack && absoluteDistance < 110) {
            this.cpuInputState.crouch = true;
            this.aiState.crouchTimer = 0.28;
            return;
        }

        if (cpuLowHealth && absoluteDistance < 140) {
            this.cpuInputState[movingAwayFromPlayer] = true;
            if (this.aiState.attackCooldown === 0 && absoluteDistance >= 95) {
                this.cpuInputState.hadoken = true;
                this.aiState.attackCooldown = 1.1;
            }
            return;
        }

        if (absoluteDistance > FighterPhysics.aiPreferredRange + 40) {
            this.cpuInputState[movingTowardPlayer] = true;
            return;
        }

        if (absoluteDistance < FighterPhysics.aiRetreatRange) {
            this.cpuInputState[movingAwayFromPlayer] = true;
            return;
        }

        if (this.aiState.attackCooldown === 0 && absoluteDistance <= FighterPhysics.aiAttackRange) {
            this.cpuInputState.hadoken = true;
            this.aiState.attackCooldown = 0.9;
            return;
        }

        if (this.aiState.jumpCooldown === 0 && absoluteDistance > FighterPhysics.aiJumpRangeMin && absoluteDistance < FighterPhysics.aiJumpRangeMax) {
            this.cpuInputState[movingTowardPlayer] = true;
            this.cpuInputState.jump = true;
            this.aiState.jumpCooldown = 2.4;
            return;
        }

        if (this.aiState.decisionTimer === 0) {
            if (absoluteDistance > FighterPhysics.aiPreferredRange) {
                this.cpuInputState[movingTowardPlayer] = true;
            } else if (absoluteDistance < FighterPhysics.aiPreferredRange - 25) {
                this.cpuInputState.crouch = true;
                this.aiState.crouchTimer = 0.18;
            }
            this.aiState.decisionTimer = 0.18;
        }
    },

    hasIncomingProjectileThreat: function (fighter) {
        for (var i = 0; i < this.projectiles.length; i++) {
            var projectile = this.projectiles[i];
            if (!projectile.isActive() || projectile.ownerId === fighter.fighterId) continue;
            var distanceX = Math.abs(projectile.getPositionX() - fighter.getCenterX());
            if (distanceX < 120) return true;
        }
        return false;
    },

    // ========== COMBAT RESOLUTION ==========

    resolvePushboxes: function () {
        var playerPushBox = this.playerFighter.getPushBox();
        var cpuPushBox = this.cpuFighter.getPushBox();
        if (!FighterPhysics.rectsOverlap(playerPushBox, cpuPushBox)) return;

        var overlapWidth = Math.min(playerPushBox.x + playerPushBox.width, cpuPushBox.x + cpuPushBox.width)
            - Math.max(playerPushBox.x, cpuPushBox.x);
        if (overlapWidth <= 0) return;

        if (this.playerFighter.getCenterX() < this.cpuFighter.getCenterX()) {
            this.playerFighter.applyExternalDisplacement(-(overlapWidth / 2));
            this.cpuFighter.applyExternalDisplacement(overlapWidth / 2);
        } else {
            this.playerFighter.applyExternalDisplacement(overlapWidth / 2);
            this.cpuFighter.applyExternalDisplacement(-(overlapWidth / 2));
        }
    },

    resolveHitForPair: function (attacker, defender) {
        var hitBox = attacker.getActiveHitBox();
        if (!hitBox) return;

        var hurtBox = defender.getHurtBox();
        if (!FighterPhysics.rectsOverlap(hitBox, hurtBox)) return;

        var attackProfile = attacker.getAttackProfile();
        if (!attackProfile) return;

        defender.takeHit(attackProfile, attacker.physicsState.facing);
        attacker.markAttackAsLanded();

        // Use fiercer sound for uppercut
        if (attacker.actionState.name === "up") {
            SoundEffects.playFierceHit();
        } else {
            SoundEffects.playHit();
        }
    },

    processFighterAudioEvents: function (fighter) {
        var events = fighter.consumeEvents();
        for (var i = 0; i < events.length; i++) {
            var evt = events[i];
            if (evt.name === "action-start") {
                if (evt.payload.actionName === "hadoken") SoundEffects.playHadoken();
                else if (evt.payload.actionName === "up") SoundEffects.playShoryuken();
            }
            if (evt.name === "jump-start") SoundEffects.playJump(evt.payload.jumpDirection);
        }
    },

    spawnProjectileForFighter: function (fighter) {
        var projectile = fighter.trySpawnProjectile();
        if (!projectile) return;
        this.projectiles.push(projectile);
        this.projectileLayer.addChild(projectile);
    },

    spawnProjectileImpact: function (position, projectileData, scale) {
        var impact = new ProjectileImpact({
            position: position,
            projectileData: projectileData,
            scale: scale || 1
        });
        this.projectileLayer.addChild(impact);
    },

    cleanupInactiveProjectiles: function () {
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            if (!this.projectiles[i].isActive()) {
                this.projectiles.splice(i, 1);
            }
        }
    },

    updateProjectiles: function (dt) {
        var arenaBounds = this.playerFighter.arenaBounds;
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            this.projectiles[i].updateProjectile(dt, arenaBounds);
        }
        this.cleanupInactiveProjectiles();
    },

    resolveProjectileClashes: function () {
        for (var i = 0; i < this.projectiles.length; i++) {
            var first = this.projectiles[i];
            if (!first.isActive()) continue;
            for (var j = i + 1; j < this.projectiles.length; j++) {
                var second = this.projectiles[j];
                if (!second.isActive() || first.ownerId === second.ownerId) continue;
                if (!FighterPhysics.rectsOverlap(first.getRect(), second.getRect())) continue;
                var impactX = (first.getPositionX() + second.getPositionX()) / 2;
                var impactY = (first.getPositionY() + second.getPositionY()) / 2;
                this.spawnProjectileImpact(cc.p(impactX, impactY), first.getProjectileData(), 1.2);
                first.deactivate();
                second.deactivate();
                SoundEffects.playClash();
            }
        }
        this.cleanupInactiveProjectiles();
    },

    resolveProjectileHits: function () {
        for (var i = this.projectiles.length - 1; i >= 0; i--) {
            var projectile = this.projectiles[i];
            if (!projectile.isActive()) continue;
            var defender = projectile.ownerId === this.playerFighter.fighterId ? this.cpuFighter : this.playerFighter;
            if (!FighterPhysics.rectsOverlap(projectile.getRect(), defender.getHurtBox())) continue;
            this.spawnProjectileImpact(
                cc.p(projectile.getPositionX(), projectile.getPositionY()),
                projectile.getProjectileData(), 1
            );
            defender.takeHit(projectile.attackProfile, projectile.facing);
            projectile.deactivate();
            SoundEffects.playImpact();
        }
        this.cleanupInactiveProjectiles();
    },

    resolveCombat: function () {
        this.resolvePushboxes();
        this.resolveHitForPair(this.playerFighter, this.cpuFighter);
        this.resolveHitForPair(this.cpuFighter, this.playerFighter);
        this.resolveProjectileClashes();
        this.resolveProjectileHits();
    },

    // ========== CHECK WIN/LOSE ==========

    checkKO: function () {
        if (this.cpuFighter.getHealth() <= 0) {
            this.enterKOPhase(true);
            return true;
        }
        if (this.playerFighter.getHealth() <= 0) {
            this.enterKOPhase(false);
            return true;
        }
        return false;
    },

    // ========== MAIN UPDATE ==========

    update: function (dt) {
        if (this.gamePhase === "countdown") {
            this.updateCountdownPhase(dt);
            // During countdown, fighters are visible but idle (no input)
            var emptyInput = this.createInputState();
            this.playerFighter.updateWithInput(dt, emptyInput, {
                opponentX: this.cpuFighter.getCenterX()
            });
            this.cpuFighter.updateWithInput(dt, emptyInput, {
                opponentX: this.playerFighter.getCenterX()
            });
            // Still consume events (but discard audio during countdown idle)
            this.playerFighter.consumeEvents();
            this.cpuFighter.consumeEvents();
            if (this.statusLayer) this.statusLayer.refreshHealthBars();
            return;
        }

        if (this.gamePhase === "ko") {
            this.updateKOPhase(dt);
            // Let physics/animation continue for a moment (knockback, falling)
            var emptyInput2 = this.createInputState();
            this.playerFighter.updateWithInput(dt, emptyInput2, {
                opponentX: this.cpuFighter.getCenterX()
            });
            this.cpuFighter.updateWithInput(dt, emptyInput2, {
                opponentX: this.playerFighter.getCenterX()
            });
            this.playerFighter.consumeEvents();
            this.cpuFighter.consumeEvents();
            this.updateProjectiles(dt);
            if (this.statusLayer) this.statusLayer.refreshHealthBars();
            return;
        }

        // === FIGHTING PHASE ===
        this.updateCpuAi(dt);

        this.playerFighter.updateWithInput(dt, this.inputState, {
            opponentX: this.cpuFighter.getCenterX()
        });
        this.cpuFighter.updateWithInput(dt, this.cpuInputState, {
            opponentX: this.playerFighter.getCenterX()
        });
        this.processFighterAudioEvents(this.playerFighter);
        this.processFighterAudioEvents(this.cpuFighter);
        this.spawnProjectileForFighter(this.playerFighter);
        this.spawnProjectileForFighter(this.cpuFighter);
        this.updateProjectiles(dt);
        this.resolveCombat();

        if (this.statusLayer) {
            this.statusLayer.refreshHealthBars();
        }

        // Check for KO
        this.checkKO();
    }
});
