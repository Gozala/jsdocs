/**
 * @Module
 * Abstaract Syntax Tree
 */
var Node = require('./node-platform').Node;

/**
 * Node for the root of a parse tree.  It contains the statements and functions
 * in the script, and a list of {@link Comment} nodes associated with the script
 * as a whole. Node type is {@link Token#SCRIPT}.
 *
 * Note that the tree itself does not store errors. Parse errors
 * and warnings, can be found in {@link Parser#errors} {@link Parser#warnings}.
 * @class
 * @author Irakli Gozalishvili
 * @param {org.mozilla.javascript.ast.AstRoot} jAst
 */
function AstRoot(ast) {
    if (!ast) return null;
    this._base = ast;
}
AstRoot.prototype = {
    /**
     * @type org.mozilla.javascript.ast.AstRoot
     */
    _base: null,
    /**
     * URI, path or descriptive text indicating the origin
     * of this script's source code.
     * @type {String}
     */
    get uri() {return this._base.getSourceName;},
    /**
     * Visits the all nodes expect comment ones in the order they appear in the
     * source code and replaces self (getter) with an array (property).
     * @param {AstNode[]}
     */
    get nodes() {
        var self = arguments.callee;
        if (!self.nodes) self.nodes = this._base.nodes || [];
        return self.nodes;
    },
    /**
     * Visits the comment nodes in the order they appear in the source code.
     * And replaces self (getter) with an array (property).
     * @param {AstNode[]}
     */
    get commentNodes() {
        var self = arguments.callee;
        if (!self.nodes) {
            self.nodes = this._base.commentNodes || [];
        }
        return self.nodes;
    },
    /**
     * @returns {String}
     */
    toSource: function() { return this._base.toSource(); }
};
exports.AstRoot = AstRoot;

/**
 * Base class for AST node types. The goal of the AST is to represent the
 * physical source code, to make it useful for code-processing tools such
 * as IDEs or pretty-printers.  The parser must not rewrite the parse tree
 * when producing this representation.
 * @class
 * @param {org.mozilla.javascript.ast.AstNode}
 * @extends Node
 */
function AstNode(astNode) {
    if (!astNode) return null;
    this._base = astNode;
}
AstNode.prototype = {
    /**
     * @type org.mozilla.javascript.ast.AstNode
     */
    _base: null,
    /**
     * Returns a debugging representation of the parse tree
     * starting at this node.
     * @returns {String}        a very verbose indented printout of the tree.
     * The format of each line is:  abs-pos  name position length [identifier]
     */
    debugPrint: function() { return this._base.debugPrint(); },
    /**
     * Line number recorded for this node. If no line number was recorded,
     * searches the parent chain. the nearest line number, or -1 if none was
     * found
     * @type Integer
     */
    get line() { return parseInt(new String(this._base.getLineno())) },
    /**
     * Depth of this node. The root is depth 0, its children are depth 1, and
     * so on.
     * @type Integer
     */
    get depth() { return parseInt( this._base.depth()) },
    /**
     * Short, descriptive name for the node, such as "ArrayComprehension".
     * @type String
     */
    get shortName() { return this._base.shortName(); },
    /**
     * Prints the source indented to depth 0.
     */
    toSource: function() { return this._base.toSource(); },
    /**
     * Returns the root of the tree containing this node.
     * @return the {@link AstRoot} at the root of this node's parent
     * chain, or {@code null} if the topmost parent is not an {@code AstRoot}.
     * @type AstRoot
     */
    get astRoot() { return this._base.getAstRoot() },
    /**
     * Parent node, or {@code null} if it has none.
     */
    get parent() { return new AstNode(this._base.getParent()); },
    /**
     * Node length
     * @type Integer
     */
    get length() { return parseInt(this._base.getLength()) },
    /**
     * Absolute document position of the node. Computes it by adding the node's
     * relative position to the relative positions of all its parents.
     * @type Integer
     */
    get absolutePosition() {
        return parseInt(this._base.getAbsolutePosition());
    },
    /**
     * Relative position in parent
     * @type Integer
     */
    get position() { return parseInt(this._base.getPosition()) },
    toString: function() {
        return this.shortName + ' : ' + this._base.toString();
    }
};
AstNode.prototype.__proto__ = Node.prototype;
/**
 * Returns the string name for this operator.
 * @param {Integer}         op the token type, e.g. {@link Token#ADD} or
 * {@link Token#TYPEOF}
 * @returns {String}        the source operator string, such as "+" or "typeof"
 */
AstNode.operatorToString = function operatorToString(operator) {
    return "Unknown"
};
exports.AstNode = AstNode;
