/**
 * @Module
 * Abstaract Syntax Tree
 */

/**
 * imports
 */
var Node = require('./node-platform').Node;

/**
 * shortcuts
 */
var JAstNode = org.mozilla.javascript.ast.AstNode;
var JNode = org.mozilla.javascript.ast.Node;

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
    this._base = jAstNode;
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
    debugPrint: function() { return new String(this._base.debugPrint()); },
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
    get depth() { return parseInt(new String(this._base.depth())) },
    /**
     * Short, descriptive name for the node, such as "ArrayComprehension".
     * @type String
     */
    get shortName() { return new String(this._base.shortName()); },
    /**
     * Prints the source indented to depth 0.
     */
    toSource: function() { return new String(this._base.toSource()); },
    /**
     * Returns the root of the tree containing this node.
     * @return the {@link AstRoot} at the root of this node's parent
     * chain, or {@code null} if the topmost parent is not an {@code AstRoot}.
     * @type AstRoot
     */
    get astRoot() { return new AstRoot(this._base.getAstRoot()) },
    /**
     * Parent node, or {@code null} if it has none.
     */
    get parent() { return new AstNode(this._base.getParent()); },
    /**
     * Node length
     * @type Integer
     */
    get length() { return parseInt(new String(this._base.getLength())) },
    /**
     * Absolute document position of the node. Computes it by adding the node's
     * relative position to the relative positions of all its parents.
     * @type Integer
     */
    get absolutePosition() {
        return parseInt(new String(this._base.getAbsolutePosition()))
    },
    /**
     * Relative position in parent
     * @type Integer
     */
    get position() { return parseInt(new String(this._base.getPosition())) },
    toString: function() {
        return this.shortName + " : " + this._base.toString();
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
    this._base = jAst;
}
AstRoot.prototype = {
    /**
     * @type org.mozilla.javascript.ast.AstRoot
     */
    _base: null,
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
    get sourceName() {return new String(this._base.getSourceName());},
    /**
     * Visits the all nodes expect comment ones in the order they appear in the
     * source code and replaces self (getter) with an array (property).
     * @param {AstNode[]}
     */
    get nodes() {
        if (!this._nodes) {
            this._nodes = [];
            this._base.visit(this._getVisitor(this._nodes));
        }
        return this._nodes;
    },
    /**
     * Visits the comment nodes in the order they appear in the source code.
     * And replaces self (getter) with an array (property).
     * @param {AstNode[]}
     */
    get commentNodes() {
        if (!this._commentNodes) {
            this._commentNodes = [];
            this._base.visitComments(this._getVisitor(this._commentNodes));
        }
        return this._commentNodes;
    },
    /**
     * @type {Comment[]}                  comment set, sorted by start position.
     */
    get comments() {
        var comments = this._base.getComments();
        return comments ? comments.toArray().map(function(e) { return e }) : [];
    },
    /**
     * Returns a copy of the child list, with each child cast to an
     * {@link AstNode}.
     * @throws ClassCastException if any non-{@code AstNode} objects are
     * in the child list, e.g. if this method is called after the code
     * generator begins the tree transformation.
     */
    get statements() {
        return this._base.getStatements().toArray().map(function(e) {
            return new AstNode(e);
        });
    },
    /**
     * @returns {String}
     */
    toSource: function() { return new String(this._base.toSource()); }
};
AstRoot.prototype.__proto__ = AstNode.prototype;
exports.AstRoot = AstRoot;
