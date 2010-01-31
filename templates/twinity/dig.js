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
    return members("properties", symbol, data || {});
}
var methods = exports.methods = function methods(symbol, data) {
    return members("methods", symbol, data || {});
}
var member = exports.member = function member(symbol, data) {
    data = data || {};
    var name = data.name = symbol.name;
    var alias = data.alias = symbol.alias;
    data.isPrivate = symbol.isPrivate;
    data.isInner = symbol.isInner;
    var isStatic = data.isStatic = symbol.isStatic;
    var memberOf = symbol.memberOf
    data.memberOf = (isStatic && memberOf != GLOBAL) ? memberOf : null;
    data.description = UTILS.resolveLinks(UTILS.summarize(member.desc));
    data.link = Link().toSymbol(alias).withText(name.replace(/\^\d+$/, ''));
    return data;
}
var propertiesMember = exports.propertiesMember = function propertiesMember(symbol, data) {
    data = member(symbol, data || {});
    data.isConstant = symbol.isConstant;
    return data;
}
var methodsMember = exports.methodsMember = function methodsMember(symbol, data) {
    data = member(symbol, data || {});
    var params = symbol.params;
    if (params) {
        data.params = params;
        data.paramsString = UTILS.makeSignature(params);
    }
    return data;
}
var members = exports.members = function members(type, symbol, data) {
    data = data || {};
    var alias = symbol.alias;
    var members = symbol[type], l = members.length;
    var own = [], memberContributers = [], contributers = {};
    while (l--) {
        var member = members[l];
        var memberOf = member.memberOf;
        if (memberOf == alias && !member.isNamespace) { // own
            own.unshift(exports[type + "Member"](member));
        } else if (memberOf != alias) { // inhereted
            var contributer = contributers[memberOf];
            if (!contributer) {
                memberContributers.push(contributer = contributers[memberOf] = {});
                contributer.link = Link().toSymbol(memberOf);
                contributer[type] = [];
            }
            contributer[type].push({
                link: Link().toSymbol(member.alias).withText(member.name),
                name: member.name,
                alias: memeber.alias
            });
        }
    }
    if (own.length || memberContributers.length) {
        members = data[type] = {};
        if (own.length) members.own = own;
        if (memberContributers.length) members.inherited = memberContributers;
    }
    return data;
}
var Class = exports.Class = function Class(symbol, data) {
    return methods(symbol, properties(symbol, constructor(symbol, extend(symbol, type(symbol)))));
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