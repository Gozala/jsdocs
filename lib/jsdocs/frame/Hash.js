/**
    @constructor
    @example
    var _index = new Hash();
    _index.set("a", "apple");
    _index.set("b", "blue");
    _index.set("c", "coffee");

    for (var p = _index.first(); p; p = _index.next()) {
        print(p.key+" is for "+p.value);
    }
 */
var Hash = exports.Hash = function Hash() {
    this._map = {};
    this._keys = [];
    this._vals = [];
    this.reset();
};
Hash.prototype = {
    constructor: Hash,
    set: function set(key, value) {
        if (key != "") {
            this._keys.push(key);
            this._map["=" + key] = this._vals.length;
            this._vals.push(value);
        }
    },
    replace: function replace(k, k2, v) {
        if (k == k2) return;
        var offset = this._map["="+k];
        this._keys[offset] = k2;
        if (typeof v != "undefined") this._vals[offset] = v;
        this._map["="+k2] = offset;
        delete(this._map["="+k]);
    },
    drop: function drop(k) {
        if (k != "") {
            var offset = this._map["="+k];
            this._keys.splice(offset, 1);
            this._vals.splice(offset, 1);
            delete(this._map["="+k]);
            for (var p in this._map) {
                if (this._map[p] >= offset) this._map[p]--;
            }
            if (this._cursor >= offset && this._cursor > 0) this._cursor--;
        }
    },
    get: function get(key) {
        if (key != "") return this._vals[this._map["="+key]];
    },
    keys: function keys() {
        return this._keys;
    },
    hasKey: function hasKey(k) {
        if (k != "") return (typeof this._map["="+k] != "undefined");
    },
    values: function values() {
        return this._vals;
    },
    reset: function reset() {
        this._cursor = 0;
    },
    first: function first() {
        this.reset();
        return this.next();
    },
    next: function next() {
        if (this._cursor++ < this._keys.length)
            return {key: this._keys[this._cursor-1], value: this._vals[this._cursor-1]};
    }
};

