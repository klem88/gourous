var margin = {top: 100, right: 50, bottom: 80, left: 50};
var width = Math.max(960, window.innerWidth - margin.left - margin.right);
var height = Math.max(500, window.innerHeight - margin.top - margin.bottom);

var datafile = 'gourous29.json';
var zoomextent = [0.6, 100];
var radiusrange = [5, 20];
var graphradiusrange = [50, 80];
var edgewithrange = [0.5, 3];
var graphedgewithrange = [2, 5];
var strokewidthgraphnodeselected = 4;
var transform = d3.zoomIdentity;
var datacolorassoc = {};
var authorscolors = {};
var uniqueauthorsdata = {};
var preurl = 'https://static2.cyberlibris.com/books_upload/';
var selectededges = [];
var selectedvertices = [];
var topgraphnodeshown = 10;


// Zoom variable
var zoom = d3
	.zoom()
	.scaleExtent(zoomextent)
	.on('zoom', zoomed);

var svg = d3.select("body")
	.append('svg')
	.attr("width", width)
	.attr("height", height)
	.call(zoom)
	.on('click', function(){
		mouseX = d3.mouse(this)[0];
		mouseY = d3.mouse(this)[1];
		
		drawhiddenvertices();

		var col = hiddencontextvertices.getImageData(mouseX, mouseY, 1, 1).data;
		var colString = "rgb(" + col[0] + "," + col[1] + ","+ col[2] + ")";
		
		node = [];
		node.push(datacolorassoc[colString]);
				
		computegraphnodesandedges();

		hiddencontextvertices.clearRect(0, 0, width, height);

	})

var ggraph = svg
	.append('g')
	.attr('id', 'ggraph');

var ggraphlinks = ggraph
	.append('g')
	.attr('id', 'ggraphlinks');

var ggraphnodes = ggraph
	.append('g')
	.attr('id', 'ggraphnodes');

var ggraphcovers = ggraph
	.append('g')
	.attr('id', 'ggraphcovers');

var canvasvertices = d3
	.select("body")
	.append("canvas")
	.attr("id", "canvasvertices")
	.attr("width", width)
	.attr("height", height);

var canvasedges = d3
	.select("body")
	.append("canvas")
	.attr("id", "canvasedges")
	.attr("width", width)
	.attr("height", height);

var hiddencanvasvertices = d3
	.select("body")
	.append("canvas")
	.attr("id", "hiddencanvasvertices")
	.attr("width", width)
	.attr("height", height);


var contextvertices = canvasvertices.node().getContext("2d");

var contextedges = canvasedges.node().getContext("2d");
//contextedges.strokeStyle = 'rgba(63,183,176, 0.4)'

var hiddencontextvertices = hiddencanvasvertices.node().getContext("2d");

// SET THE FORCES
var simulationgraph = d3
	.forceSimulation()
	.force("link", d3
		.forceLink()
		.distance(function(d) { return 0; })
		.strength(function(d){ return 0; })
		.id(function(d) { return d.id; })) //Permet de faire le lien entre Nodes et Links (by "id")
	.force("x", d3.forceX().x(function(d){ return (d.x) }).strength(.6))
	.force("y", d3.forceY().y(function(d){ return (d.y) }).strength(.6))
	.force("collide",d3
		.forceCollide(function(d){ return graphradiussize(d); })
		.strength(.4)
		.iterations(3))
	.alphaDecay(.05);

function graphradiussize(d){ return Math.min(150 / transform.k, d.radius / Math.sqrt(transform.k)); };

