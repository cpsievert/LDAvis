// Create, dispatch event
// Taken from http://stackoverflow.com/questions/21924004/why-doesnt-jquery-fire-the-input-event-on-val-input-set
// Creating an artificial event to trigger the topic change when the button is clicked
function eventDispatcher(el){
    var evt = new UIEvent('input');
    el.dispatchEvent(evt)
}

// function to increment/decrement topic from click on button:
// I'm defining this here because it needs to be loaded before the top div:
function changeTopic(obj, K) {
    var contentObj = document.getElementById("lda-topic");
    var value = parseInt(contentObj.value);
    if (obj.id == "topicdown") {
	   value--;
    }
    if (obj.id == "topicup") {
	   value++;
    }
    if (obj.id == "topicclear") {
	   value = 0;
    }
    value = Math.max(0, Math.min(K, value));
    document.getElementById("lda-topic").value = value;
    eventDispatcher(document.getElementById("lda-topic"));
}


LDAvis = function(to_select, json_file) {

    // This section sets up the logic for event handling
    var current_clicked = {
        what: "nothing",
        element: undefined
    },
    current_hover = {
        what: "nothing",
        element: undefined
    },
    old_winning_state = {
        what: "nothing",
        element: undefined
    },
    vis_state = {
        lambda: 1,
        topic: 0,
        term: ""
    };

    // Set up a few 'global' variables to hold the data:
    var K, // number of topics 
    R, // number of terms to display in bar chart
    mdsData, // (x,y) locations and topic proportions
    mdsData3, // topic proportions for all terms in the viz
    lamData, // all terms that are among the top-R most relevant for all topics, lambda values
    lambda = {
        old: 1,
        current: 1
    },
    color1 = "#1f77b4", // baseline color for default topic circles and overall term frequencies
    color2 = "#d62728"; // 'highlight' color for selected topics and term-topic frequencies

    // Set the duration of each half of the transition:
    var duration = 750;

    // Set global margins used for everything
    var margin = {
        top: 30,
        right: 30,
        bottom: 70,
        left: 30
    },
    mdswidth = 530,
    mdsheight = 530,
    barwidth = 530,
    barheight = 530,
    termwidth = 90, // width to add between two panels to display terms
    mdsarea = mdsheight * mdswidth;

    // a circle with this radius would be equal in area to the scatterplot
    //var rTotal = Math.sqrt(mdsarea / Math.PI);
    // controls how big the maximum circle can be
    //var rMax = rTotal / 5;  // for mdswidth and mdsheight = 530, rMax = 59.8
    var rMax = 60;  // just hard code it for now; doesn't depend on data, only on mds width and height:

    // proportion of area of MDS plot to which the sum of default topic circle areas is set
    var circle_prop = 0.25;
    var word_prop = 0.25;

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
    var termID = visID + "-term";

    //////////////////////////////////////////////////////////////////////////////

    // sort array according to a specified object key name 
    // Note that default is decreasing sort, set decreasing = -1 for increasing
    // adpated from http://stackoverflow.com/questions/16648076/sort-array-on-key-value
    function fancysort(key_name, decreasing) {
        decreasing = (typeof decreasing === "undefined") ? 1 : decreasing;
        return function(a, b) {
            if (a[key_name] < b[key_name])
                return 1 * decreasing;
            if (a[key_name] > b[key_name])
                return -1 * decreasing;
            return 0;
        };
    }


    // The actual read-in of the data and main code:
    d3.json(json_file, function(error, data) {

        // set the number of topics to global variable K:
        K = data['mdsDat'].x.length;

        // R is the number of top relevant (or salient) words whose bars we display
        R = data['R'];

        // a (K x 5) matrix with columns x, y, topics, Freq, cluster (where x and y are locations for left panel)
        mdsData = [];
        for (var i = 0; i < K; i++) {
            var obj = {};
            for (var key in data['mdsDat']) {
                obj[key] = data['mdsDat'][key][i];
            }
            mdsData.push(obj);
        }

        // a huge matrix with 3 columns: Term, Topic, Freq, where Freq is all non-zero probabilities of topics given terms
        // for the terms that appear in the barcharts for this data
        mdsData3 = [];
        for (var i = 0; i < data['token.table'].Term.length; i++) {
            var obj = {};
            for (var key in data['token.table']) {
                obj[key] = data['token.table'][key][i];
            }
            mdsData3.push(obj);
        }

        // large data for the widths of bars in bar-charts. 6 columns: Term, logprob, loglift, Freq, Total, Category
        // Conatins all possible terms for topics in (1, 2, ..., k) and lambda in (0, 0.01, 0.02, ..., 1).
        lamData = [];
        for (var i = 0; i < data['tinfo'].Term.length; i++) {
            var obj = {};
            for (var key in data['tinfo']) {
                obj[key] = data['tinfo'][key][i];
            }
            lamData.push(obj);
        }

        // Create the topic input & lambda slider forms. Inspired from:
        // http://bl.ocks.org/d3noob/10632804
        // http://bl.ocks.org/d3noob/10633704
        init_forms(topicID, lambdaID, visID);

        // http://jsfiddle.net/AmanVirdi/hbP3y/
        // kenny look at link above to create custom 'spinner' for topic increment/decrement buttons

        // When the value of lambda changes, update the visualization
        d3.select(lambda_select)
            .on("mouseup", function() {
                // store the previous lambda value
                lambda.old = lambda.current;
                lambda.current = document.getElementById(lambdaID).value;
                vis_state.lambda = +this.value;
                // adjust the text on the range slider
                d3.select(lambda_select).property("value", vis_state.lambda);
                d3.select(lambda_select + "-value").text(vis_state.lambda);
                // transition the order of the bars
                var increased = lambda.old < vis_state.lambda;
                if (vis_state.topic > 0) reorder_bars(increased);
                // store the current lambda value
                state_save(true);
                document.getElementById(lambdaID).value = vis_state.lambda;
            });

        // When the topic input changes, update the visualization:
        d3.select(topic_select)
            .on("input", function() {
		//debugger;
                if (vis_state.topic > 0 && vis_state.topic != this.value) {
                    topic_off(document.getElementById(topicID + vis_state.topic));
                }
                vis_state.topic = this.value;
                topic_on(document.getElementById(topicID + vis_state.topic));
                state_save(true);
            });

        // create linear scaling to pixels (and add some padding on outer region of scatterplot)
        var xrange = d3.extent(mdsData, function(d) {
            return d.x;
        }); //d3.extent returns min and max of an array
        var xdiff = xrange[1] - xrange[0],
        xpad = 0.10;
        var xScale = d3.scale.linear()
            .range([0, mdswidth])
            .domain([xrange[0] - xpad * xdiff, xrange[1] + xpad * xdiff]);

        var yrange = d3.extent(mdsData, function(d) {
            return d.y;
        });
        var ydiff = yrange[1] - yrange[0],
        ypad = 0.10;
        var yScale = d3.scale.linear()
            .range([mdsheight, 0])
            .domain([yrange[0] - ypad * ydiff, yrange[1] + ypad * ydiff]);

        // Create new svg element (that will contain everything):
        var svg = d3.select(to_select).append("svg")
            .attr("width", mdswidth + barwidth + margin.left + termwidth + margin.right)
            .attr("height", mdsheight + 2 * margin.top + margin.bottom + 2 * rMax);

        // Create a group for the mds plot
        var mdsplot = svg.append("g")
            .attr("id", "leftpanel")
            .attr("class", "points")
            .attr("transform", "translate(" + margin.left + "," + 2 * margin.top + ")");

        mdsplot.append("line") // draw x-axis
            .attr("x1", 0)
            .attr("x2", mdswidth)
            .attr("y1", mdsheight / 2)
            .attr("y2", mdsheight / 2)
            .attr("stroke", "gray")
            .attr("opacity", 0.3);
	mdsplot.append("text") // label axis
	    .attr("x", 0)
	    .attr("y", mdsheight/2 - 5)
	    .text("PC1")
	    .attr("fill", "gray");

        mdsplot.append("line") // draw y-axis
            .attr("x1", mdswidth / 2)
            .attr("x2", mdswidth / 2)
            .attr("y1", 0)
            .attr("y2", mdsheight)
            .attr("stroke", "gray")
            .attr("opacity", 0.3);
	mdsplot.append("text") // label axis
	    .attr("x", mdswidth/2 + 5)
	    .attr("y", 7)
	    .text("PC2")
	    .attr("fill", "gray");

	// new definitions based on fixing the sum of the areas of the default topic circles:
	var newSmall = Math.sqrt(0.02*mdsarea*circle_prop/Math.PI);
	var newMedium = Math.sqrt(0.05*mdsarea*circle_prop/Math.PI);
	var newLarge = Math.sqrt(0.10*mdsarea*circle_prop/Math.PI);
	var cx = 10 + newLarge,
        cx2 = cx + 1.5 * newLarge;
	
        // circle guide inspired from
        // http://www.nytimes.com/interactive/2012/02/13/us/politics/2013-budget-proposal-graphic.html?_r=0
        circleGuide = function(rSize, size) {
            d3.select("#leftpanel").append("circle")
                .attr('class', "circleGuide" + size)
                .attr('r', rSize)
                .attr('cx', cx)
                .attr('cy', mdsheight + rSize)
                .style('fill', 'none')
                .style('stroke-dasharray', '2 2')
                .style('stroke', '#999');
            d3.select("#leftpanel").append("line")
                .attr('class', "lineGuide" + size)
                .attr("x1", cx)
                .attr("x2", cx2)
                .attr("y1", mdsheight + 2 * rSize)
                .attr("y2", mdsheight + 2 * rSize)
                .style("stroke", "gray")
                .style("opacity", 0.3);
        }

        circleGuide(newSmall, "Small");
        circleGuide(newMedium, "Medium");
        circleGuide(newLarge, "Large");

        var defaultLabelSmall = "2%";
        var defaultLabelMedium = "5%";
        var defaultLabelLarge = "10%";

        d3.select("#leftpanel").append("text")
            .attr("x", 10)
            .attr("y", mdsheight - 10)
            .attr('class', "circleGuideTitle")
            .style("text-anchor", "left")
            .style("font-weight", "bold")
            .text("Marginal topic distribtion");
        d3.select("#leftpanel").append("text")
            .attr("x", cx2 + 10)
            .attr("y", mdsheight + 2 * newSmall)
            .attr('class', "circleGuideLabelSmall")
            .style("text-anchor", "start")
            .text(defaultLabelSmall);
        d3.select("#leftpanel").append("text")
            .attr("x", cx2 + 10)
            .attr("y", mdsheight + 2 * newMedium)
            .attr('class', "circleGuideLabelMedium")
            .style("text-anchor", "start")
            .text(defaultLabelMedium);
        d3.select("#leftpanel").append("text")
            .attr("x", cx2 + 10)
            .attr("y", mdsheight + 2 * newLarge)
            .attr('class', "circleGuideLabelLarge")
            .style("text-anchor", "start")
            .text(defaultLabelLarge);

        // bind mdsData to the points in the left panel:
        var points = mdsplot.selectAll("points")
            .data(mdsData)
            .enter();

        // text to indicate topic
        points.append("text")
            .attr("class", "txt")
            .attr("x", function(d) {
                return (xScale(+d.x));
            })
            .attr("y", function(d) {
                return (yScale(+d.y) + 4);
            })
            .attr("stroke", "black")
            .attr("opacity", 1)
            .style("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", 100)
            .text(function(d) {
                return d.topics;
            });

        // draw circles
        points.append("circle")
            .attr("class", "dot")
            .style("opacity", 0.2)
            .style("fill", color1)
            .attr("r", function(d) {
                //return (rScaleMargin(+d.Freq));
                return (Math.sqrt((d.Freq/100)*mdswidth*mdsheight*circle_prop/Math.PI));
            })
            .attr("cx", function(d) {
                return (xScale(+d.x));
            })
            .attr("cy", function(d) {
                return (yScale(+d.y));
            })
            .attr("stroke", "black")
            .attr("id", function(d) {
                return (topicID + d.topics)
            })
            .on("mouseover", function(d) {
                var old_topic = topicID + vis_state.topic;
                if (vis_state.topic > 0 && old_topic != this.id) {
                    topic_off(document.getElementById(old_topic));
                }
                topic_on(this);
            })
            .on("click", function(d) {
                var old_topic = topicID + vis_state.topic;
                if (vis_state.topic > 0 && old_topic != this.id) {
                    topic_off(document.getElementById(old_topic));
                }
                // make sure topic input box value and fragment reflects clicked selection
                document.getElementById(topicID).value = vis_state.topic = d.topics;
                state_save(true);
                topic_on(this);
            })
            .on("mouseout", function(d) {
                if (vis_state.topic != d.topics) topic_off(this);
                if (vis_state.topic > 0) topic_on(document.getElementById(topicID + vis_state.topic));
            });

        // Add the clear selection clickable text:
        // svg.append("text")
        //     .text("Click to clear selection")
        //     .attr("x", 40)
        //     .attr("y", 20)
        //     .attr("cursor", "pointer")
        //     .on("click", function() {
        //         state_reset();
        //     });

        // Add the clear selection clickable text:
        svg.append("text")
            .text("Intertopic Distance Map (via multidimensional scaling)")
            .attr("x", mdswidth/2 + margin.left)
            .attr("y", 30)
	    .style("font-size", "16px")
	    .style("text-anchor", "middle");
            // .attr("cursor", "pointer")
            // .on("click", function() {
            //     state_reset();
            // });

        // establish layout and vars for bar chart
        var barDefault2 = lamData.filter(function(d) {
            return d.Category == "Default"
        });

        var y = d3.scale.ordinal()
            .domain(barDefault2.map(function(d) {
                return d.Term;
            }))
            .rangeRoundBands([0, barheight], 0.15);
        var x = d3.scale.linear()
            .domain([1, d3.max(barDefault2, function(d) {
                return d.Total;
            })])
            .range([0, barwidth])
            .nice();
        var yAxis = d3.svg.axis()
            .scale(y);

        // Add a group for the bar chart
        var chart = svg.append("g")
            .attr("transform", "translate(" + +(mdswidth + margin.left + termwidth) + "," + 2 * margin.top + ")")
            .attr("id", "bar-freqs");

        // bar chart legend/guide:
        var barguide = {"width": 100, "height": 15};
        d3.select("#bar-freqs").append("rect")
            .attr("x", 0)
            .attr("y", mdsheight + 10)
            .attr("height", barguide.height)
            .attr("width", barguide.width)
            .style("fill", color1)
            .attr("opacity", 0.4);
        d3.select("#bar-freqs").append("text")
            .attr("x", barguide.width + 5)
            .attr("y", mdsheight + 10 + barguide.height/2)
            .style("dominant-baseline", "middle")
            .text("Overall term frequency");

        d3.select("#bar-freqs").append("rect")
            .attr("x", 0)
            .attr("y", mdsheight + 10 + barguide.height + 5)
            .attr("height", barguide.height)
            .attr("width", barguide.width/2)
            .style("fill", color2)
            .attr("opacity", 0.8);
        d3.select("#bar-freqs").append("text")
            .attr("x", barguide.width/2 + 5)
            .attr("y", mdsheight + 10 + (3/2)*barguide.height + 5)
            .style("dominant-baseline", "middle")
            .text("Term frequency within the selected topic");

	// footnotes:
        d3.select("#bar-freqs")
            .append("a")
            .attr("xlink:href", "http://vis.stanford.edu/files/2012-Termite-AVI.pdf")
            .attr("target", "_blank")
            .append("text")
            .attr("x", 0)
            .attr("y", mdsheight + 10 + (6/2)*barguide.height + 5)
            .style("dominant-baseline", "middle")
            .text("1. saliency(term w) = frequency(w) * [sum_t p(t | w) * log(p(t | w)/p(t))]; see Chuang et. al (2012)");
        d3.select("#bar-freqs")
            .append("a")
            .attr("xlink:href", "http://nlp.stanford.edu/events/illvi2014/papers/sievert-illvi2014.pdf")
            .attr("target", "_blank")
            .append("text")
            .attr("x", 0)
            .attr("y", mdsheight + 10 + (8/2)*barguide.height + 5)
            .style("dominant-baseline", "middle")
            .text("2. relevance(term w | topic t) = lambda * p(w | t) + (1 - lambda) * p(w | t)/p(w); see Sievert & Shirley (2013)");

        // Bind 'default' data to 'default' bar chart
        var basebars = chart.selectAll(".bar-totals")
            .data(barDefault2)
            .enter();

        // Draw the gray background bars defining the overall frequency of each word
        basebars
            .append("rect")
            .attr("class", "bar-totals")
            .attr("x", 0)
            .attr("y", function(d) {
                return y(d.Term);
            })
            .attr("height", y.rangeBand())
            .attr("width", function(d) {
                return x(d.Total);
            })
            .style("fill", color1)
            .attr("opacity", 0.4);

        // Add word labels to the side of each bar
        basebars
            .append("text")
            .attr("x", -5)
            .attr("class", "terms")
            .attr("y", function(d) {
                return y(d.Term) + 12;
            })
            .attr("cursor", "pointer")
            .attr("id", function(d) {
                return (termID + d.Term)
            })
            .style("text-anchor", "end") // right align text - use 'middle' for center alignment
            .text(function(d) {
                return d.Term;
            })
            .on("mouseover", function(d) {
                if (vis_state.term != "" && vis_state.term != this.innerHTML) {
                    term_off(document.getElementById(termID + vis_state.term));
                }
                vis_state.term = this.innerHTML;
                term_on(this);
                state_save(true);
            })
        // .on("click", function(d) {
        // 	var old_term = termID + vis_state.term;
        // 	if (vis_state.term != "" && old_term != this.id) {
        // 	    term_off(document.getElementById(old_term));
        // 	}
        // 	vis_state.term = d.Term;
        // 	state_save(true);
        // 	term_on(this);
        // 	debugger;
        // })
            .on("mouseout", function(d) {
                vis_state.term = "";
                term_off(this);
                state_save(true);
                //if (vis_state.term != d.Term) term_off(this);
                //if (vis_state.term != "") term_on(document.getElementById(termID + vis_state.term));
            });

        var title = chart.append("text")
            .attr("x", barwidth/2)
            .attr("y", -30)
            .attr("class", "bubble-tool") //  set class so we can remove it when highlight_off is called  
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .text("Top-" + R + " Most Salient Terms");
	       
        title.append("tspan")
	       .attr("baseline-shift", "super")	    
	       .attr("font-size", "12px")
	       .text("(1)");
	
        // barchart axis adapted from http://bl.ocks.org/mbostock/1166403
        var xAxis = d3.svg.axis().scale(x)
            .orient("top")
            .tickSize(-barheight)
            .tickSubdivide(true)
            .ticks(6);

        chart.attr("class", "xaxis")
            .call(xAxis);

	   // dynamically create the topic and lambda input forms at the top of the page:
        function init_forms(topicID, lambdaID, visID) {

            // create container div for topic and lambda input:
	       var inputDiv = document.createElement("div");
	       inputDiv.setAttribute("id", "top");

            // insert the input container just before the vis:
            var visDiv = document.getElementById(visID);
            document.body.insertBefore(inputDiv, visDiv);

	    // topic input container:
            var topicDiv = document.createElement("div");
	       topicDiv.setAttribute("style", "padding: 5px; background-color: #e8e8e8; position: absolute; top: 10px; left: 38px; height: 40px; width: " + mdswidth + "px; display: inline-block");
	       inputDiv.appendChild(topicDiv);

            var topicLabel = document.createElement("label");
            topicLabel.setAttribute("for", topicID);
            topicLabel.setAttribute("style", "font-family: sans-serif; font-size: 14px");
            topicLabel.innerHTML = "Selected Topic: <span id='" + topicID + "-value'></span>";
            topicDiv.appendChild(topicLabel);

            var topicInput = document.createElement("input");
            topicInput.setAttribute("style", "width: 50px");
            topicInput.type = "text";
            topicInput.min = "0";
            topicInput.max = K; // assumes the data has already been read in
            topicInput.step = "1";
            topicInput.value = "0"; // a value of 0 indicates no topic is selected
            topicInput.id = topicID;
            topicDiv.appendChild(topicInput);

 	    var topicDown = document.createElement("button");
	    topicDown.id = "topicdown";
	    topicDown.setAttribute("style", "margin-left: 5px");
	    topicDown.setAttribute("onclick", "changeTopic(this, " + K + ");");
	    topicDown.innerHTML = "Previous Topic";
            topicDiv.appendChild(topicDown);

	    var topicUp = document.createElement("button");
	    topicUp.id = "topicup";
	    topicUp.setAttribute("style", "margin-left: 5px");
	    topicUp.setAttribute("onclick", "changeTopic(this, " + K + ");");
	    topicUp.innerHTML = "Next Topic";
            topicDiv.appendChild(topicUp);

	    var topicClear = document.createElement("button");
	    topicClear.id = "topicclear";
	    topicClear.setAttribute("style", "margin-left: 5px");
	    topicClear.setAttribute("onclick", "changeTopic(this, " + K + ");");
	    topicClear.innerHTML = "Clear Topic";
            topicDiv.appendChild(topicClear);

           // lambda inputs
    	    var lambdaDivLeft = 8 + mdswidth + margin.left + termwidth;
    	    var lambdaDivWidth = barwidth;
    	    var lambdaDiv = document.createElement("div");
    	    lambdaDiv.setAttribute("id", "lambdaInput");
    	    lambdaDiv.setAttribute("style", "padding: 5px; background-color: #e8e8e8; position: absolute; top: 10px; left: " + lambdaDivLeft + "px; height: 40px; width: " + lambdaDivWidth + "px");
    	    inputDiv.appendChild(lambdaDiv);

    	    var lambdaZero = document.createElement("div");
    	    lambdaZero.setAttribute("style", "padding: 5px; height: 20px; width: 220px; font-family: sans-serif; position: absolute; top: 0px; left: 0px;");
	    lambdaZero.setAttribute("id", "lambdaZero");
    	    lambdaDiv.appendChild(lambdaZero);
	    var xx = d3.select("#lambdaZero")
		.append("text")
		.attr("x", 0)
		.attr("y", 0)
		.style("font-size", "14px")
		.text("Slide to adjust relevance metric:");
	    var yy = d3.select("#lambdaZero")
		.append("text")
		.attr("x", 125)
		.attr("y", -5)
		.style("font-size", "10px")
		.style("position", "absolute")
		.text("(2)");
	    
            var lambdaLabel = document.createElement("label");
            lambdaLabel.setAttribute("for", lambdaID);
	    lambdaLabel.setAttribute("style", "height: 20px; width: 200px; position: absolute; top: 25px; left: 90px; font-family: sans-serif; font-size: 14px");
            lambdaLabel.innerHTML = "&#955 = <span id='" + lambdaID + "-value'>1</span>";
            lambdaDiv.appendChild(lambdaLabel);

    	    var sliderDiv = document.createElement("div");
    	    sliderDiv.setAttribute("id", "sliderdiv");
    	    sliderDiv.setAttribute("style", "padding: 5px; height: 40px; position: absolute; top:0px; left: 240px; width: 250px");
    	    lambdaDiv.appendChild(sliderDiv);

            var lambdaInput = document.createElement("input");
            lambdaInput.setAttribute("style", "width: 250px; margin: 0px");
            lambdaInput.type = "range";
            lambdaInput.min = 0;
            lambdaInput.max = 1;
            lambdaInput.step = 0.01;
            lambdaInput.value = 1;
            lambdaInput.id = lambdaID;
	    lambdaInput.setAttribute("list", "ticks"); // to enable automatic ticks (with no labels, see below)
            sliderDiv.appendChild(lambdaInput);

	    // Create the svg to contain the slider scale:
	    var scaleContainer = d3.select("#sliderdiv").append("svg")
		.attr("width", 250)
		.attr("height", 25);

            var sliderScale = d3.scale.linear()
		.domain([0, 1])
		.range([7.5, 242.5])  // trimmed by 7.5px on each side to match the input type=range slider:
		.nice();

            // adapted from http://bl.ocks.org/mbostock/1166403
            var sliderAxis = d3.svg.axis()
		.scale(sliderScale)
		.orient("bottom")
		.tickSize(10)
		.tickSubdivide(true)
		.ticks(6);

	    // group to contain the elements of the slider axis:
	    var sliderAxisGroup = scaleContainer.append("g")
		.attr("class", "slideraxis")
		.call(sliderAxis);
	    
	    // Another strategy for tick marks on the slider; simpler, but not labels
	    // var sliderTicks = document.createElement("datalist");
	    // sliderTicks.setAttribute("id", "ticks");
	    // for (var tick = 0; tick <= 10; tick++) {
	    // 	var tickOption = document.createElement("option");
	    // 	//tickOption.value = tick/10;
	    // 	tickOption.innerHTML = tick/10;
	    // 	sliderTicks.appendChild(tickOption);
	    // }
            // append the forms to the containers
	    //lambdaDiv.appendChild(sliderTicks);

        }

        // function to re-order the bars (gray and red), and terms:
        function reorder_bars(increase) {
            // grab the bar-chart data for this topic only:
            var dat2 = lamData.filter(function(d) {
                return d.Category == "Topic" + vis_state.topic
            });
            // define relevance:
            for (var i = 0; i < dat2.length; i++) {
                dat2[i].relevance = vis_state.lambda * dat2[i].logprob +
                    (1 - vis_state.lambda) * dat2[i].loglift;
            }

            // sort by relevance:
            dat2.sort(fancysort("relevance"));

            // truncate to the top R tokens:
            var dat3 = dat2.slice(0, R);

            var y = d3.scale.ordinal()
                .domain(dat3.map(function(d) {
                    return d.Term;
                }))
                .rangeRoundBands([0, barheight], 0.15);
            var x = d3.scale.linear()
                .domain([1, d3.max(dat3, function(d) {
                    return d.Total;
                })])
                .range([0, barwidth])
                .nice();

            // Change Total Frequency bars
            var graybars = d3.select("#bar-freqs")
                .selectAll(".bar-totals")
                .data(dat3, function(d) {
                    return d.Term;
                });

            // Change word labels
            var labels = d3.select("#bar-freqs")
                .selectAll(".terms")
                .data(dat3, function(d) {
                    return d.Term;
                });

            // Create red bars (drawn over the gray ones) to signify the frequency under the selected topic
            var redbars = d3.select("#bar-freqs")
                .selectAll(".overlay")
                .data(dat3, function(d) {
                    return d.Term;
                });

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
                .attr("y", function(d) {
                    return y(d.Term) + barheight + margin.bottom + 2 * rMax;
                })
                .attr("height", y.rangeBand())
                .style("fill", color1)
                .attr("opacity", 0.4);

            var labelsEnter = labels.enter()
                .append("text")
                .attr("x", -5)
                .attr("class", "terms")
                .attr("y", function(d) {
                    return y(d.Term) + 12 + barheight + margin.bottom + 2 * rMax;
                })
                .attr("cursor", "pointer")
                .style("text-anchor", "end")
                .attr("id", function(d) {
                    return (termID + d.Term)
                })
                .text(function(d) {
                    return d.Term;
                })
                .on("mouseover", function(d) {
                    var old_term = termID + vis_state.term;
                    if (vis_state.term != "" && old_term != this.id) {
                        term_off(document.getElementById(old_term));
                    }
                    term_on(this);
                })
            // .on("click", function(d) {
            //     var old_term = termID + vis_state.term;
            //     if (vis_state.term != "" && old_term != this.id) {
            // 	term_off(document.getElementById(old_term));
            //     }
            //     vis_state.term = d.Term;
            //     state_save(true);
            //     term_on(this);
            // })
                .on("mouseout", function(d) {
                    if (vis_state.term != d.Term) term_off(this);
                    if (vis_state.term != "") term_on(document.getElementById(termID + vis_state.term));
                });

            var redbarsEnter = redbars.enter().append("rect")
                .attr("class", "overlay")
                .attr("x", 0)
                .attr("y", function(d) {
                    return y(d.Term) + barheight + margin.bottom + 2 * rMax;
                })
                .attr("height", y.rangeBand())
                .style("fill", color2)
                .attr("opacity", 0.8);


            if (increase) {
                graybarsEnter
                    .attr("width", function(d) {
                        return x(d.Total);
                    })
                    .transition().duration(duration)
                    .delay(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    });
                labelsEnter
                    .transition().duration(duration)
                    .delay(duration)
                    .attr("y", function(d) {
                        return y(d.Term) + 12;
                    });
                redbarsEnter
                    .attr("width", function(d) {
                        return x(d.Freq);
                    })
                    .transition().duration(duration)
                    .delay(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    });

                graybars.transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Total);
                    })
                    .transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    });
                labels.transition().duration(duration)
                    .delay(duration)
                    .attr("y", function(d) {
                        return y(d.Term) + 12;
                    });
                redbars.transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Freq);
                    })
                    .transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    });

                // Transition exiting rectangles to the bottom of the barchart:
                graybars.exit()
                    .transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Total);
                    })
                    .transition().duration(duration)
                    .attr("y", function(d, i) {
                        return barheight + margin.bottom + 6 + i * 18;
                    })
                    .remove();
                labels.exit()
                    .transition().duration(duration)
                    .delay(duration)
                    .attr("y", function(d, i) {
                        return barheight + margin.bottom + 18 + i * 18;
                    })
                    .remove();
                redbars.exit()
                    .transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Freq);
                    })
                    .transition().duration(duration)
                    .attr("y", function(d, i) {
                        return barheight + margin.bottom + 6 + i * 18;
                    })
                    .remove();
                // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
                newaxis.transition().duration(duration)
                    .call(xAxis)
                    .transition().duration(duration);
            } else {
                graybarsEnter
                    .attr("width", 100) // FIXME by looking up old width of these bars
                    .transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    })
                    .transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Total);
                    });
                labelsEnter
                    .transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term) + 12;
                    });
                redbarsEnter
                    .attr("width", 50) // FIXME by looking up old width of these bars
                    .transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    })
                    .transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Freq);
                    });

                graybars.transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    })
                    .transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Total);
                    });
                labels.transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term) + 12;
                    });
                redbars.transition().duration(duration)
                    .attr("y", function(d) {
                        return y(d.Term);
                    })
                    .transition().duration(duration)
                    .attr("width", function(d) {
                        return x(d.Freq);
                    });

                // Transition exiting rectangles to the bottom of the barchart:
                graybars.exit()
                    .transition().duration(duration)
                    .attr("y", function(d, i) {
                        return barheight + margin.bottom + 6 + i * 18 + 2 * rMax;
                    })
                    .remove();
                labels.exit()
                    .transition().duration(duration)
                    .attr("y", function(d, i) {
                        return barheight + margin.bottom + 18 + i * 18 + 2 * rMax;
                    })
                    .remove();
                redbars.exit()
                    .transition().duration(duration)
                    .attr("y", function(d, i) {
                        return barheight + margin.bottom + 6 + i * 18 + 2 * rMax;
                    })
                    .remove();

                // https://github.com/mbostock/d3/wiki/Transitions#wiki-d3_ease
                newaxis.transition().duration(duration)
                    .transition().duration(duration)
                    .call(xAxis);
            }
        }

        //////////////////////////////////////////////////////////////////////////////

        // function to update bar chart when a topic is selected
        // the circle argument should be the appropriate circle element
        function topic_on(circle) {
            if (circle == null) return null;
            
	    // grab data bound to this element
            var d = circle.__data__
            var Freq = Math.round(d.Freq * 10) / 10,
            topics = d.topics;
            
	    // change opacity and fill of the selected circle
            circle.style.opacity = highlight_opacity;
            circle.style.fill = color2;
            
	    // Remove 'old' bar chart title
            var text = d3.select(".bubble-tool");
            text.remove();
            
	    // append text with info relevant to topic of interest
            d3.select("#bar-freqs")
		.append("text")
		.attr("x", barwidth/2)
		.attr("y", -30)
		.attr("class", "bubble-tool") //  set class so we can remove it when highlight_off is called  
		.style("text-anchor", "middle")
		.style("font-size", "16px")
		//.text(Freq + "% of tokens come from topic " + topics);
		.text("Top-" + R + " Most Relevant Terms for Topic " + topics);
	    
            // grab the bar-chart data for this topic only:
            var dat2 = lamData.filter(function(d) {
                return d.Category == "Topic" + topics
            });
	    
            // define relevance:
            for (var i = 0; i < dat2.length; i++) {
                dat2[i].relevance = lambda.current * dat2[i].logprob +
                    (1 - lambda.current) * dat2[i].loglift;
            }
	    
            // sort by relevance:
            dat2.sort(fancysort("relevance"));
	    
            // truncate to the top R tokens:
            var dat3 = dat2.slice(0, R);

            // scale the bars to the top R terms:
            var y = d3.scale.ordinal()
                .domain(dat3.map(function(d) {
                    return d.Term;
                }))
                .rangeRoundBands([0, barheight], 0.15);
            var x = d3.scale.linear()
                .domain([1, d3.max(dat3, function(d) {
                    return d.Total;
                })])
                .range([0, barwidth])
                .nice();

            // remove the red bars if there are any:
            d3.selectAll(".overlay").remove();

            // Change Total Frequency bars
            d3.selectAll(".bar-totals")
                .data(dat3)
                .attr("x", 0)
                .attr("y", function(d) {
                    return y(d.Term);
                })
                .attr("height", y.rangeBand())
                .attr("width", function(d) {
                    return x(d.Total);
                })
                .style("fill", color1)
                .attr("opacity", 0.4);

            // Change word labels
            d3.selectAll(".terms")
                .data(dat3)
                .attr("x", -5)
                .attr("y", function(d) {
                    return y(d.Term) + 12;
                })
                .attr("id", function(d) {
                    return (termID + d.Term)
                })
                .style("text-anchor", "end") // right align text - use 'middle' for center alignment
                .text(function(d) {
                    return d.Term;
                });

            // Create red bars (drawn over the gray ones) to signify the frequency under the selected topic
            d3.select("#bar-freqs").selectAll(".overlay")
                .data(dat3)
                .enter()
                .append("rect")
                .attr("class", "overlay")
                .attr("x", 0)
                .attr("y", function(d) {
                    return y(d.Term);
                })
                .attr("height", y.rangeBand())
                .attr("width", function(d) {
                    return x(d.Freq);
                })
                .style("fill", color2)
                .attr("opacity", 0.8);

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
            if (circle == null) return circle;
            // go back to original opacity/fill
            circle.style.opacity = base_opacity;
            circle.style.fill = color1;

            // change the bar chart "title"
            // var title = chart.append("text")
	    // 	.attr("x", barwidth/2)
	    // 	.attr("y", -30)
	    // 	.attr("class", "bubble-tool") //  set class so we can remove it when highlight_off is called  
	    // 	.style("text-anchor", "middle")
	    // 	.style("font-size", "16px")
	    // 	.text("Top-" + R + " Most Salient Terms");
	    // title.append("tspan")
	    // 	.attr("baseline-shift", "super")	    
	    // 	.attr("font-size", 12)
	    // 	.text(1);

            var title = d3.selectAll(".bubble-tool")
		.text("Top-" + R + " Most Salient Terms");
	    title.append("tspan")
	     	.attr("baseline-shift", "super")	    
	     	.attr("font-size", 12)
	     	.text(1);

            // remove the red bars
            d3.selectAll(".overlay").remove();

            // go back to 'default' bar chart
            var dat2 = lamData.filter(function(d) {
                return d.Category == "Default"
            });

            var y = d3.scale.ordinal()
                .domain(dat2.map(function(d) {
                    return d.Term;
                }))
                .rangeRoundBands([0, barheight], 0.15);
            var x = d3.scale.linear()
                .domain([1, d3.max(dat2, function(d) {
                    return d.Total;
                })])
                .range([0, barwidth])
                .nice();

            // Change Total Frequency bars
            d3.selectAll(".bar-totals")
                .data(dat2)
                .attr("x", 0)
                .attr("y", function(d) {
                    return y(d.Term);
                })
                .attr("height", y.rangeBand())
                .attr("width", function(d) {
                    return x(d.Total);
                })
                .style("fill", color1)
                .attr("opacity", 0.4);

            //Change word labels
            d3.selectAll(".terms")
                .data(dat2)
                .attr("x", -5)
                .attr("y", function(d) {
                    return y(d.Term) + 12;
                })
                .style("text-anchor", "end") // right align text - use 'middle' for center alignment
                .text(function(d) {
                    return d.Term;
                });

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

        function term_on(term) {
            if (term == null) return null;
            term.style["font-weight"] = "bold";
            var d = term.__data__
            var Term = d.Term;
            var dat2 = mdsData3.filter(function(d2) {
                return d2.Term == Term
            });

            var k = dat2.length; // number of topics for this token with non-zero frequency

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
                .attr("r", function(d) {
                    //return (rScaleCond(d));
		    return (Math.sqrt(d*mdswidth*mdsheight*word_prop/Math.PI)); 
                });

            // re-bind mdsData so we can handle multiple selection
            d3.selectAll(".dot")
                .data(mdsData)

            // Change sizes of topic numbers:
            d3.selectAll(".txt")
                .data(size)
                .transition()
                .style("font-size", function(d) {
                    return +d;
                });

            // Alter the guide
            d3.select(".circleGuideTitle")
                .text("Conditional topic distribution given term = '" + term.innerHTML + "'");
            // Size of the big circle changes
            //d3.select(".circleGuideLabelBig")
            //.text("Total frequency (100% of occurences)");
            // Average size changes
            // var rAvg = rScaleCond(1 / K);
            // d3.select(".circleGuideLabelSmall")
            //     .attr("y", mdsheight + 2 * rAvg)
            //     .text("Average frequency (" + (100 * (1 / K)).toFixed(1) + "% of occurences)");
            // d3.select(".circleGuideSmall")
            //     .attr("r", rAvg)
            //     .attr("cy", mdsheight + rAvg);
            // d3.select(".lineGuideSmall")
            //     .attr("y1", mdsheight + 2 * rAvg)
            //     .attr("y2", mdsheight + 2 * rAvg);
        }

        function term_off(term) {
            if (term == null) return null;
            term.style["font-weight"] = "normal";

            d3.selectAll(".dot")
                .data(mdsData)
                .transition()
                .attr("r", function(d) {
                    //return (rScaleMargin(+d.Freq));
                    return (Math.sqrt((d.Freq/100)*mdswidth*mdsheight*circle_prop/Math.PI));
                });

            // Change sizes of topic numbers:
            d3.selectAll(".txt")
                .transition()
                .style("font-size", "11px");

            // Go back to the default guide
            d3.select(".circleGuideTitle")
                .text("Marginal topic distribution");
            d3.select(".circleGuideLabelLarge")
                .text(defaultLabelLarge);
            d3.select(".circleGuideLabelSmall")
                .attr("y", mdsheight + 2 * newSmall)
                .text(defaultLabelSmall);
            d3.select(".circleGuideSmall")
                .attr("r", newSmall)
                .attr("cy", mdsheight + newSmall);
            d3.select(".lineGuideSmall")
                .attr("y1", mdsheight + 2 * newSmall)
                .attr("y2", mdsheight + 2 * newSmall);
        }


        // serialize the visualization state using fragment identifiers -- http://en.wikipedia.org/wiki/Fragment_identifier
        // location.hash holds the address information
        var params = location.hash.split("&");
        vis_state.topic = params[0].split("=")[1];
        vis_state.lambda = params[1].split("=")[1];
        vis_state.term = params[2].split("=")[1];
        if (!isNaN(vis_state.topic)) topic_on(document.getElementById(topicID + vis_state.topic));
        var termElem = document.getElementById(termID + vis_state.term);
        if (termElem !== undefined) term_on(termElem);

        function state_url() {
            return location.origin + location.pathname + "#topic=" + vis_state.topic +
                "&lambda=" + vis_state.lambda + "&term=" + vis_state.term;
        }

        function state_save(replace) {
            if (replace)
                history.replaceState(vis_state, "Query", state_url());
            else
                history.pushState(vis_state, "Query", state_url());
        }

        function state_reset() {
            if (vis_state.topic > 0) {
                topic_off(document.getElementById(topicID + vis_state.topic));
            }
            if (vis_state.term != "") {
                term_off(document.getElementById(termID + vis_state.term));
            }
            vis_state.term = "";
            document.getElementById(topicID).value = vis_state.topic = 0;
            state_save(true);
        }

    });



}

