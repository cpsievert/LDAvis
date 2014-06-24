// This section sets up the logic for event handling
var current_clicked = { what: "nothing", element: undefined, object: undefined },
current_hover = { what: "nothing", element: undefined, object: undefined },
old_winning_state = { what: "nothing", element: undefined, object: undefined };

// global margins used for everything
var margin = {top: 30, right: 120, bottom: 30, left: 30},
mdswidth = 500, 
barwidth = 400, 
width = mdswidth + barwidth + margin.right + 2*margin.left,
height = 500,
mdsheight = height,
barheight = mdsheight;

// A few big global variables:
var mdsData,  // (K rows, one for each topic)
mdsData2,  // (Topic frequencies for each term that shows up in any barchart)
barData;  // (Barchart widths for every term that shows up for the given lambda value)


function show_state()
{
    console.log(current_clicked, current_hover, old_winning_state);
}

function reset_state()
{
    current_clicked = { what: "nothing", element: undefined, object: undefined },
    current_hover = { what: "nothing", element: undefined, object: undefined },
    update_drawing();    
}

function update_drawing()
{
    var winning_state;
    if (current_hover.what !== "nothing") {
        winning_state = current_hover;
    } else {
        winning_state = current_clicked;
    }

    if (old_winning_state.element !== undefined) {
        switch (old_winning_state.what) {
        case "nothing": throw new Error("internal error");
        case "cluster":
            cluster_off.call(old_winning_state.element, old_winning_state.object);
            break;
        case "topic":
            topic_off.call(old_winning_state.element, old_winning_state.object);
            break;
        }
    
    }
    switch (winning_state.what) {
    case "nothing":
        topic_off.call(old_winning_state.element);
        break;
    case "cluster":
        cluster_on.call(winning_state.element, winning_state.object);
        break;
    case "topic":
        topic_on.call(winning_state.element, winning_state.object);
        break;
    }
    old_winning_state.what = winning_state.what;
    old_winning_state.element = winning_state.element;
    old_winning_state.object = winning_state.object;
    console.log(winning_state);
}


//////////////////////////////////////////////////////////////////////////////

// sort array according to a specified object key name 
// Note that default is decreasing sort, set decreasing = -1 for increasing
// adpated from http://stackoverflow.com/questions/16648076/sort-array-on-key-value
function fancysort(key_name, decreasing) {
    decreasing = (typeof decreasing === "undefined") ? 1 : decreasing;
    return function (a, b) {
	if (a[key_name] < b[key_name])
	    return 1*decreasing;
	if (a[key_name] > b[key_name])
	    return -1*decreasing;
	return 0;
    };
}

//////////////////////////////////////////////////////////////////////////////
// Bind onto data that is passed from shiny
var scatterOutputBinding = new Shiny.OutputBinding();

