/** Called automatically by JsDoc Toolkit. */
var Link = require("jsdocs/frame/link").Link;
var console = require("system").log;
var plugins = require("jsdocs/plugin-manager");
var Symbol = require("jsdocs/symbol").Symbol;
var DocComment = require("jsdocs/doc-comment").DocComment;
var FILE = require("file");
var Template = require("json-template").Template;
var DIG = require("./dig");
var UTILS = require("./utils")

var GLOBAL = "_global_";

exports.publish = function publish(symbolSet, options) {
    var version = "0.1";
    var date = new Date();
    var extension = Link.ext = ".html" || options.extension;
    var template = options.template;
    var encoding = "utf-8" || options.encoding;
    var style = template.join("static", "default.css").read().toString();
    var header = template.join("static", "header.html").read().toString();
    var footer = Template(template.join("static", "footer.html").read().toString()).expand({
        version: version,
        date: date
    });
    
    var destination = options.destination;

    // is source output is suppressed, just display the links to the source file
    if (options.includeSource && Link !== undefined && Link.prototype._makeSrcLink) {
        Link.prototype._makeSrcLink = function(srcFilePath) {
            return "&lt;" + srcFilePath + "&gt;";
        }
    }

    // create the folders and subfolders to hold the output
    var symbols = Link.symbolsDir = destination.join("symbols");
    var dirs = Link.srcDir = symbols.join("src");
    if (!dirs.exists()) dirs.mkdirs();

    // used to allow Link to check the details of things being linked to
    Link.symbolSet = symbolSet;

    // create the required templates    
    var classTemplate = Template(template.join("class.tmpl").read().toString());
    var classesTemplate = Template(template.join("allclasses.tmpl").read().toString());

    // some ustility filters
    function hasNoParent(symbol) {return (symbol.memberOf == "")}
    function isaFile(symbol) {return (symbol.is("FILE"))}
    function isaClass(symbol) {return (symbol.is("CONSTRUCTOR") || symbol.isNamespace)}

    // get an array version of the symbolset, useful for filtering
    var symbols = symbolSet.toArray();

    // create the hilited source code files
    var files = options.files;
    if (options.includeSource) {
        for (var i = 0, l = files.length; i < l; i++) {
            UTILS.makeSrcFile(files[i], destination.join("symbols", "src"), null, options.encoding);
        }
    }

     // get a list of all the classes in the symbolset
     var classes = symbols.filter(isaClass).sort(UTILS.makeSortby("alias"));

    // create a filemap in which outfiles must be to be named uniquely, ignoring case
    if (options.unique) {
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
    // TODO: don't access this damn Link
    Link.base = "../";
    var classesLink = Link().toFile("index.html").withText("Class Index");
    var filesLink = Link().toFile("files.html").withText("File Index");
    
    var index = classesTemplate.expand({ // kept in memory
        classesLink: classesLink,
        filesLink: filesLink,
        items: classes.map(function(item) {
            var alias = item.alias, link = Link().toClass(alias);
            return (alias == GLOBAL) ? "<i>" + link + "</i>" : link;
        })
    });

    // create each of the class pages
    for (var i = 0, l = classes.length; i < l; i++) {
        var symbol = classes[i];

        symbol.events = symbol.getEvents();   // 1 order matters
        symbol.methods = symbol.getMethods(); // 2


        Link.currentSymbol = symbol;
        var name = options.uniqueNames ? Link.filemap[symbol.alias] : symbol.alias;
        var json = DIG.Class(symbol);
        print("\n\n" + JSON.stringify(json) + "\n\n");
        destination.join("symbols", name + extension).write(classTemplate.expand({
            "encoding": encoding,
            "header": header,
            "footer": footer,
            "style": style,
            "index": index,
            "symbol": json
        }));
    }

throw "So far"

    // regenerate the index with different relative links, used in the index pages
    Link.base = "";
    // TODO: don't access this damn Link
    global.conf.classesIndex = classesTemplate.process(classes);

    // create the class index page
    var classesindexTemplate = new JsPlate(template.join("index.tmpl").read().toString(), "index.tmpl");
    var classesIndex = classesindexTemplate.process(classes);
    destination.join("index" + conf.extension).write(classesIndex);
    classesindexTemplate = classesIndex = classes = null;

    // create the file index page
    var fileindexTemplate = new Template(template.join("allfiles.tmpl").read().toString());

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
    var filesIndex = fileindexTemplate.expand({
        title: new Link().toFile("files.html").withText("File Index"),
        files: allFiles
    });
    destination.join("files" + conf.extension).write(filesIndex);
    fileindexTemplate = filesIndex = files = null;
}


