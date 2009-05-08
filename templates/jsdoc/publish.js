// It's a hack should find better way. Template should by dummy
var Link = require('jsdocs/frame/Link').Link,
    defined = require('jsdocs/frame').defined;

/** Called automatically by JsDoc Toolkit. */
function publish(symbolSet, JSDOCREF) {
    JSDOC = JSDOCREF;
    publish.conf = {  // trailing slash expected for dirs
        ext: '.html',
        outDir: JSDOC.opt.d,
        templatesDir: JSDOC.opt.t,
        symbolsDir:  'symbols/',
        srcDir:      'symbols/src/'
    };
    // Haks to be able to use give access to the vars
    JSDOC.publish = publish;
    Link.conf = publish.conf;
    Link.JSDOC = JSDOC;
    
    // is source output is suppressed, just display the links to the source file
    if (JSDOC.opt.s && defined(Link) && Link.prototype._makeSrcLink) {
        Link.prototype._makeSrcLink = function(srcFilePath) {
            return "&lt;" + srcFilePath + "&gt;";
        }
    }
    // create the folders and subfolders to hold the output
    try { publish.conf.outDir.join(publish.conf.srcDir).mkdirs(); } catch(e) {}
    // used to allow Link to check the details of things being linked to
    Link.symbolSet = symbolSet;
    // create the required templates
    try {
        var classTemplate = new JSDOC.JsPlate(publish.conf.templatesDir.join('class.tmpl'));
        var classesTemplate = new JSDOC.JsPlate(publish.conf.templatesDir.join('allclasses.tmpl'));
    } catch(e) { throw new Error("Couldn't create the required templates: " + e); }
    
    // some ustility filters
    function hasNoParent($) {return ($.memberOf == "")}
    function isaFile($) {return ($.is('FILE'))}
    function isaClass($) {return ($.is('CONSTRUCTOR') || $.isNamespace)}
    
    // get an array version of the symbolset, useful for filtering
    var symbols = symbolSet.toArray();
    var files = JSDOC.opt.srcFiles;
    // create the hilited source code files
    files.forEach(function(file) {
        makeSrcFile(file, publish.conf.outDir.join('symbols/src/'));
    })
    // get a list of all the classes in the symbolset
    var classes = symbols.filter(isaClass).sort(makeSortby('alias'));
    // create a class index, displayed in the left-hand column of every class page
    Link.base = '../';
    // kept in memory
    publish.classesIndex = classesTemplate.process(classes);
    // create each of the class pages
    for (var i = 0, l = classes.length; i < l; i++) {
        var symbol = classes[i];
        var output = '';
        output = classTemplate.process(symbol);
        publish.conf.outDir.join('symbols').join(symbol.alias + publish.conf.ext).write(output);
    }
    // regenerate the index with different relative links, used in the index pages
    Link.base = '';
    publish.classesIndex = classesTemplate.process(classes);
    // create the class index page
    var classesindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir.join('index.tmpl'));
    var classesIndex = classesindexTemplate.process(classes);
    publish.conf.outDir.join("index" + publish.conf.ext).write(classesIndex);
    classesindexTemplate = classesIndex = classes = null;
    // create the file index page
    var fileindexTemplate = new JSDOC.JsPlate(publish.conf.templatesDir.join('allfiles.tmpl'));
    var documentedFiles = symbols.filter(isaFile); // files that have file-level docs
    var allFiles = []; // not all files have file-level docs, but we need to list every one
    for (var i = 0; i < files.length; i++) {
        allFiles.push(new JSDOC.Symbol(files[i], [], 'FILE', new JSDOC.DocComment("/** */")));
    }
    for (var i = 0; i < documentedFiles.length; i++) {
        var offset = files.indexOf(documentedFiles[i].alias);
        allFiles[offset] = documentedFiles[i];
    }
    allFiles = allFiles.sort(makeSortby('name'));
    // output the file index page
    var filesIndex = fileindexTemplate.process(allFiles);
    publish.conf.outDir.join('files' + publish.conf.ext).write(filesIndex);
    fileindexTemplate = filesIndex = files = null;
};

exports.publish = publish;
/** Just the first sentence (up to a full stop). Should not break on dotted variable names. */
function summarize(desc) {
    if (typeof desc != "undefined")
        return desc.match(/([\w\W]+?\.)[^a-z0-9_$]/i)? RegExp.$1 : desc;
}

/**
 * Make a symbol sorter by some attribute.
 */
function makeSortby(attribute) {
    return function(a, b) {
        if (a[attribute] != undefined && b[attribute] != undefined) {
            a = a[attribute].toLowerCase();
            b = b[attribute].toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
    };
};

/** Pull in the contents of an external file at the given path. */
function include(path) {
  return publish.conf.templatesDir.join(path).read().toString();
}
/**
 * Turn a raw source file into a code-hilited page in the docs.
 */
function makeSrcFile(file, srcDir, name) {
    if (JSDOC.opt.s) return;
    if (!name) {
        name = file.toString().replace(/\.\.?[\\\/]/g, '').replace(/[\\\/]/g, '_');
        name = name.replace(/\:/g, "_");
    }
    var src = { file: file, name:name, hilited: ''};
    if (defined(JSDOC.PluginManager)) JSDOC.PluginManager.run('onPublishSrc', src);
    if (src.hilited) srcDir.join(name + publish.conf.ext).write(src.hilited);
};
/**
 * Build output for displaying function parameters.
 */
function makeSignature(params) {
    if (!params) return '()';
    var signature = params.filter(function($) { return $.name.indexOf('.') == -1; })
        .map(function($) { return $.name; })
        .join(', ');
    return '(' + signature + ')';
};
/**
 * Find symbol {@link ...} strings in text and turn into html links
 */
function resolveLinks(str, from) {
    return str.replace(/\{@link ([^} ]+) ?\}/gi, function(match, symbolName) { return new Link().toSymbol(symbolName);});
}
