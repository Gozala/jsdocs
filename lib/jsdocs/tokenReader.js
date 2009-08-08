/**
 * Extended Array of token instances.
 * @class
 * @extends Array
 */
function TokenList() {}
TokenList.prototype = {
    /**
     * Retruns last token from this list.
     * return Token
     */
    last: function() {
        return this[this.length - 1]
    },
    /**
     * Returns last whitespace or comment token from this list.
     * @returns Token
     */
    lastSym: function() {
        for (var i = this.length - 1; i >= 0; i--) {
            if (!(this[i].is('WHIT') || this[i].is('COMM')))
                return tokens[i];
        }
        return null;
    }
};
TokenList.prototype.__proto__ = Array.prototype;


/**
 * @class Search a {@link JSDOC.TextStream} for language tokens.
 * @requires {Token|Lang}
 */
function TokenReader() {
    this.keepDocs = true;
    this.keepWhite = false;
    this.keepComments = false;
};
JSDOC.TokenReader.prototype = {
    /**
     * Reads stream while it reaches eof and returns list of found tokens.
     * @param {TextStream} straem
     * @returns {TokenList}             List of found tokens
     */
    tokenize: function(stream) {
        var tokens = new TokenList();
        while (!stream.look().eof) {
            if (this.read_mlcomment(stream, tokens)) continue;
            if (this.read_slcomment(stream, tokens)) continue;
            if (this.read_dbquote(stream, tokens))   continue;
            if (this.read_snquote(stream, tokens))   continue;
            if (this.read_regx(stream, tokens))      continue;
            if (this.read_xml(stream, tokens))       continue;
            if (this.read_numb(stream, tokens))      continue;
            if (this.read_punc(stream, tokens))      continue;
            if (this.read_space(stream, tokens))     continue;
            if (this.read_newline(stream, tokens))   continue;
            if (this.read_word(stream, tokens))      continue;
            // if execution reaches here then an error has happened
            var unknownToken = stream.next();
            Log.warn('Unknown token was found : ' + unknownToken);
            tokens.push(new Token(unknownToken, "TOKN", "UNKNOWN_TOKEN"));
        }
        return tokens;
    },
    /**
     * Tries to read a word from the current cursor position in the given stream
     * Adds created token to the given tokens array and returns true if token
     * was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_word: function(stream, tokens) {
        var found = '';
        while (!stream.look().eof && Lang.isWordChar(stream.look())) {
            found += stream.next();
        }
        if (found === "") return false;
        else {
            var name = Lang.keyword(found);
            if (name) tokens.push(new Token(found, 'KEYW', name));
            else tokens.push(new Token(found, "NAME", "NAME"));
            return true;
        }
    },
    /**
     * Tries to read a punctuation token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_punc: function(stream, tokens) {
        var found = '';
        var name;
        while (!stream.look().eof && Lang.punc(found + stream.look())) {
            found += stream.next();
        }
        if (found === "") return false;
        else {
            tokens.push(new Token(found, 'PUNC', Lang.punc(found)));
            return true;
        }
    },
    /**
     * Tries to read a space token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_space: function(stream, tokens) {
        var found = "";
        
        while (!stream.look().eof && JSDOC.Lang.isSpace(stream.look())) {
            found += stream.next();
        }
        
        if (found === "") {
            return false;
        }
        else {
            if (this.collapseWhite) found = " ";
            if (this.keepWhite) tokens.push(new JSDOC.Token(found, "WHIT", "SPACE"));
            return true;
        }
    },
    /**
     * Tries to read a new line token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_newline: function(stream, tokens) {
        var found = "";
        
        while (!stream.look().eof && JSDOC.Lang.isNewline(stream.look())) {
            found += stream.next();
        }
        
        if (found === "") {
            return false;
        }
        else {
            if (this.collapseWhite) found = "\n";
            if (this.keepWhite) tokens.push(new JSDOC.Token(found, "WHIT", "NEWLINE"));
            return true;
        }
    },
    /**
     * Tries to read a multiline comment token from the current cursor position
     * in the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_mlcomment: function(stream, tokens) {
        if (stream.look() == "/" && stream.look(1) == "*") {
            var found = stream.next(2);
            
            while (!stream.look().eof && !(stream.look(-1) == "/" && stream.look(-2) == "*")) {
                found += stream.next();
            }
            
            // to start doclet we allow /** or /*** but not /**/ or /****
            if (/^\/\*\*([^\/]|\*[^*])/.test(found) && this.keepDocs) tokens.push(new JSDOC.Token(found, "COMM", "JSDOC"));
            else if (this.keepComments) tokens.push(new JSDOC.Token(found, "COMM", "MULTI_LINE_COMM"));
            return true;
        }
        return false;
    },
    /**
     * Tries to read a single line comment token from the current cursor
     * position in the given stream. Adds created token to the given tokens
     * array and returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_slcomment: function(stream, tokens) {
        var found;
        if (
            (stream.look() == "/" && stream.look(1) == "/" && (found=stream.next(2)))
            || 
            (stream.look() == "<" && stream.look(1) == "!" && stream.look(2) == "-" && stream.look(3) == "-" && (found=stream.next(4)))
        ) {
            
            while (!stream.look().eof && !JSDOC.Lang.isNewline(stream.look())) {
                found += stream.next();
            }
            
            if (this.keepComments) {
                tokens.push(new JSDOC.Token(found, "COMM", "SINGLE_LINE_COMM"));
            }
            return true;
        }
        return false;
    },
    /**
     * Tries to read a double quote token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_dbquote: function(stream, tokens) {
        if (stream.look() == "\"") {
            // find terminator
            var string = stream.next();
            
            while (!stream.look().eof) {
                if (stream.look() == "\\") {
                    if (JSDOC.Lang.isNewline(stream.look(1))) {
                        do {
                            stream.next();
                        } while (!stream.look().eof && JSDOC.Lang.isNewline(stream.look()));
                        string += "\\\n";
                    }
                    else {
                        string += stream.next(2);
                    }
                }
                else if (stream.look() == "\"") {
                    string += stream.next();
                    tokens.push(new JSDOC.Token(string, "STRN", "DOUBLE_QUOTE"));
                    return true;
                }
                else {
                    string += stream.next();
                }
            }
        }
        return false; // error! unterminated string
    },
    /**
     * Tries to read a single quote token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokeStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_snquote: function(stream, tokens) {
        if (stream.look() == "'") {
            // find terminator
            var string = stream.next();
            
            while (!stream.look().eof) {
                if (stream.look() == "\\") { // escape sequence
                    string += stream.next(2);
                }
                else if (stream.look() == "'") {
                    string += stream.next();
                    tokens.push(new JSDOC.Token(string, "STRN", "SINGLE_QUOTE"));
                    return true;
                }
                else {
                    string += stream.next();
                }
            }
        }
        return false; // error! unterminated string
    },
    /**
     * Tries to read a number token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_numb: function(stream, tokens) {
        if (stream.look() === "0" && stream.look(1) == "x") {
            return this.read_hex(stream, tokens);
        }
        
        var found = "";
        
        while (!stream.look().eof && JSDOC.Lang.isNumber(found+stream.look())){
            found += stream.next();
        }
        
        if (found === "") {
            return false;
        }
        else {
            if (/^0[0-7]/.test(found)) tokens.push(new JSDOC.Token(found, "NUMB", "OCTAL"));
            else tokens.push(new JSDOC.Token(found, "NUMB", "DECIMAL"));
            return true;
        }
    },
    /*t:
        requires("../lib/JSDOC/TextStream.js");
        requires("../lib/JSDOC/Token.js");
        requires("../lib/JSDOC/Lang.js");
        
        plan(3, "testing JSDOC.TokenReader.prototype.read_numb");
        
        //// setup
        var src = "function foo(num){while (num+8.0 >= 0x20 && num < 0777){}}";
        var tr = new JSDOC.TokenReader();
        var tokens = tr.tokenize(new JSDOC.TextStream(src));
        
        var hexToken, octToken, decToken;
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i].name == "HEX_DEC") hexToken = tokens[i];
            if (tokens[i].name == "OCTAL") octToken = tokens[i];
            if (tokens[i].name == "DECIMAL") decToken = tokens[i];
        }
        ////
        
        is(decToken.data, "8.0", "decimal number is found in source.");
        is(hexToken.data, "0x20", "hexdec number is found in source (issue #99).");
        is(octToken.data, "0777", "octal number is found in source.");
    */
    /**
     * Tries to read a hex token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_hex: function(stream, tokens) {
        var found = stream.next(2);
        
        while (!stream.look().eof) {
            if (JSDOC.Lang.isHexDec(found) && !JSDOC.Lang.isHexDec(found+stream.look())) { // done
                tokens.push(new JSDOC.Token(found, "NUMB", "HEX_DEC"));
                return true;
            }
            else {
                found += stream.next();
            }
        }
        return false;
    },
    /**
     * Tries to read a regular expression token from the current cursor
     * position in the given stream. Adds created token to the given tokens
     * array and returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_regx: function(stream, tokens) {
        var last;
        if (
            stream.look() == "/"
            && 
            (
                
                (
                    !(last = tokens.lastSym()) // there is no last, the regex is the first symbol
                    || 
                    (
                           !last.is("NUMB")
                        && !last.is("NAME")
                        && !last.is("RIGHT_PAREN")
                        && !last.is("RIGHT_BRACKET")
                    )
                )
            )
        ) {
            var regex = stream.next();
            
            while (!stream.look().eof) {
                if (stream.look() == "\\") { // escape sequence
                    regex += stream.next(2);
                }
                else if (stream.look() == "/") {
                    regex += stream.next();
                    
                    while (/[gmi]/.test(stream.look())) {
                        regex += stream.next();
                    }
                    
                    tokens.push(new JSDOC.Token(regex, "REGX", "REGX"));
                    return true;
                }
                else {
                    regex += stream.next();
                }
            }
            // error: unterminated regex
        }
        return false;
    },
    /**
     * Tries to read a double quote token from the current cursor position in
     * the given stream. Adds created token to the given tokens array and
     * returns true if token was found, returns flase if was not.
     * @param {TokenStream} stream
     * @param {Token[]} tokens
     * @returns {Boolean}       True if token was found.
     */
    read_xml: function(stream, tokens) {
        if (
            stream.look() == "<"
            && 
            (
                !tokens.last()
                ||
                (
                    !tokens.last().is("NUMB")
                    && !tokens.last().is("STRN")
                    && !tokens.last().is("REGX")
                    && !tokens.last().is("NAME")
                    && !tokens.last().is("RIGHT_PAREN")
                    && !tokens.last().is("RIGHT_BRACKET")
                )
            )
        ) {
            // find terminator
            var xml = stream.next();
            
            while (!stream.look().eof) {
                if (stream.look() == ">") {
                    xml += stream.next();
                    tokens.push(new JSDOC.Token(xml, "XML", "XML"));
                    return true;
                }
                else {
                    xml += stream.next();
                }
            }
            // error! unterminated xml tag
        }
        return false;
    }
};
/**
 * @tags module jsdocs/tokenReader
 */
exports.TokenReader = TokenReader;