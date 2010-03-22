//#!/usr/bin/env narwhal

var Link = require("./link").Link;
var plugins = require("jsdocs/plugin-manager");
var Symbol = require("jsdocs/symbol").Symbol;
var DocComment = require("jsdocs/doc-comment").DocComment;
var Template = require("json-template").Template;
var DIG = require("./dig");
var UTILS = require("./utils")
var SYSTEM = require("system");
var GLOBAL = "global";

var Parser = require("jsdocs/parser").Parser;
var plugins = require("jsdocs/plugin-manager");
var TokenReader = require("jsdocs/token-reader").TokenReader;
var TokenStream = require("jsdocs/token").TokenStream;
var TextStream = require("jsdocs/text-stream").TextStream;

exports.main = function main(source) {
    var options = SYSTEM.env;
    var parser = Parser(SYSTEM.env);
    var tokenReader = new TokenReader();
    var ts = new TokenStream(tokenReader.tokenize(new TextStream(source)));
    parser.parse(ts, SYSTEM.env.src);
    var symbolSet = parser.symbols;
    parser.finish();
    plugins.notify("onFinishedParsing", symbolSet)
    var version = "0.1";
    var date = new Date();
    var extension = Link.ext = ".html" || options.extension;
    var encoding = "utf-8" || options.encoding;
    var template = "templates/breeze/"
    var style = read(template + "resources/static/default.css");
    var header = read(template + "resources/static/header.html");
    var footer = Template(read(template + "resources/static/footer.html")).expand({
        version: version,
        date: date
    });


    // create the folders and subfolders to hold the output
    var symbols = Link.symbolsDir = ["symbols"];
    var sources = Link.srcDir = ["src"];
    var destination = [];
    //if (!sources.exists()) sources.mkdirs();

    // used to allow Link to check the details of things being linked to
    Link.symbolSet = symbolSet;

    // create the required templates
    var classTemplate = Template(read(template + "resources/class.tmpl"));
    var classesTemplate = Template(read(template + "resources/allclasses.tmpl"));

    // some ustility filters
    function hasNoParent(symbol) {return (symbol.memberOf == "")}
    function isaFile(symbol) {return (symbol.is("FILE"))}
    function isaClass(symbol) {return (symbol.is("CONSTRUCTOR") || symbol.isNamespace)}

    // get an array version of the symbolset, useful for filtering
    var symbols = symbolSet.toArray();
    // create the hilited source code files
    var files = [SYSTEM.env.src];
    if (options.includeSource) {
        for (var i = 0, l = files.length; i < l; i++) {
            var content, src;
            var path = files[i];
            var name = path.toString()
                .replace(/\.\.?[\\\/]/g, "")
                .replace(/[\\\/]/g, "_")
                .replace(/\:/g, "_");
            plugins.notify("onPublishSrc", (src = {
                path: path,
                name: name,
                charset: encoding,
                highlighted: null
            }));
            if (content = src.highlighted) sources.join(name + extension).write(content);
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
        write(destination.join("symbols", name + extension), classTemplate.expand({
            encoding: encoding,
            header: header,
            footer: footer,
            style: style,
            index: index,
            symbol: DIG.Class(symbol)
        }));
    }
    // regenerate the index with different relative links, used in the index pages
    Link.base = "../----/";
    // TODO: don't access this damn Link
    index = classesTemplate.expand({ // kept in memory
        classesLink: classesLink,
        filesLink: filesLink,
        items: classes.map(function(item) {
            var alias = item.alias, link = Link().toClass(alias);
            return (alias == GLOBAL) ? "<i>" + link + "</i>" : link;
        })
    });
    // create the class index page
    var classesIndex = Template(read(template + "resources/index.tmpl"));
    write(destination.join("index" + extension), classesIndex.expand({
        encoding: encoding,
        style: style,
        header: header,
        index: index,
        footer: footer,
        classes: classes.map(function(symbol) {
            return {
                link: Link().toSymbol(symbol.alias),
                description: UTILS.resolveLinks(UTILS.summarize(symbol.classDesc))
            }
        })
    }));

    // create the file index page
    var filesIndex = Template(read(template + "resources/allfiles.tmpl"));
    var documentedFiles = symbols.filter(isaFile); // files that have file-level docs
    var allFiles = []; // not all files have file-level docs, but we need to list every one
    for (var i = 0, l = files.length; i < l; i++) {
        allFiles.push(new Symbol(files[i], [], "FILE", new DocComment("/** */")));
    }
    for (var i = 0, l = documentedFiles.length; i < l; i++) {
        var offset = files.indexOf(documentedFiles[i].alias);
        allFiles[offset] = documentedFiles[i];
    }
    allFiles = allFiles.sort(UTILS.makeSortby("name"));

    // output the file index page
    write(destination.join("files" + extension), filesIndex.expand({
        encoding: encoding,
        style: style,
        header: header,
        index: index,
        footer: footer,
        // title: Link().toFile("files.html").withText("File Index"),
        files: allFiles.map(function(symbol) {
            var file = { link: Link().toSrc(symbol.alias).withText(symbol.name) };
            if (symbol.desc) file.description = symbol.desc;
            if (symbol.author) file.author = symbol.author;
            if (symbol.version) file.version = symbol.version;
            var uris = symbol.comment.getTag('location');
            if (uris && uris.length) file.uris = uris.map(function(uri) {
                return uri.toString()
                    .replace(/(^\$ ?| ?\$$)/g, '')
                    .replace(/^HeadURL: https:/g, 'http:');
            });
            return file;
        })
    }));
}

if (require.main == module) {
    var src = SYSTEM.env.src;
    if (src) {
        var request = new XMLHttpRequest();
        request.open("GET", src, true);
        request.onreadystatechange = function() {
            if (request.readyState == 4 && (request.status == 200 || request.status == 0))
                exports.main(request.responseText);
        }
        request.send(null);
    }
}

function read(path) {
    var request = new XMLHttpRequest();
    request.open("GET", path, false);
    request.send(null);
    return request.responseText;
}

function write(path, data) {
    window.open("data:text/html," + encodeURIComponent(data));
}

