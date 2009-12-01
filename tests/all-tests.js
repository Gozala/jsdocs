exports["test:token-reader"] = require("./token-reader");

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));