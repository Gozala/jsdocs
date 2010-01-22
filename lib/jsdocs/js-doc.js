var fs = require("file");
var console = require("system").log;
var catalog = require("packages").catalog;
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
    // forwarding logs to file if out is present
    if (options.out) console = new Logger(options.out);
    // encreasing log level if in verbose mode
    if (options.verbose) console.level = 5;
    // output directory
    var destination = options.destination = fs.path(options.destination);
    if (!destination.exists()) destination.mkdirs();
    console.info("Output directory set to '" + destination.absolute().toString() + "'.");
    // TODO: Actually use this property for something
    var encoding = options.encoding;
    // expects JSON like definitions
    if (options.define) options.define = JSON.parse(options.define);
    // combine any conf file D options with the commandline D options
    if (options.conf && (options.conf = fs.path(options.conf)).exists()) {
        options.conf = JSON.parse(options.conf.read().toString());
    }
    // reading tempalte dir or defaulting to the one shipped with toolkit
    if (!options.template) options.template = catalog["jsdocs"].directory.join("templates", "default");
    else options.template = fs.path(options.template);
    // mapping file exclude string patterns to regexps
    var exclude = options.exclude = options.exclude.map(function(string) { return new RegExp(string) });
    // Give plugins a chance to initialize
    plugins.notify("onInit", options);

    options.files = getSourceFiles(options.src, options.extensions, exclude, options.recurse);

    var symbols = parseSourceFiles(options);
    // TODO: Fix default template an then do
    require(options.template.join("publish").absolute()).publish(symbols, options);
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
    var parser = new Parser(options);
        files = options.files, l = files.length;
    while (l--) {
        var file = files[l];
        var path = file.absolute();
        console.debug("Parsing file: " + path);
        try {
            var src = file.read().toString();
        } catch(e) {
            console.warn("Can't read source file '" + path + "': " + e.message);
            continue;
        }
        var tr = new TokenReader();
        var ts = new TokenStream(tr.tokenize(new TextStream(src)));
        parser.parse(ts, path);
    }
    var symbols = parser.symbols;
    parser.finish();
    plugins.notify("onFinishedParsing", symbols)
    return symbols;
}

