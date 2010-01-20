var Lang = require("./lang");
var DocComment = require("./doc-comment").DocComment;
var Symbol = require("./symbol").Symbol;
var Hash = require("./frame/hash.js").Hash;
var console = require("system").log;

/** @constructor */
var SymbolSet = exports.SymbolSet = function SymbolSet(parser) {
    this.parser = parser;
    this.init();
};
SymbolSet.prototype = {
    constructor: SymbolSet,
    init: function init() {
        this._index = new Hash();
    },
    keys: function keys() {
        return this._index.keys();
    },
    hasSymbol: function hasSymbol(alias) {
        return this._index.hasKey(alias);
    },
    addSymbol: function addSymbol(symbol) {
        if (this.hasSymbol(symbol.alias)) {
            console.warn("Overwriting symbol documentation for: "+symbol.alias + ".");
        }
        this._index.set(symbol.alias, symbol);
    },
    getSymbol: function getSymbol(alias) {
        if (this.hasSymbol(alias)) return this._index.get(alias);
    },
    getSymbolByName: function getSymbolByName(name) {
        for (var p = this._index.first(); p; p = this._index.next()) {
            var symbol = p.value;
            if (symbol.name == name) return symbol;
        }
    },
    toArray: function toArray() {
        return this._index.values();
    },
    deleteSymbol: function deleteSymbol(alias) {
        if (!this.hasSymbol(alias)) return;
        this._index.drop(alias);
    },
    renameSymbol: function renameSymbol(oldName, newName) {
        // todo: should check if oldname or newname already exist
        this._index.replace(oldName, newName);
        this._index.get(newName).alias = newName;
        return newName;
    },
    relate: function relate() {
        this.resolveBorrows();
        this.resolveMemberOf();
        this.resolveAugments();
    },
    resolveBorrows: function resolveBorrows() {
        for (var p = this._index.first(); p; p = this._index.next()) {
            var symbol = p.value;
            if (symbol.is("FILE") || symbol.is("GLOBAL")) continue;

            var borrows = symbol.inherits;
            for (var i = 0; i < borrows.length; i++) {
                if (/#$/.test(borrows[i].alias)) {
                    console.warn("Attempted to borrow entire instance of "+borrows[i].alias+" but that feature is not yet implemented.");
                    return;
                }
                var borrowed = this.getSymbol(borrows[i].alias);

                if (!borrowed) {
                    console.warn("Can't borrow undocumented "+borrows[i].alias+".");
                    continue;
                }

                if (borrows[i].as == borrowed.alias) {
                    var assumedName = borrowed.name.split(/([#.-])/).pop();
                    borrows[i].as = symbol.name+RegExp.$1+assumedName;
                    console.info("Assuming borrowed as name is "+borrows[i].as+" but that feature is experimental.");
                }

                var borrowAsName = borrows[i].as;
                var borrowAsAlias = borrowAsName;
                if (!borrowAsName) {
                    console.warn("Malformed @borrow, 'as' is required.");
                    continue;
                }

                if (borrowAsName.length > symbol.alias.length && borrowAsName.indexOf(symbol.alias) == 0) {
                    borrowAsName = borrowAsName.replace(borrowed.alias, "")
                } else {
                    var joiner = "";
                    if (borrowAsName.charAt(0) != "#") joiner = ".";
                    borrowAsAlias = borrowed.alias + joiner + borrowAsName;
                }

                borrowAsName = borrowAsName.replace(/^[#.]/, "");

                if (this.hasSymbol(borrowAsAlias)) continue;

                var clone = borrowed.clone();
                clone.name = borrowAsName;
                clone.alias = borrowAsAlias;
                this.addSymbol(clone);
            }
        }
    },
    resolveMemberOf: function resolveMemberOf() {
        for (var p = this._index.first(); p; p = this._index.next()) {
            var symbol = p.value;

            if (symbol.is("FILE") || symbol.is("GLOBAL")) continue;

            // the memberOf value was provided in the @memberOf tag
            else if (symbol.memberOf) {
                // like foo.bar is a memberOf foo
                if (symbol.alias.indexOf(symbol.memberOf) == 0) {
                    var memberMatch = new RegExp("^("+symbol.memberOf+")[.#-]?(.+)$");
                    var aliasParts = symbol.alias.match(memberMatch);

                    if (aliasParts) {
                        symbol.memberOf = aliasParts[1];
                        symbol.name = aliasParts[2];
                    }

                    var nameParts = symbol.name.match(memberMatch);

                    if (nameParts) {
                        symbol.name = nameParts[2];
                    }
                }
                // like bar is a memberOf foo
                else {
                    var joiner = symbol.memberOf.charAt(symbol.memberOf.length-1);
                    if (!/[.#-]/.test(joiner)) symbol.memberOf += ".";
                    this.renameSymbol(symbol.alias, symbol.memberOf + symbol.name);
                }
            }
            // the memberOf must be calculated
            else {
                var parts = symbol.alias.match(/^(.*[.#-])([^.#-]+)$/);

                if (parts) {
                    symbol.memberOf = parts[1];
                    symbol.name = parts[2];
                }
            }

            // set isStatic, isInner
            if (symbol.memberOf) {
                switch (symbol.memberOf.charAt(symbol.memberOf.length-1)) {
                    case '#' :
                        symbol.isStatic = false;
                        symbol.isInner = false;
                    break;
                    case '.' :
                        symbol.isStatic = true;
                        symbol.isInner = false;
                    break;
                    case '-' :
                        symbol.isStatic = false;
                        symbol.isInner = true;
                    break;
                    default: // memberOf ends in none of the above
                        symbol.isStatic = true;
                    break;
                }
            }

            // unowned methods and fields belong to the global object
            if (!symbol.is("CONSTRUCTOR") && !symbol.isNamespace && symbol.memberOf == "") {
                symbol.memberOf = "_global_";
            }

            // clean up
            if (symbol.memberOf.match(/[.#-]$/)) {
                symbol.memberOf = symbol.memberOf.substr(0, symbol.memberOf.length-1);
            }
            // add to parent's methods or properties list
            if (symbol.memberOf) {

                var container = this.getSymbol(symbol.memberOf);
                if (!container) {
                    // TODO: GEt rid of Parser
                    if (Lang.isBuiltin(symbol.memberOf)) container = this.parser.addBuiltin(symbol.memberOf);
                    else {
                        console.warn("Trying to document "+symbol.name +" as a member of undocumented symbol "+symbol.memberOf+".");
                    }
                }

                if (container) container.addMember(symbol);
            }
        }
    },
    resolveAugments: function resolveAugments() {
        for (var p = this._index.first(); p; p = this._index.next()) {
            var symbol = p.value;

            if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
            this.walk.apply(this, [symbol]);
        }
    },
    walk: function walk(symbol) {
        var augments = symbol.augments;
        for(var i = 0; i < augments.length; i++) {
            var contributer = this.getSymbol(augments[i]);
            if (!contributer && Lang.isBuiltin(''+augments[i])) {
                contributer = new Symbol("_global_."+augments[i], [], augments[i], new DocComment("Built in."));
                contributer.isNamespace = true;
                contributer.srcFile = "";
                contributer.isPrivate = false;
                // TODO: get read of the parser
                this.parser.addSymbol(contributer);
            }

            if (contributer) {
                if (contributer.augments.length) {
                    this.walk.apply(this, [contributer]);
                }

                symbol.inheritsFrom.push(contributer.alias);
                //if (!isUnique(symbol.inheritsFrom)) {
                //    console.warn("Can't resolve augments: Circular reference: "+symbol.alias+" inherits from "+contributer.alias+" more than once.");
                //}
                //else {
                    var cmethods = contributer.methods;
                    var cproperties = contributer.properties;

                    for (var ci = 0, cl = cmethods.length; ci < cl; ci++) {
                        if (!cmethods[ci].isStatic) symbol.inherit(cmethods[ci]);
                    }
                    for (var ci = 0, cl = cproperties.length; ci < cl; ci++) {
                        if (!cproperties[ci].isStatic) symbol.inherit(cproperties[ci]);
                    }
                //}
            }
            else console.warn("Can't augment contributer: "+augments[i]+", not found.");
        }
    }
};