$.extend(scatterOutputBinding, {
    find: function(scope) {
	return $(scope).find('.shiny-scatter-output');
    },
    renderValue: function(el, data) {
	
	// adapted from https://github.com/timelyportfolio/shiny-d3-plot/blob/master/graph.js
	// idea is to turn an object of arrays into an array of objects
	// this is a bit more sophisticated since you don't have to specify the object key names

	// # of topics
	var k = data['mdsDat'].x.length
	
	mdsData = [];
	for (var i=0; i < k; i++)  { 
            var obj = {};
            for (var key in data['mdsDat']){
		obj[key] = data['mdsDat'][key][i];
            }
            mdsData.push( obj );
	}
	
	mdsData2 = [];
	for (var i=0; i < data['mdsDat2'].Term.length; i++)  { 
            var obj = {};
            for (var key in data['mdsDat2']){
		obj[key] = data['mdsDat2'][key][i];
            }
            mdsData2.push( obj );
	}
	
	barData = [];
	for (var i=0; i<data['barDat'].Term.length; i++)  { 
            var obj = {};
            for (var key in data['barDat']){
		obj[key] = data['barDat'][key][i];
            }
            barData.push( obj );
	}
	
	// establish layout and vars for mdsPlot
	var color = d3.scale.category10();
	
	// create linear scaling to pixels (and add some padding on outer region of scatterplot)
	var xrange = d3.extent(mdsData, function(d){ return d.x; }); // d3.extent returns min and max of an array
	var xdiff = xrange[1] - xrange[0], xpad = 0.10;
	var xScale = d3.scale.linear()
            .range([0, mdswidth])
            .domain([xrange[0] - xpad*xdiff, xrange[1] + xpad*xdiff]);
	
	var yrange = d3.extent(mdsData, function(d){return d.y; });
	var ydiff = yrange[1] - yrange[0], ypad = 0.10;
	var yScale = d3.scale.linear()
            .range([mdsheight, 0])
            .domain([yrange[0] - ypad*ydiff, yrange[1] + ypad*ydiff]);
	
	// remove the old graph
	var svg = d3.select(el).select("svg");      
	svg.remove();
	
	$(el).html("");
	
	// Create NEW svg element (that will contain everything)
	var svg = d3.select(el).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

	// This group is just for the mds plot
	var mdsplot = svg.append("g")
	    .attr("id", "leftpanel")
            .attr("class", "points")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 
	
	// moved this before the circles are drawn, so that hovering over a circle doesn't get interrupted
	// by hovering over one of the axis lines.      
	mdsplot.append("line") // draw x-axis
            .attr("x1", 0)
            .attr("x2", mdswidth)
            .attr("y1", mdsheight/2) 
            .attr("y2", mdsheight/2)
            .attr("stroke", "gray")
            .attr("opacity", 0.3);
	
	mdsplot.append("line") // draw y-axis
            .attr("x1", mdswidth/2) 
            .attr("x2", mdswidth/2)
            .attr("y1", 0)
            .attr("y2", mdsheight)
            .attr("stroke", "gray")
            .attr("opacity", 0.3);
	
	// Bind mdsData to the points in the left panel:
	var points = mdsplot.selectAll("points")
            .data(mdsData)
            .enter();
	
	// text to indicate topic
	points.append("text")
            .attr("class", "txt")
            .attr("x", function(d) { return(xScale(+d.x)); })
            .attr("y", function(d) { return(yScale(+d.y) + 4); })
            .text(function(d) { return d.topics; })
            .attr("text-anchor", "middle")        
            .attr("stroke", "black")
            .attr("opacity", 1)
            .attr("font-size", 11)
            .attr("font-weight", 100);

	// Draw Voronoi map around cluster centers (if # of clusters > 1)
	// adapted from http://bl.ocks.org/mbostock/4237768  
	if (data['centers'].x.length > 1) {
            var centers = [];
            for (var i=0; i < data['centers'].x.length; i++)  { 
		centers[i] = [ xScale(data['centers'].x[i]), yScale(data['centers'].y[i]) ];
            }
            
            var voronoi = d3.geom.voronoi()
		.clipExtent([[0, 0], [mdswidth, mdsheight]])
		.x(function(d) { return(xScale(+d.x)); })
		.y(function(d) { return(yScale(+d.y)); });
                // .clipExtent([[margin.left, margin.top], [mdswidth - margin.right, mdsheight - margin.bottom]]);
	    
            var vdat = voronoi(mdsData);
	    
            var cluster_paths = [];
            for (i=0; i < data['centers'].x.length; ++i) {
		cluster_paths[i] = "";
            }
            for (i=0; i < mdsData.length; ++i) {
		var cluster = Number(mdsData[i].cluster) - 1;
		cluster_paths[cluster] = cluster_paths[cluster] + "M" + vdat[i].join("L") + "Z";
            }

	    // Append the Voronoi group to the mdsplot group:
            mdsplot.append("g")
		.attr("id", "voronoi-group");
            
            mdsplot.select("#voronoi-group")
		.selectAll("path")
		.data(cluster_paths)
		.enter()
		.append("path")
		.style("fill", function(d, i) { return d3.rgb(color(String(i+1))).brighter(1.5); })
                // .style("stroke", function(d, i) { return d3.rgb(color(String(i+1))).brighter(1.5); })
		.style("fill-opacity", 0.3)
		.attr("d", function(d) { return d; })
		.on("mouseover", function(d, i) {
                    current_hover.element = this;
                    current_hover.what = "cluster";
                    current_hover.object = String(i+1);
                    update_drawing();
		})
		.on("mouseout", function(d, i) {
                    current_hover.element = undefined;
                    current_hover.what = "nothing";
                    current_hover.object = undefined;
                    update_drawing();
		})
		.on("click", function(d, i) {
                    current_clicked.element = this;
                    current_clicked.what = "cluster";
                    current_clicked.object = String(i+1);
                    update_drawing();
		});
	}
	
	// draw the circles:
	points.append("circle")
            .attr("class", "dot")
            // Setting the id will allow us to select points via the value of selectInput
            .attr("id", function(d) { return "Topic"+d.topics; })
            .style("opacity", 0.3)
            .style("fill", function(d) { return color(d.cluster); })
            // circle sizes should get smaller as the # of topics increases
            .attr("r", function(d) { return (400/k)*Math.sqrt(d.Freq) ; })  
            .attr("cx", function(d) { return (xScale(+d.x)); })
            .attr("cy", function(d) { return (yScale(+d.y)); })
            .on("mouseover", function(d) {
		current_hover.element = this;
		current_hover.what = "topic";
		current_hover.object = d;
		update_drawing();
            })  // highlight circle and print the relevant proportion within circle
            .on("click", function(d) {
		current_clicked.element = this;
		current_clicked.what = "topic";
		current_clicked.object = d;
		update_drawing();
            })
            .on("mouseout", function(d) {
		current_hover.element = undefined;
		current_hover.what = "nothing";
		current_hover.object = d;
		update_drawing();
            });
	
	// moved this below the drawing of the circles so that if a circle occludes the 'clear selection' link, 
	// the user can still click on the link to clear the selection.
	svg.append("text")
            .text("Click here to clear selection")
            .attr("x", mdswidth - 150)
            .attr("y", 10)
            .attr("font-weight", "bold")
            .attr("cursor", "pointer")
            .on("click", function() {
                reset_state();
            });
	
	// Basic text to tell user to click on stuff!!!
	svg.append("text")
            .text("Click elements below to freeze selection")
            .attr("x", 10)
            .attr("y", 10)
	
	// establish layout and vars for bar chart	
	var barDefault2 = barData.filter(function(d) { return d.Category == "Default" });
	
	var y = d3.scale.ordinal()
            .domain(barDefault2.map(function(d) { return d.Term; }))
            .rangeRoundBands([0, barheight], 0.15);
	var x = d3.scale.linear()
            .domain([1, d3.max(barDefault2, function(d) { return d.Total; })])
            .range([0, barwidth])
            .nice();
	var color2 = d3.scale.category10();
	var yAxis  = d3.svg.axis()
            .scale(y);
	
	// Add a group for the barchart:
	var chart = svg.append("g")
	    .attr("id", "bar-freqs") // place bar chart to the right of the mds plot;
            .attr("transform", "translate(" + +(mdswidth + 2*margin.left + 50) + "," + 2*margin.top + ")"); 
	// + 50 above to provide a bit of width between the two panels to display the terms

	// Bind 'default' data to 'default' bar chart
	var basebars = chart.selectAll(".bar-totals")
            .data(barDefault2)
            .enter();
	
	// Draw the gray background bars defining the overall frequency of each word
	basebars    
            .append("rect")
            .attr("class", "bar-totals")
            .attr("x", 0)  
            .attr("y", function(d) { return y(d.Term); })
            .attr("height", y.rangeBand()) 
            .attr("width", function(d) { return x(d.Total); } )
            .style("fill", "gray")  
            .attr("opacity", 0.4);  
	
	//Add word labels
	basebars
            .append("text")
            .attr("x", -5)
            .attr("class", "terms")
            .attr("y", function(d) { return y(d.Term) + 10; })
            .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
            .attr("dominant-baseline", "middle") //vertical alignment
            .text(function(d) { return d.Term; })
            .on("mouseover", text_on)
            .on("mouseout", text_off);

        // add a 'title' to bar chart 
	svg.append("text")
            .attr("x", mdswidth + 2*margin.left + barwidth/2)
            .attr("y", -margin.top/2)
            .attr("text-anchor", "middle")
            .attr("class", "bubble-tool")       //set class so we can remove it when highlight_off is called  
            .style("font-size", "16px") 
            .style("text-decoration", "underline")  
            .text("Most salient tokens");

	// adapted from http://bl.ocks.org/mbostock/1166403
	var xAxis = d3.svg.axis().scale(x)
            .orient("top")
            .tickSize(-barheight)
            .tickSubdivide(true)
	    .ticks(6);
	
	chart.attr("class", "xaxis")
	    .call(xAxis);

	/*
	// update drawing based on a selected topic in selectInput
	if (data['currentTopic'] != 0) { //0 represents no topic selected
	var currentTopic = d3.select("#Topic"+data['currentTopic'])[0][0];
	console.log(currentTopic);
	current_clicked.element = currentTopic;
	current_clicked.what = "topic";
	current_clicked.object = currentTopic.__data__;
	update_drawing();
	} else
	// Have to update drawing in the case where shiny inputs have changed
	// but no mouse hover/clicks have happened (on the plot itself)
	*/
	update_drawing();
	
    }
    
});

