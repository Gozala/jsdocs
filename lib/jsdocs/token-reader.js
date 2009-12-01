var Token = require("./token").Token;
var Lang = require("./lang");
/**
        @class Search a {@link TextStream} for language tokens.
*/
var TokenReader = exports.TokenReader = function TokenReader() {
    this.keepDocs = true;
    this.keepWhite = false;
    this.keepComments = false;
};
TokenReader.prototype = {
    constructor: TokenReader,
    /**
        @type {Token[]}
    */
    tokenize: function(/**TextStream*/stream) {
        var tokens = [];
        /**@ignore*/ tokens.last    = function() { return tokens[tokens.length-1]; };
        /**@ignore*/ tokens.lastSym = function() {
            for (var i = tokens.length-1; i >= 0; i--) {
                if (!(tokens[i].is("WHIT") || tokens[i].is("COMM"))) return tokens[i];
            }
        }

        while (!stream.look().eof) {
            if (this.read_mlcomment(stream, tokens)) continue;
            if (this.read_slcomment(stream, tokens)) continue;
            if (this.read_dbquote(stream, tokens))   continue;
            if (this.read_snquote(stream, tokens))   continue;
            if (this.read_regx(stream, tokens))      continue;
            if (this.read_numb(stream, tokens))      continue;
            if (this.read_punc(stream, tokens))      continue;
            if (this.read_newline(stream, tokens))   continue;
            if (this.read_space(stream, tokens))     continue;
            if (this.read_word(stream, tokens))      continue;

            // if execution reaches here then an error has happened
            tokens.push(new Token(stream.next(), "TOKN", "UNKNOWN_TOKEN"));
        }
        return tokens;
    },

    /**
        @returns {Boolean} Was the token found?
    */
    read_word: function(/**TokenStream*/stream, tokens) {
        var found = "";
        while (!stream.look().eof && Lang.isWordChar(stream.look())) {
            found += stream.next();
        }

        if (found === "") {
            return false;
        }
        else {
            var name;
            if ((name = Lang.keyword(found))) tokens.push(new Token(found, "KEYW", name));
            else tokens.push(new Token(found, "NAME", "NAME"));
            return true;
        }
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_punc: function(/**TokenStream*/stream, tokens) {
        var found = "";
        var name;
        while (!stream.look().eof && Lang.punc(found+stream.look())) {
            found += stream.next();
        }

        if (found === "") {
            return false;
        }
        else {
            tokens.push(new Token(found, "PUNC", Lang.punc(found)));
            return true;
        }
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_space: function(/**TokenStream*/stream, tokens) {
        var found = "";

        while (!stream.look().eof && Lang.isSpace(stream.look())) {
            found += stream.next();
        }

        if (found === "") {
            return false;
        }
        else {
            if (this.collapseWhite) found = " ";
            if (this.keepWhite) tokens.push(new Token(found, "WHIT", "SPACE"));
            return true;
        }
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_newline: function(/**TokenStream*/stream, tokens) {
        var found = "";

        while (!stream.look().eof && Lang.isNewline(stream.look())) {
            found += stream.next();
        }

        if (found === "") {
            return false;
        }
        else {
                if (this.collapseWhite) found = "\n";
                if (this.keepWhite) tokens.push(new Token(found, "WHIT", "NEWLINE"));
                return true;
        }
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_mlcomment: function(/**TokenStream*/stream, tokens) {
        if (stream.look() == "/" && stream.look(1) == "*") {
                var found = stream.next(2);

                while (!stream.look().eof && !(stream.look(-1) == "/" && stream.look(-2) == "*")) {
                        found += stream.next();
                }

                // to start doclet we allow /** or /*** but not /**/ or /****
                if (/^\/\*\*([^\/]|\*[^*])/.test(found) && this.keepDocs) tokens.push(new Token(found, "COMM", "JSDOC"));
                else if (this.keepComments) tokens.push(new Token(found, "COMM", "MULTI_LINE_COMM"));
                return true;
        }
        return false;
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_slcomment: function(/**TokenStream*/stream, tokens) {
        var found;
        if (
                (stream.look() == "/" && stream.look(1) == "/" && (found=stream.next(2)))
                ||
                (stream.look() == "<" && stream.look(1) == "!" && stream.look(2) == "-" && stream.look(3) == "-" && (found=stream.next(4)))
        ) {

                while (!stream.look().eof && !Lang.isNewline(stream.look())) {
                        found += stream.next();
                }

                if (this.keepComments) {
                        tokens.push(new Token(found, "COMM", "SINGLE_LINE_COMM"));
                }
                return true;
        }
        return false;
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_dbquote: function(/**TokenStream*/stream, tokens) {
        if (stream.look() == "\"") {
                // find terminator
                var string = stream.next();

                while (!stream.look().eof) {
                        if (stream.look() == "\\") {
                                if (Lang.isNewline(stream.look(1))) {
                                        do {
                                                stream.next();
                                        } while (!stream.look().eof && Lang.isNewline(stream.look()));
                                        string += "\\\n";
                                }
                                else {
                                        string += stream.next(2);
                                }
                        }
                        else if (stream.look() == "\"") {
                                string += stream.next();
                                tokens.push(new Token(string, "STRN", "DOUBLE_QUOTE"));
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
        @returns {Boolean} Was the token found?
    */
    read_snquote: function(/**TokenStream*/stream, tokens) {
        if (stream.look() == "'") {
                // find terminator
                var string = stream.next();

                while (!stream.look().eof) {
                        if (stream.look() == "\\") { // escape sequence
                                string += stream.next(2);
                        }
                        else if (stream.look() == "'") {
                                string += stream.next();
                                tokens.push(new Token(string, "STRN", "SINGLE_QUOTE"));
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
        @returns {Boolean} Was the token found?
    */
    read_numb: function(/**TokenStream*/stream, tokens) {
        if (stream.look() === "0" && stream.look(1) == "x") {
                return this.read_hex(stream, tokens);
        }

        var found = "";

        while (!stream.look().eof && Lang.isNumber(found+stream.look())){
                found += stream.next();
        }

        if (found === "") {
                return false;
        }
        else {
                if (/^0[0-7]/.test(found)) tokens.push(new Token(found, "NUMB", "OCTAL"));
                else tokens.push(new Token(found, "NUMB", "DECIMAL"));
                return true;
        }
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_hex: function(/**TokenStream*/stream, tokens) {
        var found = stream.next(2);

        while (!stream.look().eof) {
                if (Lang.isHexDec(found) && !Lang.isHexDec(found+stream.look())) { // done
                        tokens.push(new Token(found, "NUMB", "HEX_DEC"));
                        return true;
                }
                else {
                        found += stream.next();
                }
        }
        return false;
    },
    /**
        @returns {Boolean} Was the token found?
    */
    read_regx: function(/**TokenStream*/stream, tokens) {
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

                                tokens.push(new Token(regex, "REGX", "REGX"));
                                return true;
                        }
                        else {
                                regex += stream.next();
                        }
                }
                // error: unterminated regex
        }
        return false;
    }
};

