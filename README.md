js-cam-motion
================

JavaScript Library for Motion Detection based on WebRTC.

## Why is this cool?

You can detect motion from client-side javascript!

* Detect direction of the motion, up, right, down or left movement
* Get the center point of motion

## Demo Video

[![ScreenShot](https://raw.github.com/tjerkw/js-cam-motion/master/resources/demo-video.png)](http://youtu.be/ZnxGtNmgH_8)

## How does it work?

The HTML5 JavaScript spec comes with a *getUserMedia* function which allows
reading camera input data.

Algorithms can be used on top of this data to detect motion,
and also to detect the direction of motion.


This library builds upon that idea and provides
an easy to use library to listen for motion events.


The main algorithm used here, is detecting the difference between two camera frames,
and calculating the location of the most difference, which is the area which contains movement.

## Generating Events

Basically wave your hands, left, right, up or down in order to generate events.
Note that any object can be used for motion detection, also your head.

## Usage

Setup an CamMotion.Engine and start listening for motion detection events.

```javascript
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
```

### Runtime options

* timeout
  The timeout between frames. This is on top of any processing time
* pixelsToSkip
  The number of pixels to skip when blending and detecting. Higher numbers make it a lot faster
* colorDiffTreshold
  The treshold for which to colors are considered different (colorA - ColorB) > colorDiffTreshold.
* historyBufferLength
  The number of previous detection points to remember for recognizing gestures.

## Note

The detection might perform differently on different cameras and under different lightning conditions.

Is it really not working? Raise an issue and report your camera used and your environment (lightning conditions).


## Acknowledgments

* [TjerkWolterink] (http://about.me/tjerkw), about me (https://github.com/tjerkw), my linked in (http://www.linkedin.com/in/tjerkwolterink)

## License

Licensed under the [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

[![githalytics.com alpha](https://cruel-carlota.pagodabox.com/5a8c351ee05d1a2fb0c27983ecade8ec "githalytics.com")](http://githalytics.com/tjerkw/js-cam-motion)
