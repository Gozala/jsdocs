var Link = require("jsdocs/frame/link").Link;
var UTILS = require("./utils");
var console = require("system").log;

var GLOBAL = "_global_";

var type = exports.type = function type(symbol, data) {
    data = data || {};
    var alias = data.alias = symbol.alias;
    var isBuiltin = data.isBuiltin = symbol.isBuiltin();
    var isClass = data.isClass = !(data.isNamespace = symbol.isNamespace);
    var isFunction = data.isFunction = (!isClass && symbol.is("FUNCTION"));
    var type = "";
    if (isBuiltin) type += "Built-In ";
    if (isClass) type += "Class "
    else {
        if (isFunction) type += "Function ";
        type += "Namespace ";
    }
    data.type = type;
    data.description = UTILS.resolveLinks(symbol.classDesc);
    if (!isBuiltin) data.defined = Link().toSrc(symbol.srcFile);
    var isPrivate = data.isPrivate = symbol.isPrivate;
    var isInner = data.isInner = symbol.isInner;
    var isHighlighted = data.isHighlighted = !!symbol.comment.getTag("hilited").length;
    return data;
}
var extend = exports.extend = function extend(symbol, data) {
    data = data || {};
    var extend = symbol.augments;
    if (extend && extend.length) {
        extend = data.extend = extend.map(function(ancestor) {
            return Link.toSymbol(ancestor);
        });
        data.extendString = extend.join(", ");
    }
    return data;
}
var constructor = exports.constructor = function constructor(symbol, data) {
    data = data || {};
    var alias = symbol.alias;
    var isBuiltin = symbol.isBuiltin();
    var isClass = !symbol.isNamespace;
    var isFunction = (!isClass && symbol.is("FUNCTION"));
    var type = "";
    if (isBuiltin) type += "Built-In ";
    if (isClass) type += "Class "
    else {
        if (isFunction) type += "Function ";
        type += "Namespace ";
    }
    var isHighlighted = data.isHighlighted = !!symbol.comment.getTag("hilited").length;
    if (!isBuiltin && (!isClass || symbol.is("CONSTRUCTOR"))) {
        var constructor = data.classConstructor = {};
        constructor.link = Link().toSymbol(alias).inner("constructor");
        if (isClass) {
            var params = constructor.params = symbol.params;
            constructor.paramsString = UTILS.makeSignature(params);
            constructor.isPrivate = symbol.isPrivate;
            constructor.isInner = symbol.isInner;
            constructor.type = type;
            constructor.isHighlighted = isHighlighted;
            constructor.decsription = UTILS.resolveLinks(UTILS.summarize(symbol.desc));
        }
    }
    return data;
}
var properties = exports.properties = function properties(symbol, data) {
    data = data || {};
    var alias = symbol.alias;
    var properties = symbol.properties, l = properties.length;
    var ownProperties = [], propertyContributers = [], contributers = {};
    while (l--) {
        var property = properties[l];
        var memberOf = property.memberOf;
        if (memberOf == alias && !property.isNamespace) { // own
            ownProperties.unshift({
                "name": property.name,
                "isPrivate": property.isPrivate,
                "isInner": property.isInner,
                "isStatic": property.isStatic,
                "isConstant": property.isConstant,
                "memberOf": (property.isStatic && memberOf != GLOBAL)
                    ? property.memberOf : null,
                "link": Link().toSymbol(alias).withText(property.name),
                "description": UTILS.resolveLinks(UTILS.summarize(property.desc))
            });
        } else if (memberOf != alias) { // inhereted
            var contributer = contributers[memberOf];
            if (!contributer) {
                contributer = contributers[memberOf] = {}
                contributer.link = Link().toSymbol(memberOf);
                contributer.properties = [];
                propertyContributers.push(contributer);
            }
            contributer.properties.push(Link().toSymbol(property.alias).withText(property.name));
        }
    }
    if (ownProperties.length) data.ownProperties = ownProperties;
    if (propertyContributers.length) data.propertyContributers = propertyContributers;
    return data;
}
var Class = exports.Class = function Class(symbol, data) {
    return properties(symbol, constructor(symbol, extend(symbol, type(symbol))));
};

exports.toJSON = function toJSON(symbol) {
    var data = {};
    var alias = data.alias = symbol.alias;
    var isBuiltin = data.isBuiltin = symbol.isBuiltin();
    var isClass = data.isClass = !(data.isNamespace = symbol.isNamespace);
    var isFunction = data.isFunction = (!isClass && symbol.is("FUNCTION"));
    var type = "";
    if (isBuiltin) type += "Built-In ";
    if (isClass) type += "Class "
    else {
        if (isFunction) type += "Function ";
        type += "Namespace ";
    }
    data.type = type;
    var extend = symbol.augments;
    if (extend && extend.length) {
        extend = data.extend = extend.map(function($) {
            return Link.toSymbol($);
        });
        data.extendString = extend.join(", ");
    }
    data.description = UTILS.resolveLinks(symbol.classDesc);
    if (!isBuiltin) data.defined = Link().toSrc(symbol.srcFile);
    var isPrivate = data.isPrivate = symbol.isPrivate;
    var isInner = data.isInner = symbol.isInner;
    var isHighlighted = data.isHighlighted = !!symbol.comment.getTag("hilited").length;
    if (!symbol.isBuiltin() && (symbol.isNamespace || symbol.is("CONSTRUCTOR"))) {
        var constructor = data.classConstructor = {};
        constructor.link = Link().toSymbol(alias).inner("constructor");
        if (isClass) {
            var params = constructor.params = symbol.params;
            constructor.paramsString = UTILS.makeSignature(params);
            constructor.isPrivate = isPrivate;
            constructor.isInner = isInner;
            constructor.type = type;
            constructor.isHighlighted = isHighlighted;
            constructor.decsription = UTILS.resolveLinks(UTILS.summarize(symbol.desc));
        }
    }
    var properties = symbol.properties, l = properties.length;
    var ownProperties = [], propertyContributers = [], contributers = {};
    while (l--) {
        var property = properties[l];
        var memberOf = property.memberOf;
        if (memberOf == alias && !property.isNamespace) { // own
            ownProperties.unshift({
                "name": property.name,
                "isPrivate": property.isPrivate,
                "isInner": property.isInner,
                "isStatic": property.isStatic,
                "isConstant": property.isConstant,
                "memberOf": (property.isStatic && memberOf != GLOBAL)
                    ? property.memberOf : null,
                "link": Link().toSymbol(alias).withText(property.name),
                "description": UTILS.resolveLinks(UTILS.summarize(property.desc))
            });
        } else if (memberOf != alias) { // inhereted
            var contributer = contributers[memberOf];
            if (!contributer) {
                propertyContributers.push(contributer = contributers[memberOf] = {});
            }
            var contributerProperties = contributer.properties;
            if (!contributerProperties) {
                var contributerProperties = contributer.properties = [];
                contributer.link = Link().toSymbol(memberOf);
            }
            contributerProperties.push(Link().toSymbol(property.alias).withText(property.name));
        }
    }
    if (ownProperties.length) data.ownProperties = ownProperties;
    if (propertyContributers.length) data.propertyContributers = propertyContributers;
    return data;
    //data.methods.filter(function($){return $.memberOf == data.alias  && !$.isNamespace}).sort(makeSortby("name"));
}