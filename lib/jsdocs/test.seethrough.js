var File = require('file').Path;
var thisFile = new File(require.fileName)
    thisDir = thisFile.join('..');

var Template = require('./seethrough.js').Template;
var seethrough = require('./seethrough.js').seethrough;

jsUnity.attachAssertions();
exports.PublishTests = {
    setUp: function() {},
    tearDown: function() {},
    'test - simple': function() {
        var source = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:st="http://hyperstruct.net/seethrough#js">\n\
                <head>\n\
                    <title st:content="site.title"/>\n\
                </head>\n\
                <body>\n\
                    <h1>Welcome to <span st:replace="site.title"/>!</h1>\n\
                </body>\n\
            </html>';

        var output = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:st="http://hyperstruct.net/seethrough#js">\n\
                <head>\n\
                    <title>Foobar</title>\n\
                </head>\n\
                <body>\n\
                    <h1>Welcome to Foobar!</h1>\n\
                </body>\n\
            </html>';

        var data = {
            site: {
                title: 'Foobar'
            }
        };

        XML.ignoreComments = false;
        XML.ignoreWhitespace = false;
        XML.prettyPrinting = false;
        var src = new XML(source);
        
        assertInstanceOf(XML, src);
        
        var template = seethrough.compile(src);
        var result = template(data).toXMLString();

        assertEqual(result, output);
    },
    'test - Template': function() {
        var source = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:st="http://hyperstruct.net/seethrough#js">\n\
                <head>\n\
                    <title st:content="site.title"/>\n\
                </head>\n\
                <body>\n\
                    <h1>Welcome to <span st:replace="site.title"/>!</h1>\n\
                </body>\n\
            </html>';

        var output = '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:st="http://hyperstruct.net/seethrough#js">\n\
                <head>\n\
                    <title>Foobar</title>\n\
                </head>\n\
                <body>\n\
                    <h1>Welcome to Foobar!</h1>\n\
                </body>\n\
            </html>';

        var data = {
            site: {
                title: 'Foobar'
            }
        };

        var template = new Template(source);
        var result = template.render(data);
        
        print(typeof result);
        print(typeof output);

        assertEqual(result, output);
    }
};
