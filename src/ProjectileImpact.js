var ProjectileImpact = cc.Node.extend({
    ringNode: null,
    burstNode: null,
    coreNode: null,

    ctor: function (options) {
        this._super();

        this.initImpact(options || {});
    },

    initImpact: function (options) {
        var projectileData = options.projectileData || {};

        this.setPosition(options.position || cc.p(0, 0));

        this.ringNode = new cc.DrawNode();
        this.burstNode = new cc.DrawNode();
        this.coreNode = new cc.DrawNode();
        this.addChild(this.ringNode);
        this.addChild(this.burstNode);
        this.addChild(this.coreNode);

        this.redraw(projectileData, options.scale || 1);
        this.runAction(cc.sequence(
            cc.spawn(
                cc.scaleTo(projectileData.impactDuration || 0.16, 1.8),
                cc.fadeOut(projectileData.impactDuration || 0.16)
            ),
            cc.removeSelf(true)
        ));
    },

    redraw: function (projectileData, scale) {
        var radius = Math.max(projectileData.width || 0, projectileData.height || 0) * 0.3 * scale;
        var burstColor = projectileData.impactBurstColor || cc.color(255, 255, 255, 210);
        var ringColor = projectileData.impactRingColor || cc.color(120, 220, 255, 235);
        var coreColor = projectileData.impactCoreColor || cc.color(255, 255, 255, 255);
        var rayIndex;
        var angle;
        var startPoint;
        var endPoint;

        this.ringNode.clear();
        this.burstNode.clear();
        this.coreNode.clear();

        this.ringNode.drawCircle(cc.p(0, 0), radius, 0, 24, false, 4, ringColor);

        for (rayIndex = 0; rayIndex < 8; rayIndex += 1) {
            angle = (Math.PI * 2 * rayIndex) / 8;
            startPoint = cc.p(Math.cos(angle) * radius * 0.35, Math.sin(angle) * radius * 0.35);
            endPoint = cc.p(Math.cos(angle) * radius * 1.25, Math.sin(angle) * radius * 1.25);
            this.burstNode.drawSegment(startPoint, endPoint, 2, burstColor);
        }

        this.coreNode.drawDot(cc.p(0, 0), radius * 0.42, coreColor);
    }
});