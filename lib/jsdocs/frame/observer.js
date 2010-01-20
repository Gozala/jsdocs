function Observable() {
    this.observers = {};
};
Observable.prototype = {
    constructor: Observable,
    observe: function(topic, observer, scope) {
        var observers = this.observers;
        observers = observers[topic] = observers[topic] || [];
        observers.push({
            observer: observer,
            scope: scope
        })
        return this;
    },
    notify: function(topic) {
        var observers = this.observers[topic];
        if (observers) {
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0, l = observers.length; i < l; i++) {
                var observer = observers[i];
                observer.observer.apply(observer.scope, args);
            }
        }
    }
};

