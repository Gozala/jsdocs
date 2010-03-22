var fs = require("file");
var console = require("system").log;
var Logger = require("logger").logger;

var Parser = require("./parser").Parser;
var plugins = require("./plugin-manager");
var TokenReader = require("./token-reader").TokenReader;
var TokenStream = require("./token").TokenStream;
var TextStream = require("./text-stream").TextStream;


/**
    @constructor
    @param [opt] Used to override the commandline options. Useful for testing.
    @version $Id$
*/
exports.doc = function doc(options) {
    var extensions = options.extensions || (options.extensions = [".js"]);
    if (options.ignoreAnonymous === undefined) options.ignoreAnonymous = true;
    if (options.treatUnderscoredAsPrivate === undefined) options.treatUnderscoredAsPrivate = true;
    var recurse = options.recurse || (options.recurse = 0);
    // forwarding logs to file if out is present
    if (options.out) console = new Logger(options.out);
    // encreasing log level if in verbose mode
    if (options.verbose) console.level = 5;
    // output directory
    var destination = options.destination = fs.path(options.destination || "docs");
    if (!destination.exists()) destination.mkdirs();
    console.info("Output directory set to '" + destination.toString() + "'.");
    // TODO: Actually use this property for something
    var encoding = options.encoding || (options.encoding = "utf-8");
    // expects JSON like definitions
    if (options.define) options.define = JSON.parse(options.define);
    // combine any conf file D options with the commandline D options
    if (options.conf && (options.conf = fs.path(options.conf)).exists()) {
        options.conf = JSON.parse(options.conf.read().toString());
    }
    // mapping file exclude string patterns to regexps
    var exclude = options.exclude ? options.exclude.map(function(string) { return new RegExp(string) }) : [];
    // Give plugins a chance to initialize
    plugins.notify("onInit", options);

    options.files = getSourceFiles(options.src, extensions, exclude, recurse);

    return parseSourceFiles(options);
};
/**
    Retrieve source file list.
    @param {File[]} files               files / dirs containing sources to document.
    @param {String[]} fileExtensions    File extensions that result should contain.
    @param {Integer} depth              How deep in the folders should files be taken.
    @param {RegExp[]} exclude           patterns for files to be excluded.
    @returns {Path[]}                   The paths of the files to be parsed.
 */
function getSourceFiles(paths, extensions, exclude, depth) {
    depth = depth || 0;
    var sources = [];
    function accepted(file) {
        var name = file.basename();
        return !(
            (extensions.indexOf(file.extension()) < 0) ||
            (exclude.some(function(pattern) { pattern.match(name) }))
        );
    }
    paths.forEach(function(path) {
        var file = fs.path(path);
        if (file.isFile() && accepted(file)) sources.push(file);
        else if (file.isDirectory()) file.list().forEach(function(name) {
            var entry = file.join(name);
            if (entry.isFile() && accepted(entry)) sources.push(entry);
            else if (depth != 1) sources.push.apply(sources, getSourceFiles([entry], extensions, exclude, --depth));
        });
    });
    return sources;
};
/**
 * Initializes parser and parces source files.
 * @param {Path[]} files                Files to be parsed
 */
function parseSourceFiles(options) {
    var parser = Parser(options);
        files = options.files, l = files.length;
    while (l--) {
        var file = files[l];
        console.debug("Parsing file: " + file.toString());
        try {
            var source = file.read().toString();
        } catch(e) {
            console.warn("Can't read source file '" + file.toString() + "': " + e.message);
            continue;
        }
        var tokenReader = new TokenReader();
        var ts = new TokenStream(tokenReader.tokenize(new TextStream(source)));
        parser.parse(ts, file.toString());
    }
    var symbols = parser.symbols;
    parser.finish();
    plugins.notify("onFinishedParsing", symbols)
    return symbols;
}

