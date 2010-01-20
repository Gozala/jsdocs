var assert = require("test/assert");
var parser = require("jsdocs").optionsParser;

var options;
exports["test:passing source directory"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isEqual("../test", options.args[0], "argument shoud match '../test'");
};
exports["test:options.template"] = function() {
    options = parser.parse(["jsdocs", "-t", "templateDir", "../test"]);
    assert.isEqual("templateDir", options.template, "matches argument following -t");
    options = parser.parse(["jsdocs", "--template", "templateDir", "../test"]);
    assert.isEqual("templateDir", options.template, "matches argument following --template");
    options = parser.parse(["jsdocs", "../test"]);
    assert.isEqual(undefined, options.template, "'undefined' if no --template or -t was passed");
};
exports["test:options.destination"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isEqual("out", options.destination, "'out' if was not overrided");
    options = parser.parse(["jsdocs", "-d", "dest", "../test"]);
    assert.isEqual("dest", options.destination, "matches argument following -d");
    options = parser.parse(["jsdocs", "--directory", "foo", "../test"]);
    assert.isEqual("foo", options.destination, "matches argument following --directory");
};
exports["test:options.allfunctions"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isFalse(options.allfunctions, "'false' if -a or --all was not passed");
    options = parser.parse(["jsdocs", "-a", "../test"]);
    assert.isTrue(options.allfunctions, "true if -a was passed");
    options = parser.parse(["jsdocs", "--all", "../test"]);
    assert.isTrue(options.allfunctions, "true if --all was passed");
};
exports["test:options.ignoreAnonymous"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isTrue(options.ignoreAnonymous, "'true' by default");
    options = parser.parse(["jsdocs", "--include-anoymus", "../test"]);
    assert.isFalse(options.ignoreAnonymous, "'false' when -A is passed");
};
exports["test:options.explain"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isFalse(options.explain, "'true' by default");
    options = parser.parse(["jsdocs", "--explain", "../test"]);
    assert.isTrue(options.explain, "'false' when --explain is passed");
};
exports["test:options.treatUnderscoreAsPrivate"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isFalse(options.treatUnderscoreAsPrivate, "'true' if '--underscore-is-not-private' was not passed");
    options = parser.parse(["jsdocs", "--underscore-is-not-private", "../test"]);
    assert.isFalse(options.treatUnderscoreAsPrivate, "false if --underscore-is-not-private was passed");
};
exports["test:options.conf"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isTrue(options.conf == undefined, "undefined if '-c' or '--config' was not passed");
    options = parser.parse(["jsdocs", "-c", "c.file" "../test"]);
    assert.isEqual("c.file", options.conf, "should match param following -c");
    options = parser.parse(["jsdocs", "--config", "conf.file" "../test"]);
    assert.isEqual("conf.file", options.conf, "should match param following --config");
};
exports["test:options.define"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isTrue(options.define == undefined, "undefined if '-D' or '--define' was not passed");
    options = parser.parse(["jsdocs", "-D", "{'destination':'/tmp/D'}", "../test"]);
    assert.isEqual("{'destination':'/tmp/D'}", options.define, "shold match param following -D");
    options = parser.parse(["jsdocs", "--define", "{'destination':'/tmp/define'}", "../test"]);
    assert.isEqual("{'destination':'/tmp/define'}", options.define, "shold match param following --define");
};
exports["test:options.encoding"] = function() {
    options = parser.parse(["jsdocs", "../test"]);
    assert.isEqual("utf-8", options.encoding, "'utf-8' if '-e' or '--encoding' was not passed");
    options = parser.parse(["jsdocs", "-e", "utf-16", "../test"]);
    assert.isEqual("utf-16", options.enoding, "should match param following '-e'");
    options = parser.parse(["jsdocs", "--encoding", "foo", "../test"]);
    assert.isEqual("foo", options.enoding, "should match param following '--encoding'");
};

parser.option("-E", "--exclude", "exclude")
    .help("-E=\"REGEX\" or --exclude=\"REGEX\"\n" +
        "Multiple. Exclude files based on the supplied regex.")
    .def([])
    .action(collection);
exports["test:options.ignoreCode"] = function() {
};

parser.option("-n", "--nocode", "ignoreCode")
    .help("Ignore all code, only document comments with @name tags.")
    .def(false)
    .set(true);

exports["test:options.out"] = function() {
};


parser.option("-o", "--out", "out")
    .help("Print log messages to a file (defaults to stdout).")
    .set();

exports["test:options.includePrivates"] = function() {
};

parser.option("-p", "--private", "includePrivates")
    .help("Include symbols tagged as private, underscored and inner symbols.")
    .def(false)
    .set(true);

exports["test:options.quiet"] = function() {
};

parser.option("-q", "--quiet", "quiet")
    .help("Do not output any messages, not even warnings.")
    .def(false)
    .set(true);

exports["test:options.recurse"] = function() {
};

parser.option("-r", "--recurse", "recurse")
    .help("Descend into src directories.")
    .integer()
    .def(1)
    .set();

exports["test:options.includeSource"] = function() {
};

parser.option("-s", "--suppress", "includeSource")
    .help("Suppress source code output.")
    .def(false)
    .set(true);

exports["test:options.securemodules"] = function() {
};

parser.option("-S", "--securemodules", "securemodules")
    .help("Use Secure Modules mode to parse source code.")
    .def(false)
    .set(true);

exports["test:options.destination"] = function() {
};

parser.option("-u", "--unique", "destination")
    .help("Force file names to be unique, but not based on symbol names.")
    .def(false)
    .set(true);

exports["test:options.verbose"] = function() {
};

parser.option("-v", "--verbose", "verbose")
    .help("Provide verbose feedback about what is happening.")
    .def(false)
    .set(true);

exports["test:options.extensions"] = function() {
};

parser.option("-x", "--ext", "extensions")
    .help("-x=<EXT>[,EXT]... or --ext=<EXT>[,EXT]...\n" +
        "Scan source files with the given extensions separated by \":\" (defaults to .js)")
    .def([".js"])
    .action(collection);

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));