var Opt = require('./frame/Opt').Opt,
    ChainNode = require('./frame/Chain').ChainNode,
    Chain = require('./frame/Chain').Chain,
    //Link = require('./frame/Link').Link,
    Hash = require('./frame/Hash').Hash,
    Namespace = require('./frame/Namespace').Namespace,
    defined = require('./frame').defined,
    copy = require('./frame').copy,
    isUnique = require('./frame').isUnique
    Log = system.log;
    
require('./frame/String');
/**
    @overview
    @date $Date$
    @version $Revision$ 
    @location $HeadURL$
    @name whateverFilename.js
 */

/**
    This is the main container for the JSDOC application.
    @namespace
*/
var JSDOC = exports.JSDOC = {};

/**
    @requires Opt
 */
arguments = [];
JSDOC.opt = Opt.get(arguments, 
    {
        d: "directory",
        c: "conf",
        t: "template",
        r: "recurse",
        x: "ext",
        p: "private",
        a: "allfunctions", 
        e: "encoding",
        n: "nocode",
        o: "out",
        s: "suppress",
        T: "testmode",
        h: "help",
        v: "verbose",
        "D[]": "define",
        "H[]": "handler"
    }
);

/** The current version string of this application. */
JSDOC.VERSION = "2.0.3";

//------------------------------------------- DocComment.js ------------------//

/**
    Create a new DocComment. This takes a raw documentation comment,
    and wraps it in useful accessors.
    @class Represents a documentation comment object.
 */ 
JSDOC.DocComment = function(/**String*/comment) {
    this.init();
    if (typeof comment != "undefined") {
        this.parse(comment);
    }
}

JSDOC.DocComment.prototype.init = function() {
    this.isUserComment = true;
    this.src           = "";
    this.meta          = "";
    this.tagTexts      = [];
    this.tags          = [];
}

/**
    @requires JSDOC.DocTag
 */
JSDOC.DocComment.prototype.parse = function(/**String*/comment) {
    if (comment == "") {
        comment = "/** @desc */";
        this.isUserComment = false;
    }
    
    this.src = JSDOC.DocComment.unwrapComment(comment);
    
    this.meta = "";
    if (this.src.indexOf("#") == 0) {
        this.src.match(/#(.+[+-])([\s\S]*)$/);
        if (RegExp.$1) this.meta = RegExp.$1;
        if (RegExp.$2) this.src = RegExp.$2;
    }
    
    if (typeof JSDOC.PluginManager != "undefined") {
        JSDOC.PluginManager.run("onDocCommentSrc", this);
    }
    
    this.fixDesc();

    this.src = JSDOC.DocComment.shared+"\n"+this.src;
    
    this.tagTexts = 
        this.src
        .split(/(^|[\r\n])\s*@/)
        .filter(function($){return $.match(/\S/)});
    
    /**
        The tags found in the comment.
        @type JSDOC.DocTag[]
     */
    this.tags = this.tagTexts.map(function($){return new JSDOC.DocTag($)});
    
    if (typeof JSDOC.PluginManager != "undefined") {
        JSDOC.PluginManager.run("onDocCommentTags", this);
    }
}

/*t:
    plan(5, "testing JSDOC.DocComment");
    requires("../frame/String.js");
    requires("../lib/JSDOC/DocTag.js");
    
    var com = new JSDOC.DocComment("/**@foo some\n* comment here*"+"/");
    is(com.tagTexts[0], "foo some\ncomment here", "first tag text is found.");
    is(com.tags[0].title, "foo", "the title is found in a comment with one tag.");
    
    var com = new JSDOC.DocComment("/** @foo first\n* @bar second*"+"/");
    is(com.getTag("bar").length, 1, "getTag() returns one tag by that title.");
    
    JSDOC.DocComment.shared = "@author John Smith";
    var com = new JSDOC.DocComment("/**@foo some\n* comment here*"+"/");
    is(com.tags[0].title, "author", "shared comment is added.");
    is(com.tags[1].title, "foo", "shared comment is added to existing tag.");
*/

/**
    If no @desc tag is provided, this function will add it.
 */
JSDOC.DocComment.prototype.fixDesc = function() {
    if (this.meta && this.meta != "@+") return;
    if (/^\s*[^@\s]/.test(this.src)) {                
        this.src = "@desc "+this.src;
    }
}

/*t:
    plan(5, "testing JSDOC.DocComment#fixDesc");
    
    var com = new JSDOC.DocComment();
    
    com.src = "this is a desc\n@author foo";
    com.fixDesc();
    is(com.src, "@desc this is a desc\n@author foo", "if no @desc tag is provided one is added.");

    com.src = "x";
    com.fixDesc();
    is(com.src, "@desc x", "if no @desc tag is provided one is added to a single character.");

    com.src = "\nx";
    com.fixDesc();
    is(com.src, "@desc \nx", "if no @desc tag is provided one is added to return and character.");
    
    com.src = " ";
    com.fixDesc();
    is(com.src, " ", "if no @desc tag is provided one is not added to just whitespace.");

    com.src = "";
    com.fixDesc();
    is(com.src, "", "if no @desc tag is provided one is not added to empty.");
*/

/**
    Remove slash-star comment wrapper from a raw comment string.
    @type String
 */
JSDOC.DocComment.unwrapComment = function(/**String*/comment) {
    if (!comment) return "";
    var unwrapped = comment.replace(/(^\/\*\*|\*\/$)/g, "").replace(/^\s*\* ?/gm, "");
    return unwrapped;
}

/*t:
    plan(5, "testing JSDOC.DocComment.unwrapComment");
    
    var com = "/**x*"+"/";
    var unwrapped = JSDOC.DocComment.unwrapComment(com);
    is(unwrapped, "x", "a single character jsdoc is found.");
    
    com = "/***x*"+"/";
    unwrapped = JSDOC.DocComment.unwrapComment(com);
    is(unwrapped, "x", "three stars are allowed in the opener.");
    
    com = "/****x*"+"/";
    unwrapped = JSDOC.DocComment.unwrapComment(com);
    is(unwrapped, "*x", "fourth star in the opener is kept.");
    
    com = "/**x\n * y\n*"+"/";
    unwrapped = JSDOC.DocComment.unwrapComment(com);
    is(unwrapped, "x\ny\n", "leading stars and spaces are trimmed.");
    
    com = "/**x\n *   y\n*"+"/";
    unwrapped = JSDOC.DocComment.unwrapComment(com);
    is(unwrapped, "x\n  y\n", "only first space after leading stars are trimmed.");
*/

/**
    Provides a printable version of the comment.
    @type String
 */
JSDOC.DocComment.prototype.toString = function() {
    return this.src;
}

/*t:
    plan(1, "testing JSDOC.DocComment#fixDesc");
    var com = new JSDOC.DocComment();
    com.src = "foo";
    is(""+com, "foo", "stringifying a comment returns the unwrapped src.");
*/

/**
    Given the title of a tag, returns all tags that have that title.
    @type JSDOC.DocTag[]
 */
JSDOC.DocComment.prototype.getTag = function(/**String*/tagTitle) {
    return this.tags.filter(function($){return $.title == tagTitle});
}

/*t:
    plan(1, "testing JSDOC.DocComment#getTag");
    requires("../frame/String.js");
    requires("../lib/JSDOC/DocTag.js");
    
    var com = new JSDOC.DocComment("/**@foo some\n* @bar\n* @bar*"+"/");
    is(com.getTag("bar").length, 2, "getTag returns expected number of tags.");
*/

/**
    Used to store the currently shared tag text.
*/
JSDOC.DocComment.shared = "";

/*t:
    plan(2, "testing JSDOC.DocComment.shared");
    requires("../frame/String.js");
    requires("../lib/JSDOC/DocTag.js");
    
    JSDOC.DocComment.shared = "@author Michael";
    
    var com = new JSDOC.DocComment("/**@foo\n* @foo*"+"/");
    is(com.getTag("author").length, 1, "getTag returns shared tag.");
    is(com.getTag("foo").length, 2, "getTag returns unshared tags too.");
*/


//------------------------------------------- DocTag.js ------------------//

/**
    @constructor
 */
JSDOC.DocTag = function(src) {
    this.init();
    if (typeof src != "undefined") {
        this.parse(src);
    }
}

/**
    Create and initialize the properties of this.
 */
JSDOC.DocTag.prototype.init = function() {
    this.title        = "";
    this.type         = "";
    this.name         = "";
    this.isOptional   = false;
    this.defaultValue = "";
    this.desc         = "";
    
    return this;
}

/**
    Populate the properties of this from the given tag src.
    @param {string} src
 */
JSDOC.DocTag.prototype.parse = function(src) {
    if (typeof src != "string") throw "src must be a string not "+(typeof src);

    try {
        src = this.nibbleTitle(src);
        if (JSDOC.PluginManager) {
            JSDOC.PluginManager.run("onDocTagSynonym", this);
        }
        
        src = this.nibbleType(src);
        
        // only some tags are allowed to have names.
        if (this.title == "param" || this.title == "property" || this.title == "config") { // @config is deprecated
            src = this.nibbleName(src);
        }
    }
    catch(e) {
        if (Log) Log.warn(e);
        else throw e;
    }
    this.desc = src; // whatever is left
    
    // example tags need to have whitespace preserved
    if (this.title != "example") this.desc = this.desc.trim();
    
    if (JSDOC.PluginManager) {
        JSDOC.PluginManager.run("onDocTag", this);
    }
}

/**
    Automatically called when this is stringified.
 */
JSDOC.DocTag.prototype.toString = function() {
    return this.desc;
}

/*t:
    plan(1, "testing JSDOC.DocTag#toString");
    
    var tag = new JSDOC.DocTag("param {object} date A valid date.");
    is(""+tag, "A valid date.", "stringifying a tag returns the desc.");
 */

/**
    Find and shift off the title of a tag.
    @param {string} src
    @return src
 */
JSDOC.DocTag.prototype.nibbleTitle = function(src) {
    if (typeof src != "string") throw "src must be a string not "+(typeof src);
    
    var parts = src.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);

    if (parts && parts[1]) this.title = parts[1];
    if (parts && parts[2]) src = parts[2];
    else src = "";
    
    return src;
}

