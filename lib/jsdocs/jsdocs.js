var JSDOC = require('./JSDOC').JSDOC,
    File = require('file').Path,
    JSON = require('json'),
    CWD = new File('.').absolute(),
    Log = system.log;

// Default values
var defaults = {
    templatePath: 'template',
    destinationPath: 'docs',
    includeUndocumented: true,
    includePrivates: true,
    encoding: 'utf-8',
    nocode: false,
    depth: 0,
    verbose: false,
    fileExtensions: [".js"]
};

/**
 * Generates documentation and saves it.
 * @param {Object} config               Configuration object.
 * {
 *      sourcesPaths: ['lib', '../js'], {String[]} files / dir paths containing sources to be documented.
 *      includeUndocumented: false,     {Boolean} If true includes all functions, even undocumented ones.
 *      includePrivates: false,         {Boolean} If true includes symbols tagged as private, underscored and inner symbols.
 *      templatePath: 'template',       {String} (Required) Path for template to be used.
 *      configPath: '../config.js',     {String} Path to a configuration file.
 *      destinationPath: 'docs',        {Srting} Path to a directory where generated documentaion will be saved.
 *      encoding: 'utf-8',              {String} (Not Implemented) Encoding to be use for file read / write.
 *      nocode: false,                  {Boolean} If true only code with @name tags will be deocumented.
 *      logPath: 'log',                 {String} (Not Implemented) If path specified log will be saved to a file.
 *      depth: 0,                       {Number} Depth. Descend into source directories. if 0 will document files in all subdirectories.
 *      verbose: false,                 {Boolean} (Not Implemented) Provide verbose feedback about what is happening.
 *      fileExtensions: [".js"]         {String} Documents files only with the given extensions.
 *  };
 */
var generate = exports.generate = function(config) {
    // Extending configs with configs from file specified. Logging warning if failed.
    try {
        if (config.configPath) {
            Log.debug('Extending configs with configs from file specified');
            var configFile = new File(configPath);
            var baseConfig = JSON.decode(configFile.read().toString());
            for (var member in baseConfig)
                if (!config[member]) config[member] = baseConfig[member];
        }
    } catch(e) {
        Log.warn('Failed to get configs from a file : ' + config.configPath + ' : ' + e.message);
    }
    // Getting sources to document if, throw an error if there's nothing to document
    if (config.sourcesPaths instanceof Array) {
        Log.debug('Getting sources to document');
        var sourceFiles = [];
        config.sourcesPaths.forEach(function(path) {
            try {
                var file = new File(path);
                if (file.exists()) sourceFiles.push(file);
            } catch(e) {}
        });
    } else throw new Error('No source files to document.');
    // Trying to get a template directory, throw an error if template path is invalid
    Log.debug('Trying to get a template directory');
    try {
        var path = config.templatePath || defaults.templatePath
        var template = new File(path).absolute();
        if (!template.exists()) throw new Error('Template path doesn\'t exists : ' + path);
    } catch(e) {
        Log.error(e.message);
        throw new Error('Bad template path was provided : ' + path);
    }
    // Trying to get publisher from temlplate, throw an error if failed
    Log.debug('Trying to require publish.js from template directory');
    try {
        var publish = require(template.join('publish').toString()).publish;
    } catch(e) {
        Log.error(e.message);
        throw new Error('Bad template, template folder should contain publisher.js with exports.publish function in it : ' + template);
    }
    // Trying to get folder where documentations should be saved
    Log.debug('Trying to get folder where documentations should be saved');
    try {
        var path = config.destinationPath || defaults.destinationPath;
        var destination = new File(path).absolute();
        if (!destination.exists()) destination.mkdirs();
        if (!destination.isDirectory()) throw new Error('Destination should be a directory : ' + path);
    } catch (e) {
        throw new Error('Bad destination path ' + path + ' : ' + e.message);
    }
    // Trying to get file to log results
    var log = null;
    try {
        if (config.logPath) {
            var log = new File(config.logPath).absolute();
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



    // Have to dill with JSDOCS and all this mess so far :(
    // I know lines below makes no sense and I'm going to get rid of them a tsome point :)
    JSDOC.opt = {
        srcFiles: sources,
        t: template,
        d: destination,
        r: depth,
        n: nocode,
        p: includePrivates,
        a: includeUndocumented,
        e: encoding
    };
    
    Log.info("JsDoc Toolkit started at " + new Date());
    Log.info("With options: ");
    for (var o in JSDOC.opt) Log.debug("    " + o + ": " + JSDOC.opt[o]);
    
    // get a plugins
    // TODO: Need to use better way for this
    require('./plugins').plug(JSDOC);
    
    JSDOC.handlers = {};
    JSDOC.JsDoc = {};
    Log.debug('Start parseing source files');
    _parseSourceFiles(sources);
    JSDOC.JsDoc.symbolSet = JSDOC.Parser.symbols;
    Log.debug('Publishing docs');
    publish(JSDOC.JsDoc.symbolSet, JSDOC);
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
                    Log.debug('asserting extenions : ' + extension + ':' + entry.extname());
                    return (entry.extname() == extension);
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
        var ts = new JSDOC.TokenStream(tr.tokenize(new JSDOC.TextStream(source)));
        JSDOC.Parser.parse(ts, file);
    });
    JSDOC.Parser.finish();
}