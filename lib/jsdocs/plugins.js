exports.plug = function plug(JSDOC) {
    JSDOC.PluginManager.registerPlugin(
            "JSDOC.publishSrcHilite",
            {
                    onPublishSrc: function(src) {
                            if (src.file in JsHilite.cache) {
                                    return; // already generated src code
                            }
                            else JsHilite.cache[src.file] = true;
                    
                            try {
                                    
                                    var sourceCode = src.file.read().toString();
                            }
                            catch(e) {
                                    print(e.message);
                            }
    
                            var hiliter = new JsHilite(sourceCode);
                            src.hilited = hiliter.hilite();
                    }
            }
    );
    
    function JsHilite(src, charset) {
    
            var tr = new JSDOC.TokenReader();
            
            tr.keepComments = true;
            tr.keepDocs = true;
            tr.keepWhite = true;
            
            this.tokens = tr.tokenize(new JSDOC.TextStream(src));
            
            // TODO is redefining toString() the best way?
            JSDOC.Token.prototype.toString = function() { 
                    return "<span class=\""+this.type+"\">"+this.data.replace(/</g, "&lt;")+"</span>";
            }
            
            if (!charset) charset = "utf-8";
            
            this.header = '<html><head><meta http-equiv="content-type" content="text/html; charset='+charset+'"> '+
            "<style>\n\
            .KEYW {color: #933;}\n\
            .COMM {color: #bbb; font-style: italic;}\n\
            .NUMB {color: #393;}\n\
            .STRN {color: #393;}\n\
            .REGX {color: #339;}\n\
            .line {border-right: 1px dotted #666; color: #666; font-style: normal;}\n\
            </style></head><body><pre>";
            this.footer = "</pre></body></html>";
            this.showLinenumbers = true;
    }
    
    JsHilite.cache = {};
    JsHilite.prototype.hilite = function() {
            var hilited = this.tokens.join("");
            var line = 1;
            if (this.showLinenumbers) hilited = hilited.replace(/(^|\n)/g, function(m){return m+"<span class='line'>"+((line<10)? " ":"")+((line<100)? " ":"")+(line++)+"</span> "});
            
            return this.header+hilited+this.footer;
    }


    JSDOC.PluginManager.registerPlugin(
            "JSDOC.symbolLink",
            {
                    onSymbolLink: function(link) {
                            // modify link.linkPath
                            // or link.linkText here
                    }
            }
    );


    JSDOC.PluginManager.registerPlugin(
            "JSDOC.commentSrcJson",
            {
                    onDocCommentSrc: function(comment) {
                            var json;
                            if (/^\s*@json\b/.test(comment)) {
                                    comment.src = new String(comment.src).replace("@json", "");
    
                                    eval("json = "+comment.src);
                                    var tagged = "";
                                    for (var i in json) {
                                            var tag = json[i];
                                            // todo handle cases where tag is an object
                                            tagged += "@"+i+" "+tag+"\n";
                                    }
                                    comment.src = tagged;
                            }
                    }
            }
    );


    JSDOC.PluginManager.registerPlugin(
            "JSDOC.frameworkPrototype",
            {
                    onPrototypeClassCreate: function(classCreator) {
                            var desc = "";
                            if (classCreator.comment) {
                                    desc = classCreator.comment;
                            }
                            var insert = desc+"/** @name "+classCreator.name+"\n@constructor\n@scope "+classCreator.name+".prototype */"
                            
                            insert = insert.replace(/\*\/\/\*\*/g, "\n");
                            /*DEBUG*///print("insert is "+insert);
                            classCreator.addComment.data = insert;
                    }
            }
    );


    JSDOC.PluginManager.registerPlugin(
            "JSDOC.functionCall",
            {
                    onFunctionCall: function(functionCall) {
                            if (functionCall.name == "dojo.define" && functionCall.arg1) {
                                    functionCall.doc = "/** @lends "+eval(functionCall.arg1)+".prototype */";
                            }
                    }
            }
    );


    JSDOC.PluginManager.registerPlugin(
            "JSDOC.tagParamConfig",
            {
                    onDocCommentTags: function(comment) {
                            var currentParam = null;
                            var tags = comment.tags;
                            for (var i = 0, l = tags.length; i < l; i++) {
                                    
                                    if (tags[i].title == "param") {
                                            if (tags[i].name.indexOf(".") == -1) {
                                                    currentParam = i;
                                            }
                                    }
                                    else if (tags[i].title == "config") {
                                            tags[i].title = "param";
                                            if (currentParam == null) {
                                                    tags[i].name = "arguments"+"."+tags[i].name;
                                            }
                                            else if (tags[i].name.indexOf(tags[currentParam].name+".") != 0) {
                                                    tags[i].name = tags[currentParam].name+"."+tags[i].name;
                                            }
                                            currentParam != null
                                            //tags[currentParam].properties.push(tags[i]);
                                    }
                                    else {
                                            currentParam = null;
                                    }
                            }
                    }
            }
    );

/* TODO: Fix this plugin.Think Namespace is not available here.
  
    JSDOC.PluginManager.registerPlugin(
            "JSDOC.tagSynonyms",
            {
                    onDocCommentSrc: function(comment) {
                            comment.src = comment.src.replace(/@methodOf\b/i, "@function\n@memberOf");
                            comment.src = comment.src.replace(/@fieldOf\b/i, "@field\n@memberOf");
                    },
                    
                    onDocCommentTags: function(comment) {
                            for (var i = 0, l = comment.tags.length; i < l; i++) {
                                    var title = comment.tags[i].title.toLowerCase();
                                    var syn;
                                    if ((syn = JSDOC.tagSynonyms.synonyms["="+title])) {
                                            comment.tags[i].title = syn;
                                    }
                            }
                    }
            }
    );
    new Namespace(
            "JSDOC.tagSynonyms",
            function() {
                    JSDOC.tagSynonyms.synonyms = {
                            "=member":             "memberOf",
                            "=memberof":           "memberOf",
                            "=description":        "desc",
                            "=exception":          "throws",
                            "=argument":           "param",
                            "=returns":            "return",
                            "=classdescription":   "class",
                            "=fileoverview":       "overview",
                            "=extends":            "augments",
                            "=base":               "augments",
                            "=projectdescription": "overview",
                            "=classdescription":   "class",
                            "=link":               "see",
                            "=borrows":            "inherits",
                            "=scope":              "lends",
                            "=construct":          "constructor"
                    }
            }
    );
*/
}
