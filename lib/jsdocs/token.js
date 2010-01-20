var Lang = require("./lang");

/**
    @constructor
*/
var Token = exports.Token = function Token(data, type, name) {
        this.data = data;
        this.type = type;
        this.name = name;
};
Token.prototype = {
    constructor: Token,
    toString: function() {
        return "<"+this.type+" name=\""+this.name+"\">"+this.data+"</"+this.type+">";
    },
    is: function(what) {
        return this.name === what || this.type === what;
    }
};

/**
    @constructor
    @private
*/
function VoidToken(/**String*/type) {
    this.toString = function() { return "<VOID type=\""+type+"\">" };
    this.is = function() { return false; }
}


/**
    @constructor
*/
var TokenStream = exports.TokenStream = function TokenStream(tokens) {
    this.tokens = tokens || [];
    this.rewind();
}
TokenStream.prototype = {
    constructor: TokenStream,
    rewind: function rewind() {
        this.cursor = -1;
    },
    /**
     @returns {Token}
     */
    look: function look(/**Number*/n, /**Boolean*/considerWhitespace) {
        if (typeof n == "undefined") n = 0;

        if (considerWhitespace == true) {
            if (this.cursor+n < 0 || this.cursor+n > this.tokens.length) return {};
            return this.tokens[this.cursor+n];
        }
        else {
            var count = 0;
            var i = this.cursor;

            while (true) {
                if (i < 0) return new Token("", "VOID", "START_OF_STREAM");
                else if (i > this.tokens.length) return new Token("", "VOID", "END_OF_STREAM");

                if (i != this.cursor && (this.tokens[i] === undefined || this.tokens[i].is("WHIT"))) {
                    if (n < 0) i--; else i++;
                    continue;
                }

                if (count == Math.abs(n)) {
                    return this.tokens[i];
                }
                count++;
                (n < 0)? i-- : i++;
            }

            return new Token("", "VOID", "STREAM_ERROR"); // because null isn't an object and caller always expects an object
        }
    },
    /**
     @type Token|Token[]
     */
    next: function next(/**Number*/howMany) {
        if (typeof howMany == "undefined") howMany = 1;
        if (howMany < 1) return null;
        var got = [];

        for (var i = 1; i <= howMany; i++) {
            if (this.cursor+i >= this.tokens.length) {
                return null;
            }
            got.push(this.tokens[this.cursor+i]);
        }
        this.cursor += howMany;

        if (howMany == 1) {
            return got[0];
        }
        else return got;
    },
    /**
        @type Token[]
    */
    balance: function balance(/**String*/start, /**String*/stop) {
        if (!stop) stop = Lang.matching(start);

        var depth = 0;
        var got = [];
        var started = false;

        while ((token = this.look())) {
            if (token.is(start)) {
                depth++;
                started = true;
            }

            if (started) {
                got.push(token);
            }

            if (token.is(stop)) {
                depth--;
                if (depth == 0) return got;
            }
            if (!this.next()) break;
        }
    },
    getMatchingToken: function getMatchingToken(/**String*/start, /**String*/stop) {
        var depth = 0;
        var cursor = this.cursor;

        if (!start) {
            start = Lang.matching(stop);
            depth = 1;
        }
        if (!stop) stop = Lang.matching(start);

        while ((token = this.tokens[cursor])) {
            if (token.is(start)) {
                depth++;
            }

            if (token.is(stop) && cursor) {
                depth--;
                if (depth == 0) return this.tokens[cursor];
            }
            cursor++;
        }
    },
    insertAhead: function insertAhead(/**Token*/token) {
        this.tokens.splice(this.cursor+1, 0, token);
    }
};