LDAvis = function(to_select, json_file) {

	// This section sets up the logic for event handling
	var current_clicked = { what: "nothing", element: undefined, 
	object: undefined },
	current_hover = { what: "nothing", element: undefined, object: undefined },
	old_winning_state = { what: "nothing", element: undefined, object: undefined };

	// Set up a few 'global' variables to hold the data:
	var K, R,
	mdsData,
	mdsData3,
	lamData,
	current_topic = 0,
	lambda = {'old': 1, 'current': 1};

	// Set the duration of each half of the transition:
	var duration = 750;

	// Set global margins used for everything
	var margin = {top: 30, right: 30, bottom: 70, left: 30},
	mdswidth = 530, 
	mdsheight = 530,
	barwidth = 530,
	barheight = 530,
	termwidth = 90, // width to add between two panels to display terms
	mdsarea = mdsheight * mdswidth;

	// a circle with this radius would be equal in area to the scatterplot
	var rTotal = Math.sqrt(mdsarea/Math.PI); 
	// controls how big the maximum circle can be
	var rMax	 = rTotal/5; 

	// opacity of topic circles:
	var base_opacity = 0.2,
	highlight_opacity = 0.6;

	// topic/lambda selection names are specific to *this* vis
	var topic_select = to_select + "-topic";
	var lambda_select = to_select + "-lambda";

	// get rid of the # in the to_select (useful) for setting ID values
	var parts = to_select.split("#");
	var visID = parts[parts.length - 1];
	var topicID = visID + "-topic";
	var lambdaID = visID + "-lambda";

	// The actual read-in of the data and main code:
	d3.json(json_file, function(error, data) {

		    // set the number of topics to global variable K:
    K = data['mdsDat'].x.length;

    // R is the number of top relevant (or salient) words whose bars we display
    R = data['R'];

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

		// Create the topic input & lambda slider forms. Inspired from:
		// http://bl.ocks.org/d3noob/10632804
		// http://bl.ocks.org/d3noob/10633704
		init_forms(topicID, lambdaID, visID);

		// When the value of lambda changes, update the visualization
		d3.select(lambda_select)
			.on("mouseup", function() {
				// store the previous lambda value
				lambda.old = document.getElementById(lambdaID).value;
				lambda.current = +this.value;
				// adjust the text on the range slider
		  	d3.select(lambda_select).property("value", lambda.current);
		  	d3.select(lambda_select + "-value").text(lambda.current);
		  	// transition the order of the bars
		  	reorder_bars();
		  	// store the current lambda value
		  	document.getElementById(lambdaID).value = lambda.current;
		});

		d3.select(topic_select)
			.on("input", function(d) {
				if (isNaN(+this.value)) {
					current_clicked = { what: "nothing", element: undefined, object: undefined };
				} else {
					var el = document.getElementById(topicID + this.value)
					current_clicked.element = el;
					current_clicked.what = "topic";
					current_clicked.object = el.__data__; //is this right?
					update_drawing();
				}
				return false;
		});
    
    // establish layout and vars for mdsPlot
    var color = d3.scale.category10();

    // create linear scaling to pixels (and add some padding on outer region of scatterplot)
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


	  var maxTopicFreq = Math.max.apply(null, data['mdsDat']['Freq']);
	  var minTopicFreq = Math.min.apply(null, data['mdsDat']['Freq']);
	  var rScaleMargin = d3.scale.sqrt().domain([0, maxTopicFreq]).range([1, rMax]);
      

    // Create new svg element (that will contain everything):
    var svg = d3.select(to_select).append("svg")
	    .attr("width", mdswidth  + barwidth + margin.left + termwidth + margin.right)
	    .attr("height", mdsheight + 2*margin.top + margin.bottom + 2*rMax);

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

		// circle guide inspired from
	  // http://www.nytimes.com/interactive/2012/02/13/us/politics/2013-budget-proposal-graphic.html?_r=0
	  var rSmall = rScaleMargin(100/K),  // an 'average circle'
	  	rBig = rMax,
	  	cx = 10 + rBig,
    	cx2 = cx + 1.5*rBig;

    circleGuide =  function(rSize, size) {
     	d3.select("#leftpanel").append("circle")
        .attr('class',"circleGuide" + size)
        .attr('r', rSize)
        .attr('cx', cx)
        .attr('cy', mdsheight + rSize)
        .style('fill', 'none')
        .style('stroke-dasharray', '2 2')
        .style('stroke', '#999');
      d3.select("#leftpanel").append("line")
      	.attr('class',"lineGuide" + size)
        .attr("x1", cx)
	      .attr("x2", cx2)
	      .attr("y1", mdsheight + 2*rSize)
	      .attr("y2", mdsheight + 2*rSize)
	      .style("stroke", "gray")
	      .style("opacity", 0.3);
     }

    circleGuide(rBig, "Big");
    circleGuide(rSmall, "Small");

    // Guide title vars
    var defaultLabelBig = "The largest frequency is " + 
    	Math.pow(rBig/rSmall, 2).toFixed(1)  + 
    	" times larger than the average.";
    var defaultLabelSmall = "Average frequency (" + 
    	(100*(1/K)).toFixed(1) + "% of the corpus)";

    d3.select("#leftpanel").append("text")
    	.attr("x", cx)
    	.attr("y", mdsheight - 10)
    	.attr('class',"circleGuideTitle")
    	.style("text-anchor", "middle")
    	.style("font-weight", "bold")
    	.text("Marginal topic frequency");
    d3.select("#leftpanel").append("text")
    	.attr("x", cx2 + 10)
    	.attr("y", mdsheight + 2*rBig)
    	.attr('class',"circleGuideLabelBig")
    	.style("text-anchor", "start")
    	.text(defaultLabelBig);
    d3.select("#leftpanel").append("text")
    	.attr("x", cx2 + 10)
    	.attr("y", mdsheight + 2*rSmall)
    	.attr('class',"circleGuideLabelSmall")
    	.style("text-anchor", "start")
    	.text(defaultLabelSmall);

    // bind mdsData to the points in the left panel:
    var points = mdsplot.selectAll("points")
	    .data(mdsData)
	    .enter();

    // text to indicate topic
    points.append("text")
	    .attr("class", "txt")
	    .attr("x", function(d) { return(xScale(+d.x)); })
	    .attr("y", function(d) { return(yScale(+d.y)+4); })
	    .attr("stroke", "black")
	    .attr("opacity", 1)
	    .style("text-anchor", "middle")
	    .style("font-size", "11px")
	    .style("font-weight", 100)
	    .text(function(d) { return d.topics; });

    // draw circles
    points.append("circle")
    .attr("class", "dot")
    .style("opacity", 0.2)
    .style("fill", function(d) { return color(d.cluster); })
    // circle sizes should get smaller as the # of topics increases:
    .attr("r", function(d) { return (rScaleMargin(+d.Freq)); })
    .attr("cx", function(d) { return (xScale(+d.x)); })
    .attr("cy", function(d) { return (yScale(+d.y)); })
    .attr("stroke", "black")
    .attr("id", function(d) { return (topicID + d.topics) })
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
    	change_box(this);
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
    .text("Click to clear topic selection")
    .attr("x", 40)
    .attr("y", 20)
    .attr("cursor", "pointer")
    .on("click", function() {
    	reset_state();
    });

    // establish layout and vars for bar chart
    var barDefault2 = lamData.filter(function(d) { 
    	return d.Category == "Default" 
    });

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
	    .attr("cursor", "pointer")
      .style("text-anchor", "end") // right align text - use 'middle' for center alignment
      .text(function(d) { return d.Term; })
      .on("mouseover", text_on)
      .on("mouseout", text_off);

    // append text with info relevant to topic of interest
    svg.append("text")
	    .attr("x", mdswidth + 2*margin.left + barwidth/2)             
	    .attr("y", margin.top/2)
	    .attr("class", "bubble-tool")       //  set class so we can remove it when highlight_off is called  
	    .style("text-anchor", "middle")
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


	  function init_forms (topicID, lambdaID, visID) { 
			// topic inputs
			var topicLabel = document.createElement("label");
		  	topicLabel.setAttribute("for", topicID);
		  	topicLabel.setAttribute("style", "margin-left: 15px");
		  //newLabel.setAttribute("style", "display: inline-block; width: 240px; text-align: right");
		  	topicLabel.innerHTML = "Enter a topic number = <span id='" + topicID + "-value'></span>";
		  var topicInput = document.createElement("input");
		  	topicInput.setAttribute("style", "width: 50px");
			  topicInput.type = "number";
			  topicInput.min = "0";
			  topicInput.max = K; // assumes the data has already been read in
			  topicInput.step = "1";
			  topicInput.value = "0"; // a value of 0 indicates no topic is selected
			  topicInput.id = topicID;
			// lambda inputs  	
		  var lambdaLabel = document.createElement("label");
		  	lambdaLabel.setAttribute("for", lambdaID);
		  	lambdaLabel.setAttribute("style", "width: 300px; margin-left: 15px");
		  	lambdaLabel.innerHTML = "&#955 = <span id='" + lambdaID + "-value'>1</span>";
		  var lambdaInput = document.createElement("input");
		  	lambdaInput.setAttribute("style", "margin-left: 150px");
			  lambdaInput.type = "range";
			  lambdaInput.min = 0;
			  lambdaInput.max = 1;
			  lambdaInput.step = 0.1;
			  lambdaInput.value = 1;
			  lambdaInput.id = lambdaID;
			// input container
			var inputDiv = document.createElement("div");

			// append the forms to the containers
			inputDiv.appendChild(topicLabel);
			inputDiv.appendChild(topicInput);
			inputDiv.appendChild(lambdaInput);
			inputDiv.appendChild(lambdaLabel);
			
			
			// insert the container just before the vis
			var visDiv = document.getElementById(visID);
			document.body.insertBefore(inputDiv, visDiv);
		}

		function show_state() {
			console.log(current_clicked, current_hover, current_topic);
		}

		function reset_state() {
			current_clicked = { what: "nothing", element: undefined, 
			object: undefined },
			current_hover = { what: "nothing", element: undefined, 
			object: undefined },
			document.getElementById(topicID).value = 0;
			current_topic = 0;
			update_drawing();    
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
	      	dat2[i].relevance = lambda.current * dat2[i].logprob + 
	      											(1 - lambda.current) * dat2[i].loglift;
	      }

	      // sort by relevance:
	      dat2.sort(fancysort("relevance"));

	      // truncate to the top R tokens:
	      var dat3 = dat2.slice(0, R); 

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
				.attr("cursor", "pointer")
				.style("text-anchor", "end")
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
				
				
				if (lambda.old < lambda.current) {
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
				} else { 
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
				} // end of old_lambda vs lambda
			}

			old_winning_state.what = winning_state.what;
			old_winning_state.element = winning_state.element;
			old_winning_state.object = winning_state.object;  
		}

		// Main function to update the drawing:
		function update_drawing() {
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
						topic_off(old_winning_state.element);
					break;
				}
			}

			switch (winning_state.what) {
				case "nothing":
					topic_off(old_winning_state.element);
				break;
				case "topic":
					topic_on(winning_state.element);
				break;
			}
			old_winning_state.what = winning_state.what;
			old_winning_state.element = winning_state.element;
			old_winning_state.object = winning_state.object;
		    //console.log(winning_state);
		    //show_state();
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

		// make sure topic input box shows the right topic
		function change_box(circle) {
			document.getElementById(topicID).value = circle.__data__.topics;
		}

		//////////////////////////////////////////////////////////////////////////////

		// function to update bar chart when a topic is selected
		// the circle argument should be the actual circle element
		function topic_on(circle) {
			// grab data bound to this element
			var d = circle.__data__
			var Freq = Math.round(d.Freq * 10)/10, topics = d.topics;

			// change opacity and fill of the selected circle
			circle.style.opacity = highlight_opacity;
			circle.style.fill = "#FFA500";
			
	    var text = d3.select(".bubble-tool");
	    text.remove();

	    // append text with info relevant to topic of interest
	    d3.select("svg")
		    .append("text")
		    .attr("x", mdswidth + 2*margin.left + barwidth/2)             
		    .attr("y", margin.top/2)
				.attr("class", "bubble-tool")       //  set class so we can remove it when highlight_off is called  
				.style("text-anchor", "middle")
				.style("font-size", "16px") 
				.style("text-decoration", "underline")  
				.text(Freq + "% of tokens come from topic " + topics);

	    // grab the bar-chart data for this topic only:
	    var dat2 = lamData.filter(function(d) { return d.Category == "Topic"+topics });
	    
	    // define relevance:
	    for (var i = 0; i < dat2.length; i++)  { 
	    	dat2[i].relevance = lambda.current * dat2[i].logprob + 
	    												(1 - lambda.current) * dat2[i].loglift;
	    }

	    // sort by relevance:
	    dat2.sort(fancysort("relevance"));

	    // truncate to the top R tokens:
	    var dat3 = dat2.slice(0, R); 

	    // scale the bars to the top R terms:
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
		    .attr("x", 0)  
		    .attr("y", function(d) { return y(d.Term); })
		    .attr("height", y.rangeBand()) 
		    .attr("width", function(d) { return x(d.Total); } )
		    .style("fill", "gray")   
		    .attr("opacity", 0.4);

	    // Change word labels
	    d3.selectAll(".terms")
		    .data(dat3)
		    .attr("x", -5)
		    .attr("y", function(d) { return y(d.Term) + 12; })
		    .style("text-anchor", "end") // right align text - use 'middle' for center alignment
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


		function topic_off(circle) {
			// go back to original opacity/fill
			circle.style.opacity = base_opacity;
			circle.style.fill = "#1F77B4";

	    // change the bar chart "title"
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
		    .attr("x", 0)  
		    .attr("y", function(d) { return y(d.Term); })
		    .attr("height", y.rangeBand()) 
		    .attr("width", function(d) { return x(d.Total); } )
		    .style("fill", "gray")   
		    .attr("opacity", 0.4);

	    //Change word labels
	    d3.selectAll(".terms")
		    .data(dat2)
		    .attr("x", -5)
		    .attr("y", function(d) { return y(d.Term) + 12; })
		    .style("text-anchor", "end") // right align text - use 'middle' for center alignment
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

	    var size = [];
	    for (var i = 0; i < K; ++i) {
	    	size[i] = 0;
	    }
	    for (i = 0; i < k; i++) {
				// If we want to also re-size the topic number labels, do it here
				// 11 is the default, so leaving this as 11 won't change anything.
				size[dat2[i].Topic - 1] = 11;
			}

			var rScaleCond = d3.scale.sqrt()
				.domain([0, 1]).range([0, rMax]);

	    // Change size of bubbles according to the word's distribution over topics
	    d3.selectAll(".dot")
		    .data(radius)
		    .transition()
		    .attr("r", function(d) { return (rScaleCond(d)); });

	    // Change sizes of topic numbers:
	    d3.selectAll(".txt")
		    .data(size)
		    .transition()
		    .style("font-size", function(d) { 
		    	return +d;
		    });

	    // Alter the guide
	    d3.select(".circleGuideTitle")
    		.text("Topic frequency given: " + text.text());
    	// Size of the big circle changes
    	d3.select(".circleGuideLabelBig")
    		.text("Total frequency (100% of occurences)");
    	// Average size changes
    	var rAvg = rScaleCond(1/K);
    	d3.select(".circleGuideLabelSmall")
    		.attr("y", mdsheight + 2*rAvg)
    		.text("Average frequency (" + (100*(1/K)).toFixed(1) + "% of occurences)");
    	d3.select(".circleGuideSmall")
    		.attr("r", rAvg)
    		.attr("cy", mdsheight + rAvg);
    	d3.select(".lineGuideSmall")
    		.attr("y1", mdsheight + 2*rAvg)
    		.attr("y2", mdsheight + 2*rAvg);
    	
		}

		function text_off() {
			var text = d3.select(this);
			text.style("font-weight", "normal");

			d3.selectAll(".dot")
				.data(mdsData)
				.transition()
				.attr("r", function(d) { return (rScaleMargin(+d.Freq)); });

	    // Change sizes of topic numbers:
	    d3.selectAll(".txt")
	    	.transition()
	    	.style("font-size", "11px");

	    // Go back to the default guide
	    d3.select(".circleGuideTitle")
    		.text("Marginal topic frequency");
    	d3.select(".circleGuideLabelBig")
    		.text(defaultLabelBig);
    	d3.select(".circleGuideLabelSmall")
    		.attr("y", mdsheight + 2*rSmall)
    		.text(defaultLabelSmall);
    	d3.select(".circleGuideSmall")
    		.attr("r", rSmall)
    		.attr("cy", mdsheight + rSmall);
    	d3.select(".lineGuideSmall")
    		.attr("y1", mdsheight + 2*rSmall)
    		.attr("y2", mdsheight + 2*rSmall);
    	
		}
	});

}