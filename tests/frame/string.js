var assert = require("test/assert");
var balance = require("jsdocs/frame/string").balance;

exports["test:String.prototype.balance"] = function() {

        var s = balance.call("{abc}", "{","}");
        assert.is(s[0], 0, "opener in first is found.");
        assert.is(s[1], 4, "closer in last is found.");

        s = balance.call("ab{c}de", "{","}");
        assert.is(s[0], 2, "opener in middle is found.");
        assert.is(s[1], 4, "closer in middle is found.");

        s = balance.call("a{b{c}de}f", "{","}");
        assert.is(s[0], 1, "nested opener is found.");
        assert.is(s[1], 8, "nested closer is found.");

        s = balance.call("{}", "{","}");
        assert.is(s[0], 0, "opener with no content is found.");
        assert.is(s[1], 1, "closer with no content is found.");

        s = balance.call("", "{","}");
        assert.is(s[0], -1, "empty string opener is -1.");
        assert.is(s[1], -1, "empty string closer is -1.");

        s = balance.call("{abc","{","}");
        assert.is(s[0], -1, "opener with no closer returns -1.");
        assert.is(s[1], -1, "no closer returns -1.");

        s = balance.call("{abc","{","}");
        assert.is(s[0], -1, "no opener or closer returns -1 for opener.");
        assert.is(s[1], -1, "no opener or closer returns -1 for closer.");

        s = balance.call("a<bc}de", "<","}");
        assert.is(s[0], 1, "unmatching opener is found.");
        assert.is(s[1], 4, "unmatching closer is found.");
}

if (require.main == module)
    require("os").exit(require("test/runner").run(exports));