d3.json(datafile, function(err, data) {
	
	vertices = [];
	edges = [];
	verticesdata = {};
	uniqueauthors = data.uniqueauthors.sort();

	xextent = d3.extent(data.vertices.x);
	yextent = d3.extent(data.vertices.y);
	nodeweightextent = d3.extent(data.vertices.weight);
	nodeegvecextent = d3.extent(data.vertices.egveccent);
	edgeweightextent = d3.extent(data.edges.weight);

	xscale = d3.scaleLinear().range([0, width]).domain(xextent);
	yscale = d3.scaleLinear().range([height, 0]).domain(yextent);
	radiusscale = d3.scaleLinear().range(radiusrange).domain(nodeegvecextent);
	graphradiusscale = d3.scaleLinear().range(graphradiusrange).domain(nodeegvecextent);
	//nodecolorscale = d3.scaleSequential(d3.interpolateCool).domain(nodeweightextent);
	//nodecolorscale = d3.scalePow().exponent(0.6).interpolate(d3.interpolateRgb).range([d3.rgb(66,134,237), d3.rgb('red')]).domain(nodeweightextent);
	nodecolorscale = d3.scalePow().exponent(0.6).interpolate(d3.interpolateRgb).range([d3.rgb(60,60,60), d3.rgb(256,256,256)]).domain(nodeweightextent);
	edgewithscale = d3.scaleLinear().range(edgewithrange).domain(edgeweightextent);
	graphedgewithscale = d3.scaleLinear().range(graphedgewithrange).domain(edgeweightextent);
	//edgecolorscale = d3.scaleQuantize().range(d3.schemeCategory10).domain(edgeweightextent);
	edgecolorscale = d3.scalePow().exponent(1).interpolate(d3.interpolateRgb).range([d3.rgb(80,80,80), d3.rgb(256,256,256)]).domain(edgeweightextent);
	//edgewiththreshold = d3.scalePow().exponent(0.0001).range([edgeweightextent[1] - ((edgeweightextent[1] - edgeweightextent[0]) * 1), edgeweightextent[1]]).domain(zoomextent);
	
	vertices = data.vertices.name;
	
	// INITIALISE ALL DATA ARRAYS AND OBJECTS

	//VERTICES
	for (var i = 0; i < vertices.length; i++){
			var col = generatecolor();

			verticesdata[vertices[i]] = 
			{
				'x' : xscale(data.vertices.x[i]), 
				'y' : yscale(data.vertices.y[i]),
				'weight' : data.vertices.weight[i],
				'hiddencolor' : col,
				'coverurl' : data.vertices.cover[i],
				'author' : data.vertices.author[i],
				//'status' : data.vertices.status[i],
				'egveccent' : data.vertices.egveccent[i]
			}
			datacolorassoc[col] = vertices[i];
	};

	//EDGES
	for (var i = 0; i < data.edges.from.length; i++){
		edges.push({
			'source' : data.edges.from[i],
			'target' : data.edges.to[i],
			'weight' : data.edges.weight[i]
		});
	};

	//AUTHORS
	uniqueauthors.map(function(d){
		var col = generatecolor();
		uniqueauthorsdata[d] = col;
		authorscolors[col] = d;
	});

	// INITIALISE FILTERS AND FILL
	b1value = edgeweightextent[0];
	b2value = edgeweightextent[1];
	b3value = topgraphnodeshown;

	d3.select('#b1value').html(b1value);
	d3.select('#b2value').html(b2value);
	d3.select('#b3value').html(b3value);

	d3
		.select('#b1plus')
		.on('click', function(d){
			b1value = d3.min([edgeweightextent[1], b1value + 1]);
			d3.select('#b1value').html(b1value);
			drawedges();
		});

	d3
		.select('#b1min')
		.on('click', function(d){
			b1value = d3.max([edgeweightextent[0], b1value - 1]);
			d3.select('#b1value').html(b1value);
			drawedges();
		});

	d3
		.select('#b2plus')
		.on('click', function(d){
			b2value = d3.min([edgeweightextent[1], b2value + 1]);
			d3.select('#b2value').html(b2value);
			drawedges();
		});

	d3
		.select('#b2min')
		.on('click', function(d){
			b2value = d3.max([edgeweightextent[0], b2value - 1]);
			d3.select('#b2value').html(b2value);
			drawedges();
		});

	d3
		.select('#b3plus')
		.on('click', function(d){
			b3value = d3.min([50, b3value + 1]);
			d3.select('#b3value').html(b3value);
			computegraphnodesandedges();
		});

	d3
		.select('#b3min')
		.on('click', function(d){
			b3value = d3.max([1, b3value - 1]);
			d3.select('#b3value').html(b3value);
			computegraphnodesandedges();
		});

	drawedges();
	drawvertices();
	//drawhiddenvertices();
	drawprep();
});


function computegraphnodesandedges(){
	
	selectededges.length = 0;
	edges
		.filter(function(d){ return (node.includes(d.source) | node.includes(d.target)) 
			& d.weight >= b1value
			& d.weight <= b2value
		})
		.sort(function(a, b){
			return parseFloat(b.weight) - parseFloat(a.weight);
		})
		.slice(0, b3value)
		.map(function(d){
			selectededges.push({
				'source' : d.source,
				'target' : d.target,
				'weight' : d.weight
			})
		});
	//console.log(selectededges);
	var allnodes = [];
	(node[0] != undefined) ? node.map(function(d){ return allnodes.push(d); }) : null;
	selectededges.map(function(d){ allnodes.push(d.source); allnodes.push(d.target); });

	selectedvertices.length = 0;
	// Fill selected vertices (as an array of objects for the forces layout) based on UNIQUE all nodes
	d3.map(allnodes, function(d){ return d }).keys()
		.map(function(d){
			selectedvertices.push({
				'id' : d,
				'ox' : (verticesdata[d].x),
				'oy' : (verticesdata[d].y),
				'x' : (verticesdata[d].x),
				'y' : (verticesdata[d].y),
				'weight' : verticesdata[d].weight,
				'coverurl' : verticesdata[d].coverurl,
				'radius' : graphradiusscale(verticesdata[d].egveccent),
			})
		});

	printgraph(selectedvertices, selectededges);
	simulationgraph.nodes(selectedvertices).alpha(1).restart();
}

