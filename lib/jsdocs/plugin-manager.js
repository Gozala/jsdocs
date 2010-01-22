/**
 @module Holds functionality related to running plugins.
*/

var FILE = require("file");
var pointers = exports.pointers = {};

var plugins = FILE.path(module.path).join("../plugins").listPaths(), l = plugins.length;
while (l--) {
    var plugin = require(plugins[l].toString());
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

