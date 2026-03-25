var PlayScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var statusLayer = new StatusLayer();
        var animationLayer = new AnimationLayer({
            statusLayer: statusLayer
        });

        this.addChild(new BackgroundLayer());
        this.addChild(animationLayer);
        this.addChild(statusLayer);
    }
});
