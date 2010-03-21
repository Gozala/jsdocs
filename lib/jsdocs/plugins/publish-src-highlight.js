var console = require("system").log;
var TokenReader = require("../token-reader").TokenReader;
var TextStream = require("../text-stream").TextStream;
var Token = require("../token").Token;

var cache = {};
exports.onPublishSrc = function(src) {
    if (src.path in cache) return; // already generated src code
    cache[src.path] = true;
    var highlighter = new JsHighlight(src.path.read().toString(), src.charset);
    src.highlighted = highlighter.highlight();
};

function html() { return Array.prototype.join.call(arguments, "\n"); }

function JsHighlight(src, charset) {
    var tr = new TokenReader();
    tr.keepComments = true;
    tr.keepDocs = true;
    tr.keepWhite = true;
    this.tokens = tr.tokenize(new TextStream(src));

    // TODO is redefining toString() the best way?
    Token.prototype.toString = function() {
        return '<span class="' + this.type + '">' + this.data.replace(/</g, "&lt;") + "</span>";
    }
    this.showLinenumbers = true;
    this.header = html(
        "<html>",
            "\t<head>",
            '\t\t<meta http-equiv="content-type" content="text/html; charset="' + (charset || "utf-8") + '"/>',
            "\t\t<style>",
                ".KEYW {color: #933;}",
                ".COMM {color: #bbb; font-style: italic;}",
                ".NUMB {color: #393;}",
                ".STRN {color: #393;}",
                ".REGX {color: #339;}",
                ".line {border-right: 1px dotted #666; color: #666; font-style: normal;}",
            "\t\t</style>",
            "\t</head>",
            "\t<body>",
                "\t\t<pre>"
    );
    this.footer = html(
                "\t\t</pre>",
            "\t</body>",
        "</html>"
    );
}
JsHighlight.prototype.highlight = function() {
    var highlighted = this.tokens.join("");
    var line = 1;
    if (this.showLinenumbers) {
        highlighted = highlighted.replace(/(^|\n)/g, function(m) {
            return m + "<span class='line'>"
                + ( (line<10) ? " " : "" )
                + ( (line<100) ? " " : "" )
                + (line++)
                + "</span> ";
        });
    }
    return this.header + highlighted + this.footer;
};