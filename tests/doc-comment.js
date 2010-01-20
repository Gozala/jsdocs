var assert = require("test/assert");
var DocTag = require("jsdocs/doc-tag").DocTag;
var DocComment = require("jsdocs/doc-comment").DocComment;

exports["test:testing JSDOC.DocComment"] = function() {
    var com = new DocComment("/**@foo some\n* comment here*"+"/");
    assert.is(com.tagTexts[0], "foo some\ncomment here", "first tag text is found.");
    assert.is(com.tags[0].title, "foo", "the title is found in a comment with one tag.");

    var com = new DocComment("/** @foo first\n* @bar second*"+"/");
    assert.is(com.getTag("bar").length, 1, "getTag() returns one tag by that title.");

    DocComment.shared = "@author John Smith";
    var com = new DocComment("/**@foo some\n* comment here*"+"/");
    assert.is(com.tags[0].title, "author", "shared comment is added.");
    assert.is(com.tags[1].title, "foo", "shared comment is added to existing tag.");
};
exports["test:JSDOC.DocComment#fixDesc"] = function() {
    var com = new DocComment();

    com.src = "this is a desc\n@author foo";
    com.fixDesc();
    assert.is(com.src, "@desc this is a desc\n@author foo", "if no @desc tag is provided one is added.");

    com.src = "x";
    com.fixDesc();
    assert.is(com.src, "@desc x", "if no @desc tag is provided one is added to a single character.");

    com.src = "\nx";
    com.fixDesc();
    assert.is(com.src, "@desc \nx", "if no @desc tag is provided one is added to return and character.");

    com.src = " ";
    com.fixDesc();
    assert.is(com.src, " ", "if no @desc tag is provided one is not added to just whitespace.");

    com.src = "";
    com.fixDesc();
    assert.is(com.src, "", "if no @desc tag is provided one is not added to empty.");
};
exports["test:JSDOC.DocComment.unwrapComment"] = function() {
    var com = "/**x*"+"/";
    var unwrapped = DocComment.unwrapComment(com);
    assert.is(unwrapped, "x", "a single character jsdoc is found.");

    com = "/***x*"+"/";
    unwrapped = DocComment.unwrapComment(com);
    assert.is(unwrapped, "x", "three stars are allowed in the opener.");

    com = "/****x*"+"/";
    unwrapped = DocComment.unwrapComment(com);
    assert.is(unwrapped, "*x", "fourth star in the opener is kept.");

    com = "/**x\n * y\n*"+"/";
    unwrapped = DocComment.unwrapComment(com);
    assert.is(unwrapped, "x\ny\n", "leading stars and spaces are trimmed.");

    com = "/**x\n *   y\n*"+"/";
    unwrapped = DocComment.unwrapComment(com);
    assert.is(unwrapped, "x\n  y\n", "only first space after leading stars are trimmed.");
};
exports["test:JSDOC.DocComment#fixDesc"] = function() {
    var com = new DocComment();
    com.src = "foo";
    assert.is(""+com, "foo", "stringifying a comment returns the unwrapped src.");
};
exports["test:JSDOC.DocComment#getTag"] = function() {
    var com = new DocComment("/**@foo some\n* @bar\n* @bar*"+"/");
    assert.is(com.getTag("bar").length, 2, "getTag returns expected number of tags.");
};
exports["test:JSDOC.DocComment.shared"] = function() {
    DocComment.shared = "@author Michael";
    var com = new DocComment("/**@foo\n* @foo*"+"/");
    assert.is(com.getTag("author").length, 1, "getTag returns shared tag.");
    assert.is(com.getTag("foo").length, 2, "getTag returns unshared tags too.");
};

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));