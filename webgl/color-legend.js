var colorLegend = window.colorLegend = {};

colorLegend.draw = function() {
    colorLegend.svg = d3.select("#right")
        .append("svg")
        .attr("id", "color-legend");

    var colorLegendX = 50;
    var colorLegendY = 25;
    var colorLegendWidth = 200;
    var colorLegendHeight = 10;
    var pixelToRatio = d3.scale.linear()
        .domain([0, colorLegendWidth])
        .range([0.95, 83.33]);
    var ratioToPixel = d3.scale.linear()
        .domain([0.95, 83.33])
        .range([0, colorLegendWidth]);
    var colorScale = d3.scale.linear() 
        .domain([0.95, 25, 83.33]) 
        .interpolate(d3.interpolateRgb) 
        .range(["#00994C", "yellow", "red"]); 

    var colorScaleData = [];
    for(var i=0; i<colorLegendWidth; i++) {
        colorScaleData.push(i);
    }

    colorLegend.svg.selectAll(".color-legend")
        .data(colorScaleData)
        .enter()
        .append("svg:rect")
        .attr("class", "color-legend")
        .attr("x", function(d) {
            return d + colorLegendX;
        })
        .attr("y", colorLegendY)
        .attr("width", 1)
        .attr("height", colorLegendHeight)
        .attr("fill", function(d) {
            return colorScale(pixelToRatio(d));
        });

    // draw reference points on color legend
    // solarMass / au Earth: 1
    var colorLegendTicks = [1, 83];
    colorLegend.svg.selectAll(".color-legend-reference-line")
        .data(colorLegendTicks)
        .enter()
        .append("svg:line")
        .attr("class", "color-legend-reference-line")
        .attr("x1", function(d) {
            return parseFloat(colorLegendX + ratioToPixel(d));
        })
        .attr("y1", colorLegendY - 10)
        .attr("x2", function(d) {
            return parseFloat(colorLegendX + ratioToPixel(d));
        })
        .attr("y2", colorLegendY);

    // label reference points
    colorLegend.svg.append("svg:text")
        .attr("class", "color-legend-reference-label")
        .attr("x", colorLegendX)
        .attr("y", colorLegendY - 15)
        .text("1");
    
    colorLegend.svg.append("svg:text")
        .attr("class", "color-legend-reference-label")
        .attr("x", colorLegendX + colorLegendWidth - 5)
        .attr("y", colorLegendY - 15)
        .text("83");

    // label units
    var colorLegendCaption = [
        "Estimated surface temperature represented",
        "as the ratio of stellar mass to distance from sun",
        "where Earth has the ratio 1"
    ]

    colorLegend.svg.selectAll(".color-legend-caption")
        .data(colorLegendCaption)
        .enter()
        .append("svg:text")
        .attr("class", "color-legend-caption")
        .attr("x", colorLegendX + colorLegendWidth)
        .attr("y", function(d, i) {
            return colorLegendY + colorLegendHeight + (i+1)*10;
        })
        .text(function(d) {
            return d;
        });
};
