var CamMotion = CamMotion || {};
/**
 * A simple circular buffer implementation
 */
CamMotion.CircularBuffer = function (size) {
	var buffer = [];
	var index = -1;
	var currentLength = 0;

	function push(value) {
		buffer.push(value);
		index = (index + 1) % size;
		currentLength++;
		if (currentLength > size) {
			currentLength = size;
		}
	}

	/**
	 * Gets a value from the buffer.
	 * Relative index counts back in time.
	 * 0 gets the last pushed value, 1 gets the pushed
	 * value before that.
	 */
	function get(relativeIndex) {

		if(index === -1) {
			throw "circular buffer is empty";
		}
		var i = index - relativeIndex;
		i %= size;
		if (i < 0) {
			i += size;
		}
		return buffer[i];
	}

	function length() {
		return currentLength;
	}

	function reset() {
		buffer = [];
		index = -1;
		currentLength = 0;
	}

	return {
		push: push,
		get: get,
		length: length,
		reset: reset
	}
};