Shiny.outputBindings.register(scatterOutputBinding, 'cpsievert.scatterbinding');

function cluster_on(d) {
    
    // increase opacity of Voronoi region
    var circle = d3.select(this);
    circle.style("fill-opacity", 0.5)
    var cluster = d;
    
    // remove the title 
    var text = d3.select(".bubble-tool");
    text.remove();
    
    // clustDat contains the topics in this cluster -- just need this to compute % of tokens from
    // the cluster, to display above barchart:
    var clustDat = mdsData.filter(function(d) { return d.cluster == cluster });
    
    var Freq = 0;
    for (var i=0; i < clustDat.length; i++) {
	Freq = Freq + clustDat[i]['Freq'];
    }
    var Freq = Freq.toFixed(1); // round to one decimal place
    
    // append a 'title' to bar chart with data relevant to the cluster of interest
    d3.select("svg")
	.append("text")
	.attr("x", mdswidth + 2*margin.left + barwidth/2)             
	.attr("y", margin.top/2)
	.attr("text-anchor", "middle")
	.attr("class", "bubble-tool")     
	.style("font-size", "16px") 
	.style("text-decoration", "underline")  
	.text(Freq + "% of the corpus comes from cluster " + cluster);

    // filter the bars according to the selected cluster
    var dat2 = barData.filter(function(d) { return d.Category == "Cluster"+cluster });

    var y = d3.scale.ordinal()
        .domain(dat2.map(function(d) { return d.Term; }))
        .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
        .domain([1, d3.max(dat2, function(d) { return d.Total; })])
        .range([0, barwidth])
        .nice();

    // Change Total Frequency bars
    d3.selectAll(".bar-totals")
	.data(dat2)
	.transition()
	.attr("x", 0)  
	.attr("y", function(d) { return y(d.Term); })
	.attr("height", y.rangeBand()) 
	.attr("width", function(d) { return x(d.Total); } )
	.style("fill", "gray")   
	.attr("opacity", 0.4);

    // Change word labels
    d3.selectAll(".terms")
	.data(dat2)
	.transition()
	.text(function(d) { return d.Term; });

    // Create blue bars (drawn over the gray ones) to signify the frequency under the selected cluster
    d3.select("#bar-freqs")
	.selectAll(".overlay")  
	.data(dat2)
	.enter()
	.append("rect")
	.attr("class", "overlay")
	.attr("x", 0)  
	.attr("y", function(d) { return y(d.Term); })
	.attr("height", y.rangeBand()) 
	.attr("width", function(d) { return x(d.Freq); } )
	.style("fill", "steelblue")   
	.attr("opacity", 0.4); 

    // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
        .orient("top")
        .tickSize(-barheight)
        .tickSubdivide(true)
	.ticks(6);

    // redraw x-axis
    d3.selectAll(".xaxis")
	.attr("class", "xaxis")
	.call(xAxis);

}


