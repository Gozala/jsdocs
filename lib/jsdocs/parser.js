
var Walker = require("./walker").Walker;
var Symbol = require("./symbol").Symbol;
var SymbolSet = require("./symbol-set").SymbolSet;
var DocComment = require("./doc-comment").DocComment;
var console = require("system").log;
/**
    @namespace
    @requires Walker
    @requires Symbol
    @requires DocComment
*/
var Parser = exports.Parser = function Parser(options) {
    if (!(this instanceof Parser)) return new Parser(options);
    for (var key in options) this[key] = options[key];
    this.symbols = new SymbolSet(this);
    this.walker = new Walker(this);
};
Parser.prototype = {
    constructor: Parser,
    /**
     * Identify secure modules while parseing source code
     * @type {Boolean}
     */
    securemodules: true,
    /**
     * If true will include all functions, even anonymus ones.
     * @type {Boolean}
     */
    ignoreAnonymous: true,
    /**
     * Treat properties starting with underscore as privates.
     * @type {Boolean}
     */
    treatUnderscoredAsPrivate: true,
    /**
     * Include symbols tagged as private, underscored and inner symbols.
     * @type {Boolean}
     */
    includePrivates: true,
    /**
     * Dump detail on found symbols
     * @type {Boolean}
     */
    explain: false,
    /**
     * Include all functions, even undocumented ones.
     * @type {Boolean}
     */
    allfunctions: false,
    /**
     * Ignore all code, only document comments with @name tags.
     * @type {Boolean}
     */
    ignoreCode: false,
    addSymbol: function addSymbol(symbol) {
        var rename = this.rename;
        if (rename) {
            for (var name in rename) {
                if (symbol.alias.indexOf(name) == 0) {
                    if (symbol.name == symbol.alias) {
                        symbol.name = symbol.name.replace(name, rename[name]);
                    }
                    symbol.alias = symbol.alias.replace(name, rename[name]);
                }
            }
        }
        if (this.securemodules) {
            if (typeof this.secureModules == "undefined") this.secureModules = {};
            if (/^exports\./.test(symbol.alias)) {
                symbol.srcFile.match(/(^|[\\\/])([^\\\/]+)\.js/i);
                var fileNS = RegExp.$2;

                // need to create the namespace associated with this file first
                var module = this.secureModules[fileNS];
                if (!module) {
                    this.secureModules[fileNS] = 1;
                    var nsSymbol = new Symbol(fileNS, [], "GLOBAL", new DocComment(""));
                    nsSymbol.isNamespace = true;
                    nsSymbol.srcFile = "";
                    nsSymbol.isPrivate = false;
                    nsSymbol.srcFile = symbol.srcFile;
                    nsSymbol.desc = (this.symbols.getSymbol(symbol.srcFile) || {desc: ""}).desc;
                    this.addSymbol(nsSymbol);
                }

                symbol.alias = symbol.alias.replace(/^exports\./, fileNS + '.');
                symbol.name = symbol.name.replace(/^exports\./, '');
                symbol.memberOf = fileNS;
                symbol.isStatic = true;
            }
        }

        // if a symbol alias is documented more than once the last one with the user docs wins
        var symbols = this.symbols;
        if (symbols.hasSymbol(symbol.alias)) {
            var oldSymbol = symbols.getSymbol(symbol.alias);
            if (oldSymbol.comment.isUserComment) {
                if (symbol.comment.isUserComment) { // old and new are both documented
                    console.warn("The symbol '" + symbol.alias + "' is documented more than once.");
                } else { // old is documented but new isn't
                    return;
                }
            }
        }

        // we don't document anonymous things
        if (this.ignoreAnonymous && symbol.name.match(/\$anonymous\b/)) return;

        // uderscored things may be treated as if they were marked private, this cascades
        if (this.treatUnderscoredAsPrivate && symbol.name.match(/[.#-]_[^.#-]+$/)) {
            if (!symbol.comment.getTag("public").length > 0) symbol.isPrivate = true;
        }

        // -p flag is required to document private things
        if (!this.includePrivates && symbol.isPrivate) return; // issue #161 fixed by mcbain.asm

        // ignored things are not documented, this doesn't cascade
        if (symbol.isIgnored) return;
        symbols.addSymbol(symbol);
    },
    addBuiltin: function addBuiltin(name) {
        var builtin = new Symbol(name, [], "CONSTRUCTOR", new DocComment(""));
        builtin.isNamespace = true;
        builtin.srcFile = "";
        builtin.isPrivate = false;
        this.addSymbol(builtin);
        return builtin;
    },
    finish: function finish() {
        var symbolsSet = this.symbols;
        symbolsSet.relate();

        // make a litle report about what was found
        if (this.explain) {
            var symbols = symbolsSet.toArray();
            var srcFile = "";
            for (var i = 0, l = symbols.length; i < l; i++) {
                var symbol = symbols[i];
                if (srcFile != symbol.srcFile) {
                    srcFile = symbol.srcFile;
                    print("\n"+srcFile+"\n-------------------");
                }
                print(i+":\n  alias => "+symbol.alias + "\n  name => "+symbol.name+ "\n  isa => "+symbol.isa + "\n  memberOf => " + symbol.memberOf + "\n  isStatic => " + symbol.isStatic + ",  isInner => " + symbol.isInner+ ",  isPrivate => " + symbol.isPrivate);
            }
            print("-------------------\n");
        }
    },
    /**
     * Parses specified source. Optionally specidies source uri.
     */
    parse: function pase(/**TokenStream*/ts, /**String*/srcPath) {
        var symbols = this.symbols;
        // TODO: Check why we need to add this to the calsses
        Symbol.srcFile = (srcPath || "");
        DocComment.shared = ""; // shared comments don't cross file boundaries

        this.walker.walk(ts); // adds to our symbols

        // filter symbols by option
        for (var p = symbols._index.first(); p; p = symbols._index.next()) {
            var symbol = p.value;
            if (!symbol) continue;
            if (symbol.is("FILE") || symbol.is("GLOBAL")) {
                continue;
            }
            else if (!this.allfunctions && !symbol.comment.isUserComment) {
                symbols.deleteSymbol(symbol.alias);
            }
            if (/#$/.test(symbol.alias)) { // we don't document prototypes
                symbols.deleteSymbol(symbol.alias);
            }
        }
        return symbols.toArray();
    }
};

