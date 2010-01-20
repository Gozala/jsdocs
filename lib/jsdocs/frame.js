/** A few helper functions to make life a little easier. */

exports.defined = function defined(o) {
    return (o !== undefined);
};

exports.copy = function copy(o) { // todo check for circular refs
    if (o == null || typeof(o) != 'object') return o;
    var c = new o.constructor();
    for(var p in o)    c[p] = copy(o[p]);
    return c;
};

exports.isUnique = function isUnique(arr) {
    var l = arr.length;
    for(var i = 0; i < l; i++ ) {
        if (arr.lastIndexOf(arr[i]) > i) return false;
    }
    return true;
};

/** Returns the given string with all regex meta characters backslashed. */
exports.escapeMeta = RegExp.escapeMeta = function escapeMeta(str) {
    return str.replace(/([$^\\\/()|?+*\[\]{}.-])/g, "\\$1");
};