//WARNING: There are many improvements that could be made to this code. This is my first stab at d3js!
// Foremost, most of the code *could* be shortened via bunching repeated tasks into reusable functions 

//This section sets up the logic for event handling (thanks Carlos!)
var current_clicked = { what: "nothing", element: undefined, object: undefined },
    current_hover = { what: "nothing", element: undefined, object: undefined },
    old_winning_state = { what: "nothing", element: undefined, object: undefined };

function show_state()
{
    console.log(current_clicked, current_hover);
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
    } else
        winning_state = current_clicked;

    if (old_winning_state.element !== undefined)
        switch (old_winning_state.what) {
            case "nothing": throw new Error("internal error");
            case "cluster":
            cluster_off.call(old_winning_state.element, old_winning_state.object);
            break;
            case "topic":
            topic_off.call(old_winning_state.element, old_winning_state.object);
            break;
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

//global margins used for everything
var margin = {top: 30, right: 60, bottom: 30, left: 30},
    width = 1000,
    height = 1000,
    mdswidth = 550, 
    mdsheight = 550,
    barwidth = width - mdswidth - 2*(margin.left + margin.right), //width for histogram
    barheight = mdsheight;

//////////////////////////////////////////////////////////////////////////////
// Bind onto data that is passed from shiny
//var scatterOutputBinding = new Shiny.OutputBinding();
//  $.extend(scatterOutputBinding, {
//    find: function(scope) {
//      return $(scope).find('.shiny-scatter-output');
//    },
//    renderValue: function(el, data) {
    
// adapted from https://github.com/timelyportfolio/shiny-d3-plot/blob/master/graph.js
// idea is to turn an object of arrays into an array of objects
// this is a bit more sophisticated since you don't have to specify the object key names
// javascript...y u no have native way of doing such a thing??
// shiny...y u no support different structures of passing data??


d3.json("lda.json", function(error, data) {

      var k = data['mdsDat'].x.length // # of topics
      var mdsData = [];
      for (var i=0; i < k; i++)  { 
        var obj = {};
        for (var key in data['mdsDat']){
          obj[key] = data['mdsDat'][key][i];
        }
        mdsData.push( obj );
      }

      var mdsData2 = [];
      for (var i=0; i < data['mdsDat2'].Term.length; i++)  { 
        var obj = {};
        for (var key in data['mdsDat2']){
          obj[key] = data['mdsDat2'][key][i];
        }
        mdsData2.push( obj );
      }

      var barData = [];
      for (var i=0; i < data['barDat'].Term.length; i++)  { 
        var obj = {};
        for (var key in data['barDat']){
          obj[key] = data['barDat'][key][i];
        }
        barData.push( obj );
      }

      var docData = [];
      for (var i=0; i<data['docDat'].Category.length; i++)  { 
        var obj = {};
        for (var key in data['docDat']){
          obj[key] = data['docDat'][key][i];
        }
        docData.push( obj );
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

      //remove the old graph
      //var svg = d3.select(el).select("svg");      
      //svg.remove();
      
      //$(el).html("");

      //Create NEW svg element (that will contain everything)
      var svg = d3.select("#lda").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")    //This group is just for the mds plot
        .attr("class", "points")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")"); 

      svg.append("g").attr("id", "voronoi-group");
      svg.append("g").attr("id", "bar-freqs")
        .attr("transform", "translate(" + +(mdswidth + 2*margin.left) + "," + margin.top + ")"); //place bar chart to the right of the mds plot;

      svg.append("text")
            .text("Clear selection")
            .attr("x", 10)
            .attr("y", -10)
            .attr("cursor", "pointer")
            .on("click", function() {
                reset_state();
            });
      
      svg.append("line") //draw x-axis
        .attr("x1", 0)
        .attr("x2", mdswidth)
        .attr("y1", mdsheight/2) 
        .attr("y2", mdsheight/2)
        .attr("stroke", "gray")
        .attr("opacity", 0.3);

      svg.append("line") //draw y-axis
        .attr("x1", mdswidth/2) 
        .attr("x2", mdswidth/2)
        .attr("y1", 0)
        .attr("y2", mdsheight)
        .attr("stroke", "gray")
        .attr("opacity", 0.3);


      var points = svg.selectAll("points")
        .data(mdsData)
        .enter();

      points   //text to indicate topic
        .append("text")
        .attr("class", "txt")
        .attr("x", function(d) { return(xScale(+d.x)); })
        .attr("y", function(d) { return(yScale(+d.y)+4); })
        .text(function(d) { return d.topics; })
        .attr("text-anchor", "middle")        
        .attr("stroke", "black")
        .attr("opacity", 1)
        .attr("font-size", 11)
        .attr("font-weight", 100);

        
      points  //draw circles
        .append("circle")
        .attr("class", "dot")
        .style("opacity", 0.3)
        .style("fill", function(d) { return color(d.cluster); })
        .attr("r", function(d) { return (200/k)*Math.sqrt(d.Freq) ; })  //circle sizes should get smaller as the # of topics increases
        .attr("cx", function(d) { return (xScale(+d.x)); })
        .attr("cy", function(d) { return (yScale(+d.y)); })
        .on("mouseover", function(d) {
            current_hover.element = this;
            current_hover.what = "topic";
            current_hover.object = d;
            update_drawing();
        })  //highlight circle and print the relevant proportion within circle
        .on("click", function(d) {
            current_clicked.element = this;
            current_clicked.what = "topic";
            current_clicked.object = d;
            update_drawing();
        })
        .on("mouseout", function(d) {
            current_hover.element = undefined;
            current_hover.what = "nothing";
            current_hover.object = undefined;
            update_drawing();
        });

      //Draw voronio map around cluster centers (if # of clusters > 1)
      // adapted from http://bl.ocks.org/mbostock/4237768  
      if (data['centers'].x.length > 1) {
        var centers = [];
        for (var i=0; i<data['centers'].x.length; i++)  { 
          centers[i] = [ xScale(data['centers'].x[i]), yScale(data['centers'].y[i]) ];
        }
             
        var voronoi = d3.geom.voronoi()
              .clipExtent([[0, 0], [mdswidth, mdsheight]])
              .x(function(d) { return(xScale(+d.x)); })
              .y(function(d) { return(yScale(+d.y)); });
                //.clipExtent([[margin.left, margin.top], [mdswidth - margin.right, mdsheight - margin.bottom]]);

        var vdat = voronoi(mdsData);

        var cluster_paths = [];
        for (i=0; i<data['centers'].x.length; ++i) {
            cluster_paths[i] = "";
        }
        for (i=0; i<mdsData.length; ++i) {
            var cluster = Number(mdsData[i].cluster) - 1;
            cluster_paths[cluster] = cluster_paths[cluster] + "M" + vdat[i].join("L") + "Z";
        }
          
        svg.select("#voronoi-group")
            .selectAll("path")
            .data(cluster_paths)
            .enter().append("path")
            .style("fill", function(d, i) { return d3.rgb(color(String(i+1))).brighter(1.5); })
            // .style("stroke", function(d, i) { return d3.rgb(color(String(i+1))).brighter(1.5); })
            .style("fill-opacity", 0.5)
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
      
      //attach term-topic frequencies for access upon activating a word (this data will resize the bubbles)
      var mds = svg.selectAll("mds-data2")
          .data(mdsData2)
          .enter()
          .append("circle")
          .attr("class", "mds-data2");

      //establish layout and vars for bar chart
      var barDefault2 = barData.filter(function(d) { return d.Category == "Default" });
      //var barDefault2 = barDefault.sort(fancysort("Order"));

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
      var chart = svg
        .append("g")
        .attr("transform", "translate(" + +(mdswidth + 2*margin.left) + "," + margin.top + ")");

      //Bind all possible instances of bar chart so that we can access it upon interaction
      //IS THERE A WAY TO DO THIS WITHOUT CREATING A SHIT LOAD OF ELEMENTS?
      var chartDat = chart.selectAll(".bar-chart")
        .data(barData)
        .enter()
        .append("rect")
        .attr("class", "bar-chart")
        .style("display", "none");

      //Bind 'default' data to 'default' bar chart
      var basebars = chart.selectAll(".bar-totals")
        .data(barDefault2)
        .enter();
      
      //Draw the gray background bars defining the overall frequency of each word
      basebars    
        .append("rect")
        .attr("class", "bar-totals")
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")  
        .attr("opacity", 0.4);  

      //Add word labels to the top of each bar
      basebars
        .append("text")
        .attr("x", -5)
        .attr("class", "terms")
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
        .text(function(d) { return d.Term; })
        .on("mouseover", text_on)
        .on("mouseout", text_off);

    // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
                    .orient("top")
                    .tickSize(-barheight)
                    .tickSubdivide(true);

    chart
      .attr("class", "x axis")
      .call(xAxis);

    //Unbind any documents that may be bound already (necessary when user uploads new data)
    //d3.selectAll(".hidden-docs").remove();

    //Remove any existing documents
    //d3.selectAll(".topdocs").remove();
    //console.log(docData);
    //Bind all the document data to the document list (so they can be accessed upon topic click)
    //d3.select(".doc-list").selectAll("hidden-docs")
    //  .data(docData)
    //  .enter()
    //    .append("li")
    //    .attr("class", "hidden-docs")
    //    .style("display", "none");

});

//Shiny.outputBindings.register(scatterOutputBinding, 'cpsievert.scatterbinding');

function cluster_on(d) {
    
  // increase opacity of circle that has mouseover event:
  var circle = d3.select(this);
  circle
    .style("fill-opacity", 1); 
  var cluster = d;

  //filter the data bound to the mdsplot according to the clutser of interest
  var clustDat = d3.select("svg").selectAll(".dot").data().filter(function(d) { return d.cluster == cluster });

  var Freq = 0
  for (var i=0; i<clustDat.length; i++) {
      Freq = Freq + clustDat[i]['Freq'];
  }
  var Freq = Math.round(Freq)

  //append a 'title' to bar chart with data relevant to the cluster of interest
  d3.select("svg")
    .append("text")
    .attr("x", mdswidth + 2*margin.left + barwidth/2)             
    .attr("y", margin.top/2)
    .attr("text-anchor", "middle")
    .attr("class", "bubble-tool")       //set class so we can remove it when highlight_off is called  
    .style("font-size", "16px") 
    .style("text-decoration", "underline")  
    .text(Freq + "% of tokens fall under cluster " + cluster);

  var dat2 = d3.select("svg").selectAll(".bar-chart").data().filter(function(d) { return d.Category == "Cluster"+cluster });
  //var dat2 = dat.sort(fancysort("Order"));

  var y = d3.scale.ordinal()
              .domain(dat2.map(function(d) { return d.Term; }))
              .rangeRoundBands([0, barheight], 0.15);
  var x = d3.scale.linear()
              .domain([1, d3.max(dat2, function(d) { return d.Total; })])
              .range([0, barwidth])
              .nice();

  //Change Total Frequency bars
  d3.selectAll(".bar-totals")
    .data(dat2)
    .transition()
      .attr("x", 0)  
      .attr("y", function(d) { return y(d.Term); })
      .attr("height", y.rangeBand()) 
      .attr("width", function(d) { return x(d.Total); } )
      .style("fill", "gray")   
      .attr("opacity", 0.4);

  //Change word labels
  d3.selectAll(".terms")
    .data(dat2)
    .transition()
      .attr("x", -5)
      .attr("y", function(d) { return y(d.Term) + 12; })
      .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
      .text(function(d) { return d.Term; });

 //Create blue bars (drawn over the gray ones) to signify the frequency under the selected cluster
  d3.select("#bar-freqs").selectAll("overlay")  
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
                  .tickSubdivide(true);
    //redraw x-axis
    d3.selectAll(".x.axis")
      .attr("class", "x axis")
      .call(xAxis);

}


function topic_on(d) {
    var circle = d3.select(this);
    circle
      .style("opacity", 0.8); 
    var Freq = Math.round(d.Freq), topics = d.topics, cluster = d.cluster;

    //remove the title with cluster proportion
    var text = d3.select(".bubble-tool");
      text.remove();

    //append text with info relevant to topic of interest
    d3.select("svg")
      .append("text")
      .attr("x", mdswidth + 2*margin.left + barwidth/2)             
      .attr("y", margin.top/2)
      .attr("text-anchor", "middle")
      .attr("class", "bubble-tool")       //set class so we can remove it when highlight_off is called  
      .style("font-size", "16px") 
      .style("text-decoration", "underline")  
      .text(Freq + "% of tokens fall under topic " + topics);

    var dat2 = d3.select("svg").selectAll(".bar-chart").data().filter(function(d) { return d.Category == "Topic"+topics });
    //var dat2 = dat.sort(fancysort("Order"));

    var y = d3.scale.ordinal()
                .domain(dat2.map(function(d) { return d.Term; }))
                .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
                .domain([1, d3.max(dat2, function(d) { return d.Total; })])
                .range([0, barwidth])
                .nice();

    //remove the blue bars of cluster frequencies
    d3.selectAll(".overlay").remove();

     //Change Total Frequency bars
    d3.selectAll(".bar-totals")
      .data(dat2)
      .transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    //Change word labels
    d3.selectAll(".terms")
      .data(dat2)
      .transition()
        .attr("x", -5)
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
        .text(function(d) { return d.Term; });

    //Create red bars (drawn over the gray ones) to signify the frequency under the selected topic
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
                  .tickSubdivide(true);

    d3.selectAll(".x.axis")
      .attr("class", "x axis")
      .call(xAxis);

    //var docDat = d3.select(".doc-list").selectAll(".hidden-docs").data().filter(function(d) { return d.Category == "Topic"+topics });
    
    //remove any shown documents
    //d3.selectAll(".topdocs").remove();
    //console.log(docDat);
    //Draw the default documents
    //d3.select(".doc-list").selectAll("topdocs")
    //  .data(docDat)
    //  .enter()
    //    .append("li")
    //    .attr("class", "topdocs")
    //    .text(function(d) { return d.Document; });

}

function cluster_off() {
    var circle = d3.select(this);
    circle
      .style("fill-opacity", 0.5);  //go back to original opacity

    //remove the tool-tip
    d3.selectAll(".bubble-tool").remove();

    //remove the blue bars of cluster frequencies
    d3.selectAll(".overlay").remove();

    //remove any shown documents
    d3.selectAll(".topdocs").remove();

    //go back to 'default' bar chart
    //Is there a better way to do this with .exit()?
    var dat2 = d3.select("svg").selectAll(".bar-chart").data().filter(function(d) { return d.Category == "Default" });

    //var dat2 = dat.sort(fancysort("Order"));

    var y = d3.scale.ordinal()
                .domain(dat2.map(function(d) { return d.Term; }))
                .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
                .domain([1, d3.max(dat2, function(d) { return d.Total; })])
                .range([0, barwidth])
                .nice();

     //Change Total Frequency bars
    d3.selectAll(".bar-totals")
      .data(dat2)
      .transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    //Change word labels
    d3.selectAll(".terms")
      .data(dat2)
      .transition()
        .attr("x", -5)
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
        .text(function(d) { return d.Term; });

      // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
                  .orient("top")
                  .tickSize(-barheight)
                  .tickSubdivide(true);
    //redraw x-axis
    d3.selectAll(".x.axis")
      .attr("class", "x axis")
      .call(xAxis);
        
}

function topic_off() {
    var circle = d3.select(this);
    circle
      .style("opacity", 0.4);  //go back to original opacity

    //remove the tool-tip
    d3.selectAll(".bubble-tool").remove();

    //remove the blue bars of cluster frequencies
    d3.selectAll(".overlay").remove();

    //remove any shown documents
    d3.selectAll(".topdocs").remove();

    //go back to 'default' bar chart
    //Is there a better way to do this with .exit()?
    var dat2 = d3.select("svg").selectAll(".bar-chart").data().filter(function(d) { return d.Category == "Default" });
    //var dat2 = dat.sort(fancysort("Order"));

    var y = d3.scale.ordinal()
                .domain(dat2.map(function(d) { return d.Term; }))
                .rangeRoundBands([0, barheight], 0.15);
    var x = d3.scale.linear()
                .domain([1, d3.max(dat2, function(d) { return d.Total; })])
                .range([0, barwidth])
                .nice();

     //Change Total Frequency bars
    d3.selectAll(".bar-totals")
      .data(dat2)
      .transition()
        .attr("x", 0)  
        .attr("y", function(d) { return y(d.Term); })
        .attr("height", y.rangeBand()) 
        .attr("width", function(d) { return x(d.Total); } )
        .style("fill", "gray")   
        .attr("opacity", 0.4);

    //Change word labels
    d3.selectAll(".terms")
      .data(dat2)
      .transition()
        .attr("x", -5)
        .attr("y", function(d) { return y(d.Term) + 12; })
        .attr("text-anchor", "end") // right align text - use 'middle' for center alignment
        .text(function(d) { return d.Term; });

     // adapted from http://bl.ocks.org/mbostock/1166403
    var xAxis = d3.svg.axis().scale(x)
                  .orient("top")
                  .tickSize(-barheight)
                  .tickSubdivide(true);
    //redraw x-axis
    d3.selectAll(".x.axis")
      .attr("class", "x axis")
      .call(xAxis);
        
}

function text_on(d) {
    var text = d3.select(this);
      text
        .style("font-weight", "bold");

    var Term = d.Term;
    var dat2 = d3.select("svg").selectAll(".mds-data2").data().filter(function(d) { return d.Term == Term });
    //Make sure the topic ordering agrees with the ordering we used when the points were drawn
    //var dat2 = dat.sort(fancysort("Topic", decreasing = -1)); 
    // # of topics
    var k = dat2.length  

    //Change size of bubbles according to the word's distribution over topics
    d3.selectAll(".dot")
      .data(dat2)
      .transition()
        .attr("r", function(d) { return (200/k)*Math.sqrt(d.Freq); });
}

function text_off() {
    var text = d3.select(this);
      text
        .style("font-weight", null);

    var dat = d3.select("svg").selectAll(".txt").data();
    var k = dat.length  // # of topics

    d3.selectAll(".dot")
      .data(dat)
      .transition()
        .attr("r", function(d) { return (200/k)*Math.sqrt(d.Freq); });
}


// Set up the (possibly) stacked bar chart to the right of the mds plot
// Note that this is HEAVILY influenced by these links
// http://mbostock.github.io/d3/tutorial/bar-1.html
// http://bl.ocks.org/mbostock/1134768
// http://d3-generator.com/

// For the stacked bar chart data, D3 prefers an array of arrays of objects. WAT? 
// You could think of the first element of the outer array as containing data on the first level 
// of the histogram. Thus the first element of the inner array (within the first element of the outer array)
// should contain the y coordinates for the start and end of the first chunk of the first bar. 
// For a good example, see http://javadude.wordpress.com/2012/06/18/d3-js-most-simple-stack-layout-with-bars/
/*
      var stacked = [];
      for (var j=0; j < data['stackDat'].length; j++) {
        var innerStack =[];
        var dat = data['stackDat'][j]
        for (var i=0; i < dat.vocab.length; i++)  { 
          var obj = {};
          for (var key in dat){
            obj[key] = dat[key][i];
          }
          innerStack.push( obj );
        }
        stacked.push( innerStack );
      }

      console.log("LAYOUT---------------------------");
      var stacked = d3.layout.stack()(outerStack)
      console.log(stacked)
*/

