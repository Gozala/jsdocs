exports.onDocCommentSrc = function(comment) {
    comment.src = comment.src.replace(/@methodOf\b/i, "@function\n@memberOf");
    comment.src = comment.src.replace(/@fieldOf\b/i, "@field\n@memberOf");
};
exports.onDocCommentTags = function(comment) {
    for (var i = 0, l = comment.tags.length; i < l; i++) {
        var syn, tag = comment.tags[i], title = tag.title.toLowerCase();
        if ((syn = TagSynonyms[title])) tag.title = syn;
    }
};

var TagSynonyms = {
    "member":             "memberOf",
    "memberof":           "memberOf",
    "description":        "desc",
    "exception":          "throws",
    "argument":           "param",
    "returns":            "return",
    "classdescription":   "class",
    "fileoverview":       "overview",
    "extends":            "augments",
    "base":               "augments",
    "projectdescription": "overview",
    "classdescription":   "class",
    "link":               "see",
    "borrows":            "inherits",
    "scope":              "lends",
    "construct":          "constructor"
};

