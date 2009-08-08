/**
 * return extended blank String Object with property eof which equals to true
 * @Constructor
 */
function _eof() {
    result = new String('');
    result.eof = true;
    return result;
}

/**
 * @constructor
 */
function TextStream(text) {
    this.text = (text || "").toString();
    this.cursor = 0;
}
TextStream.prototype = {
    /**
     * Looks for the n-th char, form the current cursors position and return it.
     * if not exists blank string with additional eof property is returned.
     * @param {Number} n        position from the current cursor
     * @returns {String}        Character on the given position or eof
     */
    look: function(n) {
        var position = this.cursor + (n || 0);
        if (position < 0 || position >= this.text.length)
            return _eof();
        return this.text.charAt(position);
    },
    /**
     * Looks for the n chars, form the current cursors position, return them and
     * moves cursor with a specified n positions. If no more n chars left blank
     * string with additional eof property is returned withought moving cursor.
     * @param {Number} n        position from the current cursor
     * @returns {String}        Character on the given position or eof
     */
    next: function(n) {
        n = n || 1;
        if (n < 1) return null;
        var pulled = this.text.substr(this.cursor, n);
        if (pulled.length != n) return _eof();
        this.cursor += n;
        return pulled;
    }
};
exports.TextStream = TextStream;