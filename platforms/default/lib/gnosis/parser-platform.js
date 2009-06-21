/**
 * @module
 * @requires ast
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 */

/**
 * @imports
 */
var File = require('file').Path
    AstRoot = require('./ast-platform').AstRoot;

/**
 * This class implements the JavaScript parser.
 *
 * It is based on the Java Class org.mozilla.javascript.Parser form rhino.
 * 
 * @class This class implements jsavascript parser.
 * @see TokenStream
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 */
function Parser() {
    var errors = this.errors = [];
    var warnings = this.warnings = [];
};
Parser.prototype = {
    /**
     *
     */
    errors: null,
    /**
     *
     */
    warnings: null,
    /*
     * Build a parse tree from the given source.
     *
     * @param {String|File} source          Source or File to be parsed
     * @param {String} [uri='anonymus']     URI of the source file
     * @param {Number} [lino=0]             Number of lines to parse.
     * @return an Object representing the parsed source. If the parse fails,
     * null will be returned.  (The parse failure will result in a call to
     * the ErrorReporter from CompilerEnvirons.)
     */
    parse: function(source, uri, lineno) {
        if (source.read) source = source.read().toString();
        uri = uri || 'anonymus';
        lineno = lineno || 0;
        try {
            // Abstaract syntaxt tree
            var ast = {
                get getSourceName() {
                    return uri
                },
                nodes: [],
                commentNodes: [],
                toSource: function() {
                    return source;
                }
            };
            return new AstRoot(ast);
        } catch(e) {
            throw new Error(new String(e.message));
        }
    }
};
exports.Parser = Parser;
