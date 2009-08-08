/**
 * @module
 * @requires file, ast-platform
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 */

/**
 * imports
 */
var File = require("file").Path
    AstRoot = require("./ast-platform").AstRoot;

/**
 * shortcuts
 */
var JParser = org.mozilla.javascript.Parser,
    JCompilerEnvirons = org.mozilla.javascript.CompilerEnvirons,
    JErrorReporter = org.mozilla.javascript.ErrorReporter,
    JEvaluatorException = org.mozilla.javascript.EvaluatorException;

/**
 * Builds an abstarct syntaxt tree from the given source.
 * It is based on the Java Class org.mozilla.javascript.Parser form rhino.
 * If the parse fails, null will be returned.
 * (The parse failure will be available in optional errors param.)
 * @author Irakli Gozalishvili <rfobic@gmail.com>
 * @param {String|File} source          Source or File to be parsed
 * @param {String} [uri='anonymus']     URI of the source file
 * @param {Number} [lino=0]             Number of lines to parse.
 * @returns {
 *      @type {AstRoot} ast             abstarcat syntaxt tree of the source.
 *      @type {[{
 *          @type {String} message      message string
 *          @type {String} sourceName   source
 *          @type {Number} line         line number
 *          @type {String} lineSource
 *          @type {String} lineOffset
 *      }]} warnings                    parse warnings
 *      @type {[{
 *          @type {String} message      message string
 *          @type {String} sourceName   source
 *          @type {Number} line         line number
 *          @type {String} lineSource
 *          @type {String} lineOffset
 *      }]} errors                      parse warnings
 * }
 */
function parse(source, uri, lineno, warnings, errors) {
    source = (source.read ? source.read() : source).toString();
    uri = (uri || (source.read ? source : 'anonymus')).toString();
    lineno = lineno || 0;

    warnings = warnings|| [];
    errors = errors || [];

    var compilerEnv = new JCompilerEnvirons();
    compilerEnv.setRecordingComments(true);
    compilerEnv.setRecordingLocalJsDocComments(true);

    /**
     * Implementing java interface {@code org.mozilla.javascript.ErrorReporter}
     */
    errorReporter = new JErrorReporter({
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

    try {
        var ast = new JParser(compilerEnv, errorReporter).parse(source, uri, lineno);
        return {
            ast: new AstRoot(ast),
            warnings: warnings,
            errors: errors
        };
    } catch(e) {
        throw new Error(new String(e.message));
    }
}

exports.parse = parse;
