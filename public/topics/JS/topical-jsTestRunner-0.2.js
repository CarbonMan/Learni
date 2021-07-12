window.addEventListener('load', (event)=>{
	debugger;
  TOPICAL.LOAD_JS_TEST_RUNNER = 'jsTestRunnerReady';
    TOPICAL.JSCoding = function() {
        var me = this;
        var mochaErrors;
        var testSuites = [];
        this.addSuite = function(testSuite) {
            mochaErrors = document.getElementById(testSuite.errorDiv);
            testSuite.codeEditor = CodeMirror(function(elt) {
                document.getElementById(testSuite.editorDiv).appendChild(elt);
            }, {
                value: localStorage.getItem(testSuite.id) || "",
                mode: "javascript"
            });
            testSuite.suite.results = new SuiteResultsTree({
                resultsDiv: testSuite.resultsDiv
            });

            testSuites.push(testSuite);
            // This event is generated from a modified version of Mocha
            document.addEventListener('Test run complete', (e) => {
                testSuite.suite.results.markTestResults(e.detail);
            });

            me.runTest(testSuite.id, testSuite.codeEditor.doc.getValue());
            testSuite.codeEditor.doc.on("change", (ev) => {
                me.runTest(testSuite.id, ev.getValue());
            });

        };
        this.getSuite = function(_id) {
            const result = testSuites.find(({
                id
            }) => id == _id);
            return result.suite;
        };
        this.registerFunction = function(opts) {
            return new Promise((resolve, reject) => {
                "use strict";
                const newScript = document.createElement("script");
                const oldScript = document.getElementById(opts.id);
                if (oldScript) {
                    oldScript.parentNode.insertBefore(newScript, oldScript.nextSibling)
                    oldScript.parentNode.removeChild(oldScript)
                }
                newScript.id = opts.id;
                document.body.appendChild(newScript);
                var errored;
                window.onerror = (e) => {
                    errored = true;
                    reject(e.replace("Uncaught SyntaxError: ", ""));
                }
                newScript.innerHTML = opts.functionBody;
                window.onerror = null;
                if (!errored) {
                    resolve();
                }
            });
        };

        this.runTest = function(_id, _content) {
            var testSuite = testSuites.find(({
                id
            }) => id == _id);
            if (testSuite) {
                mochaErrors.innerHTML = "";
                localStorage.setItem(_id, _content);
                testSuite.suite.setContent(_content);
                mocha.run();
            }
        };
        mocha.setup({
            ui: 'bdd',
            reporter: 'JSON'
        });
        mocha.cleanReferencesAfterRun(false);
        document.dispatchEvent(new CustomEvent(TOPICAL.BDD_READY));

        console.log('Generating TOPICAL.LOAD_JS_TEST_RUNNER');
        const event = new CustomEvent(TOPICAL.LOAD_JS_TEST_RUNNER, {
            detail: me
        });
        document.dispatchEvent(event);
    };

    document.addEventListener(TOPICAL.INIT, (e) => {
        console.log('Trapped TOPICAL.INIT');
        var pending = [];
        // Load the codeMirror editor
        var head = document.getElementsByTagName('head')[0];
        setTimeout(() => {
            pending.push(new Promise((resolve, reject) => {
                var link = document.createElement('link');
                head.appendChild(link);
                link.onload = resolve;
                link.onerror = reject;
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/codemirror.min.css';
            }));
            //*
            pending.push(new Promise((resolve, reject) => {
                var script = document.createElement('script');
                head.appendChild(script);
                script.onload = resolve;
                script.onerror = reject;
                script.src = "https://cdn.jsdelivr.net/gh/CarbonMan/Learni/public/CodeMirror-5.62.0-modified.js";
                script.integrity = "sha512-i9pd5Q6ntCp6LwSgAZDzsrsOlE8SN+H5E0T5oumSXWQz5l1Oc4Kb5ZrXASfyjjqtc6Mg6xWbu+ePbbmiEPJlDg==";
                script.crossorigin = "anonymous";
                script.referrerpolicy = "no-referrer";
            }));
            pending.push(new Promise((resolve, reject) => {
                var script = document.createElement('script');
                head.appendChild(script);
                script.onload = resolve;
                script.onerror = reject;
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/mode/javascript/javascript.min.js";
                script.integrity = "sha512-9mEZ3vO6zMj0ub2Wypnt8owrHeoJCH22MkzeJ9eD3hca8/Wlqo5pEopI6HloA0F53f/RkRkHs8TyZMxbwVmnFw==";
                script.crossorigin = "anonymous";
                script.referrerpolicy = "no-referrer";
            }));
            //*/
            Promise.all(pending)
                .then(() => {
                    var styleSheet = document.createElement("style");
                    styleSheet.type = "text/css";
                    styleSheet.innerText = `
				.CodeMirror {border: 1px solid black; font-size:13px}
				`;
                    head.appendChild(styleSheet);
                    console.log("External dependencies for TOPICAL.JSCoding loaded");
                    var jsCoding = new TOPICAL.JSCoding();
                    e.detail.addPlugin('coding', jsCoding);
                })
                .catch((e) => {
                    console.error(e)
                });
        }, 1000);
    });
});
