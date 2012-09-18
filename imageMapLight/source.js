var imageMapLight = (function(){
	var possition = {
		position: 'absolute',
		left: 0,
		top: 0,
		padding: 0,
		border: 0
	};

	var is_img_loaded = function(img) {
		if(!img.complete) { return false; }
		if(typeof img.naturalWidth !== "undefined" && img.naturalWidth === 0) { return false; }
		return true;
	};

	var canvasSupport = (function(){
		var drawShape = function(context, shape, coords) {
			context.beginPath();
			if(shape == 'rect') {
				context.rect(coords[0], coords[1], coords[2] - coords[0], coords[3] - coords[1]);
			} else if(shape == 'poly') {
				for(i=0; i < coords.length; i+=2) {
					context.lineTo(coords[i], coords[i+1]);
				}
			} else if(shape == 'circ') {
				context.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, false);
			}
			context.closePath();
		};

		var createCanvas = function(img){
			var c = document.createElement('canvas');
			c.style.width 		= img.width+'px';
			c.style.height 		= img.height+'px';
			clearCanvas(c);
			return c;
		};

		var getCanvasContext = function(canvas) {
			return canvas.getContext('2d');
		};

		var clearCanvas = function(canvas) {
			return getCanvasContext(canvas).clearRect(0, 0, canvas.width,canvas.height);
		};

		var addShapeToCanvas = function(canvas, shape, coords, options, name) {
			var context = getCanvasContext(canvas);
			context.save();	
			drawShape(context, shape, coords);

			if(options.fill) {
				context.fillStyle = options.fillColor; // rgba
				context.fill();
			}
			if(options.stroke) {
				context.strokeStyle = options.strokeColor;
				context.lineWidth = options.strokeWidth;
				context.stroke();
			}
			
			context.restore();
		};

		return {
			create: 	createCanvas,
			clear: 		clearCanvas,
			getContext: getCanvasContext,
			addShape: 	addShapeToCanvas
		};
	})();

	var mapLight = function(image) {
		this.image = $(image);
		this.map   = $('map[name="'+this.image.attr('usemap')+'"]');

		if (!this.image.is('img') || this.map.length == 0) {
			throw "can't load map light";
		}
		this.provider = canvasSupport; // new canvasSupport(this.image.get(0));

		var wrap = $(document.createElement('div')).css({
				display:'block',
				background:'url("'+this.image.attr('src')+'")',
				position:'relative',
				padding:0,
				width:this.image.width(),
				height:this.image.height()
				});
		this.image.before(wrap).css('opacity', 0).css(possition).remove();
		if($.browser.msie) { img.css('filter', 'Alpha(opacity=0)'); }
		wrap.append(this.image);

		this.imageHover = this.provider.create(this.image.get(0));
		$(this.imageHover).css(possition);
		this.image.before(this.imageHover);
		this.imageHover.height 	= this.image.height();
		this.imageHover.width 	= this.image.width();

		var onAreas = this.map.find('area[data-mapLight-on="true"]');
		this.lightAreas(onAreas);

		this.map.find('area').each((function(idx, element) {
			$(element)
				.bind('mouseenter.mapLight', (function(e){
					this.instance.clearAreas();
					var onAreas = this.instance.map.find('area[data-mapLight-on="true"]');
					this.instance.lightArea(this.area);
					this.instance.lightAreas(onAreas);
				}).bind({instance: this.instance, area: element}))
				.bind('mouseleave.mapLight', (function(e){
					this.instance.clearAreas();
					var onAreas = this.instance.map.find('area[data-mapLight-on="true"]');
					this.instance.lightAreas(onAreas);
				}).bind({instance: this.instance, area: element}));
		}).bind({instance: this}));
	};

	mapLight.prototype.lightAreas = function(areas) {
		areas = $(areas); // force cast jquery
		areas.each((function(idx, area){
			this.instance.lightArea(area);
		}).bind({instance: this}));
	};

	mapLight.prototype.lightArea = function(area) {
		var drawInfo 	= mapLight.readDrawInfo(area);
		var options 	= mapLight.readOptions(area);

		this.provider.addShape(this.imageHover, drawInfo.shape, drawInfo.coords, options);
	};

	mapLight.prototype.clearAreas = function() {
		this.provider.clear(this.imageHover);
	};

	mapLight.prototype.alwaysLightArea = function(area) {
		area.setAttribute('data-mapLight-on', true);
		$(area).trigger('mouseenter.mapLight'); // force render areas
	};

	mapLight.prototype.noneAlwaysLightAreas = function() {
		var onAreas = this.map.find('area[data-mapLight-on="true"]');
		onAreas.each(function(idx, element) {element.setAttribute('data-mapLight-on', false);});
		$(onAreas.get(0)).trigger('mouseleave.mapLight');
	};

	mapLight.readOptions = function(element) {
		var defaultOptions = {
			stroke: false,
			fill: 	true,

			fillColor: 'rgba(0,0,0,0.3)',
			strokeColor: 'rgba(0,0,0,0.3)',
			strokeWidth: 1,
		};

		var opt = $(element).data('mapLightOptions');

		return $.extend({}, defaultOptions, opt);
	};

	mapLight.readDrawInfo = function(areaElement) {
		if (!(areaElement instanceof HTMLAreaElement)) {
			throw "argument need be instance of HTMLAreaElement";
		}

		var coords = areaElement.getAttribute('coords').split(',').map(function(i){ return parseFloat(i); }),
			shape  = areaElement.getAttribute('shape').toLowerCase().substr(0,4);
		return {shape: shape, coords: coords};
	};

	return mapLight;
})();