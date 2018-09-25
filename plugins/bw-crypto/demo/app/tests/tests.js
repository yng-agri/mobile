var BwCrypto = require("nativescript-bw-crypto").BwCrypto;
var bwCrypto = new BwCrypto();

describe("greet function", function() {
    it("exists", function() {
        expect(bwCrypto.greet).toBeDefined();
    });

    it("returns a string", function() {
        expect(bwCrypto.greet()).toEqual("Hello, NS");
    });
});