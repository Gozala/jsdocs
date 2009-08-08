var File = require('file').Path,
    Seethrough = require('jsdocs/seethrough.js').Template;

var thisFile = new File(require.fileName)
    thisDir = thisFile.join('..');

jsUnity.attachAssertions();
exports.PublishTests = {
    setUp: function() {},
    tearDown: function() {},
    'test - read template files': function() {
        var cssText = thisDir.join('styles.css').read().toString();
        var ieFixText = thisDir.join('ieFix.css').read().toString();
        var indexText = thisDir.join('index.xhtml').read().toString();
        var listText = thisDir.join('list.xhtml').read().toString();
        var classText = thisDir.join('class.xhtml').read().toString();
        var codeText = thisDir.join('code.xhtml').read().toString();
        
        assertTrue(cssText.length > 0);
        assertTrue(ieFixText.length > 0);
        assertTrue(indexText.length > 0);
        assertTrue(listText.length > 0);
        assertTrue(classText.length > 0);
        assertTrue(codeText.length > 0);
    },
    'test - creating templates': function() {
        var cssText = thisDir.join('styles.css').read().toString();
        var ieFixText = thisDir.join('ieFix.css').read().toString();
        var indexText = thisDir.join('index.xhtml').read().toString();
        var listText = thisDir.join('list.xhtml').read().toString();
        var classText = thisDir.join('class.xhtml').read().toString();
        var codeText = thisDir.join('code.xhtml').read().toString();

        //var cssTempate = new Template(cssText);
        //var ieFixTemplate = new Template(ieFixText);
        var listTemplate = new Template(listText, 'index');
        var indexTemplate = new Template(indexText);
        var classTemplate = new Template(classText);
        var codeTemplate = new Template(codeText);

        assertTrue(cssText.length > 0);
        assertTrue(ieFixText.length > 0);
        assertTrue(indexText.length > 0);
        assertTrue(listText.length > 0);
        assertTrue(classText.length > 0);
        assertTrue(codeText.length > 0);
    }
};