function topic_on(d) {

    // Increase opacity of currently selected circle
    //var circle = d3.select("#Topic"+d.topics);
    var circle = d3.select(this);
    circle.style("opacity", 0.8); 

    var Freq = d.Freq.toFixed(1), topics = d.topics, cluster = d.cluster;

    // remove the title with cluster proportion
    var text = d3.select(".bubble-tool");
    text.remove();

    // append text with info relevant to topic of interest
    d3.select("svg")
	.append("text")
	.attr("x", mdswidth + 2*margin.left + barwidth/2)             
	.attr("y", margin.top/2)
	.attr("text-anchor", "middle")
	.attr("class", "bubble-tool")       // set class so we can remove it when highlight_off is called  
	.style("font-size", "16px") 
	.style("text-decoration", "underline")  
	.text(Freq + "% of the corpus comes from topic " + topics);

    // grab the bar-chart data for this topic only:
    var dat2 = barData.filter(function(d) { return d.Category == "Topic"+topics });

    var y = d3.scale.ordinal()
        .domain(dat2.map(function(d) { return d.Term; }))
        .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
        .domain([1, d3.max(dat2, function(d) { return d.Total; })])
        .range([0, barwidth])
        .nice();

    // remove the blue bars of cluster frequencies
    d3.selectAll(".overlay").remove();

    // Change Total Frequency bars
    d3.selectAll(".bar-totals")
	.data(dat2)
	.transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    // Change word labels
    d3.selectAll(".terms")
	.data(dat2)
	.transition()
        .text(function(d) { return d.Term; });

    // Create red bars (drawn over the gray ones) to signify the frequency under the selected topic
    d3.select("#bar-freqs").selectAll("overlay")  
	.data(dat2)
	.enter()
        .append("rect")
        .attr("class", "overlay")
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Freq); } )
        .style("fill", "red")   
        .attr("opacity", 0.4); 

    // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
        .orient("top")
        .tickSize(-barheight)
        .tickSubdivide(true)
	.ticks(6);

    d3.selectAll(".xaxis")
	.attr("class", "xaxis")
	.call(xAxis);

}

