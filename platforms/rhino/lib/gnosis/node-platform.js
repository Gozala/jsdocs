/**
 * imports
 */
var Token = require("gnosis/token").Token;

/**
 * This class implements the root of the intermediate representation.
 * @class
 * @param {org.mozilla.javascript.Node|Node|AstNode}
 */
function Node(base) {
    this._base = base._base || base;
};
Node.prototype = {
    /**
     * @type {String}           JSDoc comment string attached to this node.
     */
    get jsDocs() { return new String(this._base.getJsDoc() || "").toString() },
    /**
     * @type {String}           node type
     */
    get type() { return parseInt(new String(this._base.getType())); },
    /**
     * @type {String}           human-readable string for the token name.
     */
    get typeName() { return Token.typeToName(this.type); },
    /**
     * @type {Node[]}           Array of child nodes.
     */
    get children() {
        if (!this._children) {
            this._children = [];
            var nodes = this._base.iterator();
            while (nodes.hasNext()) this.children.push(new Node(nodes.next()));
        }
        return this._children;
    },
    /**
     * @returns {String}
     */
    toString: function() {
        return this.typeName + " : " + new String(this._base.toString())
    },
    /**
     * @returns {String}
     */
    toSource: function() { return new String(this._base.toSource()).toString() }
};
exports.Node = Node;
