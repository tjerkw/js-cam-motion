var CamMotion = CamMotion || {};
/**
 * Simple pub-sub eventbus
 */
CamMotion.Events = function () {
	/**
	 * A map from topicName -> list[function]
	 */
	var listeners = {};

	/**
	 * Subscribes a new listeners.
	 */
	function on(topic, f) {

		if (!listeners[topic]) {
			listeners[topic] = [];
		}
		listeners[topic].push(f);
	}

	/**
	 * Publish a new event
	 */
	function trigger(topic, context) {

		var fs = listeners[topic];
		if (fs && fs.length) {
			for (var i=0;i<fs.length;i++) {
				fs[i](context);
			}
		}
	}

	return {
		"on": on,
		"trigger": trigger
	}
};