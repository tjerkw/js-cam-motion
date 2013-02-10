js-motion-detect
================

JavaScript Library for Motion Detection based on WebRTC.

== Idea

The HTML5 JavaScript spec comes with a getUserMedia function which allows
reading camera input data.

Algorithms can be used on top of this data to detect motion,
and also to detect the direction of motion.

This library builds upon that idea and provides
an easy to use library to listen for motion events.

== Generating Events

Basically wave your hands, left, right, up or down in order to generate events.
Note that any object can be used for motion detection, also your head.


== Usage

Setup an CamMotion.Engine and start listening for motion detection events.
N

''

		var camMotion = CamMotion.Engine();

		camMotion.on("error", function (e) {
			console.log("error", e);
		});


		camMotion.on("streamInit", function(e) {
			console.log("webcam stream initialized", e);
		});

		camMotion.onMotion(CamMotion.Detectors.LeftMotion, function () {
			console.log("Left motion detected");
		});
		camMotion.onMotion(CamMotion.Detectors.RightMotion, function () {
			console.log("Right motion detected");
		});
		camMotion.onMotion(CamMotion.Detectors.DownMotion, function () {
			console.log("Down motion detected");
		});
		camMotion.onMotion(CamMotion.Detectors.UpMotion, function () {
			console.log("Up motion detected");
		});
''


== Note

The detection might perform differently on different cameras and under different lightning conditions.

Is it really not working? Raise an issue and report your camera used and your environment (lightning conditions).