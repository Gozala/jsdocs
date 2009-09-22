var JSDOC = require("./JSDOC").JSDOC,
    fs = require("file"),
    JSON = require("json"),
    Catalog = require("packages").catalog,
    Log = system.log,
    Template = require("seethrough/seethrough").Template,
    SyntaxStroop = require("syntax-stroop/engine"),
    // JSDocs modules
    TextStream = require("./textStream").TextStream;

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

/**
 * Documents javascript code.
 * @param {Object} config               Configuration object.
 * @example
 * ({
 *      sourcesPaths: ['lib', '../js'], {String[]} files / dir paths containing sources to be documented.
 *      includeUndocumented: false,     {Boolean} If true includes all functions, even undocumented ones.
 *      includePrivates: false,         {Boolean} If true includes symbols tagged as private, underscored and inner symbols.
 *      templatePath: 'template',       {String} Path for template to be used.
 *      configPath: '../config.js',     {String} Path to a configuration file.
 *      destinationPath: 'docs',        {Srting} Path to a directory where generated documentaion will be saved.
 *      encoding: 'utf-8',              {String} (Not Implemented) Encoding to be use for file read / write.
 *      nocode: false,                  {Boolean} If true only code with @name tags will be deocumented.
 *      logPath: 'log',                 {String} (Not Implemented) If path specified log will be saved to a file.
 *      depth: 0,                       {Number} Depth. Descend into source directories. if 0 will document files in all subdirectories.
 *      verbose: false,                 {Boolean} (Not Implemented) Provide verbose feedback about what is happening.
 *      fileExtensions: [".js"]         {String} Documents files only with the given extensions.
 *  })
 */
var document = exports.document = function(config) {
    try {
        if (config.configPath) {
            Log.debug('Extending configs with configs from file specified');
            var configFile = fs.path(configPath);
            var baseConfig = JSON.decode(configFile.read().toString());
            for (var member in baseConfig)
                if (!config[member]) config[member] = baseConfig[member];
        }
    } catch(e) {
        Log.warn('Failed to get configs from a file : ' + config.configPath + ' : ' + e.message);
    }
    if (config.sourcesPaths instanceof Array) {
        Log.debug('Getting sources to document');
        var sourceFiles = [];
        config.sourcesPaths.forEach(function(path) {
            try {
                var file = fs.path(path);
                if (file.exists()) sourceFiles.push(file);
            } catch(e) {}
        });
    } else throw new Error('No source files to document.');
    Log.debug('Trying to get a template directory');
    try {
        var template;
        if (config.templatePath) template = fs.path(path).absolute();
        else template = Catalog['jsdocs'].directory.join(defaults.templatePath);
        if (!template.exists()) throw new Error('Template path doesn\'t exists : ' + template);
    } catch(e) {
        Log.error(e.message);
        throw new Error('Bad template path was provided : ' + template);
    }
    Log.debug('Trying to require publish.js from template directory');
    try {
        var publish = require(template.join('publish').toString()).publish;
    } catch(e) {
        Log.error(e.message);
        throw new Error('Bad template, template folder should contain publisher.js with exports.publish function in it : ' + template);
    }
    Log.debug('Trying to get folder where documentations will be saved');
    try {
        var path = config.destinationPath || defaults.destinationPath;
        var destination = fs.path(path).absolute();
        if (!destination.exists()) destination.mkdirs();
        if (!destination.isDirectory()) throw new Error('Destination should be a directory : ' + path);
    } catch (e) {
        throw new Error('Bad destination path ' + path + ' : ' + e.message);
    }
    Log.debug('Trying to get file to log results');
    var log = null;
    try {
        if (config.logPath) {
            var log = fs.path(config.logPath).absolute();
            if (!log.exists()) destination.touch();
            if (!log.isFile() || !log.isWritable)
                throw new Error('Log path should point to a writable file : ' + config.logPath);
        }
    } catch(e) {
        throw new Error('Bad log path : ' + config.logPath + ' : ' + e.message);
    }
    // TODO: add assertor to a logger to log to the log file
    var includeUndocumented = config.includeUndocumented || defaults.includeUndocumented;
    var includePrivates = config.includePrivates || defaults.includePrivates;
    var encoding = config.encoding || defaults.encoding;
    var nocode = config.nocode || defaults.nocode;
    var depth = config.depth || defaults.depth;
    var verbose = config.verbose || defaults.verbose;
    var fileExtensions = config.fileExtensions || defaults.fileExtensions;
    // Getting all the sources to be documented
    var sources = _getSourceFiles(sourceFiles, fileExtensions, depth);
    if (sources.length == 0) throw new Error('There is nothing to be documented');
    delete config;

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

    // Have to dill with JSDOCS and all this mess so far :(
    // I know lines below makes no sense and I'm going to get rid of them a tsome point :)
    JSDOC.opt = {
        srcFiles: sources,
        n: nocode,
        p: includePrivates,
        a: includeUndocumented,
        e: encoding
    };

    Log.info("JSDocs started at " + new Date());
    Log.debug("With options: ");
    for (var o in JSDOC.opt) Log.debug("    " + o + ": " + JSDOC.opt[o]);

    // get a plugins
    // TODO: Need to use better way for this
    require('./plugins').plug(JSDOC);

    JSDOC.handlers = {};
    JSDOC.JsDoc = {};
    Log.debug('Start parseing source files');
    _parseSourceFiles(sources);
    JSDOC.JsDoc.symbolSet = JSDOC.Parser.symbols;
    Log.debug('Start publishing docs');
    publish(JSDOC.JsDoc.symbolSet, sources, Plugins);
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
        Log.debug('Testing path : ' + file);
        if (file.isFile()) {
            if (extensions.some(function(extension) {
                Log.debug('asserting extenions : ' + extension + ':' + file.extname())
                return (file.extname() == extension);
            })) sources.push(file);
        } else if (file.isDirectory()) {
            Log.debug('file is directory');
            Log.debug('looking for entries');
            file.list().forEach(function(entryName) {
                Log.debug('looking for entry : ' + entryName);
                var entry = file.join(entryName);
                if (entry.isFile() && extensions.some(function(extension) {
                    Log.debug('asserting extenions : ' + extension + ':' + entry.extension());
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