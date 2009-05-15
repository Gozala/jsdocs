/*
 * Copyright 2008 by Massimiliano Mirra
 *
 * This file is part of seethrough.
 *
 * seethrough is free software; you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation; either version 3 of the License, or (at your
 * option) any later version.
 *
 * SamePlace is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The interactive user interfaces in modified source and object code
 * versions of this program must display Appropriate Legal Notices, as
 * required under Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License
 * version 3, modified versions must display the "Powered by SamePlace"
 * logo to users in a legible manner and the GPLv3 text must be made
 * available to them.
 *
 * Author: Massimiliano Mirra, <bard [at] hyperstruct [dot] net>
 * Contributors: Irakli Gozalishvili <rfobic [at] gmail [dot] com>
 */

/**
 * Constructs template object. if second optional argument id is specified
 * element with the sepcified id is used as a template root.
 * @constructor Template
 * @param {String} templateSource       Source of the template.
 * @param {String} id                   Optional. Template element id.
 * @returns {Object}
 */
exports.Template = Template = function Template(templateSource, id) {
    XML.ignoreComments = false;
    XML.ignoreWhitespace = false;
    XML.prettyPrinting = false;
    var xml = new XML(templateSource.toString());
    var template = id ? xml..*.(@id == id)[0] : xml;
    this.render = seethrough.compile(template);
};
Template.prototype = {
    /**
     * Renders template and returns output
     * @param {Object} data     JSON object to render template from.
     * @returns {String}
     */
    render: function(data) {}
}


var seethrough = {};


// TAG/ATTRIBUTE PROCESSORS
// ----------------------------------------------------------------------

seethrough.processors = {
    'http://hyperstruct.net/seethrough#js::attr': function() {
        // Apparently, an xml attribute object cannot be created by
        // itself, so we use a dummy element as attribute "factory".
        // Also, we want to create this element just once, not every
        // time we need to generate an attribute.
        var dummy = <dummy/>;
        return function stAttr(element, env, children) {
            dummy.@[element.@name] = children(env).toString();
            return dummy.@[element.@name];
        }
    },

    'http://hyperstruct.net/seethrough#js::condition': function(attrValue) {
        return function stCondition(element, env, children) {
            if(seethrough.getEnv(env, attrValue))
                return element.appendChild(children(env));
            else
                return new XML('');
        }
    },

    'http://hyperstruct.net/seethrough#js::disable': function(attrValue) {
        return function stDisable(element, env, children) {
            return attrValue == 'true' ? new XML('') : element;
        }
    },

    'http://hyperstruct.net/seethrough#js::replace': function(attrValue) {
        return function stReplace(element, env, children) {
            var envValue = seethrough.getEnv(env, attrValue);
            switch(typeof(envValue)) { // this should belong in
            case 'number':
            case 'string':
                return <dummy>{envValue}</dummy>.text();
            case 'xml':
                return envValue;
            default:
                throw new TypeError('Unhandled type for "' +
                                    envValue +
                                    '" (' + typeof(envValue) + ')');
            }
        }
    },

    'http://hyperstruct.net/seethrough#js::inspect': function(attrValue) {
        return function stInspect(element, env, children) {
            var envValue = seethrough.getEnv(env, attrValue);
            var representation;
            switch(typeof(envValue)) {
            case 'number':
            case 'string':
                representation = envValue;
                break;
            case 'xml':
                representation = envValue.toXMLString();
                break;
            case 'object':
                representation = envValue.toSource();
                break;
            default:
                throw new TypeError('Unhandled type for "' +
                                    envValue +
                                    '" (' + typeof(envValue) + ')');
            }
            // Force escaping
            return <dummy>{representation}</dummy>.text();
        }
    },

    'http://hyperstruct.net/seethrough#js::content': function(attrValue) {
        return function(element, env, children) {
            return element.appendChild(seethrough.getEnv(env, attrValue));
        }
    },
    'http://hyperstruct.net/seethrough#js::xmlstring': function(attrValue) {
        return function(element, env, children) {
            return element.appendChild(new XML('<dummy>' + seethrough.getEnv(env, attrValue) + '</dummy>').children());
        }
    },
    'http://hyperstruct.net/seethrough#js::exec': function(attrValue) {
        return function(element, env, children) {
            with(env) result = eval(attrValue);
            return element.appendChild(new XML('<dummy>' + result.toString() + '</dummy>').children());
        }
    },
//     'http://hyperstruct.net/seethrough#js::extra': function(attrValue, children) {
//         return function(element, env) {
//             return element.appendChild(seethrough.getEnv(env, attrValue));
//         }
//     },

    'http://hyperstruct.net/seethrough#js::loop': function(attrValue) {
        var [iterName, collectionName] = attrValue.split(' ');
        return function stLoop(element, env, children) {
            var container = new XMLList();
            if(iterName in env)
                throw new Error('Overriding global name not yet supported.');

            // XXX copied from compile.element -- factor! cleanup!

            var collection = seethrough.getEnv(env, collectionName);
            for each(var envValue in collection) {
                env[iterName] = envValue;

                var xmlOut = element.copy();

                var xmlChildren = children(env);
                if(typeof(xmlChildren) == 'undefined')
                    return xmlOut;

                var xmlChild;
                for(var i=0,l=xmlChildren.length(); i<l; i++) {
                    xmlChild = xmlChildren[i];
                    if(xmlChild.nodeKind() == 'attribute')
                        xmlOut.@[xmlChild.name()] = xmlChild.toString();
                    else
                        xmlOut.appendChild(xmlChild);
                }

                container += xmlOut;
            }
            delete env[iterName];
            return container;
        }
    },

    'http://hyperstruct.net/seethrough#js::eval': function() {
        return function stEval(element, env, children) {
            return new XML(eval(children(env).toString()));
        }
    }
};


