#!/usr/bin/env narwhal

var Link = require("./link").Link;
var console = require("system").log;
var plugins = require("jsdocs/plugin-manager");
var Symbol = require("jsdocs/symbol").Symbol;
var DocComment = require("jsdocs/doc-comment").DocComment;
var FS = require("file");
var Template = require("json-template").Template;
var DIG = require("./dig");
var UTILS = require("./utils")
var OPTIONS = require("jsdocs/options");
var SYSTEM = require("system");
var JSDOCS = require("jsdocs/js-doc");
var GLOBAL = "global";

exports.main = function main() {
    var options = OPTIONS.main(SYSTEM.args);
    var symbolSet = JSDOCS.doc(options);
    var version = "0.1";
    var date = new Date();
    var extension = Link.ext = ".html" || options.extension;
    var template = FS.path(module.path).join("..");
    var encoding = "utf-8" || options.encoding;
    var style = template.join("static", "default.css").read().toString();
    var header = template.join("static", "header.html").read().toString();
    var footer = Template(template.join("static", "footer.html").read().toString()).expand({
        version: version,
        date: date
    });

    var destination = options.destination;

    // create the folders and subfolders to hold the output
    var symbols = Link.symbolsDir = destination.join("symbols");
    var sources = Link.srcDir = symbols.join("src");
    if (!sources.exists()) sources.mkdirs();

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
        destination.join("symbols", name + extension).write(classTemplate.expand({
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
    var classesIndex = Template(template.join("index.tmpl").read().toString());
    destination.join("index" + extension).write(classesIndex.expand({
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
    var filesIndex = Template(template.join("allfiles.tmpl").read().toString());
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
    destination.join("files" + extension).write(filesIndex.expand({
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

if (require.main == module) exports.main();