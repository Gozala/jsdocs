var assert = require("test/assert");
var DocTag = require("jsdocs/doc-tag").DocTag;
var DocComment = require("jsdocs/doc-comment").DocComment;
var Symbol = require("jsdocs/symbol").Symbol;

exports["test:testing Symbol"] = function() {
    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@author Joe Smith*"+"/"));
    assert.is(sym.author, "Joe Smith", "@author tag, author is found.");
};

exports["test:testing setTag"] = function() {
    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@desc This is a description.*"+"/"));
    assert.is(sym.desc, "This is a description.", "@desc tag, description is found.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@overview This is an overview.*"+"/"));
    assert.is(sym.desc, "\nThis is an overview.", "@overview tag, description is found.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@since 1.01*"+"/"));
    assert.is(sym.since, "1.01", "@since tag, description is found.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@constant*"+"/"));
    assert.is(sym.isConstant, true, "@constant tag, isConstant set.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@version 2.0x*"+"/"));
    assert.is(sym.version, "2.0x", "@version tag, version is found.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@deprecated Use other method.*"+"/"));
    assert.is(sym.deprecated, "Use other method.", "@deprecated tag, desc is found.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@example This\n  is an example. \n*"+"/"));
    assert.is(typeof sym.example[0] != "undefined", true, "@example tag, creates sym.example array.");
    assert.is(sym.example[0].toString(), "This\n  is an example.", "@example tag, desc is found.");

    var sym = new Symbol("foo", [], "FILE", new DocComment("/**@see The other thing.*"+"/"));
    assert.is(sym.see.toString(), "The other thing.", "@see tag, desc is found.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@class This describes the class.*"+"/"));
    assert.is(sym.isa, "CONSTRUCTOR", "@class tag, makes symbol a constructor.");
    assert.is(sym.classDesc, "This describes the class.", "@class tag, class description is found.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@namespace This describes the namespace.*"+"/"));
    assert.is(sym.classDesc, "This describes the namespace.", "@namespace tag, class description is found.");

    var sym = new Symbol("foo", [{type: "array", name: "pages"}], "FUNCTION", new DocComment("/**Description.*"+"/"));
    assert.is(sym.params.length, 1, "parser defined param is found.");

    sym = new Symbol("foo", [], "FUNCTION", new DocComment("/**Description.\n@param {array} pages*"+"/"));
    assert.is(sym.params.length, 1, "user defined param is found.");
    assert.is(sym.params[0].type, "array", "user defined param type is found.");
    assert.is(sym.params[0].name, "pages", "user defined param name is found.");

    sym = new Symbol("foo", [{type: "array", name: "pages"}], "FUNCTION", new DocComment("/**Description.\n@param {string} uid*"+"/"));
    assert.is(sym.params.length, 1, "user defined param overwrites parser defined param.");
    assert.is(sym.params[0].type, "string", "user defined param type overwrites parser defined param type.");
    assert.is(sym.params[0].name, "uid", "user defined param name overwrites parser defined param name.");

    sym = new Symbol("foo", [{type: "array", name: "pages"}, {type: "number", name: "count"}], "FUNCTION", new DocComment("/**Description.\n@param {string} uid*"+"/"));
    assert.is(sym.params.length, 2, "user defined params  overlay parser defined params.");
    assert.is(sym.params[1].type, "number", "user defined param type overlays parser defined param type.");
    assert.is(sym.params[1].name, "count", "user defined param name overlays parser defined param name.");

    sym = new Symbol("foo", [], "FUNCTION", new DocComment("/**Description.\n@param {array} pages The pages description.*"+"/"));
    assert.is(sym.params.length, 1, "user defined param with description is found.");
    assert.is(sym.params[0].desc, "The pages description.", "user defined param description is found.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@constructor*"+"/"));
    assert.is(sym.isa, "CONSTRUCTOR", "@constructor tag, makes symbol a constructor.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@static\n@constructor*"+"/"));
    assert.is(sym.isStatic, true, "@static tag, makes isStatic true.");
    assert.is(sym.isNamespace, true, "@static and @constructor tag, makes isNamespace true.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@inner*"+"/"));
    assert.is(sym.isStatic, false, "@inner tag, makes isStatic false.");
    assert.is(sym.isInner, true, "@inner makes isInner true.");

    var sym = new Symbol("foo", [], "FUNCTION", new DocComment("/**@field*"+"/"));
    assert.is(sym.isa, "OBJECT", "@field tag, makes symbol an object.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@function*"+"/"));
    assert.is(sym.isa, "FUNCTION", "@function tag, makes symbol a function.");

    var sym = new Symbol("foo", [], "OBJECT", new DocComment("/**@event*"+"/"));
    assert.is(sym.isa, "FUNCTION", "@event tag, makes symbol a function.");
    assert.is(sym.isEvent, true, "@event makes isEvent true.");
};

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));