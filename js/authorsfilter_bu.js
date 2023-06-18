var distorsionrange = [0, 15];
var distorsionin = d3.interpolateNumber(distorsionrange[0], distorsionrange[1]);
var distorsionout = d3.interpolateNumber(distorsionrange[1], distorsionrange[0]);
var distorsion = 0;
var mouseY = 0;
var erroredcovers = [];

var authorscanvaswidth = 150;

var authorscanvas = d3
	.select('body')
	.append('canvas')
	.attr('id', 'canvasauthors')
	.attr('width', authorscanvaswidth)
	.attr('height', height);

var hiddenauthorscanvas = d3
	.select('body')
	.append('canvas')
	.attr('id', 'canvashiddenauthors')
	.attr('width', authorscanvaswidth)
	.attr('height', height);

var contextauthors = authorscanvas.node().getContext("2d");
var hiddencontextauthors = hiddenauthorscanvas.node().getContext("2d");

function drawprep(){
	cover = {};
	erroredcovers.length = 0;
	let tempcount = 0;
	let tempcover = '';

	uniqueauthors.map(function(d, i){
		tempcover = 'image300width/' + d + '.jpg';
		cover[d] = new Image();
		cover[d].src = tempcover;
		cover[d].onerror = function(){
			erroredcovers.push(d);
			tempcount += 1;
			(tempcount == selectedsimilardocid.length) ? draw() : null;
		};
		cover[d].onload = function(){
			tempcount += 1;
			(tempcount == selectedsimilardocid.length) ? draw() : null;
		};
	});
};

function drawauthors(){
	uniqueauthors.map(function(d, i){
		var a = fisheye(i * height / uniqueauthors.length);
		var b = fisheye((i + 1) * height / uniqueauthors.length);
		var picwidth = authorscanvaswidth;
		
		var cover = new Image();
		cover.src = 'image300width/' + d + '.jpg';

		cover.onload = function(){
			var picheight = picwidth * cover.height / cover.width;

			contextauthors.save();
			contextauthors.beginPath();
			contextauthors.rect(0, a, picwidth, b - a);
			contextauthors.lineWidth = Math.max(3, ((b - a) - picheight));
			contextauthors.stroke();
			contextauthors.clip();
			contextauthors.drawImage(cover, 0, a - ((picheight - (b - a)) / 2), picwidth, picheight);
			contextauthors.restore();

			if (mouseY <= b & mouseY > a) { 
				var interpopacity = d3.interpolateNumber(0, 1);
				var position = (mouseY - a) / (b - a);
				
				drawname(b, interpopacity(position));
			};
		};
	});
};

function drawhiddenauthors(){
	uniqueauthors.map(function(d, i){
		var a = fisheye(i * height / uniqueauthors.length);
		var b = fisheye((i + 1) * height / uniqueauthors.length);
		var picwidth = authorscanvaswidth;

		hiddencontextauthors.beginPath();
		hiddencontextauthors.fillStyle = uniqueauthorsdata[d];
		hiddencontextauthors.rect(0, a, picwidth, b - a);
		hiddencontextauthors.fill();
	});
};

function drawname(x, y){
		contextauthors.font = '1.2em newyorker';
		contextauthors.fillStyle = 'rgba(190, 30, 0, ' + Math.pow(y, 1/4) + ')';
		contextauthors.textAlign = 'center';
		contextauthors.fillText(currentauthor, authorscanvaswidth/2, x - 10);
}

authorscanvas
	.on('mouseenter', function(){
		d3
			.transition()
			.duration(500)
			.tween('', function(){
				return function(t){
					distorsion = distorsionin(t);
					drawauthors(uniqueauthors);
				}
			});
	})
	.on('mousemove', function(){
		mouseY = d3.mouse(this)[1];
		
		// RETRIEVE THE CURRENT AUTHOR SELECTION
		drawhiddenauthors();
		mouseX = d3.mouse(this)[0];
		mouseY = d3.mouse(this)[1];
		var col = hiddencontextauthors.getImageData(mouseX, mouseY, 1, 1).data;
		var colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
		currentauthor = authorscolors[colString];
		hiddencontextauthors.clearRect(0, 0, authorscanvaswidth, height);
		//

		drawauthors(uniqueauthors);

	})
	.on('mouseleave', function(){
		d3
			.transition()
			.duration(500)
			.tween('', function(){
				return function(t){
					distorsion = distorsionout(t);
					drawauthors(uniqueauthors);
				}
			});
	})
	.on('click', function(){
		// RETRIEVE THE CURRENT AUTHOR SELECTION
		drawhiddenauthors();
		mouseX = d3.mouse(this)[0];
		mouseY = d3.mouse(this)[1];
		var col = hiddencontextauthors.getImageData(mouseX, mouseY, 1, 1).data;
		var colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
		currentauthor = authorscolors[colString];
		hiddencontextauthors.clearRect(0, 0, authorscanvaswidth, height);
		//
		console.log(currentauthor);
		node = [];
		Object.keys(verticesdata).map(function(d){
			(verticesdata[d].author == currentauthor) ? node.push(d) : null;
		});
		zoom.scaleTo(svg, 1);
		zoom.translateTo(svg, width/2, height/2);
		computegraphnodesandedges();
	});


function fisheye(x){
	var above = x < mouseY;

	var min = 0;
	var max = height;

	var offset = above ? mouseY - min : max - mouseY;
	if (offset == 0) offset = max - min;
	return (above ? -1 : 1) * offset * (distorsion + 1) / (distorsion + (offset / Math.abs(x - mouseY))) + mouseY;
}


