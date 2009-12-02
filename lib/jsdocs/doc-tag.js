var LOG = system.log;
var plugins = require("./plugin-manager");
var balance = require("./frame/string").balance;

/**
 @constructor
 */
var DocTag = exports.DocTag = function DocTag(src) {
        this.init();
        if (typeof src != "undefined") {
                this.parse(src);
        }
};
DocTag.prototype = {
    constructor: DocTag,
    /**
    Create and initialize the properties of this.
    */
    init: function() {
        this.title        = "";
        this.type         = "";
        this.name         = "";
        this.isOptional   = false;
        this.defaultValue = "";
        this.desc         = "";

        return this;
    },
    /**
        Populate the properties of this from the given tag src.
        @param {string} src
    */
    parse: function(src) {
        if (typeof src != "string") throw "src must be a string not "+(typeof src);

        try {
                src = this.nibbleTitle(src);
                plugins.notify("onDocTagSynonym", this);

                src = this.nibbleType(src);

                // only some tags are allowed to have names.
                if (this.title == "param" || this.title == "property" || this.title == "config") { // @config is deprecated
                        src = this.nibbleName(src);
                }
        }
        catch(e) {
                if (LOG) LOG.warn(e);
                else throw e;
        }
        this.desc = src; // whatever is left

        // example tags need to have whitespace preserved
        if (this.title != "example") this.desc = this.desc.trim();

        plugins.notify("onDocTag", this);
    },
    /**
        Automatically called when this is stringified.
    */
    toString: function() {
        return this.desc;
    },
    /**
        Find and shift off the title of a tag.
        @param {string} src
        @return src
    */
    nibbleTitle: function(src) {
        if (typeof src != "string") throw "src must be a string not "+(typeof src);

        var parts = src.match(/^\s*(\S+)(?:\s([\s\S]*))?$/);

        if (parts && parts[1]) this.title = parts[1];
        if (parts && parts[2]) src = parts[2];
        else src = "";

        return src;
    },
    /**
        Find and shift off the type of a tag.
        @requires frame/String.js
        @param {string} src
        @return src
    */
    nibbleType: function(src) {
        if (typeof src != "string") throw "src must be a string not "+(typeof src);

        if (src.match(/^\s*\{/)) {
                var typeRange = balance.call(src, "{", "}");
                if (typeRange[1] == -1) {
                        throw "Malformed comment tag ignored. Tag type requires an opening { and a closing }: "+src;
                }
                this.type = src.substring(typeRange[0]+1, typeRange[1]).trim();
                this.type = this.type.replace(/\s*,\s*/g, "|"); // multiples can be separated by , or |
                src = src.substring(typeRange[1]+1);
        }

        return src;
    },
    /**
        Find and shift off the name of a tag.
        @requires frame/String.js
        @param {string} src
        @return src
    */
    nibbleName: function(src) {
        if (typeof src != "string") throw "src must be a string not "+(typeof src);

        src = src.trim();

        // is optional?
        if (src.charAt(0) == "[") {
                var nameRange = balance.call(src, "[", "]");
                if (nameRange[1] == -1) {
                        throw "Malformed comment tag ignored. Tag optional name requires an opening [ and a closing ]: "+src;
                }
                this.name = src.substring(nameRange[0]+1, nameRange[1]).trim();
                this.isOptional = true;

                src = src.substring(nameRange[1]+1);

                // has default value?
                var nameAndValue = this.name.split("=");
                if (nameAndValue.length) {
                        this.name = nameAndValue.shift().trim();
                        this.defaultValue = nameAndValue.join("=");
                }
        }
        else {
                var parts = src.match(/^(\S+)(?:\s([\s\S]*))?$/);
                if (parts) {
                        if (parts[1]) this.name = parts[1];
                        if (parts[2]) src = parts[2].trim();
                        else src = "";
                }
        }

        return src;
    }
}