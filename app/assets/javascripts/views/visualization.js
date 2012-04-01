Views.Visualization = Backbone.Marionette.ItemView.extend({

  className: "viz",

  template: function() {
    return JST['visualization'];
  },

  onShow: function() {
    this.drawMap();
    this.slider = $("#slider").slider();
    
    var fake_data = [4, 8, 15, 16, 23, 30]; //placeholder data
    this.drawBarChart("food", fake_data);
    
    fake_data = [2, 77, 10, 6, 33, 30]; //placeholder data
    this.drawBarChart("etiology", fake_data);
    
    fake_data = [5, 2, 15, 64, 43, 3]; //placeholder data
    this.drawBarChart("location", fake_data);
  }, 

  drawMap: function() {
    var data; 
    var path = d3.geo.path();
    var svg = d3.select("#chart").append("svg");
   
    var counties = svg.append("g")
      .attr("id", "counties")
      .attr("class", "OrRd");

    var states = svg.append("g")
      .attr("id", "states");
        
    //counties
    d3.json('/api/counties', function(json) {
      counties.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("class", null)
        .attr("d", path);
    });

    //states
    d3.json('/api/states', function(json) {
      states.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("d", path);
    });

    //color counties with data
    d3.json('/api/unemployments', $.proxy(function(json) {
      data = json;
      counties.selectAll("path")
        .attr("class", quantize)
        .on("mouseover", function(d){
          d3.select(this).attr("class", "county-hover");
          var mouse_pos = d3.mouse(this);
          d3.select("#tooltip") //TODO: only show this if data
            .style("left", mouse_pos[0] + "px")
            .style("top", mouse_pos[1] + "px")
						.style("visibility", "visible")
	          .text("Test data: " + data[d.id]);
        })
        .on("mouseout", function(){
          d3.select(this).attr("class", data ? quantize : null);
          d3.select("#tooltip")
            .style("visibility", "hidden")
            .text("");
        });

      //TODO: Figure out data format - data must be ordered same as county paths
      //console.log(data);
      this.drawLegend(d3.min(data), d3.max(data));
    }, this));

    function quantize(d) {
      //TODO: Rewrite this method so it makes sense for my data! Can't just bucket everything above a max into the top category; decide on discrete or continuous colormap
      //console.log(~~(data[d.id]*9/12) + ", q" + Math.min(8, ~~(data[d.id] * 9 / 12)) + "-9");
      //Double bitwise NOT to convert float to integer. Came with the d3 example code.
      //See: http://rocha.la/JavaScript-bitwise-operators-in-practice for explanation
      return "q" + Math.min(8, ~~(data[d.id] * 9 / 12)) + "-9"; //uses .q1-9 to .q8-9 in colorbrewer.css for color scale
    }
  },


  drawLegend: function(min, max) {
    //legend
    var svg = d3.select("#chart svg");
    var width = svg.style("width").replace("px", "");
    var height = svg.style("height").replace("px", "");
    
    var legend = svg.append("g")
      .attr("id", "legend");

    //not sure whether to use gradient or discrete vals
    var gradient = legend.append("svg:defs")
      .append("svg:linearGradient")
      .attr("id", "gradient");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgb(254,232,200)"); //.q1-9, the lighest color on scale - see quantize()

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgb(127,0,0)"); //.q8-9, the darkest color on scale - see quantize()

    legend.append("rect")
      .attr("x", width - 225)
      .attr("y", height - 40)
      .attr("width", 200)
      .attr("height", 15)
      .style("fill", "url(#gradient)"); 
  
    //maps input values (domain) to output values (range)
    var x = d3.scale.linear()
      .domain([0, max])
      .range([0, width-max_labelWidth]);
    
    legend.selectAll(".rule")
      .data(x.ticks(2))
      .enter().append("text")
      .attr("class", "rule")
      .attr("x", x)
      .attr("y", 0)
      .attr("dy", -3)
      .attr("text-anchor", "middle")
      .text(String);
  },
 

  drawBarChart: function(chart_type, data) {
    var labels = ["label1 is a very long label", "label2", "label3", "label4", "label5", "label6"];
    var max_labelWidth = 125; 
    var width = d3.select("#" + chart_type).style("width").replace("px", "");
    var height = 150;
    var title_height = d3.select("#" + chart_type + " h4").style("height").replace("px", "");
    var rect_height = (height-title_height)/data.length;
  
    var chart_container = d3.select("#" + chart_type)
      .append("svg")
      .attr("class", "chart")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate("+ max_labelWidth +", 0)")
      .attr("width", function() { width - max_labelWidth});
   
    
    //maps input values (domain) to output values (range) for this particular chart
    var x = d3.scale.linear()
      .domain([0, d3.max(data)])
      .range([0, width-max_labelWidth]);
    
    //draw bars
    chart_container.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .style("fill", function() {
        if (chart_type == "food") { return "#666666" }
        if (chart_type == "location") { return "#333333" }
        if (chart_type == "etiology") { return "#000000" }
      })
      .attr("y", function(d, i) { return i * rect_height; })
      .attr("width", x)
      .attr("height", rect_height);
    
    //draw values
    chart_container.selectAll("text")
      .data(data)
      .enter()
      .append("text")
      .text(function(d) { return d; })
      .attr("x", x)
      .attr("y", function(d, i) { return (i * rect_height) + rect_height/2; })
      .attr("dx", -3) //padding
      .attr("dy", ".35em") //vertical-align
      .style("font-size", "8")
      .style("fill", "#FFFFFF")
      .attr("text-anchor", "end");

    //draw labels
    var label_container = d3.select("#" + chart_type)
      .select("svg")
      .append("g")
      .attr("transform", "translate("+ (max_labelWidth-5) +", 0)"); //-5 for padding
    
    label_container.selectAll("text")
      .data(labels)
      .enter()
      .append("text")
      .attr("class", "data-label")
      .text(function(d) { return d; })
      .style("font-size", "11")
      .attr("x", function(d, i) { return 0 - this.getComputedTextLength(); })
      .attr("y", function(d, i) { return (i * rect_height) + rect_height/2; });

  }
});