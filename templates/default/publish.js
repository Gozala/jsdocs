/** Called automatically by JsDoc Toolkit. */
var Link = require("jsdocs/frame/link").Link;
var JsPlate = require("jsdocs/js-plate").JsPlate;
var console = require("system").log;
var OS = require("os");
var plugins = require("jsdocs/plugin-manager");
var Symbol = require("jsdocs/symbol").Symbol;
var DocComment = require("jsdocst/doc-comment").DocComment;

var conf = {
    extension: ".html"
}
exports.publish = function publish(symbolSet, options) {
    publish.conf = {  // trailing slash expected for dirs
        ext:         ".html",
        outDir:      JSDOC.opt.d || SYS.pwd+"../out/jsdoc/",
        templatesDir: JSDOC.opt.t || SYS.pwd+"../templates/jsdoc/",
        symbolsDir:  "symbols/",
        srcDir:      "symbols/src/"
    };

    var destination = options.destination.join("jsdoc");
    var template = options.template;

    // is source output is suppressed, just display the links to the source file
    if (options.includeSource && Link !== undefined && Link.prototype._makeSrcLink) {
        Link.prototype._makeSrcLink = function(srcFilePath) {
            return "&lt;" + srcFilePath + "&gt;";
        }
    }

    // create the folders and subfolders to hold the output
    var dirs = destination.join("symbols","src");
    if (!dirs.exists()) dirs.mkdirs();

    // used to allow Link to check the details of things being linked to
    Link.symbolSet = symbolSet;

    // create the required templates
    try {
        var classTemplate = new JsPlate(template.join("class.tmpl").read().decodeToString(), "class.tmpl");
        var classesTemplate = new JsPlate(template.join("allclasses.tmpl").read().decodeToString(), "allclasses.tmpl");
    } catch(e) {
        console.error("Couldn't create the required templates: " + e.message);
        OS.exit();
    }

    // some ustility filters
    function hasNoParent($) {return ($.memberOf == "")}
    function isaFile($) {return ($.is("FILE"))}
    function isaClass($) {return ($.is("CONSTRUCTOR") || $.isNamespace)}

    // get an array version of the symbolset, useful for filtering
    var symbols = symbolSet.toArray();

    // create the hilited source code files
    var files = options.files;
    for (var i = 0, l = files.length; i < l; i++) {
        makeSrcFile(files[i], destination.join("symbols", "src"));
     }

     // get a list of all the classes in the symbolset
     var classes = symbols.filter(isaClass).sort(makeSortby("alias"));

    // create a filemap in which outfiles must be to be named uniquely, ignoring case
    var uniqueNames = options.unique;
    if (uniqueNames) {
        var filemapCounts = {};
        Link.filemap = {};
        for (var i = 0, l = classes.length; i < l; i++) {
            var lcAlias = classes[i].alias.toLowerCase();

            if (!filemapCounts[lcAlias]) filemapCounts[lcAlias] = 1;
            else filemapCounts[lcAlias]++;

            Link.filemap[classes[i].alias] =
                (filemapCounts[lcAlias] > 1)?
                lcAlias+"_"+filemapCounts[lcAlias] : lcAlias;
        }
    }

    // create a class index, displayed in the left-hand column of every class page
    Link.base = "../";
    publish.classesIndex = classesTemplate.process(classes); // kept in memory

    // create each of the class pages
    for (var i = 0, l = classes.length; i < l; i++) {
        var symbol = classes[i];

        symbol.events = symbol.getEvents();   // 1 order matters
        symbol.methods = symbol.getMethods(); // 2

        Link.currentSymbol= symbol;
        var output = classTemplate.process(symbol);

        destination.join("symbols", (uniqueNames ? Link.filemap[symbol.alias] : symbol.alias) + conf.extension).write(output)
    }

    // regenerate the index with different relative links, used in the index pages
    Link.base = "";
    publish.classesIndex = classesTemplate.process(classes);

    // create the class index page
    try {
        var classesindexTemplate = new JsPlate(template.join("index.tmpl").read().decodeToString());
    } catch(e) {
        console.error(e.message);
        OS.exit()
    }

    var classesIndex = classesindexTemplate.process(classes);
    destination.join("index" + conf.extension).write(classesIndex);
    classesindexTemplate = classesIndex = classes = null;

    // create the file index page
    try {
        var fileindexTemplate = new JsPlate(template.join("allfiles.tmpl").read().decodeToString());
    } catch(e) {
        console.error(e.message);
        OS.exit()
    }

    var documentedFiles = symbols.filter(isaFile); // files that have file-level docs
    var allFiles = []; // not all files have file-level docs, but we need to list every one

    for (var i = 0; i < files.length; i++) {
        allFiles.push(new Symbol(files[i], [], "FILE", new DocComment("/** */")));
    }

    for (var i = 0; i < documentedFiles.length; i++) {
        var offset = files.indexOf(documentedFiles[i].alias);
        allFiles[offset] = documentedFiles[i];
    }

    allFiles = allFiles.sort(makeSortby("name"));

    // output the file index page
    var filesIndex = fileindexTemplate.process(allFiles);
    destination.join("files" + conf.extension).write(filesIndex);
    fileindexTemplate = filesIndex = files = null;
}


/** Just the first sentence (up to a full stop). Should not break on dotted variable names. */
function summarize(desc) {
    if (typeof desc != "undefined")
        return desc.match(/([\w\W]+?\.)[^a-z0-9_$]/i)? RegExp.$1 : desc;
}

/** Make a symbol sorter by some attribute. */
function makeSortby(attribute) {
    return function(a, b) {
        if (a[attribute] != undefined && b[attribute] != undefined) {
            a = a[attribute].toLowerCase();
            b = b[attribute].toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
    }
}

/** Pull in the contents of an external file at the given path. */
function include(path) {
    var path = publish.conf.templatesDir+path;
    return IO.readFile(path);
}

/** Turn a raw source file into a code-hilited page in the docs. */
function makeSrcFile(path, destination, name) {
    if (!options.includeSource) return;
    if (!name) {
        name = path.toString()
            .replace(/\.\.?[\\\/]/g, "")
            .replace(/[\\\/]/g, "_")
            .replace(/\:/g, "_");
    }
    var content, src;
    plugins.notify("onPublishSrc", (src = {
        path: path,
        name: name,
        charset: options.encoding,
        highlighted: null
    }));
    if (content = src.highlighted) destination.join(name + conf.extension).write(content);
}

/** Build output for displaying function parameters. */
function makeSignature(params) {
    if (!params) return "()";
    var signature = "("
    +
    params.filter(
        function($) {
            return $.name.indexOf(".") == -1; // don't show config params in signature
        }
    ).map(
        function($) {
            return $.name;
        }
    ).join(", ")
    +
    ")";
    return signature;
}

/** Find symbol {@link ...} strings in text and turn into html links */
function resolveLinks(str, from) {
    str = str.replace(/\{@link ([^} ]+) ?\}/gi,
        function(match, symbolName) {
            return new Link().toSymbol(symbolName);
        }
    );

    return str;
}