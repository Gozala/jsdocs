var JSDOC = require("./JSDOC").JSDOC,
    fs = require("file"),
    JSON = require("json"),
    Catalog = require("packages").catalog,
    Log = system.log,
    Template = require("seethrough/seethrough").Template,
    SyntaxStroop = require("syntax-stroop/engine"),
    // JSDocs modules
    TextStream = require("./textStream").TextStream;

var Log = new (require("logger")).Logger({write: print});
Log.trace = function(object) { print(require("test/jsdump").jsDump.parse(object)) }

// Default values
var defaults = {
    templatePath: "templates/dark-pastels",
    destinationPath: "docs",
    includeUndocumented: true,
    includePrivates: true,
    encoding: "utf-8",
    nocode: false,
    depth: 0,
    verbose: false,
    fileExtensions: [".js"]
};

var parser = new (require("args").Parser)();

parser.usage("jsdocs [options] [file / directory containing source");
parser.help("Generates documentation from the javascript source and jsdoc comments.");

parser.option("-t", "--template", "template")
    .help("Relative path to the template used for formating the output.")
    .def(require('packages').catalog['jsdocs'].directory.join("templates", "dark-pastels"))
    .set();

parser.option("-a", "--all", "includeUndocumented")
    .help("Include all functions, even undocumented ones.")
    .set(true);

parser.option("-d", "--destination", "destination")
    .help("Relative path to the output directory")
    .def("docs")
    .set();

parser.option("-e", "--encoding", "encoding")
    .help("Use this encoding to read and write files.")
    .def("utf-8")
    .set();

parser.option("-i", "--igonre", "ignoreCode")
    .help("Ignore all code, only document comments with @name tags.")
    .set(true);

parser.option("-p", "--private", "includePrivates")
    .help("Include symbols tagged as private, underscored and inner symbols.")
    .set(true);

parser.option("-D", "--depth", "depth")
    .help("Depth. Descend into src directories.")
    .def(0)
    .set();

parser.option("-s", "--source", "includeSource")
    .help("Suppress source code output.")
    .set(true);

parser.option("-v", "--verbose", "verbose")
    .help("Provide verbose feedback about what is happening.")
    .set(true);

parser.option("-x", "--extensions", "extensions")
    .help("Scan source files with the given extensions separated by \":\" (defaults to .js)")
    .def(".js")
    .set();

exports.main = function main(args) {
    var options = parser.parse(args);
    // verbose mode
    if (options.verbose) Log.level = 4;
    // source
    if (options.args.length > 1) {
        parser.printHelp(options);
        parser.exit(options);
    }
    var sourcePaths = [];
    options.args[0].split(":").forEach(function(path) {
        if (fs.path(path).exists()) path = fs.path(path).absolute();
        else if (fs.path(fs.cwd()).join(path).exists()) path = fs.path(fs.cwd()).join(path).absolute();
        else return;
        if (sourcePaths.indexOf(path) < 0) sourcePaths.push(path);
    });
    var sources = _getSourceFiles(sourcePaths, options.extensions.split(":"), options.depth);

    Log.debug("Documenting files:");
    sources.forEach(function(path) {
        Log.debug(path);
    });
    // output
    var destination = fs.path(options.destination).exists() ? fs.path(options.destination) : fs.path(fs.cwd()).join(options.destination);
    Log.debug("Documentation will be saved in:", destination.absolute());
    // template
    var template = fs.path(options.template).exists() ? fs.path(options.template) : fs.path(fs.cwd()).join(options.template);
    Log.debug("Template used:", template);
    try {
        var publisher = require(template.join("publish").toString());
    } catch(e) {
        Log.error(e.message)
    }

    Log.debug('Exposing Plugins for template');
    var Plugins = {
        // Class for geneartion of the plugins
        Template: function(path) {
            return new Template(template.join(path));
        },
        getContent: function(path) {
            return template.join(path).read().toString()
        },
        syntaxHighlight: function(code, language) {
            if (code instanceof fs.Path) code = code.read().toString();
            return SyntaxStroop.highlight(code, language);
        },
        publish: function(files) {
            Object.keys(files).forEach(function(path) {
                destination.join(path).write(files[path]);
            });
        }
    };
    global.Log = Log;

    // Have to deal with JSDOCS and all this mess so far :(
    // I know lines below makes no sense and I'm going to get rid of them a tsome point :)
    JSDOC.opt = {
        srcFiles: sources,
        n: options.nocode,
        p: options.includePrivates,
        a: options.includeUndocumented,
        e: options.encoding
    };

    // get a plugins
    // TODO: Need to use better way for this
    require('./plugins').plug(JSDOC);

    JSDOC.handlers = {};
    JSDOC.JsDoc = {};
    Log.debug('Start parseing source files');
    _parseSourceFiles(sources);
    JSDOC.JsDoc.symbolSet = JSDOC.Parser.symbols;
    Log.debug('Start publishing docs');
    publisher.publish(JSDOC.JsDoc.symbolSet, sources, Plugins);
    Log.debug('Finished publishing docs');
};

/**
 * Retrieve source file list.
 * @param {File[]} files            files / dirs containing sources to document.
 * @param {String[]} fileExtensions File extensions that result should contain.
 * @param {Integer} depth           How deep in the folders should files be taken.
 * @returns {File[]}                The paths of the files to be parsed.
 */
function _getSourceFiles(files, extensions, depth) {
    depth = depth || 0;
    var sources = [];
    files.forEach(function(file) {
        if (file.isFile()) {
            if (extensions.some(function(extension) {
                return (file.extname() == extension);
            })) sources.push(file);
        } else if (file.isDirectory()) {
            file.list().forEach(function(entryName) {
                var entry = file.join(entryName);
                if (entry.isFile() && extensions.some(function(extension) {
                    return (entry.extension() == extension);
                })) sources.push(entry);
                else if (depth != 1)
                    sources = sources.concat(_getSourceFiles([entry], extensions, depth - 1));
            });
        }
    });
    return sources;
};

/**
 * Guess it parses the files
 * Currently depends on JSDOC.Parser
 * @param {File[]} files            Files to be parsed
 */
function _parseSourceFiles(files) {
    JSDOC.Parser.init();
    files.forEach(function(file) {
        Log.debug('_parseSourceFiles : ' + file);
        try {
            var source = file.read().toString();
        } catch(e) {
            Log.warn('Can\'t read source from file : ' + file + ' : ' + e.message);
        }
        var tr = new JSDOC.TokenReader();
        var ts = new JSDOC.TokenStream(tr.tokenize(new TextStream(source)));
        JSDOC.Parser.parse(ts, file);
    });
    JSDOC.Parser.finish();
}
/**
 * Writes files to the desired destination. Creates path if not exists.
 * Overwrite all files with a matching names.
 * @param {File} destination    Destination directory.
 * @param {Object} files        Map of relative (to the destination) path's and
 * data to be written
 * @example
 * ({
 *      'index.html': '<html><head></head><body>hellow world</body></html>'
 *      'log': 'finished on 2009-05-10 23:57'
 * })
 */
function _writeFiles(destination, files) {
    for (path in files) {
        Log.debug('Writing file : ' + path);
        var file = destination.join(path);
        var dir = file.join('..');
        if (!dir.exists()) dir.mkdirs();
        try {
            file.write(files[path].toString());
        } catch(e) {
            Log.error('Failed writing file : ' + path + ' : ' + e.message);
            Log.debug('File data : \n' + files[path]);
        }
    }
}


if (module.id == require.main) exports.main(system.args);

