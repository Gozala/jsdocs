var assert = require("test/assert");

exports["test:TokenReader.prototype.read_numb"] = function() {
    var TokenReader = require("jsdocs/token-reader").TokenReader;
    var TextStream = require("jsdocs/text-stream").TextStream;
    var src = "function foo(num){while (num+8.0 >= 0x20 && num < 0777){}}";
    var tr = new TokenReader();
    var tokens = tr.tokenize(new TextStream(src));

    var hexToken, octToken, decToken;
    for (var i = 0; i < tokens.length; i++) {
            if (tokens[i].name == "HEX_DEC") hexToken = tokens[i];
            if (tokens[i].name == "OCTAL") octToken = tokens[i];
            if (tokens[i].name == "DECIMAL") decToken = tokens[i];
    }

    assert.eq(decToken.data, "8.0", "decimal number is found in source.");
    assert.eq(hexToken.data, "0x20", "hexdec number is found in source (issue #99).");
    assert.eq(octToken.data, "0777", "octal number is found in source.");

}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));