var spaceD3 = window.spaceD3 = {};

spaceD3.drawCircles = function(data, cx, cy, cr, selector, classname) {
    // first clear
    svg.selectAll(selector).remove();

    // draw orbits for solar system planets
    var solarorbits = svg.selectAll(selector)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", classname);

    solarorbits.attr("cx", cx)
        .attr("cy", cy)
        .attr("r", cr);
}

spaceD3.highlightSelectedPlanetOrbit = function(x, h) {
    // draw neon vertical line at selected planet
    var selected = $('.ui-selected');
    if(!selected.exists()) return;

    var selectedId = selected.attr("id");
    if(selectedId=="Sun") {
        d3.selectAll(".selected-orbit").remove();
        return;
    }

    console.log(selectedId);

    var rf = function(d) {
        return x(d['au']);
    };

    // TODO: if selected orbit is not visible, then decrease distance as appropriate
    spaceD3.drawCircles([solarsystemData[selectedId]], 0, h/2, rf, ".selected-orbit", "selected-orbit");

}

spaceD3.drawScene = function() {
    var h = 400;
    var distanceMultiplier = $('#distance-multiplier-value').val();

    var x = d3.scale.linear()
        .domain([0, 770])
        .range([30, 770*distanceMultiplier]);

    var r = d3.scale.linear()
        .domain([0, 100000])
        .range([0, 30]);

    // draw orbits for extrasolar planets
    rf = function(d) {
        return x(parseFloat(d['pl_orbsmax']));
    };
    spaceD3.drawCircles(exoplanetData, 0, h/2, rf, ".exo-orbit", "exo-orbit");
    
    // draw solar orbits
    var xf, yf, rf;
    rf = function(d) {
        return x(d['au']);
    };
    spaceD3.drawCircles(solarData, 0, h/2, rf, ".solar-orbit", "solar-orbit");
    
    // draw the exoplanets
    xf = function(d) {
        var pd = x(parseFloat(d['pl_orbsmax']));
        return pd;
    };
    var kmEarthRadius = solarsystemData['Earth']['radiuse'];
    rf = function(d) {
        return r(parseFloat(d['pl_rade'])*kmEarthRadius);
    };
    spaceD3.drawCircles(exoplanetData, xf, h/2, rf, ".planet.extrasolar", "planet extrasolar");
    
    // Vertical line for selected planet
    spaceD3.highlightSelectedPlanetOrbit(x, h);
  
    // draw the solar system
    xf = function(d) {
        return x(d['au']);
    };
    rf = function(d) {
        return r(d['radiuse']);
    };
    spaceD3.drawCircles(solarData, xf, h/2, rf, ".planet.solar", "planet solar");

}

var svg;
var solarData;
spaceD3.start = function() {
    // Clean data for appropriate use with d3
    solarData = []
    for(planetName in solarsystemData) {
        solarData.push(solarsystemData[planetName]);
    }

    svg = d3.select("body")
        .append("svg")
        .attr("id", "space-d3");

    spaceD3.drawScene();
}
