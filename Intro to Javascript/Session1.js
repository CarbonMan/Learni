const { exec } = require('child_process');
var expect = require("chai").expect;

describe("Test installation", function () {
    describe("RGB to Hex conversion", function () {
        it("converts the basic colors", function () {
            function rgbToHexExpected(r, g, b, hex) {
                exec(`node app/cli rgbtohex ${r} ${g} ${b}`, (err, stdout, stderr) => {
                    if (err) {
                        // node couldn't execute the command
                        throw new Error(err);
                    }
                    expect(stdout).to.equal(`${hex}\n`);
                    expect(stderr).to.equal("");
                });
            }
            rgbToHexExpected(255, 0, 0, "ff0000");
            //rgbToHexExpected(255, 0, 0, "ff0001");
            rgbToHexExpected(0, 255, 0, "00ff00");
            rgbToHexExpected(0, 0, 255, "0000ff");
        });
    });

    describe("Hex to RGB conversion via cli", function () {
        it("converts the basic colors", function () {
            function hexTorgbExpected(hex, r, g, b) {
                exec(`node app/cli hexToRgb ${hex}`, (err, stdout, stderr) => {
                    if (err) {
                        // node couldn't execute the command
                        throw new Error(err);
                    }
                    expect(stdout).to.equal(`[ ${r}, ${g}, ${b} ]\n`);
                    expect(stderr).to.equal("");
                });
            }
            hexTorgbExpected("ff0000", 255, 0, 0);
            hexTorgbExpected("00ff00", 0, 255, 0);
            hexTorgbExpected("0000ff", 0, 0, 255);
        });
    });
});
