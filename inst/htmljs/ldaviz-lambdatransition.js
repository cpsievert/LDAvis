// This section sets up the logic for event handling
var current_clicked = { what: "nothing", element: undefined, object: undefined },
current_hover = { what: "nothing", element: undefined, object: undefined },
old_winning_state = { what: "nothing", element: undefined, object: undefined };

// Set up a few global variables to hold the data:
var K,
mdsData,
mdsData3,
lamData,
current_topic = 0,
old_lambda = 1,
current_lambda = 1;


// Set the duration of each half of the transition:
var duration = 750;

// Set global margins used for everything
var margin = {top: 30, right: 30, bottom: 70, left: 30},
mdswidth = 530, 
mdsheight = 530,
barwidth = 530,
barheight = 530,
termwidth = 90; // width to add between two panels to display terms

function show_state()
{
    console.log(current_clicked, current_hover);
}

function reset_state()
{
    current_clicked = { what: "nothing", element: undefined, object: undefined },
    current_hover = { what: "nothing", element: undefined, object: undefined },
    document.getElementById("topic").value = "";
    update_drawing();    
}

// function to click a topic based on input from the html form:
function change_topic(event) {

    var new_topic = Math.max(1, Math.min(50, Math.floor(+document.getElementById("topic").value)));
    if (isNaN(new_topic)) {
	current_clicked = { what: "nothing", element: undefined, object: undefined };
	document.getElementById("topic").value = current_topic;
    } else {
	current_topic = new_topic;
	current_clicked.element = d3.select("#topic".concat(current_topic))[0][0];
	current_clicked.what = "topic";
	current_clicked.object = d3.select("#topic".concat(current_topic))[0][0].__data__;
	document.getElementById("topic").value = current_topic;
	update_drawing();
    }
    return false;
}

// function to click a topic based on input from the html form:
function decrement_topic(event) {

    var new_topic = Math.max(1, Math.min(50, Math.floor(current_topic - 1)));
    if (isNaN(new_topic)) {
	current_clicked = { what: "nothing", element: undefined, object: undefined };
	document.getElementById("topic").value = current_topic;
    } else {
	current_topic = new_topic;
	current_clicked.element = d3.select("#topic".concat(current_topic))[0][0];
	current_clicked.what = "topic";
	current_clicked.object = d3.select("#topic".concat(current_topic))[0][0].__data__;
	document.getElementById("topic").value = current_topic;
	update_drawing();
    }
    return false;
}

// function to click a topic based on input from the html form:
function increment_topic(event) {

    var new_topic = Math.max(1, Math.min(50, Math.floor(current_topic + 1)));
    if (isNaN(new_topic)) {
	current_clicked = { what: "nothing", element: undefined, object: undefined };
	document.getElementById("topic").value = current_topic;
    } else {
	current_topic = new_topic;
	current_clicked.element = d3.select("#topic".concat(current_topic))[0][0];
	current_clicked.what = "topic";
	current_clicked.object = d3.select("#topic".concat(current_topic))[0][0].__data__;
	document.getElementById("topic").value = current_topic;
	update_drawing();
    }
    return false;
}


// function to read in a new lambda value from an html form and transition barchart:
function change_lambda(event) {

    // read in the new value of lambda from the html input:
    var new_lambda = Math.max(0, Math.min(100, Math.floor(+document.getElementById("lambda").value * 100)))/100;
    
    // if the new lambda is not a number, just print the old lambda to the screen and do nothing else:
    if (isNaN(new_lambda)) {  
	document.getElementById("lambda").value = current_lambda;
	//return false;
    } else {
	old_lambda = current_lambda;    
	current_lambda = new_lambda;
	document.getElementById("lambda").value = current_lambda;
	reorder_bars();
    }
    return false;
}

// function to read in a new lambda value from an html form and transition barchart:
function decrement_lambda(event) {
    // read in the new value of lambda from the html button:
    var new_lambda = Math.max(0, Math.min(100, Math.floor((current_lambda - 0.1) * 100)))/100;
    //var new_lambda = current_lambda - 0.1;
    old_lambda = current_lambda;    
    current_lambda = new_lambda;
    document.getElementById("lambda").value = current_lambda;
    reorder_bars();
    return false;
}

