var FighterPhysics = {
    touchSplitX: 240,
    buttonOpacityIdle: 128,
    buttonOpacityActive: 255,
    frameDelay: 0.1,
    groundY: 0,
    walkSpeed: 140,
    groundAcceleration: 900,
    groundDeceleration: 1400,
    gravity: 1500,
    jumpVelocity: 520,
    forwardJumpSpeed: 130,
    backJumpSpeed: 95,
    maxFallSpeed: 1000,
    moveEpsilon: 8,
    attackDuration: 0.32,
    uppercutPoseDuration: 0.18,
    stageMargin: 20,
    maxHealth: 100,
    bodyWidth: 42,
    bodyHeight: 90,
    crouchBodyHeight: 64,
    bodyOffsetY: 45,
    pushboxWidth: 34,
    hitFlashDuration: 0.08,
    hitstunFriction: 900,
    aiPreferredRange: 130,
    aiRetreatRange: 72,
    aiAttackRange: 155,
    aiJumpRangeMin: 105,
    aiJumpRangeMax: 210,

    attacks: {
        hadoken: {
            duration: 0.32,
            activeWindowStart: 0.08,
            activeWindowEnd: 0.12,
            damage: 12,
            hitstun: 0.3,
            knockback: 180,
            launch: 60,
            spawnsProjectile: true,
            projectile: {
                spawnOffsetX: 54,
                spawnOffsetY: 60,
                speed: 340,
                width: 78,
                height: 46,
                lifetime: 1.1,
                visualScale: 1.2,
                color: cc.color(255, 255, 255, 255),
                glowColor: cc.color(60, 190, 255, 245),
                trailColor: cc.color(40, 115, 255, 220),
                ringColor: cc.color(170, 235, 255, 245),
                impactDuration: 0.18,
                impactRingColor: cc.color(140, 220, 255, 245),
                impactBurstColor: cc.color(255, 255, 255, 235),
                impactCoreColor: cc.color(200, 245, 255, 255)
            }
        },
        up: {
            duration: 0.18,
            activeWindowStart: 0.03,
            activeWindowEnd: 0.12,
            damage: 16,
            hitstun: 0.4,
            knockback: 120,
            launch: 220,
            hitbox: {
                offsetX: 26,
                offsetY: 56,
                width: 42,
                height: 74
            }
        }
    },

    clamp: function (value, minValue, maxValue) {
        return Math.max(minValue, Math.min(maxValue, value));
    },

    moveToward: function (currentValue, targetValue, maxDelta) {
        if (currentValue < targetValue) {
            return Math.min(currentValue + maxDelta, targetValue);
        }

        if (currentValue > targetValue) {
            return Math.max(currentValue - maxDelta, targetValue);
        }

        return targetValue;
    },

    resolveJumpVelocityX: function (horizontalIntent, facing) {
        if (horizontalIntent === 0) {
            return 0;
        }

        if (horizontalIntent === this.getFacingSign(facing)) {
            return this.forwardJumpSpeed * horizontalIntent;
        }

        return this.backJumpSpeed * horizontalIntent;
    },

    getFacingSign: function (facing) {
        return facing === "left" ? -1 : 1;
    },

    makeRect: function (x, y, width, height) {
        return {
            x: x,
            y: y,
            width: width,
            height: height
        };
    },

    rectsOverlap: function (firstRect, secondRect) {
        return !(
            firstRect.x + firstRect.width <= secondRect.x ||
            secondRect.x + secondRect.width <= firstRect.x ||
            firstRect.y + firstRect.height <= secondRect.y ||
            secondRect.y + secondRect.height <= firstRect.y
        );
    }
};