function printgraph(selectedvertices, selectededges){
	var coverquality = '300pix/' //(transform.k > 10 & topgraphnodeshown < 20) ? '300pix/' : '136pix/';
	// COVER PATTERNS
	coverdata = ggraphcovers
		.selectAll(".cover")
		.data(selectedvertices, function(d){ return 'id' + coverquality.slice(0, -1) + d.coverurl ; });

	coverdata.exit().remove();

	coverupd = coverdata
		.enter()
		.append('pattern')
		.attr('class', 'cover')
		.attr('id', function(d){ return 'id' + d.coverurl; })
		.attr('width', '100%')
		.attr('height', '100%')
		.attr('viewBox', '0 0 1 1.4')
		.attr('preserveAspectRatio', 'xMidYMid slice')
		.attr('patternContentUnits', 'objectBoundingBox')
		.append('image')
		.attr("xlink:href", function(d){ return preurl + coverquality + d.coverurl; })
		.attr("width", 1)
		.attr("height", 1.4)
		.attr("preserveAspectRatio", "xMidYMid slice");

	// PRINT GRAPH NODES
	printgraphnodes = ggraphnodes
		.selectAll(".graphnode")
		.data(selectedvertices, function(d){ return 'id' + d.id; });

	printgraphnodes.exit().remove();

	printgraphnodesupd = printgraphnodes
		.enter()
		.append("circle")
		.attr("class", 'graphnode')
		.call(d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended))
		.on('click', function(m){
			//console.log(m);
			node = [];
			node.push(m.id);
			
			computegraphnodesandedges();
			//zoom.translateTo(svg, width/2, height/2);
			d3.event.stopPropagation(); // The click event attached to the SVG is triggered otherwise and removes the graph force network

		})
		.merge(printgraphnodes)
		.attr('stroke', function(d){ return (node.includes(d.id)) ? 'white' : null; })
		.attr('stroke-width', strokewidthgraphnodeselected / Math.sqrt(transform.k))
		.attr('stroke-dasharray', 5);

	printgraphnodesupd
		.attr("fill", function(d) { return 'url(#' + 'id' + d.coverurl + ')'; })
		.transition()
		.duration(1000)
		.ease(d3.easeElasticOut)
		.attr("r", function(d) { return graphradiussize(d); });

	// PRINT GRAPH LINKS
	printgraphlinks = ggraphlinks
		.selectAll('.graphlink')
		.data(selectededges, function(d){ return 'id' + d.source + ' ' + d.target })

	printgraphlinks.exit().remove();

	printgraphlinksupd = printgraphlinks
		.enter()
		.append('line')
		.attr('class', 'graphlink')
		//.attr('opacity', 0.6)
		.style('stroke', "rgba(142, 40, 0, 0.6)")
		.attr('stroke-width', function(d){ return graphedgewithscale(d.weight) / Math.sqrt(transform.k); })
		.merge(printgraphlinks);

	// SET AND EXECUTE FORCES
	simulationgraph
		.nodes(selectedvertices)
		.on("tick", ticked);

	simulationgraph
		.force("link")
		.links(selectededges);
};

function drawvertices(){
	contextvertices.clearRect(0, 0, width, height);
	vertices
		.filter(function(d){ return transform.applyX(verticesdata[d].x) > 0 & transform.applyX(verticesdata[d].x) < width 
			& transform.applyY(verticesdata[d].y) > 0 & transform.applyY(verticesdata[d].y) < height })
		.map(function(d){
			contextvertices.fillStyle = 'rgba('.concat(nodecolorscale(verticesdata[d].weight).slice(4, -1)).concat(',0.8)');
			contextvertices.beginPath();
			contextvertices.arc(transform.applyX(verticesdata[d].x), transform.applyY(verticesdata[d].y), 
				radiusscale(verticesdata[d].egveccent) * Math.sqrt(transform.k), 0, 2 * Math.PI, true);
			contextvertices.fill();
			contextvertices.closePath();
		});
};

