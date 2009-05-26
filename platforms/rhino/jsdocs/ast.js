/**
 * @Module
 * Abstaract Syntax Tree
 */
var Node = require('./node').Node;

/**
 * shortcuts
 */
var JAstNode = org.mozilla.javascript.ast.AstNode;
var JNode = org.mozilla.javascript.ast.Node;

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
function AstRoot(jAst) {
    if (!jAst) return null;
    this._ast = jAst;
}
AstRoot.prototype = {
    /**
     * @type org.mozilla.javascript.ast.AstRoot
     */
    _ast: null,
    /**
     * @param {Array}       instance to collect ast nodes in.
     * Creates simple visitor for traversing the AST. Used to collect nodes
     * from the {@code org.mozilla.javascript.ast.AstRoot} instance.
     * Implements {@code org.mozilla.javascript.ast.NodeVisitor}
     */
    _getVisitor: function(nodes) {
        return function(node) {
            nodes.push(new AstNode(node));
            return true;
        };
    },
    /**
     * URI, path or descriptive text indicating the origin
     * of this script's source code.
     * @type {String}
     */
    get uri() {return new String(this._ast.getSourceName);},
    /**
     * Visits the all nodes expect comment ones in the order they appear in the
     * source code and replaces self (getter) with an array (property).
     * @param {AstNode[]}
     */
    get nodes() {
        var self = arguments.callee;
        if (!self.nodes) {
            self.nodes = [];
            this._ast.visit(this._getVisitor(self.nodes));
        }
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
            self.nodes = [];
            this._ast.visitComments(this._getVisitor(self.nodes));
        }
        return self.nodes;
    },
    /**
     * @returns {String}
     */
    toSource: function() { return new String(this._ast.toSource()); }
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
function AstNode(jAstNode) {
    if (!jAstNode) return null;
    this._jBase = jAstNode;
}
AstNode.prototype = {
    /**
     * @type org.mozilla.javascript.ast.AstNode
     */
    _jBase: null,
    /**
     * Returns a debugging representation of the parse tree
     * starting at this node.
     * @returns {String}        a very verbose indented printout of the tree.
     * The format of each line is:  abs-pos  name position length [identifier]
     */
    debugPrint: function() { return new String(this._jBase.debugPrint()); },
    /**
     * Line number recorded for this node. If no line number was recorded,
     * searches the parent chain. the nearest line number, or -1 if none was
     * found
     * @type Integer
     */
    get line() { return parseInt(new String(this._jBase.getLineno())) },
    /**
     * Depth of this node. The root is depth 0, its children are depth 1, and
     * so on.
     * @type Integer
     */
    get depth() { return parseInt(new String(this._jBase.depth())) },
    /**
     * Short, descriptive name for the node, such as "ArrayComprehension".
     * @type String
     */
    get shortName() { return new String(this._jBase.shortName()); },
    /**
     * Prints the source indented to depth 0.
     */
    toSource: function() { return new String(this._jBase.toSource()); },
    /**
     * Returns the root of the tree containing this node.
     * @return the {@link AstRoot} at the root of this node's parent
     * chain, or {@code null} if the topmost parent is not an {@code AstRoot}.
     * @type AstRoot
     */
    get astRoot() { return new AstRoot(this._jBase.getAstRoot()) },
    /**
     * Parent node, or {@code null} if it has none.
     */
    get parent() { return new AstNode(this._jBase.getParent()); },
    /**
     * Node length
     * @type Integer
     */
    get length() { return parseInt(new String(this._jBase.getLength())) },
    /**
     * Absolute document position of the node. Computes it by adding the node's
     * relative position to the relative positions of all its parents.
     * @type Integer
     */
    get absolutePosition() {
        return parseInt(new String(this._jBase.getAbsolutePosition()))
    },
    /**
     * Relative position in parent
     * @type Integer
     */
    get position() { return parseInt(new String(this._jBase.getPosition())) },
    toString: function() {
        return this.shortName + ' : ' + this._jBase.toString();
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
    return new String(JAstNode.operatorToString(operator))
};
exports.AstNode = AstNode;
