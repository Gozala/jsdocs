exports["test:token-reader"] = require("./token-reader");
exports["test:doc-tag"] = require("./doc-tag");
exports["test:string / balance"] = require("./frame/string");

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));