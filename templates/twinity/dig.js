var Link = require("jsdocs/frame/link").Link;
var UTILS = require("./utils");
var console = require("system").log;

var GLOBAL = "_global_";

var type = exports.type = function type(symbol, data) {
    data = data || {};
    var alias = data.alias = symbol.alias.toString();
    var isBuiltin = data.isBuiltin = symbol.isBuiltin();
    var isClass = data.isClass = !(data.isNamespace = symbol.isNamespace);
    var isFunction = data.isFunction = (!isClass && symbol.is("FUNCTION"));
    var absoluteName = "";
    if (isBuiltin) absoluteName += "Built-In ";
    if (isClass) absoluteName += "Class "
    else {
        if (isFunction) absoluteName += "Function ";
        absoluteName += "Namespace ";
    }
    data.absoluteName = absoluteName;
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
    var alias = symbol.alias.toString();
    var isBuiltin = symbol.isBuiltin();
    var isClass = !symbol.isNamespace;
    var isFunction = (!isClass && symbol.is("FUNCTION"));
    var absoluteName = "";
    if (isBuiltin) absoluteName += "Built-In ";
    if (isClass) absoluteName += "Class "
    else {
        if (isFunction) absoluteName += "Function ";
        absoluteName += "Namespace ";
    }
    var isHighlighted = data.isHighlighted = !!symbol.comment.getTag("hilited").length;
    if (!isBuiltin && (!isClass || symbol.is("CONSTRUCTOR"))) {
        var constructor = data.classConstructor = {};
        if (isClass) {
            constructor.absoluteName = absoluteName;
            constructor.isHighlighted = isHighlighted;
            method(symbol, constructor);
        }
        constructor.link = Link().toSymbol(alias).inner("constructor");
    }
    return data;
}
var params = exports.params = function params(symbol) {
    return symbol.map(function(symbol) {
        var param = {};
        var type = symbol.type;
        if (type) param.type = {
            name: type.toString(),
            link: Link().toSymbol(type)
        };
        param.name = symbol.name;
        param.isOptional = symbol.isOptional;
        if (symbol.defaultValue) param.defaultValue = symbol.defaultValue;
        param.description = symbol.desc;
        return param;
    });
}
var properties = exports.properties = function properties(symbol, data) {
    return members("properties", symbol, data || {});
}
var methods = exports.methods = function methods(symbol, data) {
    return members("methods", symbol, data || {});
}
var events = exports.events = function events(symbol, data) {
    return members("events", symbol, data || {});
}

var member = exports.member = function member(symbol, data) {
    data = data || {};
    var name = data.name = symbol.name.toString();
    var alias = data.alias = symbol.alias.toString();
    data.isPrivate = symbol.isPrivate;
    data.isInner = symbol.isInner;
    var isStatic = data.isStatic = symbol.isStatic;
    var memberOf = symbol.memberOf
    data.memberOf = (isStatic && memberOf != GLOBAL) ? memberOf : null;
    data.description = UTILS.resolveLinks(UTILS.summarize(symbol.desc));
    data.link = Link().toSymbol(alias).withText(name.replace(/\^\d+$/, ''));
    data.linkName = Link.symbolNameToLinkName(symbol);
    var type = symbol.type;
    if (type) {
        data.type = type;
        data.typeLink = Link().toSymbol(type);
    }
    data.isOptional = symbol.isOptional;
    if (symbol.defaultValue) data.defaultValue = symbol.defaultValue;
    if (symbol.author) data.author = symbol.author;
    if (symbol.deprecated) data.deprecated = UTILS.resolveLinks(symbol.deprecated);
    if (symbol.since) data.since = symbol.since;
    var examples = symbol.example;
    if (examples && examples.length) data.examples = examples;
    var see = symbol.see;
    if (see && see.length) data.see = see.map(function(see) {
        return Link().toSymbol(see)
    })
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
    if (params && params.length) {
        data.params = exports.params(params);
        data.paramsString = UTILS.makeSignature(params);
    }
    var exceptions = symbol.exceptions;
    if (exceptions && exceptions.length) data.exceptions = exceptions.map(function(symbol) {
        var exception = {
            name: symbol.name.toString(),
            description: UTILS.resolveLinks(exception.desc)
        };
        var type = symbol.type;
        if (type) exception.type = {
            name: type,
            link: Link().toSymbol(type)
        };
        return exception;
    })
    var returns = symbol.returns;
    if (returns && returns.length) data.returns = returns.map(function(symbol) {
        var returns = { description: UTILS.resolveLinks(symbol.desc) };
        var type = symbol.type;
        if (type) returns.type = {
            name: type,
            link: Link().toSymbol(type)
        };
        return returns;
    })
    var requires = symbol.requires;
    if (requires && requires.length) data.requires = requires.map(function(requires) {
        return UTILS.resolveLinks(requires);
    });
    return data;
};
var method = exports.method = methodsMember;
var eventsMember = methodsMember;
var members = exports.members = function members(type, symbol, data) {
    data = data || {};
    var alias = symbol.alias.toString();
    var members = symbol[type], l = members.length;
    var own = [], memberContributers = [], contributers = {};
    while (l--) {
        var member = members[l];
        var memberOf = member.memberOf.toString();
        if (memberOf == alias && !member.isNamespace) { // own
            var src = (symbol.srcFile != member.srcFile) ? member.srcFile : null;
            member = exports[type + "Member"](member)
            if (src) member.src = { link: Link().toSrc(src) };
            own.unshift(member);
        } else if (memberOf != alias) { // inhereted
            var contributer = contributers[memberOf];
            if (!contributer) {
                memberContributers.push(contributer = contributers[memberOf] = {});
                contributer.link = Link().toSymbol(memberOf);
                contributer[type] = [];
            }
            contributer[type].push({
                link: Link().toSymbol(member.alias).withText(member.name),
                name: member.name.toString(),
                alias: memeber.alias.toString()
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
    return events(symbol, methods(symbol, properties(symbol, constructor(symbol, extend(symbol, type(symbol))))));
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