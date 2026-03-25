var FIGHTER_SPRITE_BASE_POSITION = {
    x: 120,
    y: 85
};

function fighterFormatFrameNumber(frameIndex, padWithZero) {
    if (padWithZero && frameIndex < 10) {
        return "0" + frameIndex;
    }

    return String(frameIndex);
}

function fighterCreateFrameRange(prefix, start, end, step, padWithZero) {
    var frameNames = [];
    var frameIndex;

    for (frameIndex = start; step > 0 ? frameIndex <= end : frameIndex >= end; frameIndex += step) {
        frameNames.push(prefix + "_" + fighterFormatFrameNumber(frameIndex, padWithZero) + ".png");
    }

    return frameNames;
}

function fighterResolveSpriteFrames(frameNames) {
    var frames = [];
    var frameIndex;

    for (frameIndex = 0; frameIndex < frameNames.length; frameIndex += 1) {
        frames.push(cc.spriteFrameCache.getSpriteFrame(frameNames[frameIndex]));
    }

    return frames;
}

function buildFighterStateDefinitions(prefix) {
    return {
        moveLeft: {
            frameNames: fighterCreateFrameRange(prefix, 10, 20, 1, false),
            repeat: true
        },
        moveRight: {
            frameNames: fighterCreateFrameRange(prefix, 20, 10, -1, false),
            repeat: true
        },
        crouch: {
            frameNames: fighterCreateFrameRange(prefix, 33, 38, 1, false),
            repeat: false
        },
        up: {
            frameNames: fighterCreateFrameRange(prefix, 38, 33, -1, false),
            repeat: false
        },
        hadoken: {
            frameNames: fighterCreateFrameRange(prefix, 22, 33, 1, false),
            repeat: false
        },
        jump: {
            frameNames: fighterCreateFrameRange(prefix, 34, 48, 1, false).concat(
                fighterCreateFrameRange(prefix, 48, 34, -1, false)
            ),
            repeat: true
        },
        stand: {
            frameNames: fighterCreateFrameRange(prefix, 1, 9, 1, true),
            repeat: true
        }
    };
}

var FIGHTER_STATE_DEFINITIONS = buildFighterStateDefinitions("ken");

var FIGHTER_DIRECTIONAL_STATES = {
};