/*t:
    plan(8, "testing JSDOC.DocTag#nibbleTitle");
    
    var tag = new JSDOC.DocTag();
    
    tag.init().nibbleTitle("aTitleGoesHere");
    is(tag.title, "aTitleGoesHere", "a title can be found in a single-word string.");
    
    var src = tag.init().nibbleTitle("aTitleGoesHere and the rest");
    is(tag.title, "aTitleGoesHere", "a title can be found in a multi-word string.");
    is(src, "and the rest", "the rest is returned when the title is nibbled off.");
    
    src = tag.init().nibbleTitle("");
    is(tag.title, "", "given an empty string the title is empty.");
    is(src, "", "the rest is empty when the tag is empty.");

    var src = tag.init().nibbleTitle(" aTitleGoesHere\n  a description");
    is(tag.title, "aTitleGoesHere", "leading and trailing spaces are not part of the title.");
    is(src, "  a description", "leading spaces (less one) are part of the description.");

    tag.init().nibbleTitle("a.Title::Goes_Here foo");
    is(tag.title, "a.Title::Goes_Here", "titles with punctuation are allowed.");
 */

/**
    Find and shift off the type of a tag.
    @requires frame/String.js
    @param {string} src
    @return src
 */
JSDOC.DocTag.prototype.nibbleType = function(src) {
    if (typeof src != "string") throw "src must be a string not "+(typeof src);
    
    if (src.match(/^\s*\{/)) {
        var typeRange = src.balance("{", "}");
        if (typeRange[1] == -1) {
            throw "Malformed comment tag ignored. Tag type requires an opening { and a closing }: "+src;
        }
        this.type = src.substring(typeRange[0]+1, typeRange[1]).trim();
        this.type = this.type.replace(/\s*,\s*/g, "|"); // multiples can be separated by , or |
        src = src.substring(typeRange[1]+1);
    }
    
    return src;
}

/*t:
    plan(5, "testing JSDOC.DocTag.parser.nibbleType");
    requires("../frame/String.js");
    
    var tag = new JSDOC.DocTag();
    
    tag.init().nibbleType("{String[]} aliases");
    is(tag.type, "String[]", "type can have non-alpha characters.");
    
    tag.init().nibbleType("{ aTypeGoesHere  } etc etc");
    is(tag.type, "aTypeGoesHere", "type is trimmed.");
    
    tag.init().nibbleType("{ oneType, twoType ,\n threeType  } etc etc");
    is(tag.type, "oneType|twoType|threeType", "multiple types can be separated by commas.");
    
    var error;
    try { tag.init().nibbleType("{widget foo"); }
    catch(e) { error = e; }
    is(typeof error, "string", "malformed tag type throws error.");
    isnt(error.indexOf("Malformed"), -1, "error message tells tag is malformed.");
 */

/**
    Find and shift off the name of a tag.
    @requires frame/String.js
    @param {string} src
    @return src
 */
JSDOC.DocTag.prototype.nibbleName = function(src) {
    if (typeof src != "string") throw "src must be a string not "+(typeof src);
    
    src = src.trim();
    
    // is optional?
    if (src.charAt(0) == "[") {
        var nameRange = src.balance("[", "]");
        if (nameRange[1] == -1) {
            throw "Malformed comment tag ignored. Tag optional name requires an opening [ and a closing ]: "+src;
        }
        this.name = src.substring(nameRange[0]+1, nameRange[1]).trim();
        this.isOptional = true;
        
        src = src.substring(nameRange[1]+1);
        
        // has default value?
        var nameAndValue = this.name.split("=");
        if (nameAndValue.length) {
            this.name = nameAndValue.shift().trim();
            this.defaultValue = nameAndValue.join("=");
        }
    }
    else {
        var parts = src.match(/^(\S+)(?:\s([\s\S]*))?$/);
        if (parts) {
            if (parts[1]) this.name = parts[1];
            if (parts[2]) src = parts[2].trim();
            else src = "";
        }
    }    

    return src;
}

/*t:
    requires("../frame/String.js");
    plan(9, "testing JSDOC.DocTag.parser.nibbleName");
    
    var tag = new JSDOC.DocTag();
    
    tag.init().nibbleName("[foo] This is a description.");
    is(tag.isOptional, true, "isOptional syntax is detected.");
    is(tag.name, "foo", "optional param name is found.");
    
    tag.init().nibbleName("[foo] This is a description.");
    is(tag.isOptional, true, "isOptional syntax is detected when no type.");
    is(tag.name, "foo", "optional param name is found when no type.");
    
    tag.init().nibbleName("[foo=7] This is a description.");
    is(tag.name, "foo", "optional param name is found when default value.");
    is(tag.defaultValue, 7, "optional param default value is found when default value.");
    
    //tag.init().nibbleName("[foo= a value] This is a description.");
    //is(tag.defaultValue, " a value", "optional param default value is found when default value has spaces (issue #112).");
    
    tag.init().nibbleName("[foo=[]] This is a description.");
    is(tag.defaultValue, "[]", "optional param default value is found when default value is [] (issue #95).");
    
    tag.init().nibbleName("[foo=a=b] This is a description.");
    is(tag.name, "foo", "optional param name is found when default value is a=b.");
    is(tag.defaultValue, "a=b", "optional param default value is found when default value is a=b.")
 */

/*t:
    plan(32, "Testing JSDOC.DocTag.parser.");
    requires("../frame/String.js");
    
    var tag = new JSDOC.DocTag();
    
    is(typeof tag, "object", "JSDOC.DocTag.parser with an empty string returns an object.");
    is(typeof tag.title, "string", "returned object has a string property 'title'.");
    is(typeof tag.type, "string", "returned object has a string property 'type'.");
    is(typeof tag.name, "string", "returned object has a string property 'name'.");
    is(typeof tag.defaultValue, "string", "returned object has a string property 'defaultValue'.");
    is(typeof tag.isOptional, "boolean", "returned object has a boolean property 'isOptional'.");
    is(typeof tag.desc, "string", "returned object has a string property 'desc'.");
  
    tag = new JSDOC.DocTag("param {widget} foo");
    is(tag.title, "param", "param title is found.");
    is(tag.name, "foo", "param name is found when desc is missing.");
    is(tag.desc, "", "param desc is empty when missing.");
    
    tag = new JSDOC.DocTag("param {object} date A valid date.");
    is(tag.name, "date", "param name is found with a type.");
    is(tag.type, "object", "param type is found.");
    is(tag.desc, "A valid date.", "param desc is found with a type.");
    
    tag = new JSDOC.DocTag("param aName a description goes\n    here.");
    is(tag.name, "aName", "param name is found without a type.");
    is(tag.desc, "a description goes\n    here.", "param desc is found without a type.");
    
    tag = new JSDOC.DocTag("param {widget}");
    is(tag.name, "", "param name is empty when it is not given.");
    
    tag = new JSDOC.DocTag("param {widget} [foo] This is a description.");
    is(tag.name, "foo", "optional param name is found.");
    
    tag = new JSDOC.DocTag("return {aType} This is a description.");
    is(tag.type, "aType", "when return tag has no name, type is found.");
    is(tag.desc, "This is a description.", "when return tag has no name, desc is found.");
    
    tag = new JSDOC.DocTag("author Joe Coder <jcoder@example.com>");
    is(tag.title, "author", "author tag has a title.");
    is(tag.type, "", "the author tag has no type.");
    is(tag.name, "", "the author tag has no name.");
    is(tag.desc, "Joe Coder <jcoder@example.com>", "author tag has desc.");
    
    tag = new JSDOC.DocTag("private \t\n  ");
    is(tag.title, "private", "private tag has a title.");
    is(tag.type, "", "the private tag has no type.");
    is(tag.name, "", "the private tag has no name.");
    is(tag.desc, "", "private tag has no desc.");

    tag = new JSDOC.DocTag("example\n   example(code);\n   more();");
    is(tag.desc, "   example(code);\n   more();", "leading whitespace (less one) in examples code is preserved.");
    
    tag = new JSDOC.DocTag("param theName  \n");
    is(tag.name, "theName", "name only is found.");
    
    tag = new JSDOC.DocTag("type theDesc  \n");
    is(tag.desc, "theDesc", "desc only is found.");
    
    tag = new JSDOC.DocTag("type {theType} \n");
    is(tag.type, "theType", "type only is found.");
    
    tag = new JSDOC.DocTag("");
    is(tag.title, "", "title is empty when tag is empty.");
 */


/**
    @namespace
*/
JSDOC.Lang = {
}

JSDOC.Lang.isBuiltin = function(name) {
    return (JSDOC.Lang.isBuiltin.coreObjects.indexOf(name) > -1);
}
JSDOC.Lang.isBuiltin.coreObjects = ['_global_', 'Array', 'Boolean', 'Date', 'Function', 'Math', 'Number', 'Object', 'RegExp', 'String'];

JSDOC.Lang.whitespace = function(ch) {
    return JSDOC.Lang.whitespace.names[ch];
}
JSDOC.Lang.whitespace.names = {
    " ":      "SPACE",
    "\f":     "FORMFEED",
    "\t":     "TAB",
    "\u0009": "UNICODE_TAB",
    "\u000A": "UNICODE_NBR",
    "\u0008": "VERTICAL_TAB"
};

JSDOC.Lang.newline = function(ch) {
    return JSDOC.Lang.newline.names[ch];
}
JSDOC.Lang.newline.names = {
    "\n":     "NEWLINE",
    "\r":     "RETURN",
    "\u000A": "UNICODE_LF",
    "\u000D": "UNICODE_CR",
    "\u2029": "UNICODE_PS",
    "\u2028": "UNICODE_LS"
};

JSDOC.Lang.keyword = function(word) {
    return JSDOC.Lang.keyword.names["="+word];
}
JSDOC.Lang.keyword.names = {
    "=break":      "BREAK",
    "=case":       "CASE",
    "=catch":      "CATCH",
    "=const":      "VAR",
    "=continue":   "CONTINUE",
    "=default":    "DEFAULT",
    "=delete":     "DELETE",
    "=do":         "DO",
    "=else":       "ELSE",
    "=false":      "FALSE",
    "=finally":    "FINALLY",
    "=for":        "FOR",
    "=function":   "FUNCTION",
    "=get":        "GET",
    "=if":         "IF",
    "=in":         "IN",
    "=instanceof": "INSTANCEOF",
    "=new":        "NEW",
    "=null":       "NULL",
    "=return":     "RETURN",
    "=set":        "SET",
    "=switch":     "SWITCH",
    "=this":       "THIS",
    "=throw":      "THROW",
    "=true":       "TRUE",
    "=try":        "TRY",
    "=typeof":     "TYPEOF",
    "=void":       "VOID",
    "=while":      "WHILE",
    "=with":       "WITH",
    "=var":        "VAR"
};

JSDOC.Lang.punc = function(ch) {
    return JSDOC.Lang.punc.names[ch];
}
JSDOC.Lang.punc.names = {
    ";":   "SEMICOLON",
    ",":   "COMMA",
    "?":   "HOOK",
    ":":   "COLON",
    "||":  "OR", 
    "&&":  "AND",
    "|":   "BITWISE_OR",
    "^":   "BITWISE_XOR",
    "&":   "BITWISE_AND",
    "===": "STRICT_EQ", 
    "==":  "EQ",
    "=":   "ASSIGN",
    "!==": "STRICT_NE",
    "!=":  "NE",
    "<<":  "LSH",
    "<=":  "LE", 
    "<":   "LT",
    ">>>": "URSH",
    ">>":  "RSH",
    ">=":  "GE",
    ">":   "GT", 
    "++":  "INCREMENT",
    "--":  "DECREMENT",
    "+":   "PLUS",
    "-":   "MINUS",
    "*":   "MUL",
    "/":   "DIV", 
    "%":   "MOD",
    "!":   "NOT",
    "~":   "BITWISE_NOT",
    ".":   "DOT",
    "[":   "LEFT_BRACKET",
    "]":   "RIGHT_BRACKET",
    "{":   "LEFT_CURLY",
    "}":   "RIGHT_CURLY",
    "(":   "LEFT_PAREN",
    ")":   "RIGHT_PAREN"
};

JSDOC.Lang.matching = function(name) {
    return JSDOC.Lang.matching.names[name];
}
JSDOC.Lang.matching.names = {
    "LEFT_PAREN": "RIGHT_PAREN",
    "RIGHT_PAREN": "LEFT_PAREN",
    "LEFT_CURLY": "RIGHT_CURLY",
    "RIGHT_CURLY": "LEFT_CURLY",
    "LEFT_BRACE": "RIGHT_BRACE",
    "RIGHT_BRACE": "LEFT_BRACE"
}

JSDOC.Lang.isNumber = function(str) {
    return /^(\.[0-9]|[0-9]+\.|[0-9])[0-9]*([eE][+-][0-9]+)?$/i.test(str);
}

JSDOC.Lang.isHexDec = function(str) {
    return /^0x[0-9A-F]+$/i.test(str);
}

JSDOC.Lang.isWordChar = function(str) {
    return /^[a-zA-Z0-9$_.]+$/.test(str);
}

JSDOC.Lang.isSpace = function(str) {
    return (typeof JSDOC.Lang.whitespace(str) != "undefined");
}

JSDOC.Lang.isNewline = function(str) {
    return (typeof JSDOC.Lang.newline(str) != "undefined");
}



/**
    @namespace
    @requires JSDOC.Walker
    @requires JSDOC.Symbol
    @requires JSDOC.DocComment
*/
JSDOC.Parser = {
    conf: {
        ignoreCode:               JSDOC.opt.n,
        ignoreAnonymous:           true, // factory: true
        treatUnderscoredAsPrivate: true, // factory: true
        explain:                   false // factory: false
    },
    
    addSymbol: function(symbol) {
        // if a symbol alias is documented more than once the last one with the user docs wins
        if (JSDOC.Parser.symbols.hasSymbol(symbol.alias)) {
            var oldSymbol = JSDOC.Parser.symbols.getSymbol(symbol.alias);
            if (oldSymbol.comment.isUserComment) {
                if (symbol.comment.isUserComment) { // old and new are both documented
                    Log.warn("The symbol '"+symbol.alias+"' is documented more than once.");
                }
                else { // old is documented but new isn't
                    return;
                }
            }
        }
        
        // we don't document anonymous things
        if (JSDOC.Parser.conf.ignoreAnonymous && symbol.name.match(/\$anonymous\b/)) return;

        // uderscored things may be treated as if they were marked private, this cascades
        if (JSDOC.Parser.conf.treatUnderscoredAsPrivate && symbol.name.match(/[.#-]_[^.#-]+$/)) {
            if (!symbol.comment.getTag("public")) symbol.isPrivate = true;
        }
        
        // -p flag is required to document private things
        if (!JSDOC.opt.p && symbol.isPrivate) return; // issue #161 fixed by mcbain.asm
        
        // ignored things are not documented, this doesn't cascade
        if (symbol.isIgnored) return;
        JSDOC.Parser.symbols.addSymbol(symbol);
    },
    
    addBuiltin: function(name) {
        var builtin = new JSDOC.Symbol(name, [], "CONSTRUCTOR", new JSDOC.DocComment(""));
        builtin.isNamespace = true;
        builtin.srcFile = "";
        builtin.isPrivate = false;
        JSDOC.Parser.addSymbol(builtin);
        return builtin;
    },
    
    init: function() {
        JSDOC.Parser.symbols = new JSDOC.SymbolSet();
        JSDOC.Parser.walker = new JSDOC.Walker();
    },
    
    finish: function() {
        JSDOC.Parser.symbols.relate();        
        
        // make a litle report about what was found
        if (JSDOC.Parser.conf.explain) {
            var symbols = JSDOC.Parser.symbols.toArray();
            var srcFile = "";
            for (var i = 0, l = symbols.length; i < l; i++) {
                var symbol = symbols[i];
                if (srcFile != symbol.srcFile) {
                    srcFile = symbol.srcFile;
                    print("\n"+srcFile+"\n-------------------");
                }
                print(i+":\n  alias => "+symbol.alias + "\n  name => "+symbol.name+ "\n  isa => "+symbol.isa + "\n  memberOf => " + symbol.memberOf + "\n  isStatic => " + symbol.isStatic + ",  isInner => " + symbol.isInner);
            }
            print("-------------------\n");
        }
    }
}

JSDOC.Parser.parse = function(/**JSDOC.TokenStream*/ts, /**String*/srcFile) {
    JSDOC.Symbol.srcFile = (srcFile || "");
    JSDOC.DocComment.shared = ""; // shared comments don't cross file boundaries
    
    if (!JSDOC.Parser.walker) JSDOC.Parser.init();
    JSDOC.Parser.walker.walk(ts); // adds to our symbols
    
    // filter symbols by option
    for (var p = JSDOC.Parser.symbols._index.first(); p; p = JSDOC.Parser.symbols._index.next()) {
        var symbol = p.value;
        
        if (!symbol) continue;
        
        if (symbol.is("FILE") || symbol.is("GLOBAL")) {
            continue;
        }
        else if (!JSDOC.opt.a && !symbol.comment.isUserComment) {
            JSDOC.Parser.symbols.deleteSymbol(symbol.alias);
        }
        
        if (/#$/.test(symbol.alias)) { // we don't document prototypes
            JSDOC.Parser.symbols.deleteSymbol(symbol.alias);
        }
    }
    
    return JSDOC.Parser.symbols.toArray();
}


/**
    @namespace Holds functionality related to running plugins.
*/
JSDOC.PluginManager = {
}

/**
    @param name A unique name that identifies that plugin.
    @param handlers A collection of named functions. The names correspond to hooks in the core code.
*/
JSDOC.PluginManager.registerPlugin = function(/**String*/name, /**Object*/handlers) {
    if (!defined(JSDOC.PluginManager.plugins))
        /** The collection of all plugins. Requires a unique name for each.
        */
        JSDOC.PluginManager.plugins = {};
    
    
    JSDOC.PluginManager.plugins[name] = handlers;
}

/**
    @param hook The name of the hook that is being caught.
    @param target Any object. This will be passed as the only argument to the handler whose
    name matches the hook name. Handlers cannot return a value, so must modify the target
    object to have an effect.
*/
JSDOC.PluginManager.run = function(/**String*/hook, /**Mixed*/target) {
    for (var name in JSDOC.PluginManager.plugins) {
        if (defined(JSDOC.PluginManager.plugins[name][hook])) {
            JSDOC.PluginManager.plugins[name][hook](target);
        }
    }
}


/**
    Create a new Symbol.
    @class Represents a symbol in the source code.
 */
JSDOC.Symbol = function() {
    this.init();
    if (arguments.length) this.populate.apply(this, arguments);
}

JSDOC.Symbol.prototype.init = function() {
    this.$args = [];
    this.addOn = "";
    this.alias = "";
    this.augments = [];
    this.author = "";
    this.classDesc = "";
    this.comment = {};
    this.defaultValue = undefined;
    this.deprecated = "";
    this.desc = "";
    this.events = [];
    this.example = [];
    this.exceptions = [];
    this.inherits = [];
    this.inheritsFrom = [];
    this.isa = "OBJECT";
    this.isEvent = false;
    this.isConstant = false;
    this.isIgnored = false;
    this.isInner = false;
    this.isNamespace = false;
    this.isPrivate = false;
    this.isStatic = false;
    this.memberOf = "";
    this.methods = [];
    this._name = "";
    this._params = [];
    this.properties = [];
    this.requires = [];
    this.returns = [];
    this.see = [];
    this.since = "";
    this.srcFile = {};
    this.type = "";
    this.version = "";
}

JSDOC.Symbol.prototype.serialize = function() {
    var keys = [];
    for (var p in this) {
        keys.push (p);
    }
    keys = keys.sort();
    
    var out = "";
    for (var i in keys) {
        if (typeof this[keys[i]] == "function") continue;
        out += keys[i]+" => "+ this[keys[i]] + ",\n";
    }
    return "\n{\n" + out + "}\n";
}

JSDOC.Symbol.prototype.clone = function() {
    var clone = new JSDOC.Symbol();
    clone.populate.apply(clone, this.$args); // repopulate using the original arguments
    clone.srcFile = this.srcFile; // not the current srcFile, the one when the original was made
    return clone;
}

JSDOC.Symbol.prototype.__defineSetter__("name",
    function(n) { n = n.replace(/^_global_[.#-]/, ""); n = n.replace(/\.prototype\.?/g, '#'); this._name = n; }
);
JSDOC.Symbol.prototype.__defineGetter__("name",
    function() { return this._name; }
);
JSDOC.Symbol.prototype.__defineSetter__("params", 
    function(v) {
        for (var i = 0, l = v.length; i < l; i++) {
            if (v[i].constructor != JSDOC.DocTag) { // may be a generic object parsed from signature, like {type:..., name:...}
                this._params[i] = new JSDOC.DocTag("param"+((v[i].type)?" {"+v[i].type+"}":"")+" "+v[i].name);
            }
            else {
                this._params[i] = v[i];
            }
        }
    }
);
JSDOC.Symbol.prototype.__defineGetter__("params",
    function() { return this._params; }
);

JSDOC.Symbol.prototype.populate = function(
        /** String */ name,
        /** Object[] */ params,
        /** String */ isa,
        /** JSDOC.DocComment */ comment
) {
    this.$args = arguments;
    
    this.name = name;
    this.alias = this.name;
    this.params = params;
    this.isa = (isa == "VIRTUAL")? "OBJECT":isa;
    this.comment = comment || new JSDOC.DocComment("");
    this.srcFile = JSDOC.Symbol.srcFile;
    
    if (this.is("FILE") && !this.alias) this.alias = this.srcFile;

    this.setTags();
    
    if (typeof JSDOC.PluginManager != "undefined") {
        JSDOC.PluginManager.run("onSymbol", this);
    }
}

JSDOC.Symbol.prototype.setTags = function() {
    // @author
    var authors = this.comment.getTag("author");
    if (authors.length) {
        this.author = authors.map(function($){return $.desc;}).join(", ");
    }
    
    /*t:
        plan(34, "testing JSDOC.Symbol");
        
        requires("../lib/JSDOC/DocComment.js");
        requires("../frame/String.js");
        requires("../lib/JSDOC/DocTag.js");

        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@author Joe Smith*"+"/"));
        is(sym.author, "Joe Smith", "@author tag, author is found.");
    */
    
    // @desc
    var descs = this.comment.getTag("desc");
    if (descs.length) {
        this.desc = descs.map(function($){return $.desc;}).join("\n"); // multiple descriptions are concatenated into one
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@desc This is a description.*"+"/"));
        is(sym.desc, "This is a description.", "@desc tag, description is found.");
    */
    
    // @overview
    if (this.is("FILE")) {
        if (!this.alias) this.alias = this.srcFile;
        
        var overviews = this.comment.getTag("overview");
        if (overviews.length) {
            this.desc = [this.desc].concat(overviews.map(function($){return $.desc;})).join("\n");
        }
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@overview This is an overview.*"+"/"));
        is(sym.desc, "\nThis is an overview.", "@overview tag, description is found.");
    */
    
    // @since
    var sinces = this.comment.getTag("since");
    if (sinces.length) {
        this.since = sinces.map(function($){return $.desc;}).join(", ");
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@since 1.01*"+"/"));
        is(sym.since, "1.01", "@since tag, description is found.");
    */
    
    // @constant
    if (this.comment.getTag("constant").length) {
        this.isConstant = true;
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@constant*"+"/"));
        is(sym.isConstant, true, "@constant tag, isConstant set.");
    */
    
    // @version
    var versions = this.comment.getTag("version");
    if (versions.length) {
        this.version = versions.map(function($){return $.desc;}).join(", ");
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@version 2.0x*"+"/"));
        is(sym.version, "2.0x", "@version tag, version is found.");
    */
    
    // @deprecated
    var deprecateds = this.comment.getTag("deprecated");
    if (deprecateds.length) {
        this.deprecated = deprecateds.map(function($){return $.desc;}).join("\n");
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@deprecated Use other method.*"+"/"));
        is(sym.deprecated, "Use other method.", "@deprecated tag, desc is found.");
    */
    
    // @example
    var examples = this.comment.getTag("example");
    if (examples.length) {
        this.example = examples.map(
            // trim trailing whitespace
            function($) {
                $.desc = $.desc.replace(/\s+$/, "");
                return $;
            }
        );
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@example This\n  is an example. \n*"+"/"));
        isnt(typeof sym.example[0], "undefined", "@example tag, creates sym.example array.");
        is(sym.example[0], "This\n  is an example.", "@example tag, desc is found.");
    */
    
    // @see
    var sees = this.comment.getTag("see");
    if (sees.length) {
        var thisSee = this.see;
        sees.map(function($){thisSee.push($.desc);});
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FILE", new JSDOC.DocComment("/**@see The other thing.*"+"/"));
        is(sym.see, "The other thing.", "@see tag, desc is found.");
    */
    
    // @class
    var classes = this.comment.getTag("class");
    if (classes.length) {
        this.isa = "CONSTRUCTOR";
        this.classDesc = classes[0].desc; // desc can't apply to the constructor as there is none.
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@class This describes the class.*"+"/"));
        is(sym.isa, "CONSTRUCTOR", "@class tag, makes symbol a constructor.");
        is(sym.classDesc, "This describes the class.", "@class tag, class description is found.");
    */
    
    // @namespace
    var namespaces = this.comment.getTag("namespace");
    if (namespaces.length) {
        this.classDesc = namespaces[0].desc;
        this.isNamespace = true;
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@namespace This describes the namespace.*"+"/"));
        is(sym.classDesc, "This describes the namespace.", "@namespace tag, class description is found.");
    */
    
    // @param
    var params = this.comment.getTag("param");
    if (params.length) {
        // user-defined params overwrite those with same name defined by the parser
        var thisParams = this.params;

        if (thisParams.length == 0) { // none exist yet, so just bung all these user-defined params straight in
            this.params = params;
        }
        else { // need to overlay these user-defined params on to existing parser-defined params
            for (var i = 0, l = params.length; i < l; i++) {
                if (thisParams[i]) {
                    if (params[i].type) thisParams[i].type = params[i].type;
                    thisParams[i].name = params[i].name;
                    thisParams[i].desc = params[i].desc;
                    thisParams[i].isOptional = params[i].isOptional;
                    thisParams[i].defaultValue = params[i].defaultValue;
                }
                else thisParams[i] = params[i];
            }
        }
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [{type: "array", name: "pages"}], "FUNCTION", new JSDOC.DocComment("/**Description.*"+"/"));
        is(sym.params.length, 1, "parser defined param is found.");
        
        sym = new JSDOC.Symbol("foo", [], "FUNCTION", new JSDOC.DocComment("/**Description.\n@param {array} pages*"+"/"));
        is(sym.params.length, 1, "user defined param is found.");
        is(sym.params[0].type, "array", "user defined param type is found.");
        is(sym.params[0].name, "pages", "user defined param name is found.");
        
        sym = new JSDOC.Symbol("foo", [{type: "array", name: "pages"}], "FUNCTION", new JSDOC.DocComment("/**Description.\n@param {string} uid*"+"/"));
        is(sym.params.length, 1, "user defined param overwrites parser defined param.");
        is(sym.params[0].type, "string", "user defined param type overwrites parser defined param type.");
        is(sym.params[0].name, "uid", "user defined param name overwrites parser defined param name.");
    
        sym = new JSDOC.Symbol("foo", [{type: "array", name: "pages"}, {type: "number", name: "count"}], "FUNCTION", new JSDOC.DocComment("/**Description.\n@param {string} uid*"+"/"));
        is(sym.params.length, 2, "user defined params  overlay parser defined params.");
        is(sym.params[1].type, "number", "user defined param type overlays parser defined param type.");
        is(sym.params[1].name, "count", "user defined param name overlays parser defined param name.");

        sym = new JSDOC.Symbol("foo", [], "FUNCTION", new JSDOC.DocComment("/**Description.\n@param {array} pages The pages description.*"+"/"));
        is(sym.params.length, 1, "user defined param with description is found.");
        is(sym.params[0].desc, "The pages description.", "user defined param description is found.");
    */
    
    // @constructor
    if (this.comment.getTag("constructor").length) {
        this.isa = "CONSTRUCTOR";
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@constructor*"+"/"));
        is(sym.isa, "CONSTRUCTOR", "@constructor tag, makes symbol a constructor.");
    */
    
    // @static
    if (this.comment.getTag("static").length) {
        this.isStatic = true;
        if (this.isa == "CONSTRUCTOR") {
            this.isNamespace = true;
        }
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@static\n@constructor*"+"/"));
        is(sym.isStatic, true, "@static tag, makes isStatic true.");
        is(sym.isNamespace, true, "@static and @constructor tag, makes isNamespace true.");
    */
    
    // @inner
    if (this.comment.getTag("inner").length) {
        this.isInner = true;
        this.isStatic = false;
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@inner*"+"/"));
        is(sym.isStatic, false, "@inner tag, makes isStatic false.");
        is(sym.isInner, true, "@inner makes isInner true.");
    */
    
    // @field
    if (this.comment.getTag("field").length) {
        this.isa = "OBJECT";
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "FUNCTION", new JSDOC.DocComment("/**@field*"+"/"));
        is(sym.isa, "OBJECT", "@field tag, makes symbol an object.");
    */
    
    // @function
    if (this.comment.getTag("function").length) {
        this.isa = "FUNCTION";
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@function*"+"/"));
        is(sym.isa, "FUNCTION", "@function tag, makes symbol a function.");
    */
    
    // @event
    var events = this.comment.getTag("event");
    if (events.length) {
        this.isa = "FUNCTION";
        this.isEvent = true;
    }
    
    /*t:
        var sym = new JSDOC.Symbol("foo", [], "OBJECT", new JSDOC.DocComment("/**@event*"+"/"));
        is(sym.isa, "FUNCTION", "@event tag, makes symbol a function.");
        is(sym.isEvent, true, "@event makes isEvent true.");
    */
    
    // @name
    var names = this.comment.getTag("name");
    if (names.length) {
        this.name = names[0].desc;
    }
    
    /*t:
        // todo
    */
    
    // @property
    var properties = this.comment.getTag("property");
    if (properties.length) {
        thisProperties = this.properties;
        for (var i = 0; i < properties.length; i++) {
            var property = new JSDOC.Symbol(this.alias+"#"+properties[i].name, [], "OBJECT", new JSDOC.DocComment("/**"+properties[i].desc+"\n@name "+properties[i].name+"\n@memberOf "+this.alias+"#*/"));
            // TODO: shouldn't the following happen in the addProperty method of Symbol?
            property.name = properties[i].name;
            property.memberOf = this.alias;
            if (properties[i].type) property.type = properties[i].type;
            if (properties[i].defaultValue) property.defaultValue = properties[i].defaultValue;
            this.addProperty(property);
            JSDOC.Parser.addSymbol(property);
        }
    }
    
    /*t:
        // todo
    */

    // @return
    var returns = this.comment.getTag("return");
    if (returns.length) { // there can be many return tags in a single doclet
        this.returns = returns;
        this.type = returns.map(function($){return $.type}).join(", ");
    }
    
    /*t:
        // todo
    */
    
    // @exception
    this.exceptions = this.comment.getTag("throws");
    
    /*t:
        // todo
    */
    
    // @requires
    var requires = this.comment.getTag("requires");
    if (requires.length) {
        this.requires = requires.map(function($){return $.desc});
    }
    
    /*t:
        // todo
    */
    
    // @type
    var types = this.comment.getTag("type");
    if (types.length) {
        this.type = types[0].desc; //multiple type tags are ignored
    }
    
    /*t:
        // todo
    */
    
    // @private
    if (this.comment.getTag("private").length || this.isInner) {
        this.isPrivate = true;
    }
    
    // @ignore
    if (this.comment.getTag("ignore").length) {
        this.isIgnored = true;
    }
    
    /*t:
        // todo
    */
    
    // @inherits ... as ...
    var inherits = this.comment.getTag("inherits");
    if (inherits.length) {
        for (var i = 0; i < inherits.length; i++) {
            if (/^\s*([a-z$0-9_.#-]+)(?:\s+as\s+([a-z$0-9_.#]+))?/i.test(inherits[i].desc)) {
                var inAlias = RegExp.$1;
                var inAs = RegExp.$2 || inAlias;

                if (inAlias) inAlias = inAlias.replace(/\.prototype\.?/g, "#");
                
                if (inAs) {
                    inAs = inAs.replace(/\.prototype\.?/g, "#");
                    inAs = inAs.replace(/^this\.?/, "#");
                }

                if (inAs.indexOf(inAlias) != 0) { //not a full namepath
                    var joiner = ".";
                    if (this.alias.charAt(this.alias.length-1) == "#" || inAs.charAt(0) == "#") {
                        joiner = "";
                    }
                    inAs = this.alias + joiner + inAs;
                }
            }
            this.inherits.push({alias: inAlias, as: inAs});
        }
    }
    
    /*t:
        // todo
    */

    // @augments
    this.augments = this.comment.getTag("augments");
    
    // @default
    var defaults = this.comment.getTag("default");
    if (defaults.length) {
        if (this.is("OBJECT")) {
            this.defaultValue = defaults[0].desc;
        }
    }
    
    /*t:
        // todo
    */
    
    // @memberOf
    var memberOfs = this.comment.getTag("memberOf");
    if (memberOfs.length) {
        this.memberOf = memberOfs[0].desc;
        this.memberOf = this.memberOf.replace(/\.prototype\.?/g, "#");
    }

    /*t:
        // todo
    */
    
    // @public
    if (this.comment.getTag("public").length) {
        this.isPrivate = false;
    }
    
    /*t:
        // todo
    */
}

JSDOC.Symbol.prototype.is = function(what) {
    return this.isa === what;
}

JSDOC.Symbol.prototype.isBuiltin = function() {
    return JSDOC.Lang.isBuiltin(this.alias);
}

JSDOC.Symbol.prototype.setType = function(/**String*/comment, /**Boolean*/overwrite) {
    if (!overwrite && this.type) return;
    var typeComment = JSDOC.DocComment.unwrapComment(comment);
    this.type = typeComment;
}

JSDOC.Symbol.prototype.inherit = function(symbol) {
    if (!this.hasMember(symbol.name) && !symbol.isInner) {
        if (symbol.is("FUNCTION"))
            this.methods.push(symbol);
        else if (symbol.is("OBJECT"))
            this.properties.push(symbol);
    }
}

JSDOC.Symbol.prototype.hasMember = function(name) {
    return (this.hasMethod(name) || this.hasProperty(name));
}

JSDOC.Symbol.prototype.addMember = function(symbol) {
    if (symbol.is("FUNCTION")) { this.addMethod(symbol); }
    else if (symbol.is("OBJECT")) { this.addProperty(symbol); }
}

JSDOC.Symbol.prototype.hasMethod = function(name) {
    var thisMethods = this.methods;
    for (var i = 0, l = thisMethods.length; i < l; i++) {
        if (thisMethods[i].name == name) return true;
        if (thisMethods[i].alias == name) return true;
    }
    return false;
}

JSDOC.Symbol.prototype.addMethod = function(symbol) {
    var methodAlias = symbol.alias;
    var thisMethods = this.methods;
    for (var i = 0, l = thisMethods.length; i < l; i++) {
        if (thisMethods[i].alias == methodAlias) {
            thisMethods[i] = symbol; // overwriting previous method
            return;
        }
    }
    thisMethods.push(symbol); // new method with this alias
}

JSDOC.Symbol.prototype.hasProperty = function(name) {
    var thisProperties = this.properties;
    for (var i = 0, l = thisProperties.length; i < l; i++) {
        if (thisProperties[i].name == name) return true;
        if (thisProperties[i].alias == name) return true;
    }
    return false;
}

JSDOC.Symbol.prototype.addProperty = function(symbol) {
    var propertyAlias = symbol.alias;
    var thisProperties = this.properties;
    for (var i = 0, l = thisProperties.length; i < l; i++) {
        if (thisProperties[i].alias == propertyAlias) {
            thisProperties[i] = symbol; // overwriting previous property
            return;
        }
    }

    thisProperties.push(symbol); // new property with this alias
}

JSDOC.Symbol.srcFile = ""; //running reference to the current file being parsed

/** @constructor */
JSDOC.SymbolSet = function() {
    this.init();
}

JSDOC.SymbolSet.prototype.init = function() {
    this._index = new Hash();
}

JSDOC.SymbolSet.prototype.keys = function() {
    return this._index.keys();
}

JSDOC.SymbolSet.prototype.hasSymbol = function(alias) {
    return this._index.hasKey(alias);
}

JSDOC.SymbolSet.prototype.addSymbol = function(symbol) {
    if (this.hasSymbol(symbol.alias)) {
        Log.warn("Overwriting symbol documentation for: "+symbol.alias + ".");
    }
    this._index.set(symbol.alias, symbol);
}

JSDOC.SymbolSet.prototype.getSymbol = function(alias) {
    if (this.hasSymbol(alias)) return this._index.get(alias);
}

JSDOC.SymbolSet.prototype.getSymbolByName = function(name) {
    for (var p = this._index.first(); p; p = this._index.next()) {
        var symbol = p.value;
        if (symbol.name == name) return symbol;
    }
}

JSDOC.SymbolSet.prototype.toArray = function() {
    return this._index.values();
}

JSDOC.SymbolSet.prototype.deleteSymbol = function(alias) {
    if (!this.hasSymbol(alias)) return;
    this._index.drop(alias);
}

JSDOC.SymbolSet.prototype.renameSymbol = function(oldName, newName) {
    // todo: should check if oldname or newname already exist
    this._index.replace(oldName, newName);
    this._index.get(newName).alias = newName;
    return newName;
}

JSDOC.SymbolSet.prototype.relate = function() {
    this.resolveBorrows();
    this.resolveMemberOf();
    this.resolveAugments();
}

JSDOC.SymbolSet.prototype.resolveBorrows = function() {
    for (var p = this._index.first(); p; p = this._index.next()) {
        var symbol = p.value;
        if (symbol.is("FILE") || symbol.is("GLOBAL")) continue;
        
        var borrows = symbol.inherits;
        for (var i = 0; i < borrows.length; i++) {
            var borrowed = this.getSymbol(borrows[i].alias);
            if (!borrowed) {
                Log.warn("Can't borrow undocumented "+borrows[i].alias+".");
                continue;
            }
            
            var borrowAsName = borrows[i].as;
            var borrowAsAlias = borrowAsName;
            if (!borrowAsName) {
                Log.warn("Malformed @borrow, 'as' is required.");
                continue;
            }
            
            if (borrowAsName.length > symbol.alias.length && borrowAsName.indexOf(symbol.alias) == 0) {
                borrowAsName = borrowAsName.replace(borrowed.alias, "")
            }
            else {
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
}

JSDOC.SymbolSet.prototype.resolveMemberOf = function() {
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
                if (JSDOC.Lang.isBuiltin(symbol.memberOf)) container = JSDOC.Parser.addBuiltin(symbol.memberOf);
                else {
                    Log.warn("Can't document "+symbol.name +" as a member of undocumented symbol "+symbol.memberOf+".");
                }
            }
            
            if (container) container.addMember(symbol);
        }
    }
}

JSDOC.SymbolSet.prototype.resolveAugments = function() {
    for (var p = this._index.first(); p; p = this._index.next()) {
        var symbol = p.value;
        
        if (symbol.alias == "_global_" || symbol.is("FILE")) continue;
        JSDOC.SymbolSet.prototype.walk.apply(this, [symbol]);
    }
}

JSDOC.SymbolSet.prototype.walk = function(symbol) {
    var augments = symbol.augments;
    for(var i = 0; i < augments.length; i++) {
        var contributer = this.getSymbol(augments[i]);
        if (contributer) {
            if (contributer.augments.length) {
                JSDOC.SymbolSet.prototype.walk.apply(this, [contributer]);
            }
            
            symbol.inheritsFrom.push(contributer.alias);
            if (!isUnique(symbol.inheritsFrom)) {
                //Log.warn("Can't resolve augments: Circular reference: "+symbol.alias+" inherits from "+contributer.alias+" more than once.");
            }
            else {
                var cmethods = contributer.methods;
                var cproperties = contributer.properties;
                
                for (var ci = 0, cl = cmethods.length; ci < cl; ci++)
                    symbol.inherit(cmethods[ci]);
                for (var ci = 0, cl = cproperties.length; ci < cl; ci++)
                    symbol.inherit(cproperties[ci]);
            }
        }
        else Log.warn("Can't augment contributer: "+augments[i]+", not found.");
    }
}



/**
    @constructor
*/
JSDOC.TextStream = function(text) {
    if (typeof(text) == "undefined") text = "";
    text = ""+text;
    this.text = text;
    this.cursor = 0;
}

JSDOC.TextStream.prototype.look = function(n) {
    if (typeof n == "undefined") n = 0;
    
    if (this.cursor+n < 0 || this.cursor+n >= this.text.length) {
        var result = new String("");
        result.eof = true;
        return result;
    }
    return this.text.charAt(this.cursor+n);
}

JSDOC.TextStream.prototype.next = function(n) {
    if (typeof n == "undefined") n = 1;
    if (n < 1) return null;
    
    var pulled = "";
    for (var i = 0; i < n; i++) {
        if (this.cursor+i < this.text.length) {
            pulled += this.text.charAt(this.cursor+i);
        }
        else {
            var result = new String("");
            result.eof = true;
            return result;
        }
    }

    this.cursor += n;
    return pulled;
}


/**
    @constructor
*/
JSDOC.Token = function(data, type, name) {
    this.data = data;
    this.type = type;
    this.name = name;
}

JSDOC.Token.prototype.toString = function() { 
    return "<"+this.type+" name=\""+this.name+"\">"+this.data+"</"+this.type+">";
}

JSDOC.Token.prototype.is = function(what) {
    return this.name === what || this.type === what;
}


/**
    @class Search a {@link JSDOC.TextStream} for language tokens.
*/
JSDOC.TokenReader = function() {
    this.keepDocs = true;
    this.keepWhite = false;
    this.keepComments = false;
}

/**
    @type {JSDOC.Token[]}
 */
JSDOC.TokenReader.prototype.tokenize = function(/**JSDOC.TextStream*/stream) {
    var tokens = [];
    /**@ignore*/
    tokens.last    = function() { return tokens[tokens.length-1]; }
    /**@ignore*/
    tokens.lastSym = function() {
        for (var i = tokens.length-1; i >= 0; i--) {
            if (!(tokens[i].is("WHIT") || tokens[i].is("COMM"))) return tokens[i];
        }
    };

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
        tokens.push(new JSDOC.Token(stream.next(), "TOKN", "UNKNOWN_TOKEN"));
    }
    return tokens;
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_word = function(/**JSDOC.TokenStream*/stream, tokens) {
    var found = "";
    while (!stream.look().eof && JSDOC.Lang.isWordChar(stream.look())) {
        found += stream.next();
    }
    
    if (found === "") {
        return false;
    }
    else {
        var name;
        if ((name = JSDOC.Lang.keyword(found))) tokens.push(new JSDOC.Token(found, "KEYW", name));
        else tokens.push(new JSDOC.Token(found, "NAME", "NAME"));
        return true;
    }
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_punc = function(/**JSDOC.TokenStream*/stream, tokens) {
    var found = "";
    var name;
    while (!stream.look().eof && JSDOC.Lang.punc(found+stream.look())) {
        found += stream.next();
    }
    
    if (found === "") {
        return false;
    }
    else {
        tokens.push(new JSDOC.Token(found, "PUNC", JSDOC.Lang.punc(found)));
        return true;
    }
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_space = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_newline = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_mlcomment = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_slcomment = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_dbquote = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_snquote = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_numb = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}
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
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_hex = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_regx = function(/**JSDOC.TokenStream*/stream, tokens) {
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
}

/**
    @returns {Boolean} Was the token found?
 */
JSDOC.TokenReader.prototype.read_xml = function(/**JSDOC.TokenStream*/stream, tokens) {
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


/**
    @constructor
*/
JSDOC.TokenStream = function(tokens) {
    this.tokens = (tokens || []);
    this.rewind();
}

/**
    @constructor
    @private
*/
function VoidToken(/**String*/type) {
    this.toString = function() {return "<VOID type=\""+type+"\">"};
    this.is = function(){return false;}
}

JSDOC.TokenStream.prototype.rewind = function() {
    this.cursor = -1;
}

/**
    @type JSDOC.Token
*/
JSDOC.TokenStream.prototype.look = function(/**Number*/n, /**Boolean*/considerWhitespace) {
    if (typeof n == "undefined") n = 0;

    if (considerWhitespace == true) {
        if (this.cursor+n < 0 || this.cursor+n > this.tokens.length) return {};
        return this.tokens[this.cursor+n];
    }
    else {
        var count = 0;
        var i = this.cursor;

        while (true) {
            if (i < 0) return new JSDOC.Token("", "VOID", "START_OF_STREAM");
            else if (i > this.tokens.length) return new JSDOC.Token("", "VOID", "END_OF_STREAM");

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

        return new JSDOC.Token("", "VOID", "STREAM_ERROR"); // because null isn't an object and caller always expects an object
    }
}

/**
    @type JSDOC.Token|JSDOC.Token[]
*/
JSDOC.TokenStream.prototype.next = function(/**Number*/howMany) {
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
}

/**
    @type JSDOC.Token[]
*/
JSDOC.TokenStream.prototype.balance = function(/**String*/start, /**String*/stop) {
    if (!stop) stop = JSDOC.Lang.matching(start);
    
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
}

JSDOC.TokenStream.prototype.getMatchingToken = function(/**String*/start, /**String*/stop) {
    var depth = 0;
    var cursor = this.cursor;
    
    if (!start) {
        start = JSDOC.Lang.matching(stop);
        depth = 1;
    }
    if (!stop) stop = JSDOC.Lang.matching(start);
    
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
}

JSDOC.TokenStream.prototype.insertAhead = function(/**JSDOC.Token*/token) {
    this.tokens.splice(this.cursor+1, 0, token);
}

/**
 * @namespace
 * @deprecated Use {@link FilePath} instead.
 */
JSDOC.Util = {}

/**
 * @deprecated Use {@link FilePath.fileName} instead.
 */
JSDOC.Util.fileName = function(path) {
    Log.warn("JSDOC.Util.fileName is deprecated. Use FilePath.fileName instead.");
    var nameStart = Math.max(path.lastIndexOf("/")+1, path.lastIndexOf("\\")+1, 0);
    return path.substring(nameStart);
}

/**
 * @deprecated Use {@link FilePath.fileExtension} instead.
 */
JSDOC.Util.fileExtension = function(filename) {
    Log.warn("JSDOC.Util.fileExtension is deprecated. Use FilePath.fileExtension instead.");
    return filename.split(".").pop().toLowerCase();
};

/**
 * @deprecated Use {@link FilePath.dir} instead.
 */
JSDOC.Util.dir = function(path) {
    Log.warn("JSDOC.Util.dir is deprecated. Use FilePath.dir instead.");
    var nameStart = Math.max(path.lastIndexOf("/")+1, path.lastIndexOf("\\")+1, 0);
    return path.substring(0, nameStart-1);
}


/** @constructor */
JSDOC.Walker = function(/**JSDOC.TokenStream*/ts) {
    this.init();
    if (typeof ts != "undefined") {
        this.walk(ts);
    }
}

JSDOC.Walker.prototype.init = function() {
    this.ts = null;

    var globalSymbol = new JSDOC.Symbol("_global_", [], "GLOBAL", new JSDOC.DocComment(""));
    globalSymbol.isNamespace = true;
    globalSymbol.srcFile = "";
    globalSymbol.isPrivate = false;
    JSDOC.Parser.addSymbol(globalSymbol);
    this.lastDoc = null;
    this.token = null;
    
    /**
        The chain of symbols under which we are currently nested.
        @type Array
    */
    this.namescope = [globalSymbol];
    this.namescope.last = function(n){ if (!n) n = 0; return this[this.length-(1+n)] || "" };
}

JSDOC.Walker.prototype.walk = function(/**JSDOC.TokenStream*/ts) {
    this.ts = ts;
    while (this.token = this.ts.look()) {
        if (this.token.popNamescope) {
            
            var symbol = this.namescope.pop();
            if (symbol.is("FUNCTION")) {
                if (this.ts.look(1).is("LEFT_PAREN") && symbol.comment.getTag("function").length == 0) {
                    symbol.isa = "OBJECT";
                }
            }
        }
        this.step();
        if (!this.ts.next()) break;
    }
}

JSDOC.Walker.prototype.step = function() {
    if (this.token.is("JSDOC")) { // it's a doc comment
    
        var doc = new JSDOC.DocComment(this.token.data);
        
        if (doc.getTag("lends").length > 0) { // it's a new namescope
            var lends = doc.getTag("lends")[0];

            var name = lends.desc
            if (!name) throw "@lends tag requires a value.";
            
            var symbol = new JSDOC.Symbol(name, [], "OBJECT", doc);
            
            this.namescope.push(symbol);
            
            var matching = this.ts.getMatchingToken("LEFT_CURLY");
            if (matching) matching.popNamescope = name;
            else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            
            this.lastDoc = null;
            return true;
        }
        else if (doc.getTag("name").length > 0 && doc.getTag("overview").length == 0) { // it's a virtual symbol
            var virtualName = doc.getTag("name")[0].desc;
            if (!virtualName) throw "@name tag requires a value.";
            
            var symbol = new JSDOC.Symbol(virtualName, [], "VIRTUAL", doc);
            
            JSDOC.Parser.addSymbol(symbol);
            
            this.lastDoc = null;
            return true;
        }
        else if (doc.meta) { // it's a meta doclet
            if (doc.meta == "@+") JSDOC.DocComment.shared = doc.src;
            else if (doc.meta == "@-") JSDOC.DocComment.shared = "";
            else if (doc.meta == "nocode+") JSDOC.Parser.conf.ignoreCode = true;
            else if (doc.meta == "nocode-") JSDOC.Parser.conf.ignoreCode = JSDOC.opt.n;
            else throw "Unrecognized meta comment: "+doc.meta;
            
            this.lastDoc = null;
            return true;
        }
        else if (doc.getTag("overview").length > 0) { // it's a file overview
            symbol = new JSDOC.Symbol("", [], "FILE", doc);
            
            JSDOC.Parser.addSymbol(symbol);
            
            this.lastDoc = null;
            return true;
        }
        else {
            this.lastDoc = doc;
            return false;
        }
    }
    else if (!JSDOC.Parser.conf.ignoreCode) { // it's code
        if (this.token.is("NAME")) {
            var symbol;
            var name = this.token.data;
            var doc = null; if (this.lastDoc) doc = this.lastDoc;
            var params = [];
            
            // it's inside an anonymous object
            if (this.ts.look(1).is("COLON") && this.ts.look(-1).is("LEFT_CURLY") && !(this.ts.look(-2).is("JSDOC") || this.namescope.last().comment.getTag("lends").length || this.ts.look(-2).is("ASSIGN") || this.ts.look(-2).is("COLON"))) {
                name = "$anonymous";
                name = this.namescope.last().alias+"-"+name
                
                params = [];
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);

                JSDOC.Parser.addSymbol(symbol);
                
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken(null, "RIGHT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // function foo() {}
            else if (this.ts.look(-1).is("FUNCTION") && this.ts.look(1).is("LEFT_PAREN")) {
                var isInner;
                
                if (this.lastDoc) doc = this.lastDoc;
                name = this.namescope.last().alias+"-"+name;
                if (!this.namescope.last().is("GLOBAL")) isInner = true;
                
                params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
                
                symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
                if (isInner) symbol.isInner = true;
                
            
                JSDOC.Parser.addSymbol(symbol);
                
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // foo = function() {}
            else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("FUNCTION")) {
                var isInner;
                if (this.ts.look(-1).is("VAR") || this.isInner) {
                    name = this.namescope.last().alias+"-"+name
                    if (!this.namescope.last().is("GLOBAL")) isInner = true;
                }
                else if (name.indexOf("this.") == 0) {
                    name = this.resolveThis(name);
                }
                
                if (this.lastDoc) doc = this.lastDoc;
                params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
                
                symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
                if (isInner) symbol.isInner = true;
                
                JSDOC.Parser.addSymbol(symbol);
                
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // foo = new function() {}
            else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("NEW") && this.ts.look(3).is("FUNCTION")) {
                var isInner;
                if (this.ts.look(-1).is("VAR") || this.isInner) {
                    name = this.namescope.last().alias+"-"+name
                    if (!this.namescope.last().is("GLOBAL")) isInner = true;
                }
                else if (name.indexOf("this.") == 0) {
                    name = this.resolveThis(name);
                }
                
                if (this.lastDoc) doc = this.lastDoc;
                params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
                if (isInner) symbol.isInner = true;
                
            
                JSDOC.Parser.addSymbol(symbol);
                
                symbol.scopeType = "INSTANCE";
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // foo: function() {}
            else if (this.ts.look(1).is("COLON") && this.ts.look(2).is("FUNCTION")) {
                name = (this.namescope.last().alias+"."+name).replace("#.", "#");
                
                if (this.lastDoc) doc = this.lastDoc;
                params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
                
                if (doc && doc.getTag("constructs").length) {
                    name = name.replace(/\.prototype(\.|$)/, "#");
                    
                    if (name.indexOf("#") > -1) name = name.match(/(^[^#]+)/)[0];
                    else name = this.namescope.last().alias;

                    symbol = new JSDOC.Symbol(name, params, "CONSTRUCTOR", doc);
                }
                else {
                    symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
                }
                
                
                JSDOC.Parser.addSymbol(symbol);
                
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // foo = {}
            else if (this.ts.look(1).is("ASSIGN") && this.ts.look(2).is("LEFT_CURLY")) {
                var isInner;
                if (this.ts.look(-1).is("VAR") || this.isInner) {
                    name = this.namescope.last().alias+"-"+name
                    if (!this.namescope.last().is("GLOBAL")) isInner = true;
                }
                else if (name.indexOf("this.") == 0) {
                    name = this.resolveThis(name);
                }
                
                if (this.lastDoc) doc = this.lastDoc;
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
                if (isInner) symbol.isInner = true;
                
            
                if (doc) JSDOC.Parser.addSymbol(symbol);

                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // var foo;
            else if (this.ts.look(1).is("SEMICOLON")) {
                
                var isInner;
                if (this.ts.look(-1).is("VAR") || this.isInner) {
                    name = this.namescope.last().alias+"-"+name
                    if (!this.namescope.last().is("GLOBAL")) isInner = true;
                }
                else if (name.indexOf("this.") == 0) {
                    name = this.resolveThis(name);
                }
                
                if (this.lastDoc) doc = this.lastDoc;
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
                if (isInner) symbol.isInner = true;
                
            
                if (doc) JSDOC.Parser.addSymbol(symbol);
            }
            // foo = x
            else if (this.ts.look(1).is("ASSIGN")) {
                
                var isInner;
                if (this.ts.look(-1).is("VAR") || this.isInner) {
                    name = this.namescope.last().alias+"-"+name
                    if (!this.namescope.last().is("GLOBAL")) isInner = true;
                }
                else if (name.indexOf("this.") == 0) {
                    name = this.resolveThis(name);
                }
                
                if (this.lastDoc) doc = this.lastDoc;
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
                if (isInner) symbol.isInner = true;
                
            
                if (doc) JSDOC.Parser.addSymbol(symbol);
            }
            // foo: {}
            else if (this.ts.look(1).is("COLON") && this.ts.look(2).is("LEFT_CURLY")) {
                name = (this.namescope.last().alias+"."+name).replace("#.", "#");
                
                if (this.lastDoc) doc = this.lastDoc;
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
                
            
                if (doc) JSDOC.Parser.addSymbol(symbol);
                
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
            // foo: x
            // get x()
            // set x()
            else if (this.ts.look(1).is("COLON") || this.ts.look(-1).is("GET") || this.ts.look(-1).is("SET")) {
                name = (this.namescope.last().alias+"."+name).replace("#.", "#");;
                
                if (this.lastDoc) doc = this.lastDoc;
                
                symbol = new JSDOC.Symbol(name, params, "OBJECT", doc);
                
            
                if (doc) JSDOC.Parser.addSymbol(symbol);
            }
            // foo(...)
            else if (this.ts.look(1).is("LEFT_PAREN")) {
                var functionCall = {name: name};
                if (!this.ts.look(2).is("RIGHT_PAREN")) functionCall.arg1 = this.ts.look(2).data;
                
                if (typeof JSDOC.PluginManager != "undefined") {
                    JSDOC.PluginManager.run("onFunctionCall", functionCall);
                    if (functionCall.doc) {
                        this.ts.insertAhead(new JSDOC.Token(functionCall.doc, "COMM", "JSDOC"));
                    }
                }
            }
            this.lastDoc = null;
        }
        else if (this.token.is("FUNCTION")) { // it's an anonymous function
            if (
                (!this.ts.look(-1).is("COLON") || !this.ts.look(-1).is("ASSIGN"))
                && !this.ts.look(1).is("NAME")
            ) {
                if (this.lastDoc) doc = this.lastDoc;
                
                name = "$anonymous";
                name = this.namescope.last().alias+"-"+name
                
                params = JSDOC.Walker.onParamList(this.ts.balance("LEFT_PAREN"));
                
                symbol = new JSDOC.Symbol(name, params, "FUNCTION", doc);
                
            
                JSDOC.Parser.addSymbol(symbol);
                
                this.namescope.push(symbol);
                
                var matching = this.ts.getMatchingToken("LEFT_CURLY");
                if (matching) matching.popNamescope = name;
                else Log.warn("Mismatched } character. Can't parse code in file " + symbol.srcFile + ".");
            }
        }
    }
    return true;
}

/**
    Resolves what "this." means when it appears in a name.
    @param name The name that starts with "this.".
    @returns The name with "this." resolved.
 */
JSDOC.Walker.prototype.resolveThis = function(name) {
    name.match(/^this\.(.+)$/)
    var nameFragment = RegExp.$1;
    if (!nameFragment) return name;
    
    var symbol = this.namescope.last();
    var scopeType = symbol.scopeType || symbol.isa;

    // if we are in a constructor function, `this` means the instance
    if (scopeType == "CONSTRUCTOR") {
        name = symbol.alias+"#"+nameFragment;
    }
    
    // if we are in an anonymous constructor function, `this` means the instance
    else if (scopeType == "INSTANCE") {
        name = symbol.alias+"."+nameFragment;
    }
    
    // if we are in a function, `this` means the container (possibly the global)
    else if (scopeType == "FUNCTION") {
        // in a method of a prototype, so `this` means the constructor
        if (symbol.alias.match(/(^.*)[#.-][^#.-]+/)) {
            var parentName = RegExp.$1;
            var parent = JSDOC.Parser.symbols.getSymbol(parentName);

            if (!parent) {
                if (JSDOC.Lang.isBuiltin(parentName)) parent = JSDOC.Parser.addBuiltin(parentName);
                else {
                    if (symbol.alias.indexOf("$anonymous") < 0) // these will be ignored eventually
                        Log.warn("Can't document "+symbol.alias+" without first documenting "+parentName+".");
                }
            }
            if (parent) name = parentName+(parent.is("CONSTRUCTOR")?"#":".")+nameFragment;
        }
        else {
            parent = this.namescope.last(1);
            name = parent.alias+(parent.is("CONSTRUCTOR")?"#":".")+nameFragment;
        }
    }
    // otherwise it means the global
    else {
        name = nameFragment;
    }
    
    return name;
}

JSDOC.Walker.onParamList = function(/**Array*/paramTokens) {
    if (!paramTokens) {
        Log.warn("Malformed parameter list. Can't parse code.");
        return [];
    }
    var params = [];
    for (var i = 0, l = paramTokens.length; i < l; i++) {
        if (paramTokens[i].is("JSDOC")) {
            var paramType = paramTokens[i].data.replace(/(^\/\*\* *| *\*\/$)/g, "");
            
            if (paramTokens[i+1] && paramTokens[i+1].is("NAME")) {
                i++;
                params.push({type: paramType, name: paramTokens[i].data});
            }
        }
        else if (paramTokens[i].is("NAME")) {
            params.push({name: paramTokens[i].data});
        }
    }
    return params;
}
