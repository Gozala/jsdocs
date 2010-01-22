exports.onDocCommentTags = function(comment) {
    var currentParam = null;
    var tags = comment.tags;
    for (var i = 0, l = tags.length; i < l; i++) {
        var tag = tags[i];
        if (tag.title == "param") {
            if (tag.name.indexOf(".") == -1) currentParam = i;
        } else if (tag.title == "config") {
            tag.title = "param";
            if (currentParam == null) tag.name = "arguments" + "." + tag.name;
            else if (tag.name.indexOf(tags[currentParam].name + ".") != 0)
                tag.name = tags[currentParam].name + "." + tag.name;
            currentParam != null
            //tags[currentParam].properties.push(tags[i]);
        } else {
            currentParam = null;
        }
    }
};

