var File = require('file').Path;

/**
 * This class implements the JavaScript parser.
 *
 * It is based on the Java Class org.mozilla.javascript.Parser form rhino.
 * 
 * @class This class implements jsavascript parser.
 * @see TokenStream
 * @author Irakli Gozalishvili
 */
function Parser() {
    RhinoParser = org.mozilla.javascript.Parser;
    this._parser = new RhinoParser();
};
Parser.prototype = {
    /**
     * @type org.mozilla.javascript.Parser
     */
    _parser: null,
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
        this._parser.parse(source, uri, lineno)
    }
};
exports.Parser = Parser;