function cluster_off(d) {

    var circle = d3.select(this);
    circle.style("fill-opacity", 0.4);  // go back to original opacity

    // change to default title
    d3.selectAll(".bubble-tool").text("Most salient tokens");

    // remove the blue bars of cluster frequencies
    d3.selectAll(".overlay").remove();

    // go back to 'default' bar chart
    var dat2 = barData.filter(function(d) { return d.Category == "Default" });

    var y = d3.scale.ordinal()
        .domain(dat2.map(function(d) { return d.Term; }))
        .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
        .domain([1, d3.max(dat2, function(d) { return d.Total; })])
        .range([0, barwidth])
        .nice();

    // Change Total Frequency bars
    d3.selectAll(".bar-totals")
	.data(dat2)
	.transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    // Change word labels
    d3.selectAll(".terms")
	.data(dat2)
	.transition()
        .text(function(d) { return d.Term; });

    // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis()
	.scale(x)
        .orient("top")
        .tickSize(-barheight)
        .tickSubdivide(true)
	.ticks(6);

    // redraw x-axis
    d3.selectAll(".xaxis")
	.attr("class", "xaxis")
	.call(xAxis);
    
}

function topic_off(d) {
    //var circle = d3.select("#Topic"+d.topics);
    var circle = d3.select(this);
    circle.style("opacity", 0.4);  // go back to original opacity

    // change to default title
    d3.selectAll(".bubble-tool").text("Most salient tokens");
    
    // remove the blue bars of cluster frequencies
    d3.selectAll(".overlay").remove();

    // go back to 'default' bar chart
    var dat2 = barData.filter(function(d) { return d.Category == "Default" });

    var y = d3.scale.ordinal()
        .domain(dat2.map(function(d) { return d.Term; }))
        .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
        .domain([1, d3.max(dat2, function(d) { return d.Total; })])
        .range([0, barwidth])
        .nice();

    // Change Total Frequency bars
    d3.selectAll(".bar-totals")
	.data(dat2)
	.transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    // Change word labels
    d3.selectAll(".terms")
	.data(dat2)
	.transition()
        .text(function(d) { return d.Term; });

    // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
        .orient("top")
        .tickSize(-barheight)
        .tickSubdivide(true)
	.ticks(6);
    
    // redraw x-axis
    d3.selectAll(".xaxis")
	.attr("class", "xaxis")
	.call(xAxis);    
}

function text_on(d) {
    var text = d3.select(this);
    text.style("font-weight", "bold");

    var Term = d.Term;
    var dat2 = mdsData2.filter(function(d) { return d.Term == Term });

    // # of topics
    var k = dat2.length  

    //Change size of bubbles according to the word's distribution over topics
    d3.selectAll(".dot")
	.data(dat2)
	.transition()
        .attr("r", function(d) { return (400/k)*Math.sqrt(d.Freq); });
}

function text_off() {
    var text = d3.select(this);
    text.style("font-weight", null);

    var k = mdsData.length  // # of topics

    d3.selectAll(".dot")
	.data(mdsData)
	.transition()
        .attr("r", function(d) { return (400/k)*Math.sqrt(d.Freq); });
}

