exports.balance = function(open, close) {
    var i = 0;
    while (this.charAt(i) != open) {
            if (i == this.length) return [-1, -1];
            i++;
    }

    var j = i+1;
    var balance = 1;
    while (j < this.length) {
            if (this.charAt(j) == open) balance++;
            if (this.charAt(j) == close) balance--;
            if (balance == 0) break;
            j++;
            if (j == this.length) return [-1, -1];
    }

    return [i, j];
};

