var isBuiltin = exports.isBuiltin = function(name) {
    return (isBuiltin.coreObjects.indexOf(name) > -1);
};
isBuiltin.coreObjects = ['_global_', 'Array', 'Boolean', 'Date', 'Error', 'Function', 'Math', 'Number', 'Object', 'RegExp', 'String'];

var whitespace = exports.whitespace = function(ch) {
    return whitespace.names[ch];
};
whitespace.names = {
    " ":      "SPACE",
    "\f":     "FORMFEED",
    "\t":     "TAB",
    "\u0009": "UNICODE_TAB",
    "\u000A": "UNICODE_NBR",
    "\u0008": "VERTICAL_TAB"
};

var newline = exports.newline = function(ch) {
    return newline.names[ch];
};
newline.names = {
    "\n":     "NEWLINE",
    "\r":     "RETURN",
    "\u000A": "UNICODE_LF",
    "\u000D": "UNICODE_CR",
    "\u2029": "UNICODE_PS",
    "\u2028": "UNICODE_LS"
};

var keyword = exports.keyword = function(word) {
    return keyword.names[word];
};
keyword.names = {
        "break":      "BREAK",
        "case":       "CASE",
        "catch":      "CATCH",
        "const":      "VAR",
        "continue":   "CONTINUE",
        "default":    "DEFAULT",
        "delete":     "DELETE",
        "do":         "DO",
        "else":       "ELSE",
        "false":      "FALSE",
        "finally":    "FINALLY",
        "for":        "FOR",
        "function":   "FUNCTION",
        "if":         "IF",
        "in":         "IN",
        "instanceof": "INSTANCEOF",
        "new":        "NEW",
        "null":       "NULL",
        "return":     "RETURN",
        "switch":     "SWITCH",
        "this":       "THIS",
        "throw":      "THROW",
        "true":       "TRUE",
        "try":        "TRY",
        "typeof":     "TYPEOF",
        "void":       "VOID",
        "while":      "WHILE",
        "with":       "WITH",
        "var":        "VAR"
};


var punc = exports.punc = function(ch) {
    return punc.names[ch];
};
punc.names = {
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

var matching = exports.matching = function(name) {
    return matching.names[name];
};
matching.names = {
    "LEFT_PAREN": "RIGHT_PAREN",
    "RIGHT_PAREN": "LEFT_PAREN",
    "LEFT_CURLY": "RIGHT_CURLY",
    "RIGHT_CURLY": "LEFT_CURLY",
    "LEFT_BRACE": "RIGHT_BRACE",
    "RIGHT_BRACE": "LEFT_BRACE"
};

exports.isNumber = function(str) {
    return /^(\.[0-9]|[0-9]+\.|[0-9])[0-9]*([eE][+-][0-9]+)?$/i.test(str);
}

exports.isHexDec = function(str) {
    return /^0x[0-9A-F]+$/i.test(str);
}

exports.isWordChar = function(str) {
    return /^[a-zA-Z0-9$_.]+$/.test(str);
}

exports.isSpace = function(str) {
    return (typeof whitespace(str) != "undefined");
}

exports.isNewline = function(str) {
    return (typeof newline(str) != "undefined");
}