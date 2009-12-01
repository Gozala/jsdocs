/**
    @constructor
*/
var Token = exports.Token = function Token(data, type, name) {
        this.data = data;
        this.type = type;
        this.name = name;
};
Token.prototype = {
    constructor: Token,
    toString: function() {
        return "<"+this.type+" name=\""+this.name+"\">"+this.data+"</"+this.type+">";
    },
    is: function(what) {
        return this.name === what || this.type === what;
    }
};