var Fighter = cc.Node.extend({
    spriteSheet: null,
    sprite: null,
    currentStateName: null,
    currentAnimationAction: null,
    arenaBounds: null,

    ctor: function (options) {
        this._super();

        options = options || {};

        this.characterName = options.character || "ken";
        this.characterPrefix = this.characterName === "akuma" ? "akuma" : "ken";
        this.fighterStateDefs = buildFighterStateDefinitions(this.characterPrefix);

        this.frameCache = {};
        this.inputState = this.createInputState();
        this.previousInputState = this.createInputState();
        this.physicsState = {
            position: cc.p(options.startX || 0, FighterPhysics.groundY),
            velocity: cc.p(0, 0),
            grounded: true,
            facing: options.facing || "right",
            jumpDirection: "neutral"
        };
        this.actionState = {
            name: null,
            timer: 0,
            duration: 0,
            hitLanded: false,
            projectileSpawned: false
        };
        this.combatState = {
            health: FighterPhysics.maxHealth,
            hitstunTimer: 0,
            hitFlashTimer: 0
        };
        this.pendingEvents = [];
        this.fighterId = options.id || "fighter";

        this.init();
    },

    init: function () {
        this._super();
        this.setupSprite();
        this.setupArenaBounds();
        this.transitionToState("stand");
        this.syncSpritePosition();

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

    copyInputState: function (nextInputState) {
        this.inputState.moveLeft = !!nextInputState.moveLeft;
        this.inputState.moveRight = !!nextInputState.moveRight;
        this.inputState.jump = !!nextInputState.jump;
        this.inputState.crouch = !!nextInputState.crouch;
        this.inputState.up = !!nextInputState.up;
        this.inputState.hadoken = !!nextInputState.hadoken;
    },

    getCenterX: function () {
        return this.physicsState.position.x + FIGHTER_SPRITE_BASE_POSITION.x;
    },

    isGrounded: function () {
        return this.physicsState.grounded;
    },

    isBusy: function () {
        return this.actionState.timer > 0 || this.combatState.hitstunTimer > 0;
    },

    getHealth: function () {
        return this.combatState.health;
    },

    getMaxHealth: function () {
        return FighterPhysics.maxHealth;
    },

    getHealthRatio: function () {
        return this.combatState.health / FighterPhysics.maxHealth;
    },

    faceToward: function (targetX) {
        if (targetX < this.getCenterX()) {
            this.physicsState.facing = "left";
            return;
        }

        this.physicsState.facing = "right";
    },

    setupSprite: function () {
        var plistRes = this.characterName === "akuma" ? res.akuma_plist : res.runner_plist;
        var pngRes = this.characterName === "akuma" ? res.akuma_png : res.runner_png;

        cc.spriteFrameCache.addSpriteFrames(plistRes);
        this.buildFrameCache();

        this.spriteSheet = new cc.SpriteBatchNode(pngRes);
        this.addChild(this.spriteSheet);

        this.sprite = new cc.Sprite("#" + this.characterPrefix + "_01.png");
        this.spriteSheet.addChild(this.sprite);
    },

    setupArenaBounds: function () {
        var winSize = cc.director.getWinSize();

        this.arenaBounds = {
            minX: -FIGHTER_SPRITE_BASE_POSITION.x + FighterPhysics.stageMargin,
            maxX: winSize.width - FIGHTER_SPRITE_BASE_POSITION.x - FighterPhysics.stageMargin
        };
    },

    buildFrameCache: function () {
        var stateName;
        var defs = this.fighterStateDefs;

        for (stateName in defs) {
            if (defs.hasOwnProperty(stateName)) {
                this.frameCache[stateName] = fighterResolveSpriteFrames(defs[stateName].frameNames);
            }
        }
    },

    isJustPressed: function (inputName) {
        return this.inputState[inputName] && !this.previousInputState[inputName];
    },

    consumeFrameInputState: function () {
        this.previousInputState.moveLeft = this.inputState.moveLeft;
        this.previousInputState.moveRight = this.inputState.moveRight;
        this.previousInputState.jump = this.inputState.jump;
        this.previousInputState.crouch = this.inputState.crouch;
        this.previousInputState.up = this.inputState.up;
        this.previousInputState.hadoken = this.inputState.hadoken;
    },

    queueEvent: function (eventName, payload) {
        this.pendingEvents.push({
            name: eventName,
            payload: payload || {}
        });
    },

    consumeEvents: function () {
        var events = this.pendingEvents.slice(0);

        this.pendingEvents.length = 0;

        return events;
    },

    resolveHorizontalIntent: function () {
        if (this.inputState.moveLeft === this.inputState.moveRight) {
            return 0;
        }

        return this.inputState.moveLeft ? -1 : 1;
    },

    updateActionState: function (dt) {
        var hadokenProfile;
        var upProfile;

        if (this.actionState.timer > 0) {
            this.actionState.timer = Math.max(0, this.actionState.timer - dt);
            if (this.actionState.timer === 0) {
                this.actionState.name = null;
                this.actionState.projectileSpawned = false;
            }
        }

        if (!this.physicsState.grounded) {
            return;
        }

        if (this.isJustPressed("hadoken")) {
            hadokenProfile = FighterPhysics.attacks.hadoken;
            this.startAction("hadoken", hadokenProfile ? hadokenProfile.duration : FighterPhysics.attackDuration);
            return;
        }

        if (this.isJustPressed("up")) {
            upProfile = FighterPhysics.attacks.up;
            this.startAction("up", upProfile ? upProfile.duration : FighterPhysics.uppercutPoseDuration);
        }
    },

    startAction: function (actionName, duration) {
        this.actionState.name = actionName;
        this.actionState.timer = duration;
        this.actionState.duration = duration;
        this.actionState.hitLanded = false;
        this.actionState.projectileSpawned = false;
        this.physicsState.velocity.x = 0;
        this.queueEvent("action-start", {
            actionName: actionName
        });
    },

    updateCombatState: function (dt) {
        if (this.combatState.hitstunTimer > 0) {
            this.combatState.hitstunTimer = Math.max(0, this.combatState.hitstunTimer - dt);
        }

        if (this.combatState.hitFlashTimer > 0) {
            this.combatState.hitFlashTimer = Math.max(0, this.combatState.hitFlashTimer - dt);
        }

        this.sprite.setColor(this.combatState.hitFlashTimer > 0 ? cc.color(255, 180, 180) : cc.color(255, 255, 255));
    },

    updatePhysics: function (dt) {
        this.updateJumpPhysics();
        this.updateHorizontalPhysics(dt);
        this.integratePhysics(dt);
    },

    updateJumpPhysics: function () {
        var horizontalIntent;

        if (this.physicsState.grounded && this.isJustPressed("jump")) {
            horizontalIntent = this.resolveHorizontalIntent();
            this.physicsState.grounded = false;
            this.physicsState.velocity.y = FighterPhysics.jumpVelocity;
            this.physicsState.velocity.x = FighterPhysics.resolveJumpVelocityX(horizontalIntent, this.physicsState.facing);
            this.physicsState.jumpDirection = this.resolveJumpDirection(horizontalIntent);
            this.queueEvent("jump-start", {
                jumpDirection: this.physicsState.jumpDirection
            });
        }
    },

    resolveJumpDirection: function (horizontalIntent) {
        if (horizontalIntent === 0) {
            return "neutral";
        }

        if (horizontalIntent === FighterPhysics.getFacingSign(this.physicsState.facing)) {
            return "forward";
        }

        return "back";
    },

    updateHorizontalPhysics: function (dt) {
        var horizontalIntent = this.resolveHorizontalIntent();
        var targetSpeed = 0;
        var actionBlocksMovement = this.actionState.timer > 0 || this.combatState.hitstunTimer > 0 || (this.physicsState.grounded && this.inputState.crouch);

        if (!this.physicsState.grounded) {
            return;
        }

        if (actionBlocksMovement) {
            this.physicsState.velocity.x = FighterPhysics.moveToward(this.physicsState.velocity.x, 0, FighterPhysics.hitstunFriction * dt);
            return;
        }

        if (horizontalIntent !== 0) {
            targetSpeed = horizontalIntent * FighterPhysics.walkSpeed;
            this.physicsState.velocity.x = FighterPhysics.moveToward(this.physicsState.velocity.x, targetSpeed, FighterPhysics.groundAcceleration * dt);
            return;
        }

        this.physicsState.velocity.x = FighterPhysics.moveToward(this.physicsState.velocity.x, 0, FighterPhysics.groundDeceleration * dt);
    },

    integratePhysics: function (dt) {
        var clampedPositionX;

        if (!this.physicsState.grounded) {
            this.physicsState.velocity.y = Math.max(this.physicsState.velocity.y - (FighterPhysics.gravity * dt), -FighterPhysics.maxFallSpeed);
        }

        this.physicsState.position.x += this.physicsState.velocity.x * dt;
        this.physicsState.position.y += this.physicsState.velocity.y * dt;
        clampedPositionX = FighterPhysics.clamp(this.physicsState.position.x, this.arenaBounds.minX, this.arenaBounds.maxX);

        if (clampedPositionX !== this.physicsState.position.x) {
            this.physicsState.velocity.x = 0;
        }

        this.physicsState.position.x = clampedPositionX;

        if (this.physicsState.position.y <= FighterPhysics.groundY) {
            this.physicsState.position.y = FighterPhysics.groundY;
            this.physicsState.velocity.y = 0;
            this.physicsState.grounded = true;
            this.physicsState.jumpDirection = "neutral";
        }

        this.syncSpritePosition();
    },

    resolveVisualState: function () {
        var facingSign = FighterPhysics.getFacingSign(this.physicsState.facing);

        if (!this.physicsState.grounded) {
            return "jump";
        }

        if (this.combatState.hitstunTimer > 0) {
            return "stand";
        }

        if (this.actionState.timer > 0 && this.actionState.name) {
            return this.actionState.name;
        }

        if (this.inputState.crouch) {
            return "crouch";
        }

        if (this.physicsState.velocity.x * facingSign < -FighterPhysics.moveEpsilon) {
            return "moveLeft";
        }

        if (this.physicsState.velocity.x * facingSign > FighterPhysics.moveEpsilon) {
            return "moveRight";
        }

        return "stand";
    },

    transitionToState: function (nextStateName) {
        if (this.currentStateName === nextStateName) {
            this.applyFacingVisual(nextStateName);
            return;
        }

        if (this.currentAnimationAction) {
            this.sprite.stopAction(this.currentAnimationAction);
        }

        this.currentStateName = nextStateName;
        this.currentAnimationAction = this.createAnimationAction(nextStateName);
        this.applyFacingVisual(nextStateName);

        if (this.currentAnimationAction) {
            this.sprite.runAction(this.currentAnimationAction);
        }
    },

    applyFacingVisual: function (stateName) {
        if (FIGHTER_DIRECTIONAL_STATES[stateName]) {
            this.sprite.setScaleX(1);
            return;
        }

        this.sprite.setScaleX(this.physicsState.facing === "left" ? 1 : -1);
    },

    createAnimationAction: function (stateName) {
        var stateDefinition = this.fighterStateDefs[stateName];
        var animation = new cc.Animation(this.frameCache[stateName], FighterPhysics.frameDelay);
        var animateAction = new cc.Animate(animation);

        if (stateDefinition.repeat) {
            return new cc.RepeatForever(animateAction);
        }

        return new cc.Repeat(animateAction, 1);
    },

    syncSpritePosition: function () {
        this.sprite.setPosition(
            this.physicsState.position.x + FIGHTER_SPRITE_BASE_POSITION.x,
            this.physicsState.position.y + FIGHTER_SPRITE_BASE_POSITION.y
        );
    },

    getBodyHeight: function () {
        if (this.inputState.crouch && this.physicsState.grounded) {
            return FighterPhysics.crouchBodyHeight;
        }

        return FighterPhysics.bodyHeight;
    },

    getPushBox: function () {
        return {
            x: this.getCenterX() - (FighterPhysics.pushboxWidth / 2),
            y: this.physicsState.position.y,
            width: FighterPhysics.pushboxWidth,
            height: this.getBodyHeight()
        };
    },

    getHurtBox: function () {
        return {
            x: this.getCenterX() - (FighterPhysics.bodyWidth / 2),
            y: this.physicsState.position.y,
            width: FighterPhysics.bodyWidth,
            height: this.getBodyHeight()
        };
    },

    getAttackProfile: function () {
        if (!this.actionState.name) {
            return null;
        }

        return FighterPhysics.attacks[this.actionState.name] || null;
    },

    isAttackActive: function () {
        var attackProfile = this.getAttackProfile();
        var elapsed;

        if (!attackProfile || this.actionState.hitLanded || this.actionState.duration === 0) {
            return false;
        }

        elapsed = this.actionState.duration - this.actionState.timer;

        return elapsed >= attackProfile.activeWindowStart && elapsed <= attackProfile.activeWindowEnd;
    },

    getActiveHitBox: function () {
        var attackProfile = this.getAttackProfile();
        var hitbox;
        var facingSign;

        if (!attackProfile || attackProfile.spawnsProjectile || !this.isAttackActive()) {
            return null;
        }

        hitbox = attackProfile.hitbox;
        facingSign = FighterPhysics.getFacingSign(this.physicsState.facing);

        return {
            x: this.getCenterX() + (hitbox.offsetX * facingSign) - (hitbox.width / 2),
            y: this.physicsState.position.y + hitbox.offsetY - (hitbox.height / 2),
            width: hitbox.width,
            height: hitbox.height
        };
    },

    markAttackAsLanded: function () {
        this.actionState.hitLanded = true;
    },

    trySpawnProjectile: function () {
        var attackProfile = this.getAttackProfile();
        var projectileData;
        var facingSign;

        if (!attackProfile || !attackProfile.spawnsProjectile || this.actionState.projectileSpawned || !this.isAttackActive()) {
            return null;
        }

        projectileData = attackProfile.projectile;
        facingSign = FighterPhysics.getFacingSign(this.physicsState.facing);
        this.actionState.projectileSpawned = true;

        return new Projectile({
            ownerId: this.fighterId,
            facing: this.physicsState.facing,
            attackProfile: attackProfile,
            projectileData: projectileData,
            startPosition: cc.p(
                this.getCenterX() + (projectileData.spawnOffsetX * facingSign),
                this.physicsState.position.y + projectileData.spawnOffsetY
            )
        });
    },

    takeHit: function (attackProfile, attackerFacing) {
        var knockbackDirection = FighterPhysics.getFacingSign(attackerFacing);

        this.combatState.health = Math.max(0, this.combatState.health - attackProfile.damage);
        this.combatState.hitstunTimer = attackProfile.hitstun;
        this.combatState.hitFlashTimer = FighterPhysics.hitFlashDuration;
        this.actionState.name = null;
        this.actionState.timer = 0;
        this.actionState.duration = 0;
        this.actionState.hitLanded = false;
        this.actionState.projectileSpawned = false;
        this.physicsState.velocity.x = attackProfile.knockback * knockbackDirection;
        this.physicsState.velocity.y = attackProfile.launch;
        if (attackProfile.launch > 0) {
            this.physicsState.grounded = false;
        }
    },

    applyExternalDisplacement: function (deltaX) {
        var clampedPositionX = FighterPhysics.clamp(this.physicsState.position.x + deltaX, this.arenaBounds.minX, this.arenaBounds.maxX);

        if (clampedPositionX !== this.physicsState.position.x + deltaX) {
            this.physicsState.velocity.x = 0;
        }

        this.physicsState.position.x = clampedPositionX;
        this.syncSpritePosition();
    },

    updateWithInput: function (dt, nextInputState, context) {
        this.copyInputState(nextInputState);

        if (context && context.opponentX !== undefined) {
            this.faceToward(context.opponentX);
        }

        this.updateCombatState(dt);
        this.updateActionState(dt);
        this.updatePhysics(dt);
        this.transitionToState(this.resolveVisualState());
        this.consumeFrameInputState();
    }
});