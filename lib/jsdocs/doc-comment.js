var plugins = require("./plugin-manager");
var DocTag = require("./doc-tag").DocTag;
/**
    Create a new DocComment. This takes a raw documentation comment,
    and wraps it in useful accessors.
    @class Represents a documentation comment object.
 */
var DocComment = exports.DocComment = function DocComment(/**String*/comment) {
    this.init();
    if (typeof comment != "undefined") {
            this.parse(comment);
    }
};
DocComment.prototype = {
    constructor: DocComment,
    init: function() {
        this.isUserComment = true;
        this.src           = "";
        this.meta          = "";
        this.tagTexts      = [];
        this.tags          = [];
    },
    /**
            @requires DocTag
    */
    parse: function(/**String*/comment) {
        if (comment == "") {
                comment = "/** @desc */";
                this.isUserComment = false;
        }

        this.src = DocComment.unwrapComment(comment);

        this.meta = "";
        if (this.src.indexOf("#") == 0) {
                this.src.match(/#(.+[+-])([\s\S]*)$/);
                if (RegExp.$1) this.meta = RegExp.$1;
                if (RegExp.$2) this.src = RegExp.$2;
        }

        plugins.notify("onDocCommentSrc", this);

        this.fixDesc();

        this.src = DocComment.shared+"\n"+this.src;

        this.tagTexts =
                this.src
                .split(/(^|[\r\n])\s*@/)
                .filter(function($){return $.match(/\S/)});

        /**
                The tags found in the comment.
                @type DocTag[]
         */
        this.tags = this.tagTexts.map(function($){return new DocTag($)});

        plugins.notify("onDocCommentTags", this);
    },
    /**
        If no @desc tag is provided, this function will add it.
    */
    fixDesc: function() {
        if (this.meta && this.meta != "@+") return;
        if (/^\s*[^@\s]/.test(this.src)) {
                this.src = "@desc "+this.src;
        }
    },
    /**
        Provides a printable version of the comment.
        @type String
    */
    toString: function() {
        return this.src;
    },
    /**
        Given the title of a tag, returns all tags that have that title.
        @type DocTag[]
     */
    getTag: function(/**String*/tagTitle) {
        return this.tags.filter(function($){return $.title == tagTitle});
    },
    deleteTag: function(/**String*/tagTitle) {
        this.tags = this.tags.filter(function($){return $.title != tagTitle})
    }
};
/**
    Remove slash-star comment wrapper from a raw comment string.
    @type String
*/
DocComment.unwrapComment = function(/**String*/comment) {
    if (!comment) return "";
    var unwrapped = comment.replace(/(^\/\*\*|\*\/$)/g, "").replace(/^\s*\* ?/gm, "");
    return unwrapped;
};
/**
    Used to store the currently shared tag text.
*/
DocComment.shared = "";