// function to read in a new lambda value from an html form and transition barchart:
function increment_lambda(event) {
    // read in the new value of lambda from the html button:
    var new_lambda = Math.max(0, Math.min(100, Math.floor((current_lambda + 0.1) * 100)))/100;
    //var new_lambda = current_lambda + 0.1;
    old_lambda = current_lambda;    
    current_lambda = new_lambda;
    document.getElementById("lambda").value = current_lambda;
    reorder_bars();
    return false;
}



// function to re-order the bars (gray and red), and terms:
function reorder_bars() {
    
    var winning_state;
    if (current_hover.what !== "nothing") {
        winning_state = current_hover;
    } else {
        winning_state = current_clicked;
    }
    
    // Set up a transition:
    if (old_winning_state.what == "topic") {
        
        topics = old_winning_state.object.topics;
        d = old_winning_state.object;
	
        // grab the bar-chart data for this topic only:
        var dat2 = lamData.filter(function(d) { return d.Category == "Topic"+topics });
	
        // define relevance:
        for (var i = 0; i < dat2.length; i++)  { 
	    dat2[i].relevance = current_lambda*dat2[i].logprob + (1 - current_lambda)*dat2[i].loglift;
        }
	
        // sort by relevance:
        dat2.sort(fancysort("relevance"));
	
        // truncate to the top 30 tokens:
        var dat3 = dat2.slice(0, 30); 
	
        var y = d3.scale.ordinal()
            .domain(dat3.map(function(d) { return d.Term; }))
            .rangeRoundBands([0, barheight], 0.15);
        var x = d3.scale.linear()
            .domain([1, d3.max(dat3, function(d) { return d.Total; })])
            .range([0, barwidth])
            .nice();
	
        // Change Total Frequency bars
        var graybars = d3.select("#bar-freqs")
	    .selectAll(".bar-totals")
	    .data(dat3, function(d) { return d.Term; });
	
        // Change word labels
        var labels = d3.select("#bar-freqs")
	    .selectAll(".terms")
	    .data(dat3, function(d) { return d.Term; });
	
        // Create red bars (drawn over the gray ones) to signify the frequency under the selected topic
        var redbars = d3.select("#bar-freqs")
	    .selectAll(".overlay")  
	    .data(dat3, function(d) { return d.Term; });
	
        // adapted from http://bl.ocks.org/mbostock/1166403
        var xAxis = d3.svg.axis().scale(x)
	    .orient("top")
	    .tickSize(-barheight)
	    .tickSubdivide(true)
	    .ticks(6);
	
	// New axis definition:
	var newaxis = d3.selectAll(".xaxis");
	
	// define the new elements to enter:
        var graybarsEnter = graybars.enter().append("rect")
	    .attr("class", "bar-totals")
	    .attr("x", 0)  
	    .attr("y", function(d) { return y(d.Term) + barheight + margin.bottom; })
	    .attr("height", y.rangeBand()) 
	    .style("fill", "gray")   
	    .attr("opacity", 0.4)
	
	var labelsEnter = labels.enter()
	    .append("text")
	    .attr("x", -5)
	    .attr("class", "terms")
	    .attr("y", function(d) { return y(d.Term) + 12 + barheight + margin.bottom; })
	    .attr("text-anchor", "end")
	    .text(function(d) { return d.Term; })
	    .on("mouseover", text_on)
	    .on("mouseout", text_off);
	
        var redbarsEnter = redbars.enter().append("rect")
	    .attr("class", "overlay")
	    .attr("x", 0)  
	    .attr("y", function(d) { return y(d.Term) + barheight + margin.bottom; })
	    .attr("height", y.rangeBand()) 
	    .style("fill", "red")   
	    .attr("opacity", 0.4);
	
	
	if (old_lambda < current_lambda) {
	    graybarsEnter
  	        .attr("width", function(d) { return x(d.Total); } )
		.transition().duration(duration)
	        .delay(duration)
		.attr("y", function(d) { return y(d.Term); });
	    labelsEnter
	        .transition().duration(duration)
		.delay(duration)
		.attr("y", function(d) { return y(d.Term) + 12; });
	    redbarsEnter
  	        .attr("width", function(d) { return x(d.Freq); } )
		.transition().duration(duration)
	        .delay(duration)
		.attr("y", function(d) { return y(d.Term); } );
	    
	    graybars.transition().duration(duration)
		.attr("width", function(d) { return x(d.Total); } )
		.transition().duration(duration)
		.attr("y", function(d) { return y(d.Term); });
	    labels.transition().duration(duration)
		.delay(duration)
	        .attr("y", function(d) { return y(d.Term) + 12; });
	    redbars.transition().duration(duration)
		.attr("width", function(d) { return x(d.Freq); } )
		.transition().duration(duration)
		.attr("y", function(d) { return y(d.Term); });
	    
	    // Transition exiting rectangles to the bottom of the barchart:
	    graybars.exit()
		.transition().duration(duration)
		.attr("width", function(d) { return x(d.Total); } )
		.transition().duration(duration)
		.attr("y", function(d, i) { return barheight + margin.bottom + 6 + i * 18; } )
		.remove();
	    labels.exit()
		.transition().duration(duration)
		.delay(duration)
		.attr("y", function(d, i) { return barheight + margin.bottom + 18 + i * 18; })
		.remove();
	    redbars.exit()
		.transition().duration(duration)
		.attr("width", function(d) { return x(d.Freq); } )
		.transition().duration(duration)
		.attr("y", function(d, i) { return barheight + margin.bottom + 6 + i * 18; } )
		.remove();
	    
	    // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
	    newaxis.transition().duration(duration)
	        .call(xAxis)
		.transition().duration(duration);
	    
	    
	} else { // old_lambda > current_lambda
	    graybarsEnter
		.attr("width", 100) // FIXME by looking up old width of these bars
		.transition().duration(duration)
		.attr("y", function(d) { return y(d.Term); })
		.transition().duration(duration)
		.attr("width", function(d) { return x(d.Total); } );
	    labelsEnter
	        .transition().duration(duration)
		.attr("y", function(d) { return y(d.Term) + 12; });
	    redbarsEnter
		.attr("width", 50) // FIXME by looking up old width of these bars
		.transition().duration(duration)
		.attr("y", function(d) { return y(d.Term); })
		.transition().duration(duration)
		.attr("width", function(d) { return x(d.Freq); } );

	    graybars.transition().duration(duration)
		.attr("y", function(d) { return y(d.Term); })
		.transition().duration(duration)
		.attr("width", function(d) { return x(d.Total); } );
	    labels.transition().duration(duration)
	        .attr("y", function(d) { return y(d.Term) + 12; });
	    redbars.transition().duration(duration)
		.attr("y", function(d) { return y(d.Term); })
		.transition().duration(duration)
		.attr("width", function(d) { return x(d.Freq); } );

	    // Transition exiting rectangles to the bottom of the barchart:
	    graybars.exit()
		.transition().duration(duration)
		.attr("y", function(d, i) { return barheight + margin.bottom + 6 + i * 18; } )
		.remove();
	    labels.exit()
		.transition().duration(duration)
		.attr("y", function(d, i) { return barheight + margin.bottom + 18 + i * 18; })
		.remove();
	    redbars.exit()
		.transition().duration(duration)
		.attr("y", function(d, i) { return barheight + margin.bottom + 6 + i * 18; } )
		.remove();

	    // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
	    newaxis.transition().duration(duration)
		.transition().duration(duration)
	        .call(xAxis);

	} // old_lambda vs current_lambda
	
    }
    
    old_winning_state.what = winning_state.what;
    old_winning_state.element = winning_state.element;
    old_winning_state.object = winning_state.object;
    console.log(winning_state);
    
}

