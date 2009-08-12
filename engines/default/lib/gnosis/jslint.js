eval(require("file").path(module.path).join("../fulljslint.js").read().toString());
exports.JSLINT = function(source) {
    if (source.read) source = source.read();
    JSLINT(source.toString());
    return JSLINT;
}

