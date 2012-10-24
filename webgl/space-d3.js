var spaceD3 = window.spaceD3 = {};

spaceD3.drawCircles = function(data, cx, cy, cr, cs, cf, selector, classname) {
    // first clear
    svg.selectAll(selector).remove();

    // draw orbits for solar system planets
    var circles = svg.selectAll(selector)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", classname)

    circles.attr("cx", cx)
        .attr("cy", cy)
        .attr("r", cr);

    if(cs) {
        circles.attr("stroke", cs);
    }
    
    if(cf) {
        circles.attr("fill", cf);
    }
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
    spaceD3.drawCircles([spaceD3.solarsystemData[selectedId]], 0, h/2, rf, null, null, ".selected-orbit", "selected-orbit");

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
    spaceD3.drawCircles(spaceD3.exoplanetData, 0, h/2, rf, null, null, ".exo-orbit", "exo-orbit");
    
    // draw solar orbits
    var xf, yf, rf;
    rf = function(d) {
        return x(d['au']);
    };
    spaceD3.drawCircles(spaceD3.solarData, 0, h/2, rf, null, null, ".solar-orbit", "solar-orbit");
    
    // draw the exoplanets
    xf = function(d) {
        var pd = x(parseFloat(d['pl_orbsmax']));
        return pd;
    };
    var kmEarthRadius = spaceD3.solarsystemData['Earth']['radiuse'];
    rf = function(d) {
        return r(parseFloat(d['pl_rade'])*kmEarthRadius);
    };
    var cs = function(d) {
        var c = spaceD3.bodyMap[d['pl_hostname']+d['pl_letter']].exoplanetColor;
        var r = Math.floor(c.r*255);
        var g = Math.floor(c.g*255);
        var b = Math.floor(c.b*255);
        return "rgba("+r+","+g+","+b+",0.3)";
    }
    var cf = function(d) {
        var c = spaceD3.bodyMap[d['pl_hostname']+d['pl_letter']].exoplanetColor;
        var r = Math.floor(c.r*255);
        var g = Math.floor(c.g*255);
        var b = Math.floor(c.b*255);
        return "rgba("+r+","+g+","+b+",0.1)";
    }
    spaceD3.drawCircles(spaceD3.exoplanetData, xf, h/2, rf, cs, cf, ".planet.extrasolar", "planet extrasolar");
    
    // Vertical line for selected planet
    spaceD3.highlightSelectedPlanetOrbit(x, h);
  
    // draw the solar system
    xf = function(d) {
        return x(d['au']);
    };
    rf = function(d) {
        return r(d['radiuse']);
    };
    spaceD3.drawCircles(spaceD3.solarData, xf, h/2, rf, null, null, ".planet.solar", "planet solar");

}

spaceD3.start = function(solarsystemData, exoplanetData, bodyMap) {
    spaceD3.solarsystemData = solarsystemData;
    spaceD3.exoplanetData = exoplanetData;
    spaceD3.bodyMap = bodyMap;

    // Clean data for appropriate use with d3
    spaceD3.solarData = []
    for(planetName in spaceD3.solarsystemData) {
        spaceD3.solarData.push(spaceD3.solarsystemData[planetName]);
    }

    svg = d3.select("body")
        .append("svg")
        .attr("id", "space-d3");

    spaceD3.drawScene();
}