// Main function to update the drawing:
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
        case "topic":
            topic_off.call(old_winning_state.element, old_winning_state.object);
            break;
        }
    }
    
    switch (winning_state.what) {
    case "nothing":
        topic_off.call(old_winning_state.element);
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

// when a topic is selected:
function topic_on(d) {

    var circle = d3.select(this);
    circle.style("opacity", 0.8); 

    var Freq = Math.round(d.Freq*10)/10, topics = d.topics, cluster = d.cluster;
    current_topic = +topics;

    // remove the title with cluster proportion
    var text = d3.select(".bubble-tool");
    text.remove();

    // append text with info relevant to topic of interest
    d3.select("svg")
	.append("text")
	.attr("x", mdswidth + 2*margin.left + barwidth/2)             
	.attr("y", margin.top/2)
	.attr("text-anchor", "middle")
	.attr("class", "bubble-tool")       //  set class so we can remove it when highlight_off is called  
	.style("font-size", "16px") 
	.style("text-decoration", "underline")  
	.text(Freq + "% of tokens come from topic " + topics);

    // grab the bar-chart data for this topic only:
    var dat2 = lamData.filter(function(d) { return d.Category == "Topic"+topics });
    
    // define relevance:
    for (var i = 0; i < dat2.length; i++)  { 
	dat2[i].relevance = current_lambda*dat2[i].logprob + (1 - current_lambda)*dat2[i].loglift;
    }

    // sort by relevance:
    dat2.sort(fancysort("relevance"));

    // truncate to the top 30 tokens:
    var dat3 = dat2.slice(0, 30); 

    // scale the bars to the top 30 terms:
    var y = d3.scale.ordinal()
        .domain(dat3.map(function(d) { return d.Term; }))
        .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
        .domain([1, d3.max(dat3, function(d) { return d.Total; })])
        .range([0, barwidth])
        .nice();

    // remove the red bars if there are any:
    d3.selectAll(".overlay").remove();

    // Change Total Frequency bars
    d3.selectAll(".bar-totals")
	.data(dat3)
	//.transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    // Change word labels
    d3.selectAll(".terms")
	.data(dat3)
	//.transition()
        .attr("x", -5)
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
        .text(function(d) { return d.Term; });

    // Create red bars (drawn over the gray ones) to signify the frequency under the selected topic
    d3.select("#bar-freqs").selectAll(".overlay")  
	.data(dat3)
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

    // redraw x-axis
    d3.selectAll(".xaxis")
	.attr("class", "xaxis")
	.call(xAxis);
 
}


function topic_off() {
    var circle = d3.select(this);
    circle.style("opacity", 0.4);  // go back to original opacity

    // remove the tool-tip
    d3.selectAll(".bubble-tool").text("Most Salient Terms");

    // remove the red bars
    d3.selectAll(".overlay").remove();

    // go back to 'default' bar chart
    var dat2 = lamData.filter(function(d) { return d.Category == "Default" });

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
	//.transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    //Change word labels
    d3.selectAll(".terms")
	.data(dat2)
	//.transition()
        .attr("x", -5)
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
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
    var dat2 = mdsData3.filter(function(d) { return d.Term == Term });

    var k = dat2.length;  // number of topics for this token with non-zero frequency

    var radius = [];
    for (var i = 0; i < K; ++i) {
	radius[i] = 0;
    }
    for (i = 0; i < k; i++) {
	radius[dat2[i].Topic - 1] = dat2[i].Freq;
    }

    // Change size of bubbles according to the word's distribution over topics
    d3.selectAll(".dot")
	.data(radius)
	.transition()
        .attr("r", function(d) { return (400/K)*Math.sqrt(100*d); });
}

function text_off() {
    var text = d3.select(this);
    text.style("font-weight", null);

    d3.selectAll(".dot")
	.data(mdsData)
	.transition()
        .attr("r", function(d) { return (400/K)*Math.sqrt(d.Freq); });
}


// The actual read-in of the data and main code:
d3.json("lda.json", function(error, data) {

    // set the number of topics to global variable k:
    K = data['mdsDat'].x.length;

    // a (K x 5) matrix with columns x, y, topics, Freq, cluster (where x and y are locations for left panel)
    mdsData = [];
    for (var i=0; i < K; i++)  { 
        var obj = {};
        for (var key in data['mdsDat']){
            obj[key] = data['mdsDat'][key][i];
        }
        mdsData.push( obj );
    }

    // a huge matrix with 3 columns: Term, Topic, Freq, where Freq is all non-zero probabilities of topics given terms
    // for the terms that appear in the barcharts for this data
    mdsData3 = [];
    for (var i=0; i < data['token.table'].Term.length; i++)  { 
        var obj = {};
        for (var key in data['token.table']){
            obj[key] = data['token.table'][key][i];
        }
        mdsData3.push( obj );
    }

    // large data for the widths of bars in bar-charts. 6 columns: Term, logprob, loglift, Freq, Total, Category
    // Conatins all possible terms for topics in (1, 2, ..., k) and lambda in (0, 0.01, 0.02, ..., 1).
    lamData = [];
    for (var i=0; i < data['tinfo'].Term.length; i++)  { 
        var obj = {};
        for (var key in data['tinfo']){
            obj[key] = data['tinfo'][key][i];
        }
        lamData.push( obj );
    }
    
    //establish layout and vars for mdsPlot
    var color = d3.scale.category10();

    //create linear scaling to pixels (and add some padding on outer region of scatterplot)
    var xrange = d3.extent(mdsData, function(d){ return d.x; }); //d3.extent returns min and max of an array
    var xdiff = xrange[1] - xrange[0], xpad = 0.10;
    var xScale = d3.scale.linear()
        .range([0, mdswidth])
        .domain([xrange[0] - xpad*xdiff, xrange[1] + xpad*xdiff]);

    var yrange = d3.extent(mdsData, function(d){return d.y; });
    var ydiff = yrange[1] - yrange[0], ypad = 0.10;
    var yScale = d3.scale.linear()
        .range([mdsheight, 0])
        .domain([yrange[0] - ypad*ydiff, yrange[1] + ypad*ydiff]);

    //Create new svg element (that will contain everything):
    var svg = d3.select("#lda").append("svg")
        .attr("width", mdswidth  + barwidth + margin.left + termwidth + margin.right)
        .attr("height", mdsheight + 2*margin.top + margin.bottom);
        
    // Create a group for the mds plot
    var mdsplot = svg.append("g")
        .attr("id", "leftpanel")
        .attr("class", "points")
        .attr("transform", "translate(" + margin.left + "," + 2*margin.top + ")"); 

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

    // bind mdsData to the points in the left panel:
    var points = mdsplot.selectAll("points")
        .data(mdsData)
        .enter();

    // text to indicate topic
    points.append("text")
        .attr("class", "txt")
        .attr("x", function(d) { return(xScale(+d.x)); })
        .attr("y", function(d) { return(yScale(+d.y)+4); })
        .text(function(d) { return d.topics; })
        .attr("text-anchor", "middle")        
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("font-size", 11)
        .attr("font-weight", 100);
        
    // draw circles
    points.append("circle")
        .attr("class", "dot")
        .style("opacity", 0.3)
        .style("fill", function(d) { return color(d.cluster); })
        .attr("r", function(d) { return (400/K)*Math.sqrt(d.Freq) ; })  // circle sizes should get smaller as the # of topics increases
        .attr("cx", function(d) { return (xScale(+d.x)); })
        .attr("cy", function(d) { return (yScale(+d.y)); })
        .attr("id", function(d) { return ('topic' + d.topics) })
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
            document.getElementById("topic").value = d.topics;
            update_drawing();
        })
        .on("mouseout", function(d) {
            current_hover.element = undefined;
            current_hover.what = "nothing";
            current_hover.object = undefined;
            update_drawing();
        });
    
    // Add the clear selection clickable text:
    svg.append("text")
        .text("Clear selection")
        .attr("x", 40)
        .attr("y", 20)
        .attr("cursor", "pointer")
        .on("click", function() {
            reset_state();
        });

    // establish layout and vars for bar chart
    var barDefault2 = lamData.filter(function(d) { return d.Category == "Default" });

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

    // Add a group for the bar chart
    var chart = svg.append("g")
        .attr("transform", "translate(" + +(mdswidth + margin.left + termwidth) + "," + 2*margin.top + ")")
        .attr("id", "bar-freqs");

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

    // Add word labels to the top of each bar
    basebars
        .append("text")
        .attr("x", -5)
        .attr("class", "terms")
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
        .text(function(d) { return d.Term; })
        .on("mouseover", text_on)
        .on("mouseout", text_off);

    // append text with info relevant to topic of interest
    svg.append("text")
	.attr("x", mdswidth + 2*margin.left + barwidth/2)             
	.attr("y", margin.top/2)
	.attr("text-anchor", "middle")
	.attr("class", "bubble-tool")       //  set class so we can remove it when highlight_off is called  
	.style("font-size", "16px") 
	.style("text-decoration", "underline")  
	.text("Most Salient Terms");

    // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
                    .orient("top")
                    .tickSize(-barheight)
                    .tickSubdivide(true)
	            .ticks(6);

    chart.attr("class", "xaxis")
        .call(xAxis);

    document.getElementById("lambda").value = current_lambda;
    document.getElementById("topic").value = current_topic;

});



