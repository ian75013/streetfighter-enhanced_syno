var Projectile = cc.Node.extend({
    ownerId: null,
    facing: "right",
    attackProfile: null,
    velocityX: 0,
    lifetime: 0,
    active: false,
    glowNode: null,
    coreNode: null,
    trailNode: null,
    projectileRect: null,
    projectileData: null,
    baseScale: 1,
    pulseTimer: 0,

    ctor: function (options) {
        this._super();

        this.initProjectile(options || {});
    },

    initProjectile: function (options) {
        var projectileData = options.projectileData || {};
        var startPosition = options.startPosition || cc.p(0, 0);
        var facingSign = FighterPhysics.getFacingSign(options.facing || "right");

        this.ownerId = options.ownerId || null;
        this.facing = options.facing || "right";
        this.attackProfile = options.attackProfile || null;
        this.projectileData = projectileData;
        this.velocityX = (projectileData.speed || 0) * facingSign;
        this.lifetime = projectileData.lifetime || 0;
        this.active = true;
        this.projectileRect = FighterPhysics.makeRect(0, 0, projectileData.width || 0, projectileData.height || 0);
        this.baseScale = projectileData.visualScale || 1;
        this.pulseTimer = 0;

        this.trailNode = new cc.DrawNode();
        this.glowNode = new cc.DrawNode();
        this.coreNode = new cc.DrawNode();
        this.addChild(this.trailNode);
        this.addChild(this.glowNode);
        this.addChild(this.coreNode);
        this.redraw(projectileData);

        this.setPosition(startPosition);
        this.syncRect();
    },

    redraw: function (projectileData) {
        var radius = Math.max(projectileData.width || 0, projectileData.height || 0) * 0.45;
        var glowColor = projectileData.glowColor || cc.color(120, 235, 255, 180);
        var coreColor = projectileData.color || cc.color(255, 255, 255, 255);
        var trailColor = projectileData.trailColor || cc.color(80, 170, 255, 140);
        var ringColor = projectileData.ringColor || cc.color(255, 255, 255, 210);
        var facingSign = FighterPhysics.getFacingSign(this.facing);

        this.trailNode.clear();
        this.glowNode.clear();
        this.coreNode.clear();

        this.trailNode.drawSegment(
            cc.p(-radius * 1.8 * facingSign, 0),
            cc.p(-radius * 0.2 * facingSign, 0),
            radius * 0.7,
            trailColor
        );
        this.glowNode.drawDot(cc.p(0, 0), radius, glowColor);
        this.glowNode.drawDot(cc.p(0, 0), radius * 0.78, cc.color(glowColor.r, glowColor.g, glowColor.b, 220));
        this.coreNode.drawCircle(cc.p(0, 0), radius * 0.7, 0, 32, false, 3, ringColor);
        this.coreNode.drawDot(cc.p(0, 0), radius * 0.52, coreColor);
        this.coreNode.drawDot(cc.p(radius * 0.18 * facingSign, radius * 0.08), radius * 0.16, cc.color(255, 255, 255, 220));
        this.coreNode.drawDot(cc.p(-radius * 0.08 * facingSign, -radius * 0.12), radius * 0.11, cc.color(170, 240, 255, 200));

        this.setScale(this.baseScale);
    },

    syncRect: function () {
        this.projectileRect.x = this.getPositionX() - (this.projectileRect.width / 2);
        this.projectileRect.y = this.getPositionY() - (this.projectileRect.height / 2);
    },

    updateProjectile: function (dt, arenaBounds) {
        if (!this.active) {
            return;
        }

        this.lifetime = Math.max(0, this.lifetime - dt);
        if (this.lifetime === 0) {
            this.deactivate();
            return;
        }

        this.setPositionX(this.getPositionX() + (this.velocityX * dt));
        this.pulseTimer += dt * 10;
        this.setScale(this.baseScale + (Math.sin(this.pulseTimer) * 0.08));
        this.syncRect();

        if (this.projectileRect.x + this.projectileRect.width < arenaBounds.minX || this.projectileRect.x > arenaBounds.maxX) {
            this.deactivate();
        }
    },

    getRect: function () {
        return this.projectileRect;
    },

    getProjectileData: function () {
        return this.projectileData;
    },

    deactivate: function () {
        if (!this.active) {
            return;
        }

        this.active = false;
        this.removeFromParent(true);
    },

    isActive: function () {
        return this.active;
    }
});