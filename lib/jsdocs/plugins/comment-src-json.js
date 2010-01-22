exports.onDocCommentSrc = function onDocCommentSrc(comment) {
    if (/^\s*@json\b/.test(comment)) {
        comment.src = new String(comment.src).replace("@json", "");
        try {
            var tagged = "", json = JSON.parse(comment.src);
            for (var key in json) {
                var tag = json[key];
                // todo handle cases where tag is an object
                tagged += "@" + key + " " + tag + "\n";
            }
            comment.src = tagged;
        } catch(e) {}
    }
};