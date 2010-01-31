var Link = require("jsdocs/frame/link").Link;
var plugins = require("jsdocs/plugin-manager");

/** Just the first sentence (up to a full stop). Should not break on dotted variable names. */
exports.summarize = function summarize(desc) {
    return !desc ? "" : desc.match(/([\w\W]+?\.)[^a-z0-9_$]/i) ? RegExp.$1 : desc;
};
/** Make a symbol sorter by some attribute. */
exports.makeSortby = function makeSortby(attribute) {
    return function(a, b) {
        if (a[attribute] != undefined && b[attribute] != undefined) {
            a = a[attribute].toLowerCase();
            b = b[attribute].toLowerCase();
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
        }
    }
};
/** Turn a raw source file into a code-hilited page in the docs. */
exports.makeSrcFile = function makeSrcFile(path, destination, name, encoding) {
    var content, src;
    if (!name) {
        name = path.toString()
            .replace(/\.\.?[\\\/]/g, "")
            .replace(/[\\\/]/g, "_")
            .replace(/\:/g, "_");
    }
    plugins.notify("onPublishSrc", (src = {
        path: path,
        name: name,
        charset: encoding,
        highlighted: null
    }));
    if (content = src.highlighted) destination.join(name).write(content);
};
/** Build output for displaying function parameters. */
exports.makeSignature = function makeSignature(params) {
    if (!params) return "";
    return ("" +
        params.filter(function(param) {
            return param.name.indexOf(".") == -1; // don't show config params in signature
        }).map(function($) {
            return param.name;
        }).join(", ") + "");
}
/** Find symbol {@link ...} strings in text and turn into html links */
exports.resolveLinks = function resolveLinks(text, from) {
    return text.replace(/\{@link ([^} ]+) ?\}/gi, function(match, symbolName) {
        return new Link().toSymbol(symbolName);
    });
};
exports.defined = function defined(o) {
    return o !== undefined;
}
