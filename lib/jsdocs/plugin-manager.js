/**
 @module Holds functionality related to running plugins.
*/

//var FILE = require("file");
var pointers = exports.pointers = {};

/* var plugins = FILE.path(module.path).join("../plugins").listPaths().map(function(id) {
    return require(id.toString());
});
*/
var plugins = [
    require("./plugins/comment-src-json"),
    require("./plugins/framework-prototype"),
    require("./plugins/function-call"),
    require("./plugins/publish-src-highlight"),
    require("./plugins/symbol-link"),
    require("./plugins/tag-param-config"),
    require("./plugins/tag-synonyms")
];
var l = plugins.length;
while (l--) {
    var plugin = plugins[l];
    for (var pointer in plugin) {
        (pointers[pointer] || (pointers[pointer] = [])).push(plugin[pointer]);
    }
}

/**
    @param {Strind} topic           event that happened
    @param ...                      target Any object. This will be passed as the only argument to the handler whose
    name matches the hook name. Handlers cannot return a value, so must modify the target
    object to have an effect.
*/

exports.notify = function(topic) {
    var observers = pointers[topic];
    if (observers) {
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0, l = observers.length; i < l; i++) {
            observers[i].apply(null, args);
        }
    }
};

