var path = '/Users/gozala/Projects/';
var File = require('file').Path;
var Template = require(path + 'jsdocs/templates/seethrough/seethrough.js').Template;
var templateSource = new File(path + 'jsdocs/templates/seethrough/index.xhtml').read();
var template = new Template(templateSource);
var data = {
    page: {
        title: 'test title',
        style: 'body {background: #000; color: #fff;}',
        header: 'Hello header!!',
        footer: 'Bye footer!!'
    },
    classes: [
        {name: 'foo'},
        {name: 'bar'}
    ]
};

var result = template.render(data);