/**
 * @module
 * @requires ast
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 */

/**
 * @imports
 */
var File = require('file').Path
    AstRoot = require('jsdocs/ast').AstRoot;

/**
 * shortcuts
 */
var JParser = org.mozilla.javascript.Parser;
var JCompilerEnvirons = org.mozilla.javascript.CompilerEnvirons;
var JErrorReporter = org.mozilla.javascript.ErrorReporter;
var JEvaluatorException = org.mozilla.javascript.EvaluatorException;

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
    /**
     * Implementing java interface {@code org.mozilla.javascript.ErrorReporter}
     */
    var errorReporter = new JErrorReporter({
        /**
         * Reports a warning.
         * @param {java.lang.String} message        warning description
         * @param {java.lang.String} sourceName     JavaScript source description
         * where the warning occured; typically a filename or URL
         * @param {java.Int} line                   line number associated with
         * the warning
         * @param {java.lang.String} lineSource     the text of the line
         * @param {java.Int} lineOffset             the offset into lineSource
         * where problem was detected
         */
        warning: function(message, sourceName, line, lineSource, lineOffset) {
            warnings.push({
                message: message,
                sourceName: sourceName,
                line: line,
                lineSource: lineSource,
                lineOffset: lineOffset
            });
        },
        /**
         * Reports an error.
         * @param {java.lang.String} message        warning description
         * @param {java.lang.String} source         JavaScript source description
         * where the warning occured; typically a filename or URL
         * @param {java.Int} line                   line number associated with
         * the warning
         * @param {java.lang.String} lineSource     the text of the line
         * @param {java.Int} cffset             the offset into lineSource
         * where problem was detected
         */
        error: function(message, sourceName, line, lineSource, lineOffset) {
            errors.push({
                message: message,
                sourceName: sourceName,
                line: line,
                lineSource: lineSource,
                lineOffset: lineOffset
            });
        },
        /**
         * Creates an EvaluatorException that will be thrown by Parser.
         * runtimeErrors, unlike errors, will always terminate the current
         * script.
         * @param {java.lang.String} message        warning description
         * @param {java.lang.String} sourceName     JavaScript source description
         * where the warning occured; typically a filename or URL
         * @param {java.Int} line                   line number associated with
         * the warning
         * @param {java.lang.String} lineSource     the text of the line
         * @param {java.Int} lineOffset             the offset into lineSource
         * where problem was detected
         * @returns org.mozilla.javascript.EvaluatorException
         */
        runtimeError: function(message, sourceName, line, lineSource, lineOffset) {
            return new JEvaluatorException(message + ' : ' +
                lineSource +  ': line ' + line + '  at ' + lineOffset);
        }
    });
    this._parser = new JParser(new JCompilerEnvirons(), errorReporter);
};
Parser.prototype = {
    /**
     * @type org.mozilla.javascript.Parser
     */
    _parser: null,
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
            return new AstRoot(this._parser.parse(source, uri, lineno));
        } catch(e) {
            throw new Error(new String(e.message));
        }
    }
};
exports.Parser = Parser;