// Can remove functions below when buttons replace links

/*
// increment topic button/link:
d3.select("#increase_topic").on("click", function() {
    var new_topic = Math.max(1, Math.min(50, Math.floor(current_topic + 1)));
    if (isNaN(new_topic)) {
	current_clicked = { what: "nothing", element: undefined, object: undefined };
	document.getElementById("topic").value = current_topic;
    } else {
	current_topic = new_topic;
	current_clicked.element = d3.select("#topic".concat(current_topic))[0][0];
	current_clicked.what = "topic";
	current_clicked.object = d3.select("#topic".concat(current_topic))[0][0].__data__;
	document.getElementById("topic").value = current_topic;
	update_drawing();
    }
    return false;
});

// decrement topic button/link:
d3.select("#decrease_topic").on("click", function() {
    var new_topic = Math.max(1, Math.min(50, Math.floor(current_topic - 1)));
    if (isNaN(new_topic)) {
	current_clicked = { what: "nothing", element: undefined, object: undefined };
	document.getElementById("topic").value = current_topic;
    } else {
	current_topic = new_topic;
	current_clicked.element = d3.select("#topic".concat(current_topic))[0][0];
	current_clicked.what = "topic";
	current_clicked.object = d3.select("#topic".concat(current_topic))[0][0].__data__;
	document.getElementById("topic").value = current_topic;
	update_drawing();
    }
    return false;
});

// increment lambda button/link:
d3.select("#increase_lambda").on("click", function() {

    // read in the new value of lambda from the html input:
    var new_lambda = Math.max(0, Math.min(100, Math.floor((current_lambda + 0.1) * 100)))/100;
    
    // if the new lambda is not a number, just print the old lambda to the screen and do nothing else:
    if (isNaN(new_lambda)) {  
	document.getElementById("lambda").value = current_lambda;
    } else {
	old_lambda = current_lambda;    
	current_lambda = new_lambda;
	document.getElementById("lambda").value = current_lambda;
	reorder_bars();
    }
    return false;
});

// decrement topic button/link:
d3.select("#decrease_lambda").on("click", function() {

    // read in the new value of lambda from the html input:
    var new_lambda = Math.max(0, Math.min(100, Math.floor((current_lambda - 0.1) * 100)))/100;
    
    // if the new lambda is not a number, just print the old lambda to the screen and do nothing else:
    if (isNaN(new_lambda)) {  
	document.getElementById("lambda").value = current_lambda;
    } else {
	old_lambda = current_lambda;    
	current_lambda = new_lambda;
	document.getElementById("lambda").value = current_lambda;
	reorder_bars();
    }
    return false;
});

*/

