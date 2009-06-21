/**
 * This class implements the root of the intermediate representation.
 * @class
 * @param {org.mozilla.javascript.Node}
 */
function Node(node) {
    this._base = node;
};
Node.prototype = {
    
};
Node.newString = function nodeNewString(string) {
    
}
exports.Node = Node;