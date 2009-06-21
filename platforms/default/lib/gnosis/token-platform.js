/**
 * This class implements the JavaScript scanner.
 * It is based on Java class {@code org.mozilla.javascript.Token}
 * @see Parser
 * @class
 * @author Irakli Gozalishvili
 */
exports.Token = Token = {
    /**
     * Returns a name for the token
     * @returns {String}
     */
    name: function(token) { return this.typeToName(token); },
    /**
     * Always returns a human-readable string for the token name.
     * For instance, {@link #FINALLY} has the name "FINALLY".
     * @param {Integer}         token the token code
     * @returns {String}        the actual name for the token code
     */
    typeToName: function(token) {
        switch (token) {
            case this.ERROR:           return "ERROR";
            case this.EOF:             return "EOF";
            case this.EOL:             return "EOL";
            case this.ENTERWITH:       return "ENTERWITH";
            case this.LEAVEWITH:       return "LEAVEWITH";
            case this.RETURN:          return "RETURN";
            case this.GOTO:            return "GOTO";
            case this.IFEQ:            return "IFEQ";
            case this.IFNE:            return "IFNE";
            case this.SETNAME:         return "SETNAME";
            case this.BITOR:           return "BITOR";
            case this.BITXOR:          return "BITXOR";
            case this.BITAND:          return "BITAND";
            case this.EQ:              return "EQ";
            case this.NE:              return "NE";
            case this.LT:              return "LT";
            case this.LE:              return "LE";
            case this.GT:              return "GT";
            case this.GE:              return "GE";
            case this.LSH:             return "LSH";
            case this.RSH:             return "RSH";
            case this.URSH:            return "URSH";
            case this.ADD:             return "ADD";
            case this.SUB:             return "SUB";
            case this.MUL:             return "MUL";
            case this.DIV:             return "DIV";
            case this.MOD:             return "MOD";
            case this.NOT:             return "NOT";
            case this.BITNOT:          return "BITNOT";
            case this.POS:             return "POS";
            case this.NEG:             return "NEG";
            case this.NEW:             return "NEW";
            case this.DELPROP:         return "DELPROP";
            case this.TYPEOF:          return "TYPEOF";
            case this.GETPROP:         return "GETPROP";
            case this.GETPROPNOWARN:   return "GETPROPNOWARN";
            case this.SETPROP:         return "SETPROP";
            case this.GETELEM:         return "GETELEM";
            case this.SETELEM:         return "SETELEM";
            case this.CALL:            return "CALL";
            case this.NAME:            return "NAME";
            case this.NUMBER:          return "NUMBER";
            case this.STRING:          return "STRING";
            case this.NULL:            return "NULL";
            case this.THIS:            return "THIS";
            case this.FALSE:           return "FALSE";
            case this.TRUE:            return "TRUE";
            case this.SHEQ:            return "SHEQ";
            case this.SHNE:            return "SHNE";
            case this.REGEXP:          return "REGEXP";
            case this.BINDNAME:        return "BINDNAME";
            case this.THROW:           return "THROW";
            case this.RETHROW:         return "RETHROW";
            case this.IN:              return "IN";
            case this.INSTANCEOF:      return "INSTANCEOF";
            case this.LOCAL_LOAD:      return "LOCAL_LOAD";
            case this.GETVAR:          return "GETVAR";
            case this.SETVAR:          return "SETVAR";
            case this.CATCH_SCOPE:     return "CATCH_SCOPE";
            case this.ENUM_INIT_KEYS:  return "ENUM_INIT_KEYS";
            case this.ENUM_INIT_VALUES:return "ENUM_INIT_VALUES";
            case this.ENUM_INIT_ARRAY: return "ENUM_INIT_ARRAY";
            case this.ENUM_NEXT:       return "ENUM_NEXT";
            case this.ENUM_ID:         return "ENUM_ID";
            case this.THISFN:          return "THISFN";
            case this.RETURN_RESULT:   return "RETURN_RESULT";
            case this.ARRAYLIT:        return "ARRAYLIT";
            case this.OBJECTLIT:       return "OBJECTLIT";
            case this.GET_REF:         return "GET_REF";
            case this.SET_REF:         return "SET_REF";
            case this.DEL_REF:         return "DEL_REF";
            case this.REF_CALL:        return "REF_CALL";
            case this.REF_SPECIAL:     return "REF_SPECIAL";
            case this.DEFAULTNAMESPACE:return "DEFAULTNAMESPACE";
            case this.ESCXMLTEXT:      return "ESCXMLTEXT";
            case this.ESCXMLATTR:      return "ESCXMLATTR";
            case this.REF_MEMBER:      return "REF_MEMBER";
            case this.REF_NS_MEMBER:   return "REF_NS_MEMBER";
            case this.REF_NAME:        return "REF_NAME";
            case this.REF_NS_NAME:     return "REF_NS_NAME";
            case this.TRY:             return "TRY";
            case this.SEMI:            return "SEMI";
            case this.LB:              return "LB";
            case this.RB:              return "RB";
            case this.LC:              return "LC";
            case this.RC:              return "RC";
            case this.LP:              return "LP";
            case this.RP:              return "RP";
            case this.COMMA:           return "COMMA";
            case this.ASSIGN:          return "ASSIGN";
            case this.ASSIGN_BITOR:    return "ASSIGN_BITOR";
            case this.ASSIGN_BITXOR:   return "ASSIGN_BITXOR";
            case this.ASSIGN_BITAND:   return "ASSIGN_BITAND";
            case this.ASSIGN_LSH:      return "ASSIGN_LSH";
            case this.ASSIGN_RSH:      return "ASSIGN_RSH";
            case this.ASSIGN_URSH:     return "ASSIGN_URSH";
            case this.ASSIGN_ADD:      return "ASSIGN_ADD";
            case this.ASSIGN_SUB:      return "ASSIGN_SUB";
            case this.ASSIGN_MUL:      return "ASSIGN_MUL";
            case this.ASSIGN_DIV:      return "ASSIGN_DIV";
            case this.ASSIGN_MOD:      return "ASSIGN_MOD";
            case this.HOOK:            return "HOOK";
            case this.COLON:           return "COLON";
            case this.OR:              return "OR";
            case this.AND:             return "AND";
            case this.INC:             return "INC";
            case this.DEC:             return "DEC";
            case this.DOT:             return "DOT";
            case this.FUNCTION:        return "FUNCTION";
            case this.EXPORT:          return "EXPORT";
            case this.IMPORT:          return "IMPORT";
            case this.IF:              return "IF";
            case this.ELSE:            return "ELSE";
            case this.SWITCH:          return "SWITCH";
            case this.CASE:            return "CASE";
            case this.DEFAULT:         return "DEFAULT";
            case this.WHILE:           return "WHILE";
            case this.DO:              return "DO";
            case this.FOR:             return "FOR";
            case this.BREAK:           return "BREAK";
            case this.CONTINUE:        return "CONTINUE";
            case this.VAR:             return "VAR";
            case this.WITH:            return "WITH";
            case this.CATCH:           return "CATCH";
            case this.FINALLY:         return "FINALLY";
            case this.VOID:            return "VOID";
            case this.RESERVED:        return "RESERVED";
            case this.EMPTY:           return "EMPTY";
            case this.BLOCK:           return "BLOCK";
            case this.LABEL:           return "LABEL";
            case this.TARGET:          return "TARGET";
            case this.LOOP:            return "LOOP";
            case this.EXPR_VOID:       return "EXPR_VOID";
            case this.EXPR_RESULT:     return "EXPR_RESULT";
            case this.JSR:             return "JSR";
            case this.SCRIPT:          return "SCRIPT";
            case this.TYPEOFNAME:      return "TYPEOFNAME";
            case this.USE_STACK:       return "USE_STACK";
            case this.SETPROP_OP:      return "SETPROP_OP";
            case this.SETELEM_OP:      return "SETELEM_OP";
            case this.LOCAL_BLOCK:     return "LOCAL_BLOCK";
            case this.SET_REF_OP:      return "SET_REF_OP";
            case this.DOTDOT:          return "DOTDOT";
            case this.COLONCOLON:      return "COLONCOLON";
            case this.XML:             return "XML";
            case this.DOTQUERY:        return "DOTQUERY";
            case this.XMLATTR:         return "XMLATTR";
            case this.XMLEND:          return "XMLEND";
            case this.TO_OBJECT:       return "TO_OBJECT";
            case this.TO_DOUBLE:       return "TO_DOUBLE";
            case this.GET:             return "GET";
            case this.SET:             return "SET";
            case this.LET:             return "LET";
            case this.YIELD:           return "YIELD";
            case this.CONST:           return "CONST";
            case this.SETCONST:        return "SETCONST";
            case this.ARRAYCOMP:       return "ARRAYCOMP";
            case this.WITHEXPR:        return "WITHEXPR";
            case this.LETEXPR:         return "LETEXPR";
            case this.DEBUGGER:        return "DEBUGGER";
            case this.COMMENT:         return "COMMENT";
            // Token without name
            default: throw new Error("Unknown Token: " + token);
        }
    },
    /**
     * Return true if the passed code is a valid Token constant.
     * @param code a potential token code
     * @return true if it's a known token
     */
    isValidToken: function(code) {
        return (code >= this.ERROR && code <= this.LAST_TOKEN);
    },
    /**
     *
     */
    CommentType: [ this.LINE, this.BLOCK, this.JSDOC, this.HTML],
    /**
     * Well-known as the only code < EOF
     * @type Integer
     */
    ERROR: -1,
    /**
     * End of file token - (not EOF_CHAR)
     * @type Integer
     */
    EOF: 0,
    /**
     * End of line
     * @type Integer
     */
    EOL: 1,
    /**
     * Interpreter reuses the following as bytecodes
     * @type Integer
     */
    FIRST_BYTECODE_TOKEN: 2,
    /**
     * @type Integer
     */
     ENTERWITH: 2,
    /**
     * @type Integer
     */
    LEAVEWITH: 3,
    /**
     * @type Integer
     */
    RETURN: 4,
    /**
     * @type Integer
     */
    GOTO: 5,
    /**
     * @type Integer
     */
    IFEQ: 6,
    /**
     * @type Integer
     */
    IFNE: 7,
    /**
     * @type Integer
     */
    SETNAME: 8,
    /**
     * @type Integer
     */
    BITOR: 9,
    /**
     * @type Integer
     */
    BITXOR: 10,
    /**
     * @type Integer
     */
    BITAND: 11,
    /**
     * @type Integer
     */
    EQ: 12,
    /**
     * @type Integer
     */
    NE: 13,
    /**
     * @type Integer
     */
    LT: 14,
    /**
     * @type Integer
     */
    LE: 15,
    /**
     * @type Integer
     */
    GT: 16,
    /**
     * @type Integer
     */
    GE: 17,
    /**
     * @type Integer
     */
    LSH: 18,
    /**
     * @type Integer
     */
    RSH: 19,
    /**
     * @type Integer
     */
    URSH: 20,
    /**
     * @type Integer
     */
    ADD: 21,
    /**
     * @type Integer
     */
    SUB: 22,
    /**
     * @type Integer
     */
    MUL: 23,
    /**
     * @type Integer
     */
    DIV: 24,
    /**
     * @type Integer
     */
    MOD: 25,
    /**
     * @type Integer
     */
    NOT: 26,
    /**
     * @type Integer
     */
    BITNOT: 27,
    /**
     * @type Integer
     */
    POS: 28,
    /**
     * @type Integer
     */
    NEG: 29,
    /**
     * @type Integer
     */
    NEW: 30,
    /**
     * @type Integer
     */
    DELPROP: 31,
    /**
     * @type Integer
     */
    TYPEOF: 32,
    /**
     * @type Integer
     */
    GETPROP: 33,
    /**
     * @type Integer
     */
    GETPROPNOWARN: 34,
    /**
     * @type Integer
     */
    SETPROP: 35,
    /**
     * @type Integer
     */
    GETELEM: 36,
    /**
     * @type Integer
     */
    SETELEM: 37,
    /**
     * @type Integer
     */
    CALL: 38,
    /**
     * @type Integer
     */
    NAME: 39,
    /**
     * @type Integer
     */
    NUMBER: 40,
    /**
     * @type Integer
     */
    STRING: 41,
    /**
     * @type Integer
     */
    NULL: 42,
    /**
     * @type Integer
     */
    THIS: 43,
    /**
     * @type Integer
     */
    FALSE: 44,
    /**
     * @type Integer
     */
    TRUE: 45,
    /**
     * Shallow equality (===)
     * @type Integer
     */
    SHEQ: 46,
    /**
     * shallow inequality (!==)
     * @type Integer
     */
    SHNE: 47,
    REGEXP: 48,
    /**
     * @type Integer
     */
    BINDNAME: 49,
    /**
     * @type Integer
     */
    THROW: 50,
    /**
     * Rethrow caught exception: catch (e if ) use it
     * @type Integer
     */
    RETHROW: 51,
    /**
     * @type Integer
     */
    IN: 52,
    /**
     * @type Integer
     */
    INSTANCEOF: 53,
    /**
     * @type Integer
     */
    LOCAL_LOAD: 54,
    /**
     * @type Integer
     */
    GETVAR: 55,
    /**
     * @type Integer
     */
    SETVAR: 56,
    /**
     * @type Integer
     */
    CATCH_SCOPE: 57,
    /**
     * @type Integer
     */
    ENUM_INIT_KEYS: 58,
    /**
     * @type Integer
     */
    ENUM_INIT_VALUES: 59,
    /**
     * @type Integer
     */
    ENUM_INIT_ARRAY: 60,
    /**
     * @type Integer
     */
    ENUM_NEXT: 61,
    /**
     * @type Integer
     */
    ENUM_ID: 62,
    /**
     * @type Integer
     */
    THISFN: 63,
    /**
     * To return previously stored return result
     * @type Integer
     */
    RETURN_RESULT: 64,
    /**
     * Array literal
     * @type Integer
     */
    ARRAYLIT: 65,
    /**
     * Object literal
     * @type Integer
     */
    OBJECTLIT: 66,
    /**
     * Reference
     * @type Integer
     */
    GET_REF: 67,
    /**
     * Reference = something
     * @type Integer
     */
    SET_REF: 68,
    /**
     * Delete reference
     * @type Integer
     */
    DEL_REF: 69,
    /**
     * f(args) = something or f(args)++
     * @type Integer
     */
    REF_CALL: 70,
    /**
     * Reference for special properties like __proto__
     * @type Integer
     */
    REF_SPECIAL: 71,
    /**
     * JS 1.7 yield pseudo keyword
     * @type Integer
     */
    YIELD: 72,
    
    
    // For XML support:
    
    
    /**
     * default xml namespace =
     * @type Integer
     */
    DEFAULTNAMESPACE: 73,
    /**
     * @type Integer
     */
    ESCXMLATTR: 74,
    /**
     * @type Integer
     */
    ESCXMLTEXT: 75,
    /**
     * Reference for x.@y; x..y etc.
     * @type Integer
     */
    REF_MEMBER: 76,
    /**
     * Reference for x.ns::y; x..ns::y etc.
     * @type Integer
     */
    REF_NS_MEMBER: 77,
    /**
     * Reference for @y; @[y] etc.
     * @type Integer
     */
    REF_NAME: 78,
    /**
     * Reference for ns::y; @ns::y@[y] etc.
     * @type Integer
     */
    REF_NS_NAME: 79,
    
    
    // End of interpreter bytecodes
    
    
    /**
     * @type Integer
     */
    LAST_BYTECODE_TOKEN: this.REF_NS_NAME,
    /**
     * @type Integer
     */
     TRY: 80,
    /**
     * semicolon
     * @type Integer
     */
    SEMI: 81,
    /**
     * left and right brackets
     * @type Integer
     */
    LB: 82,
    /**
     * @type Integer
     */
    RB: 83,
    /**
     * left and right curlies (braces)
     * @type Integer
     */
    LC: 84,
    /**
     * @type Integer
     */
    RC: 85,
    /**
     * Left and right parentheses
     * @type Integer
     */
    LP: 86,
    /**
     * @type Integer
     */
    RP: 87,
    /**
     * Comma operator
     * @type Integer
     */
    COMMA: 88,
    /**
     * simple assignment  (=)
     * @type Integer
     */
     ASSIGN: 89,
    /**
     * |=
     * @type Integer
     */
    ASSIGN_BITOR: 90,
    /**
     * ^=
     * @type Integer
     */
    ASSIGN_BITXOR: 91,
    /**
     * |=
     * @type Integer
     */
    ASSIGN_BITAND: 92,
    /**
     * <<=
     * @type Integer
     */
    ASSIGN_LSH: 93,
    /**
     * >>=
     * @type Integer
     */
    ASSIGN_RSH: 94,
    /**
     * >>>=
     * @type Integer
     */
    ASSIGN_URSH: 95,
    /**
     * +=
     * @type Integer
     */
    ASSIGN_ADD: 96,
    /**
     * -=
     * @type Integer
     */
    ASSIGN_SUB: 97,
    /**
     * *=
     * @type Integer
     */
    ASSIGN_MUL: 98,
    /**
     * /=
     * @type Integer
     */
    ASSIGN_DIV: 99,
    /**
     * %=
     * @type Integer
     */
    ASSIGN_MOD: 100,
    /**
     * @type Integer
     */
    FIRST_ASSIGN: this.ASSIGN,
    /**
     * @type Integer
     */
    LAST_ASSIGN: this.ASSIGN_MOD,
    /**
     * conditional (?:)
     * @type Integer
     */
     HOOK: 101,
    /**
     * @type Integer
     */
    COLON: 102,
    /**
     * logical or (||)
     * @type Integer
     */
    OR: 103,
    /**
     * logical and (&&)
     * @type Integer
     */
    AND: 104,
    /**
     * increment/decrement (++ --)
     * @type Integer
     */
    INC: 105,
    /**
     * @type Integer
     */
    DEC: 106,
    /**
     * member operator (.)
     * @type Integer
     */
    DOT: 107,
    /**
     * function keyword
     * @type Integer
     */
    FUNCTION: 108,
    /**
     * export keyword
     * @type Integer
     */
    EXPORT: 109,
    /**
     * import keyword
     * @type Integer
     */
    IMPORT: 110,
    /**
     * if keyword
     * @type Integer
     */
    IF: 111,
    /**
     * else keyword
     * @type Integer
     */
    ELSE: 112,
    /**
     * switch keyword
     * @type Integer
     */
    SWITCH: 113,
    /**
     * case this.keyword
     * @type Integer
     */
    CASE: 114,
    /**
     * default keyword
     * @type Integer
     */
    DEFAULT: 115,
    /**
     * while keyword
     * @type Integer
     */
    WHILE: 116,
    /**
     * do keyword
     * @type Integer
     */
    DO: 117,
    /**
     * for keyword
     * @type Integer
     */
    FOR: 118,
    /**
     * break keyword
     * @type Integer
     */
    BREAK: 119,
    /**
     * continue keyword
     * @type Integer
     */
    CONTINUE: 120,
    /**
     * var keyword
     * @type Integer
     */
    VAR: 121,
    /**
     * with keyword
     * @type Integer
     */
    WITH: 122,
    /**
     * catch keyword
     * @type Integer
     */
    CATCH: 123,
    /**
     * finally keyword
     * @type Integer
     */
    FINALLY: 124,
    /**
     * void keyword
     * @type Integer
     */
    VOID: 125,
    /**
     * reserved keywords
     * @type Integer
     */
    RESERVED: 126,
    /**
     * @type Integer
     */
     EMPTY: 127,
    
    
    // types used for the parse tree - these never get returned by the scanner.
    
    
    /**
     * statement block
     * @type Integer
     */
     BLOCK: 128,
    /**
     * label
     * @type Integer
     */
    LABEL: 129,
    /**
     * @type Integer
     */
    TARGET: 130,
    /**
     * @type Integer
     */
    LOOP: 131,
    /**
     * Expression statement in functions
     * @type Integer
     */
    EXPR_VOID: 132,
    /**
     * Expression statement in scripts
     * @type Integer
     */
    EXPR_RESULT: 133,
    /**
     * @type Integer
     */
    JSR: 134,
    /**
     * top-level node for entire script
     * @type Integer
     */
    SCRIPT: 135,
    /**
     * for typeof(simple-name)
     * @type Integer
     */
    TYPEOFNAME: 136,
    /**
     * @type Integer
     */
    USE_STACK: 137,
    /**
     * x.y op = something
     * @type Integer
     */
    SETPROP_OP: 138,
    /**
     * x[y] op = something
     * @type Integer
     */
    SETELEM_OP: 139,
    /**
     * @type Integer
     */
    LOCAL_BLOCK: 140,
    /**
     * reference op = something
     * @type Integer
     */
    SET_REF_OP: 141,
    
    
    // For XML support:
    
    
    /**
     * member operator (..)
     * @type Integer
     */
    DOTDOT: 142,
    /**
     * namespace::name
     * @type Integer
     */
    COLONCOLON: 143,
    /**
     * XML type
     * @type Integer
     */
    XML: 144,
    /**
     * .() -- e.g.; x.emps.emp.(name == "terry")
     * @type Integer
     */
    DOTQUERY: 145,
    /**
     * "@"
     * @type Integer
     */
    XMLATTR: 146,
    /**
     * @type Integer
     */
    XMLEND: 147,
    
    
    // Optimizer-only-tokens
    
    
    /**
     * @type Integer
     */
    TO_OBJECT: 148,
    /**
     * @type Integer
     */
    TO_DOUBLE: 149,
    /**
     * JS 1.5 get pseudo keyword
     * @type Integer
     */
    GET: 150,
    /**
     * JS 1.5 set pseudo keyword
     * @type Integer
     */
    SET: 151,
    /**
     * JS 1.7 let pseudo keyword
     * @type Integer
     */
    LET: 152,
    /**
     * @type Integer
     */
    CONST: 153,
    /**
     * @type Integer
     */
    SETCONST: 154,
    /**
     * @type Integer
     */
    SETCONSTVAR: 155,
    /**
     * array comprehension
     * @type Integer
     */
    ARRAYCOMP: 156,
    /**
     * @type Integer
     */
    LETEXPR: 157,
    /**
     * @type Integer
     */
    WITHEXPR: 158,
    /**
     * @type Integer
     */
    DEBUGGER: 159,
    /**
     * @type Integer
     */
    COMMENT: 160,
    /**
     * @type Integer
     */
    LAST_TOKEN: 160
};
