var Parser = require('jsdocs/parser').Parser,
    AstRoot = require('jsdocs/ast').AstRoot,
    AstNode = require('jsdocs/ast').AstNode,
    packages = require('packages').packages,
    File = require('file').Path;
    
jsUnity.attachAssertions();
exports.RhinoParserTests = {
    setUp: function() {},
    tearDown: function() {},
    'test - parseing string and testing ast': function() {
        var parser = new Parser();
        var testFunction = 'var foo = function foo(bar) {\n\
                                return "hello " + bar; \n\
                            }';
        var ast = parser.parse(testFunction);
        assertInstanceOf(AstRoot, ast);
        assertTrue(ast.nodes.length > 0);
        assertEqual(0, ast.commentNodes.length);
        assertEqual(0, parser.errors.length);
        assertEqual(0, parser.warnings.length);
    },
    'test - parseing string with errror' : function() {
        var parser = new Parser();
        var testFunction = 'var foo = function foo(bar) \n\
                                return "hello " + bar; \n\
                            }';
        var err;
        try {
            var ast = parser.parse(testFunction);
        } catch(e) {
            err = e;
        }
        assertUndefined(ast);
        assertTrue(parser.errors.length > 0);
        assertEqual(0, parser.warnings.length);
    },
    'test - parseing from file': function() {
        var parser = new Parser();
        testFile = (new File(packages.JSDocs.js.toString())).join('jsdocs/jsdocs.js');
        var testFunction = testFile.read().toString();
        var ast = parser.parse(testFunction);
        assertEqual(0, parser.errors.length);
        assertEqual(0, parser.warnings.length);
        assertInstanceOf(AstRoot, ast);
        assertInstanceOf(AstRoot, ast);
        assertTrue(ast.nodes.length > 0);
    },
    'test - ast node tests': function() {
        var parser = new Parser();
        var testFunction = 'var foo = { \n\
                                bar: function(arg) { \n\
                                    return "hello " + arg; \n\
                                }, \n\
                                get getter() {\n\
                                    return "hellow getter";\n\
                                },\n\
                                set setter(value) {\n\
                                    //nothing \n\
                                }\n\
                            }';
        var ast = parser.parse(testFunction);
        assertInstanceOf(AstRoot, ast);
        assertTrue(ast.nodes.length > 0);
        assertEqual(0, ast.commentNodes.length);
        assertEqual(0, parser.errors.length);
        assertEqual(0, parser.warnings.length);
        assertInstanceOf(AstNode, ast.nodes[0]);
    }
};
exports.debug = {
    getAst: function() {
        Parser = require('jsdocs/parser').Parser;
        AstRoot = require('jsdocs/ast').AstRoot;
        packages = require('packages').packages;
        File = require('file').Path;
        var parser = new Parser();
        testFile = (new File(packages.JSDocs.js.toString())).join('jsdocs/jsdocs.js');
        var testFunction = testFile.read().toString();
        var ast = parser.parse(testFunction);
    }
}