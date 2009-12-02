var assert = require("test/assert");
var DocTag = require("jsdocs/doc-tag").DocTag;

exports["test:JSDOC.DocTag#toString"] = function() {
        var tag = new DocTag("param {object} date A valid date.");
        assert.eq(""+tag, "A valid date.", "stringifying a tag returns the desc.");
};
exports["test:testing JSDOC.DocTag#nibbleTitle"] = function() {
        var tag = new DocTag();

        tag.init().nibbleTitle("aTitleGoesHere");
        assert.eq(tag.title, "aTitleGoesHere", "a title can be found in a single-word string.");

        var src = tag.init().nibbleTitle("aTitleGoesHere and the rest");
        assert.eq(tag.title, "aTitleGoesHere", "a title can be found in a multi-word string.");
        assert.eq(src, "and the rest", "the rest is returned when the title is nibbled off.");

        src = tag.init().nibbleTitle("");
        assert.eq(tag.title, "", "given an empty string the title is empty.");
        assert.eq(src, "", "the rest is empty when the tag is empty.");

        var src = tag.init().nibbleTitle(" aTitleGoesHere\n  a description");
        assert.eq(tag.title, "aTitleGoesHere", "leading and trailing spaces are not part of the title.");
        assert.eq(src, "  a description", "leading spaces (less one) are part of the description.");

        tag.init().nibbleTitle("a.Title::Goes_Here foo");
        assert.eq(tag.title, "a.Title::Goes_Here", "titles with punctuation are allowed.");
};
exports["test:testing JSDOC.DocTag.parser.nibbleType"] = function() {
        var tag = new DocTag();

        tag.init().nibbleType("{String[]} aliases");
        assert.eq(tag.type, "String[]", "type can have non-alpha characters.");

        tag.init().nibbleType("{ aTypeGoesHere  } etc etc");
        assert.eq(tag.type, "aTypeGoesHere", "type is trimmed.");

        tag.init().nibbleType("{ oneType, twoType ,\n threeType  } etc etc");
        assert.eq(tag.type, "oneType|twoType|threeType", "multiple types can be separated by commas.");

        var error;
        try { tag.init().nibbleType("{widget foo"); }
        catch(e) { error = e; }
        assert.eq(typeof error, "string", "malformed tag type throws error.");
        assert.eq(false, error.indexOf("Malformed") == -1, "error message tells tag is malformed.");
};
exports["test:JSDOC.DocTag.parser.nibbleName"] = function() {

        var tag = new DocTag();

        tag.init().nibbleName("[foo] This is a description.");
        assert.is(tag.isOptional, true, "isOptional syntax is detected.");
        assert.is(tag.name, "foo", "optional param name is found.");

        tag.init().nibbleName("[foo] This is a description.");
        assert.is(tag.isOptional, true, "isOptional syntax is detected when no type.");
        assert.is(tag.name, "foo", "optional param name is found when no type.");

        tag.init().nibbleName("[foo=7] This is a description.");
        assert.is(tag.name, "foo", "optional param name is found when default value.");
        assert.is(tag.defaultValue, "7", "optional param default value is found when default value.");

        //tag.init().nibbleName("[foo= a value] This is a description.");
        //assert.is(tag.defaultValue, " a value", "optional param default value is found when default value has spaces (issue #112).");

        tag.init().nibbleName("[foo=[]] This is a description.");
        assert.is(tag.defaultValue, "[]", "optional param default value is found when default value is [] (issue #95).");

        tag.init().nibbleName("[foo=a=b] This is a description.");
        assert.is(tag.name, "foo", "optional param name is found when default value is a=b.");
        assert.is(tag.defaultValue, "a=b", "optional param default value is found when default value is a=b.")
};
exports["test:Testing JSDOC.DocTag.parser."] = function() {
        var tag = new DocTag();

        assert.is(typeof tag, "object", "JSDOC.DocTag.parser with an empty string returns an object.");
        assert.is(typeof tag.title, "string", "returned object has a string property 'title'.");
        assert.is(typeof tag.type, "string", "returned object has a string property 'type'.");
        assert.is(typeof tag.name, "string", "returned object has a string property 'name'.");
        assert.is(typeof tag.defaultValue, "string", "returned object has a string property 'defaultValue'.");
        assert.is(typeof tag.isOptional, "boolean", "returned object has a boolean property 'isOptional'.");
        assert.is(typeof tag.desc, "string", "returned object has a string property 'desc'.");

        tag = new DocTag("param {widget} foo");
        assert.is(tag.title, "param", "param title is found.");
        assert.is(tag.name, "foo", "param name is found when desc is missing.");
        assert.is(tag.desc, "", "param desc is empty when missing.");

        tag = new DocTag("param {object} date A valid date.");
        assert.is(tag.name, "date", "param name is found with a type.");
        assert.is(tag.type, "object", "param type is found.");
        assert.is(tag.desc, "A valid date.", "param desc is found with a type.");

        tag = new DocTag("param aName a description goes\n    here.");
        assert.is(tag.name, "aName", "param name is found without a type.");
        assert.is(tag.desc, "a description goes\n    here.", "param desc is found without a type.");

        tag = new DocTag("param {widget}");
        assert.is(tag.name, "", "param name is empty when it is not given.");

        tag = new DocTag("param {widget} [foo] This is a description.");
        assert.is(tag.name, "foo", "optional param name is found.");

        tag = new DocTag("return {aType} This is a description.");
        assert.is(tag.type, "aType", "when return tag has no name, type is found.");
        assert.is(tag.desc, "This is a description.", "when return tag has no name, desc is found.");

        tag = new DocTag("author Joe Coder <jcoder@example.com>");
        assert.is(tag.title, "author", "author tag has a title.");
        assert.is(tag.type, "", "the author tag has no type.");
        assert.is(tag.name, "", "the author tag has no name.");
        assert.is(tag.desc, "Joe Coder <jcoder@example.com>", "author tag has desc.");

        tag = new DocTag("private \t\n  ");
        assert.is(tag.title, "private", "private tag has a title.");
        assert.is(tag.type, "", "the private tag has no type.");
        assert.is(tag.name, "", "the private tag has no name.");
        assert.is(tag.desc, "", "private tag has no desc.");

        tag = new DocTag("example\n   example(code);\n   more();");
        assert.is(tag.desc, "   example(code);\n   more();", "leading whitespace (less one) in examples code is preserved.");

        tag = new DocTag("param theName  \n");
        assert.is(tag.name, "theName", "name only is found.");

        tag = new DocTag("type theDesc  \n");
        assert.is(tag.desc, "theDesc", "desc only is found.");

        tag = new DocTag("type {theType} \n");
        assert.is(tag.type, "theType", "type only is found.");

        tag = new DocTag("");
        assert.is(tag.title, "", "title is empty when tag is empty.");
}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));