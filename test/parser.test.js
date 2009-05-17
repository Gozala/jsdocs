print(require.fileName);
exports.RhinoParserTests = {
    'test parseing from string': function() {
        var Parser = require('jsdocs/parser').Parser;
        var parser = new Parser();
        var testFunction = 'var foo = function foo(bar) {\n\
                                return "hello " + bar; \n\
                            };';
        var ast = parser.parse(testFunction);
    },
    'test parseing from file': function() {
        var Parser = require('jsdocs/parser').Parser;
        var parser = new Parser();
        var testFunction = 'var foo = function foo(bar) {\n\
                                return "hello " + bar; \n\
                            };';
        var ast = parser.parse(testFunction);
    }

};
