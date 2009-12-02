/**
 @module Holds functionality related to running plugins.
*/

/*
  *  The collection of all plugins. Requires a unique name for each.
 */
var Observers = {};

/**
    @param {String} topic           events to observe in the core code.
    @param {Function} observer      function to be called on event
    @param {Object} scope           during call ("this" in the context of the called observer)
*/
exports.observe = function(topic, observer, scope) {
    var observers = Observers[topic] = Observers[topic] || [];
    observers.push({
        observer: observer,
        scope: scope
    })
    return this;
};
/**
    @param {Strind} topic           event that happened
    @param ...                      target Any object. This will be passed as the only argument to the handler whose
    name matches the hook name. Handlers cannot return a value, so must modify the target
    object to have an effect.
*/

exports.notify = function(topic) {
    var observers = Observers[topic];
    if (observers) {
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0, l = observers.length; i < l; i++) {
            var observer = observers[i];
            observer.observer.apply(observer.scope, args);
        }
    }
};

