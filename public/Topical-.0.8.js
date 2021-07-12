    function TOPICAL() {
        var me = this;
        me.plugins = {};
        var pending = [];
        // Load the codeMirror editor
        var head = document.getElementsByTagName('HEAD')[0];
        setTimeout(() => {
            pending.push(new Promise((resolve, reject) => {
                var script = document.createElement('script');
                document.getElementsByTagName('head')[0].appendChild(script);
                script.onload = resolve;
                script.onerror = reject;
                script.src = "https://cdn.jsdelivr.net/gh/CarbonMan/Learni/public/mocha8.0.1-modified.js";
            }));
            pending.push(new Promise((resolve, reject) => {
                var script = document.createElement('script');
                document.getElementsByTagName('head')[0].appendChild(script);
                script.onload = resolve;
                script.onerror = reject;
                script.src = "https://cdn.jsdelivr.net/gh/CarbonMan/Learni/public/chai-4.3.4-mod.js";
            }));
            pending.push(new Promise((resolve, reject) => {
                var script = document.createElement('script');
                document.getElementsByTagName('head')[0].appendChild(script);
                script.onload = resolve;
                script.onerror = reject;
                script.src = "https://cdn.jsdelivr.net/gh/CarbonMan/Learni/public/mochaTestBundle-0.2.js";
            }));
            Promise.all(pending)
                .then(() => {
                    console.log('Generating TOPICAL.INIT');

                    document.dispatchEvent(new CustomEvent(TOPICAL.INIT, {
                        detail: me
                    }));
                })
                .catch((e) => {
                    console.error(e);
                });
        }, 1000);

    }
    TOPICAL.SHOW_RESULTS = "showResults";
    TOPICAL.INIT = "load";
    TOPICAL.TESTRUNNER_READY = "testRunnerReady";
    // This string is checked by browserified code (mocha-test) 
    TOPICAL.BDD_READY = "Mocha initialized";
    TOPICAL.prototype.addPlugin = function(id, plugin) {
        this.plugins[id] = plugin;
    };
    TOPICAL.prototype.plugin = function(id) {
        return this.plugins[id];
    };

    var topical = new TOPICAL();
