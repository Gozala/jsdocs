/**
    @overview
    @date $Date$
    @version $Revision$
    @location $HeadURL$
 */

/**
    This is the main container for the JSDOC application.
*/

var parser = exports.optionsParser = new (require("args").Parser)();
var jsdoc = require("./jsdocs/js-doc");

var version = "3.0.0";
parser.usage("jsdocs [OPTIONS] <SRC_DIR> <SRC_FILE> ...");
parser.help("[OPTIONS]");
parser.option("-d", "--directory", "destination")
    .help("Output to this directory (defaults to \"out\").")
    .def("docs")
    .set();
parser.option("-t", "--template", "template")
    .help("Relative path to the template used for formating the output.")
    .set();
parser.option("-a", "--all", "allfunctions")
    .help("Include all functions, even undocumented ones.")
    .bool();
parser.option("--include-anoymus", "ignoreAnonymous")
    .help("Include all functions, even anonymus ones.")
    .def(true)
    .set(false);
parser.option("--explain", "explain")
    .help("Explain ??")     // TODO: put better help message
    .def(false)
    .set(true);
parser.option("--underscore-is-not-private", "treatUnderscoredAsPrivate")
    .help("Don't treat properties starting with underscore as privates.")
    .def(true)
    .set(false);
parser.option("-c", "--config", "conf")
    .help("Load a configuration file.")
    .set();
parser.option("-D", "--define", "define")
    .help("-D=\"myVar:My value\" or --define=\"myVar:'My value'\"\n" +
        "Multiple. Define a variable, available in JsDoc as JSDOC.opt.D.myVar.")
    .set();
parser.option("-e", "--encoding", "encoding")
    .help("-e=<ENCODING> or --encoding=<ENCODING>\n" +
        "Use this encoding to read and write files.")
    .def("utf-8")
    .set();
parser.option("-E", "--exclude", "exclude")
    .help("-E=\"REGEX\" or --exclude=\"REGEX\"\n" +
        "Multiple. Exclude files based on the supplied regex.")
    .def([])
    .action(collection);
parser.option("-n", "--nocode", "ignoreCode")
    .help("Ignore all code, only document comments with @name tags.")
    .def(false)
    .set(true);
parser.option("-o", "--out", "out")
    .help("Print log messages to a file (defaults to stdout).")
    .set();
parser.option("-p", "--private", "includePrivates")
    .help("Include symbols tagged as private, underscored and inner symbols.")
    .def(false)
    .set(true);
parser.option("-q", "--quiet", "quiet")
    .help("Do not output any messages, not even warnings.")
    .def(false)
    .set(true);
parser.option("-r", "--recurse", "recurse")
    .help("Descend into src directories.")
    .integer()
    .def(1)
    .set();
parser.option("-s", "--suppress", "includeSource")
    .help("Suppress source code output.")
    .def(false)
    .set(true);
parser.option("-S", "--securemodules", "securemodules")
    .help("Use Secure Modules mode to parse source code.")
    .def(false)
    .set(true);
parser.option("-T", "--test", "test")
    .help("Run all unit tests and exit.")
    .action(function() {
        print("run tests");
    });
parser.option("-u", "--unique", "destination")
    .help("Force file names to be unique, but not based on symbol names.")
    .def(false)
    .set(true);
parser.option("-v", "--verbose", "verbose")
    .help("Provide verbose feedback about what is happening.")
    .def(false)
    .set(true);
parser.option("-x", "--ext", "extensions")
    .help("-x=<EXT>[,EXT]... or --ext=<EXT>[,EXT]...\n" +
        "Scan source files with the given extensions separated by \":\" (defaults to .js)")
    .def([".js"])
    .action(collection);
parser.option("--version", "version")
    .help("print jsdoc-toolkit version number and exit.")
    .action(function() {
        this.print(version);
        this.exit();
    });
parser.option("-h", "--help")
    .action(parser.printHelp);

exports.main = function main(args) {
    var options = exports.options = parser.parse(args);
    if (options.args.length > 1) {
        parser.printHelp(options);
        parser.exit(options);
    } else {
        collection(options, "src", options.args[0]);
        jsdoc.doc(options);
    }
}

/**
    utility function used by arguments parser that splits
    arguments into subarguments.
    @param {Object} options     object containing options that parser will return
    @param {String} name        options name that being parsed
    @param {String} value       value that being parsed
*/
function collection(options, name, value) {
    options[name] = value.split(",");
}

if (require.main === module.id) exports.main(args)
/**
    @requires Opt

if (typeof arguments == "undefined") arguments = [];
JSDOC.opt = Opt.get(
    arguments,
    {
        a: "allfunctions",
        c: "conf",
        d: "directory",
        "D[]": "define",
        e: "encoding",
        "E[]": "exclude",
        h: "help",
        n: "nocode",
        o: "out",
        p: "private",
        q: "quiet",
        r: "recurse",
        S: "securemodules",
        s: "suppress",
        t: "template",
        T: "testmode",
        u: "unique",
        v: "verbose",
        x: "ext"
    }
);


