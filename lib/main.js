var CamMotion = CamMotion || {};

/**
 * CamMotion module wich exposes a sunple listener function called on.
 * Which publishes the following events
 *
 * The idea and some of the implementation is based on:
 * http://www.adobe.com/devnet/html5/articles/javascript-motion-detection.html
 *
 * "error": Could not listener for motion events, probably not supported by the browser
 * "streamInit": Webcam was initialized succesfully and is streaming
 * "frame": A new frame was blended, handle motion detection here
 */
CamMotion.Engine = function(options) {
	options = options || {};
	options.colorDiffTreshold = options.colorDiffTreshold || 0x25;
	options.width = options.width || 640;
	options.height = options.height || 480;
	options.timeout = options.timeout || 50; // in millis
	options.videoNode = options.videoNode || appendVideo();
	options.canvasSource = options.canvasSource || appendCanvas();
	options.canvasBlended = options.canvasBlended || appendCanvas();
	options.historyBufferLength = options.historyBufferLength || 30;
	options.pixelsToSkip = options.pixelsToSkip || 7;

	// prevents an infinite loop
	if(options.pixelsToSkip<=0) {
		throw "options.pixelsToSkip should be bigger than 0";
	}

	var videoNode = options.videoNode;
	var canvasSource = options.canvasSource;
	var canvasBlended = options.canvasBlended;
	var contextSource = canvasSource.getContext("2d");
	var contextBlended = canvasBlended.getContext("2d");
	var timeoutId = null;
	var lastImageData = null;
	/**
	 * The pub-sub event buss instance
	 */
	var events = CamMotion.Events();
	/**
	 * A list of detectors to detect a gesture.
	 * A detector is basically a function f(points):boolean which returns true
	 * when the gesture is detected
	 */
	var detectors = [];
	/**
	 * The points history circular buffer.
	 * Needed for gesture detection which is based on history data
	 */
	var points = CamMotion.CircularBuffer(options.historyBufferLength);

	// mirror video
	// mirror video
	contextSource.translate(canvasSource.width, 0);
	contextSource.scale(-1, 1);

	/**
	 * Builds a new dom element and append it to the document body
	 */
	function appendNode(name) {
		var node = document.createElement(name);
		node.setAttribute("width", options.width);
		node.setAttribute("height", options.height);
		node.setAttribute("style", "display:none");
		window.document.body.appendChild(node);
		return node;
	}

	function appendVideo() {
		var node = appendNode("video");
		node.setAttribute("autoplay", "autoplay");
		return node;
	}

	function appendCanvas() {
		return appendNode("canvas");
	}


	/**
	 * Detect whether user media is supported.
	 * Not really used internally, but can be used by lib clients
	 */
	function isSupported() {
		return (navigator.getUserMedia || navigator.webkitGetUserMedia);
			// Disabled for now: No good support
			// navigator.mozGetUserMedia || navigator.msGetUserMedia);
	}

	/**
	 * When a webcam stream could not be established
	 * @param e the error
	 */
	function noStream(e) {
		events.trigger("error", {
			"msg": "Webcam stream could not be initialized: " +e,
			"exception": e
		});
	}

	/**
	 * Callback for when the stream is established
	 * @param stream the html5 stream object
	 */
	function onStream(stream) {
		events.trigger("streamInit", stream);

		// start the update loop
		update();
	}

	/**
	 * Start motion detection. When it fails
	 * it will fail silently but an "error" event will
	 * be triggered
	 */
	function start() {

		if (navigator.getUserMedia) {

			navigator.getUserMedia({audio: true, video: true}, function(stream) {
				videoNode.src = stream;
				onStream(stream);
			}, noStream);
		} else if (navigator.webkitGetUserMedia) {

			navigator.webkitGetUserMedia({audio: true, video: true}, function(stream) {
				videoNode.src = window.webkitURL.createObjectURL(stream);
				onStream(stream);
			}, noStream);
		} else {
			events.trigger("error", {
				msg: "no getUserMedia supported (see hasGetUserMedia function)"}
			);
		}
	}

	function stop() {
		if(timeoutId) {
			window.clearTimeout(timeoutId);
		}
	}

	/**
	 * The followign 6 functions come from
	 */
	function update() {
		draw();
		blend();
		detect();
		events.trigger("frame");
		timeoutId = window.setTimeout(update, options.timeout);
	}

	function draw() {
		canvasSource.getContext("2d").drawImage(
			videoNode,
			0, 0,
			videoNode.width, videoNode.height
		);
	}

	/**
	 * Will blend the previous camera capture with the current one.
	 * The blended result is an image with either black or white pixels.
	 * Black pixels means no movement, white pixels means movement.
	 * The result is saved in contextBlended.
	 */
	function blend() {
		var width = canvasSource.width;
		var height = canvasSource.height;
		// get webcam image data
		var sourceData = contextSource.getImageData(0, 0, width, height);
		// create an image if the previous image doesn’t exist
		if (!lastImageData) {
			lastImageData = contextSource.getImageData(0, 0, width, height);
		}
		// create a ImageData instance to receive the blended result
		var blendedData = contextSource.createImageData(width, height);
		// blend the 2 images
		differenceAccuracy(blendedData.data, sourceData.data, lastImageData.data);
		// draw the result in a canvas
		contextBlended.putImageData(blendedData, 0, 0);
		// store the current webcam image
		lastImageData = sourceData;
	}

	function fastAbs(value) {
		// funky bitwise, equal Math.abs
		return (value ^ (value >> 31)) - (value >> 31);
	}

	/**
	 * Whenever a pixel value is bigger that the treshhold (thus movement)
	 * output white, otherwise black.
	 */
	function threshold(value) {
		return (value > options.colorDiffTreshold) ? 0xFF : 0;
	}

	function differenceAccuracy(target, data1, data2) {
		if (data1.length != data2.length) return null;
		var i = 0;
		while (i < (data1.length * 0.25)) {
			var average1 = (data1[4*i] + data1[4*i+1] + data1[4*i+2]) / 3;
			var average2 = (data2[4*i] + data2[4*i+1] + data2[4*i+2]) / 3;
			var diff = threshold(fastAbs(average1 - average2));
			target[4*i] = diff;
			target[4*i+1] = diff;
			target[4*i+2] = diff;
			target[4*i+3] = 0xFF;
			i+=options.pixelsToSkip;
		}
	}

	/**
	 * From the blended image, calculates an average color for a region (x,y,width,height).
	 * The average is calculated as the average pixel color value.
	 * Since white colors = movement, and black color = no movement, this average can be used
	 * to determine wether movement was detected within a region.
	 *
	 * If the average is 0, no movement was detected. If the average
	 * was 0xFF everypixel moved in the area.
	 *
	 * @param region determined by x,y, width, height values
	 * @param if no region is given the whole image is used as a region
	 * @return a value between 0 and 255. In which 0 is no movement,
	 * and 255 means that every pixel had movement
	 */
	function getAverageMovement(x, y, width, height) {
		x = Math.floor(x);
		y = Math.floor(y)
		// width should be dividable by options.pixelsToSkip
		// in order to loop over it
		width += options.pixelsToSkip - width % options.pixelsToSkip;

		var region = toRegion(x, y, width, height);
		// get the pixels in an area from the blended image
		var blendedData = contextBlended.getImageData(
			region.x, region.y,
			region.width, region.height
		);
		// start at a pixel that actually has blended
		var i = options.pixelsToSkip - (x % options.pixelsToSkip);
		var average = 0;
		var nPixels = 0;
		// loop over the pixels
		while (i < (blendedData.data.length * 0.25)) {
			// make an average between the color channel
			average += (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
			i += options.pixelsToSkip;
			nPixels++;
		}
		// calculate an average between of the color values of the note area
		average = average / nPixels;
		return average;
	}

	/**
	 * Gets average central point {x, y} of movement for a region. Which is the
	 * average position of all white pixels.
	 *
	 * If requested withincludeRadius, a radius value r determines the
	 * average distance all white points have from the central point.
	 * This can be use as an indication of how big the moving object is.
	 *
	 * @param includeRadius boolean wether to include a radius value, uses more cpu
	 * @param region determined by x,y, width, height values
	 * @param if no region is given the whole image is used as a region
	 */
	function getMovementPoint(includeRadius, x, y, width, height) {
		var region = toRegion(x, y, width, height);
		// get the pixels in an area from the blended image
		var blendedData = contextBlended.getImageData(
			region.x, region.y,
			region.width, region.height
		);
		var i = 0;
		var color = 0;
		var point = {x: region.width/2, y: region.height/2};
		var nPoints = 1;
		var rowSize = region.width;
		// loop over the pixels
		while (i < (blendedData.data.length * 0.25)) {
			// make an average between the color channel
			color = (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
			if (color>0) {
				var x = (i%rowSize);
				var y = Math.floor(i/rowSize);
				// color is white
				point.x += x;
				point.y += y;
				nPoints++;
			}
			i+=options.pixelsToSkip;
		}
		if(nPoints>1) {
			// average it to get the center
			point.x /= nPoints;
			point.y /= nPoints;
		}
		if(includeRadius) {
			i = 0;
			point.r = 0;
			while (i < (blendedData.data.length * 0.25)) {
				// make an average between the color channel
				color = (blendedData.data[i*4] + blendedData.data[i*4+1] + blendedData.data[i*4+2]) / 3;
				if (color>0) {
					var x = (i%rowSize);
					var y = Math.floor(i/rowSize);
					var dx = x - point.x;
					var dy = y - point.y;
					point.r += Math.sqrt(dx*dx + dy*dy);
				}
				i+=options.pixelsToSkip;
			}
			point.r /= nPoints;
		}
		return point;
	}

	/**
	 * Listen for detection of a motion.
	 *
	 * @param detector the detector to use for detection
	 * @param f the function to call once the motion was detected
	 */
	function onMotion(detector, f) {

		events.on(detector.name, f);
		if (detectors.indexOf(detector) === -1) {
			detectors.push(detector);
		}
	}

	function detect() {
		if (detectors.length > 0) {
			// since gesture detectors need a
			// list of pointsHistory, we need to calculate it
			if (getAverageMovement() > 10) {
				var point = getMovementPoint();
				points.push([point.x, point.y]);
			} else if(points.length()>0) {
				points.reset();
			}

			for (var i=0;i<detectors.length;i++) {
				var detected = detectors[i](points);
				if (detected) {
					events.trigger(detectors[i].name);
					console.log(points.length());
					// stop detection of others and reset points
					points.reset();
					CamMotion.Detectors.reset();
					return;
				}
			}
			// reset cached values
			CamMotion.Detectors.reset();
		}
	}

	/**
	 * Return a region object the from parameters.
	 * If no parameters are the region will contain the
	 * whole image.
	 */
	function toRegion(x, y, width, height) {
		return {
			x: x || 0,
			y: y || 0,
			width: width || canvasBlended.width,
			height: height || canvasBlended.width
		};
	}

	return {
		"isSupported": isSupported,
		"on": events.on,
		"start": start,
		"stop": stop,
		"getAverageMovement": getAverageMovement,
		"getMovementPoint": getMovementPoint,
		"onMotion": onMotion
	};
};

