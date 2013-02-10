var CamMotion = CamMotion || {};
/**
 * Exposes a set of gesture detector functions
 */
CamMotion.Detectors = (function () {

	function Motion(points, minX, maxX, minY, maxY) {
		var vector = calcMovementVector(points);
		return vector[0] > minX && vector[0] < maxX
			&& vector[1] > minY && vector[1] < maxY;
	}

	function HorizontalMotion(points, minX, maxX, rangeY) {
		return Motion(points, minX, maxX, -rangeY, rangeY);
	}

	function VerticalMotion(points, minY, maxY, rangeX) {
		return Motion(points, -rangeX, rangeX, minY, maxY);
	}

	// play with this treshold to find the best sensitiveness for detection
	var treshold = 40;

	function RightMotion(points) {
		return HorizontalMotion(points, treshold, 1000, treshold);
	}

	function LeftMotion(points) {
		return HorizontalMotion(points, -1000, -treshold, treshold);
	}

	function DownMotion(points) {
		return VerticalMotion(points, treshold, 1000, treshold);
	}

	function UpMotion(points) {
		return VerticalMotion(points, -1000, -treshold, treshold);
	}

	var cachedMovementVector = null;
	function calcMovementVector(points) {

		if (cachedMovementVector !== null) {
			return cachedMovementVector;
		}
		var length = points.length();
		if (length <= 1) {
			return [0, 0];
		}
		var vector = [0, 0];
		var prevPoint = points.get(0);
		for (var i=1;i<length;i++) {
			vector[0] += prevPoint[0] - points.get(i)[0]; //x
			vector[1] += prevPoint[1] - points.get(i)[1]; //y
			prevPoint = points.get(i);
		}
		cachedMovementVector = vector;
		return vector;
	}

	function reset() {
		cachedMovementVector = null;
	}

	return {
		LeftMotion: LeftMotion,
		RightMotion: RightMotion,
		DownMotion: DownMotion,
		UpMotion: UpMotion,
		reset: reset
	}
})();