function drawedges(){
	contextedges.clearRect(0, 0, width, height);

	edges
		.filter(function(d){ return d.weight >= b1value & d.weight <= b2value
			& transform.applyX(verticesdata[d.source].x) > 0 & transform.applyX(verticesdata[d.source].x) < width 
			& transform.applyY(verticesdata[d.source].y) > 0 & transform.applyY(verticesdata[d.source].y) < height 
			& transform.applyX(verticesdata[d.target].x)  > 0 & transform.applyX(verticesdata[d.target].x) < width 
			& transform.applyY(verticesdata[d.target].y) > 0 & transform.applyY(verticesdata[d.target].y) < height
			//& d.weight < edgewiththreshold(transform.k)
		})
		.map(function(d){
			contextedges.strokeStyle = 'rgba('.concat(edgecolorscale(d.weight).slice(4, -1)).concat(',0.5)');
			contextedges.lineWidth = edgewithscale(d.weight) * Math.sqrt(transform.k);
			contextedges.beginPath();
			contextedges.moveTo(transform.applyX(verticesdata[d.source].x) , transform.applyY(verticesdata[d.source].y));
			contextedges.lineTo(transform.applyX(verticesdata[d.target].x) , transform.applyY(verticesdata[d.target].y));
			contextedges.stroke();
	});
};

function drawhiddenvertices(){
	
	hiddencontextvertices.clearRect(0, 0, width, height);
	vertices
		.filter(function(d){ return transform.applyX(verticesdata[d].x) > 0 & transform.applyX(verticesdata[d].x) < width 
			& transform.applyY(verticesdata[d].y) > 0 & transform.applyY(verticesdata[d].y) < height })
		.map(function(d){
			hiddencontextvertices.fillStyle = verticesdata[d].hiddencolor;
			hiddencontextvertices.beginPath();
			hiddencontextvertices.arc(transform.applyX(verticesdata[d].x), transform.applyY(verticesdata[d].y), 
				radiusscale(verticesdata[d].egveccent) * Math.sqrt(transform.k), 0, 2 * Math.PI, true);
			hiddencontextvertices.fill();
			hiddencontextvertices.closePath();

		});
};

function ticked (){
			
	//console.log(simulationgraph.alpha());
	printgraphnodesupd
		.attr("cx", function(d) { return (d.x); })
		.attr("cy", function(d) { return (d.y); });

	printgraphlinksupd
		.attr("x1", function(d) { return (d.source.x); })
		.attr("y1", function(d) { return (d.source.y); })
		.attr("x2", function(d) { return (d.target.x); })
		.attr("y2", function(d) { return (d.target.y); });
};

function zoomed(){ 

	transform = d3.zoomTransform(this);
	//console.log(transform);
	
	drawvertices();
	//drawhiddenvertices();
	drawedges();
	
	d3.selectAll('.graphnode')
		.each(function(e){  e.x = e.ox; e.y = e.oy; })
		.transition()
		.attr('r', function(d){ return graphradiussize(d); })
		.attr('stroke-width', strokewidthgraphnodeselected / Math.sqrt(transform.k))
	
	d3.selectAll('.graphlink')
		.transition()
		.attr('stroke-width', function(d){ return graphedgewithscale(d.weight) / Math.sqrt(transform.k); });

	simulationgraph.nodes(selectedvertices).alpha(0.5).restart();

	d3
		.selectAll('#ggraph')
		.attr("transform", transform);
};

//Generates the next color in the sequence, going from 0,0,0 to 255,255,255.
// Source: Yannick Assogba - https://bl.ocks.org/tafsiri/e9016e1b8d36bae56572 
var nextCol = 1;
function generatecolor(){
	var ret = [];
	// via http://stackoverflow.com/a/15804183
	if(nextCol < 16777215){
		ret.push(nextCol & 0xff); // R
		ret.push((nextCol & 0xff00) >> 8); // G 
		ret.push((nextCol & 0xff0000) >> 16); // B

		nextCol += 10; // 100 is exagerated for this example and would ordinarily be 1.
	}
	var col = "rgb(" + ret.join(',') + ")";
	return col;
};

function dragstarted(d) {	
	simulationgraph.alphaTarget(1).restart();
	d.fx = d.x;
	d.fy = d.y;
};

function dragged(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
};

function dragended(d) {
	simulationgraph.alphaTarget(0);
	d.fx = null;
	d.fy = null;
};