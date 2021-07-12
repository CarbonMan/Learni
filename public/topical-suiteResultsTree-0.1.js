    function SuiteResultsTree(opts) {
        var styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
			ul.tree {
				font-family: Arial;
			}

			ul.tree li {
				list-style-type: none;
				position: relative;
			}

			ul.tree li ul {
				display: none;
			}

			ul.tree li.open > ul {
				display: block;
			}

			ul.tree li a {
				color: black;
				text-decoration: none;
			}

			ul.tree li a:before {
				height: 1em;
				padding:0 .1em;
				font-size: .8em;
				display: block;
				position: absolute;
				left: -1.3em;
				top: .2em;
			}

			ul.tree li > a:not(:last-child):before {
				content: '+';
			}

			ul.tree li.open > a:not(:last-child):before {
				content: '-';
			}		
		`;
        document.getElementsByTagName('HEAD')[0].appendChild(styleSheet);

        /*
         * Go through the test tree and color the leaves according to whether the 
         * test has passed or failed
         */
        this.markTestResults = function(results) {
            var testTree = document.getElementById(opts.resultsDiv);
            var aTags = testTree.getElementsByTagName("a");
            results.passes.forEach(pass => {
                this.showResultStatus(aTags, pass.title, 'green');
            });
            results.failures.forEach(failure => {
                if (failure.title.indexOf("\"before all\"") == 0) {
                    var errParts = failure.err.message.split("(");
                    mochaErrors.innerHTML = `error compiling ${errParts[0]}`;
                } else {
                    this.showResultStatus(aTags, failure.title, 'red');
                }
            });
        };

        this.showResultStatus = function(aTags, searchText, color) {
            for (var i = 0; i < aTags.length; i++) {
                if (aTags[i].textContent == searchText) {
                    aTags[i].style.color = color;
                    return;
                }
            }
        };

        /**
         * Load the Test suite tree
         */
        this.showTestSuite = function(root) {
            console.log('Generating TOPICAL.SHOW_RESULTS');

            var response = {
                detail: {
                    abort: false
                }
            };
            var showEvent = new CustomEvent(TOPICAL.SHOW_RESULTS, response);
            document.dispatchEvent(showEvent);
            if (!response.abort) {
                var ul = document.getElementById(opts.resultsDiv);
                while (ul.firstChild) ul.removeChild(ul.firstChild);
                this.inspectSuite(root, ul, 0);
                this.activateTree();
            }
        };

        this.inspectSuite = function(suite, branch, depth) {
            var title;
            if (suite.title) {
                title = suite.title;
            } else {
                title = "Suites";
            }
            console.log(this.indent(title, depth));
            var branchUL = document.createElement("ul");
            branch = this.forkBranch(branch, title).appendChild(branchUL);

            suite.suites.forEach(suite => this.inspectSuite(suite, branch, depth + 1));
            suite.tests.forEach(test => this.inspectTest(test, branch, depth + 1));
        };

        this.inspectTest = function(test, branch, depth) {
            console.log(this.indent(test.title, depth));
            var leaf = this.forkBranch(branch, test.title);
            test.leaf = leaf;
        };

        this.indent = function(text, by) {
            return '    '.repeat(by) + text;
        };

        this.forkBranch = function(branch, title) {
            var li = document.createElement("li");
            li.classList.add('open');
            var a = document.createElement("a");
            a.href = "#";
            a.appendChild(document.createTextNode(title));
            li.appendChild(a);
            branch.appendChild(li);
            return li;
        };

        this.activateTree = function() {
            var tree = document.querySelectorAll('ul.tree a:not(:last-child)');
            for (var i = 0; i < tree.length; i++) {
                tree[i].addEventListener('click', function(e) {
                    var parent = e.target.parentElement;
                    var classList = parent.classList;
                    if (classList.contains("open")) {
                        classList.remove('open');
                        var opensubs = parent.querySelectorAll(':scope .open');
                        for (var i = 0; i < opensubs.length; i++) {
                            opensubs[i].classList.remove('open');
                        }
                    } else {
                        classList.add('open');
                    }
                    e.preventDefault();
                });
            }
        };
    }
