var StatusLayer = cc.Layer.extend({
    playerFighter: null,
    cpuFighter: null,
    playerBar: null,
    cpuBar: null,
    playerBarBackground: null,
    cpuBarBackground: null,
    playerBarBorder: null,
    cpuBarBorder: null,
    timerLabel: null,
    fightTimer: 99,
    timerActive: false,

    ctor: function () {
        this._super();

        var ws = cc.director.getWinSize();
        var barWidth = 150;
        var barHeight = 14;
        var barY = ws.height - 28;
        var padding = 12;
        var timerWidth = 36;
        var cx = ws.width / 2;

        // === TOP BAR BACKGROUND ===
        var topBg = new cc.DrawNode();
        topBg.drawRect(cc.p(0, ws.height - 42), cc.p(ws.width, ws.height),
            cc.color(0, 0, 0, 180), 0, cc.color(0, 0, 0));
        this.addChild(topBg, 0);

        // Bottom accent for top bar
        var topAccent = new cc.DrawNode();
        topAccent.drawSegment(cc.p(0, ws.height - 42), cc.p(ws.width, ws.height - 42),
            1, cc.color(255, 200, 50, 120));
        this.addChild(topAccent, 1);

        // === PLAYER HEALTH BAR (left side, fills from left to right) ===
        var playerBarX = padding;

        // Border
        this.playerBarBorder = new cc.DrawNode();
        this.playerBarBorder.drawRect(
            cc.p(playerBarX - 1, barY - 1),
            cc.p(playerBarX + barWidth + 1, barY + barHeight + 1),
            null, 1, cc.color(255, 200, 50, 200)
        );
        this.addChild(this.playerBarBorder, 2);

        // Background
        this.playerBarBackground = this.createBarNode(cc.p(playerBarX, barY), barWidth, barHeight, cc.color(40, 10, 10));
        // Fill
        this.playerBar = this.createBarNode(cc.p(playerBarX, barY), barWidth, barHeight, cc.color(220, 50, 50));

        // Player name
        var playerName = new cc.LabelTTF("KEN", "Impact", 11);
        playerName.setColor(cc.color(255, 200, 60));
        playerName.setAnchorPoint(0, 0.5);
        playerName.setPosition(playerBarX, barY - 10);
        this.addChild(playerName, 5);

        // === TIMER (center) ===
        var timerBg = new cc.DrawNode();
        timerBg.drawRect(
            cc.p(cx - timerWidth / 2, barY - 2),
            cc.p(cx + timerWidth / 2, barY + barHeight + 4),
            cc.color(20, 20, 40), 1, cc.color(255, 200, 50, 150)
        );
        this.addChild(timerBg, 3);

        this.timerLabel = new cc.LabelTTF("99", "Impact", 16);
        this.timerLabel.setColor(cc.color(255, 255, 255));
        this.timerLabel.setPosition(cx, barY + barHeight / 2 + 1);
        this.addChild(this.timerLabel, 5);

        // === CPU HEALTH BAR (right side, fills from right to left) ===
        var cpuBarX = ws.width - padding - barWidth;

        // Border
        this.cpuBarBorder = new cc.DrawNode();
        this.cpuBarBorder.drawRect(
            cc.p(cpuBarX - 1, barY - 1),
            cc.p(cpuBarX + barWidth + 1, barY + barHeight + 1),
            null, 1, cc.color(100, 150, 255, 200)
        );
        this.addChild(this.cpuBarBorder, 2);

        // Background
        this.cpuBarBackground = this.createBarNode(cc.p(cpuBarX, barY), barWidth, barHeight, cc.color(10, 10, 40));
        // Fill (draws from right side)
        this.cpuBar = this.createBarNode(cc.p(cpuBarX, barY), barWidth, barHeight, cc.color(50, 100, 220));
        this.cpuBar._drawsFromRight = true;

        // CPU name
        var cpuName = new cc.LabelTTF("AKUMA", "Impact", 11);
        cpuName.setColor(cc.color(140, 160, 255));
        cpuName.setAnchorPoint(1, 0.5);
        cpuName.setPosition(cpuBarX + barWidth, barY - 10);
        this.addChild(cpuName, 5);

        return true;
    },

    createBarNode: function (position, width, height, color) {
        var node = new cc.DrawNode();
        node._barPosition = position;
        node._barWidth = width;
        node._barHeight = height;
        node._barColor = color;
        node._drawsFromRight = false;
        this.addChild(node, 3);
        this.drawBar(node, 1);
        return node;
    },

    drawBar: function (node, fillRatio) {
        node.clear();
        if (fillRatio <= 0) return;

        var fillWidth = node._barWidth * fillRatio;

        if (node._drawsFromRight) {
            // Draw from right edge toward left
            var rightEdge = node._barPosition.x + node._barWidth;
            node.drawRect(
                cc.p(rightEdge - fillWidth, node._barPosition.y),
                cc.p(rightEdge, node._barPosition.y + node._barHeight),
                node._barColor, 0, node._barColor
            );
        } else {
            node.drawRect(
                node._barPosition,
                cc.p(node._barPosition.x + fillWidth, node._barPosition.y + node._barHeight),
                node._barColor, 0, node._barColor
            );
        }

        // Health bar color shift when low
        if (fillRatio < 0.25) {
            node._barColor = node._drawsFromRight ? cc.color(180, 60, 60) : cc.color(200, 40, 40);
        }
    },

    setFighters: function (playerFighter, cpuFighter) {
        this.playerFighter = playerFighter;
        this.cpuFighter = cpuFighter;
        this.refreshHealthBars();
    },

    refreshHealthBars: function () {
        if (!this.playerFighter || !this.cpuFighter) return;

        this.drawBar(this.playerBar, this.playerFighter.getHealthRatio());
        this.drawBar(this.cpuBar, this.cpuFighter.getHealthRatio());
    }
});