// ENVIRONMENT
// ----------------------------------------------------------------------

seethrough.getEnv = function(env, path) {
    function fold(fn, acc, seq) {
        Array.forEach(seq, function(item) { acc = fn(acc, item); });
        return acc;
    }

    try {
        var value = fold(
            function(subEnv, propName) { return subEnv[propName] },
            env,
            path.split('.'));

        if(typeof(value) == 'xml' && value.nodeKind() == 'attribute')
            return value.toString();
        else
            return value;
    } catch(e if e.name == 'TypeError') {
        return undefined;
    }
};


// COMPILATION
// ----------------------------------------------------------------------

seethrough.EMPTY = function() {
    return function() {};
};

seethrough.compile = function(xml) {
    var c = arguments.callee;

    // Rhino brings up XML lists of length 0, Spidermonkey doesn't.
    if(xml.length() > 1)
        return c.list(xml);
    else if(xml.length() == 0)
        return seethrough.EMPTY();
    else
        switch(xml.nodeKind()) {
        case 'element':
            return c.element(xml);
            break;
        case 'text':
            return c.text(xml);
            break;
        case 'comment':
            return c.comment(xml);
            break;
        default:
            throw new Error('Compile error: unhandled node kind. (' + xml.nodeKind() + ')');
        }
}

seethrough.compile.comment = function(xmlComment) {
    return function() {
        return xmlComment;
    }
}

seethrough.compile.text = function(xmlText) {
    return function() {
        return xmlText;
    }
};

seethrough.compile.list = function(xmlList) {
    d('  - Compiling children');
    var renderChildren = [];
    for each(var xmlNode in xmlList) {
        renderChildren.push(seethrough.compile(xmlNode));
    }

    return function(env) {
        d('  * Rendering children')
        var rendered = new XMLList();
        for each(var renderChild in renderChildren) {
            rendered += renderChild(env);
        }
        return rendered;
    };
};

seethrough.compile.element = function(xmlElement) {
    d('- Compiling element ' + xmlElement.name());
    var xmlBase = xmlElement.copy();
    delete xmlBase.*::*;

    var elementProcessors = seethrough.makeProcessors(xmlElement);
    if(elementProcessors.length > 0)
        d('  - ' + elementProcessors.length + ' processor(s) to apply');

    var children = seethrough.compile(xmlElement.children());

    var render;
    if(elementProcessors.length > 0)
        render = function(env) {
            var xmlOut = xmlBase.copy(); // ref to parent scope - leak
            d('* Rendering ' + xmlOut.name());
            for each(var fnStep in elementProcessors) {
                xmlOut = fnStep(xmlOut, env, children);
            }
            return xmlOut;
        };
    else
        render = function(env) {
            try { // why don't exceptions get surfaced here?
                var xmlOut = xmlBase.copy();
                d('* Rendering ' + xmlOut.name());

                xmlChildren = children(env); // undeclared?
                if(typeof(xmlChildren) == 'undefined')
                    return xmlOut;

                var xmlChild;
                for(var i=0,l=xmlChildren.length(); i<l; i++) {
                    xmlChild = xmlChildren[i];
                    if(xmlChild.nodeKind() == 'attribute')
                        xmlOut.@[xmlChild.name()] = xmlChild.toString();
                    else
                        xmlOut.appendChild(xmlChild);
                }

                return xmlOut;
            } catch(e) {
                d(e + '\n' + e.stack);
            }
        };

    render.src = xmlElement;
    return render;
};

seethrough.makeProcessors = function(element) {
    var steps = [], makeProcessor;

    function makeAttributeProcessor(attr) {
        var ns = attr.namespace();
        var attrValue = attr.toString();
        var processor = makeProcessor(attrValue);
        return function(element, env, children) {
            d('  * Applying processor for ' + attr.name());
            delete element.@ns::[attr.localName()];
            var result = processor(element, env, children);
            return result;
        }
    }

    // Handle attributes
    for each(var attr in element.@*::*) {
        makeProcessor = seethrough.processors[attr.name().toString()];
        if(makeProcessor)
            steps.push(makeAttributeProcessor(attr));
    }

    // Handle tag
    makeProcessor = seethrough.processors[element.name().toString()];
    if(makeProcessor)
        steps.push(makeProcessor());

    return steps;
};


// DEVELOPMENT UTILITIES
// ----------------------------------------------------------------------

function d(msg) {
    if(!d.on)
        return;

    if(!arguments.callee.printFn) {
        if(typeof(print) == 'function')
            // command-line spidermonkey
            arguments.callee.printFn = print;
        else if(typeof(app) == 'object' &&
                typeof(app.log) == 'function')
            // helma
            arguments.callee.printFn = function(s) { app.log(s) };
        else
            arguments.callee.printFn = function() {};
    }

    var output;
    var stack = (new Error()).stack;
    if(stack)
        output = stack.split('\n')[2] + ':' + msg;
    else
        output = msg;

    arguments.callee.printFn(output);
}
d.on = false;
