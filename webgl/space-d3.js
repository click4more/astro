var spaceD3 = window.spaceD3 = {};

spaceD3.drawCircles = function(data, cx, cy, cr, cs, cf, selector, classname) {
    // first clear
    spaceD3.svg.selectAll(selector).remove();

    // draw orbits for solar system planets
    var circles = spaceD3.svg.selectAll(selector)
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

spaceD3.getSelectedPlanetId = function() {
    var selected = $('.ui-selected');
    if(!selected.exists()) return null;

    var selectedId = selected.attr("id");
    if(selectedId==="Sun") {
        d3.selectAll(".selected-orbit").remove();
        return null;
    }

    return selectedId;
};

spaceD3.zoomToPlanet = function() {
    var selectedId = spaceD3.getSelectedPlanetId();
    if(!selectedId) return;

    // compute the distance multiplier that would
    // make the planet appear at the center of the screen
    // mid-screen x value (400) = orbitAu/(770*distanceMultiplier)
    // distanceMultiplier = 400*770/orbitAu;
    var orbitAu = spaceD3.solarsystemData[selectedId]['au'];
    var finalDistanceMultiplier = Math.floor(400/orbitAu + spaceD3.offsetX/770);

    var dslider = $('#distance-multiplier-slider');
    var dvalue = $('#distance-multiplier-value');
    var currentDistanceMultiplier = dvalue.val();

    var numFrames = 30;
    var duration = 1000; // milliseconds 
    var diffPerFrame = (finalDistanceMultiplier-currentDistanceMultiplier)/numFrames;
    
    // smooth transition using 60 frames
    var transition = setInterval(function() {
        // update distance multiplier slider and label 
        var newDistanceMultiplier = Math.floor(parseFloat(dvalue.val())+diffPerFrame);
        dvalue.val(newDistanceMultiplier);
        dslider.slider("value", newDistanceMultiplier);

        // update display
        spaceD3.drawScene();
        
        // stop transition when target is reached 
        if((diffPerFrame < 0 && newDistanceMultiplier <= finalDistanceMultiplier) ||
            (diffPerFrame > 0 && newDistanceMultiplier >= finalDistanceMultiplier)) {
            clearInterval(transition);
        }
    }, duration/numFrames);
};

// highlight the orbit of the selected planet with neon green
spaceD3.highlightSelectedPlanetOrbit = function(x, h) {
    var selectedId = spaceD3.getSelectedPlanetId();
    if(!selectedId) return;

    var rf = function(d) {
        return x(d['au']);
    };

    spaceD3.drawCircles([spaceD3.solarsystemData[selectedId]], 0, h/2, rf, null, null, ".selected-orbit", "selected-orbit");

}

spaceD3.drawAxis = function(xs) {
    spaceD3.svg.selectAll(".box").remove();
    spaceD3.svg.selectAll("rect")
        .data([0])
        .enter()
        .append("rect")
        .attr("class", "box")
        .attr("x", 0)
        .attr("y", 350)
        .attr("width", 800)
        .attr("height", 50);
    
    var ax = d3.svg.axis()
        .scale(xs)
        .orient("bottom");
    
    var ticks = [0];
    for(var i=0; i<spaceD3.solarData.length; i++) {
        px = spaceD3.solarData[i]['au'];
        ticks.push(px);
    }
    ax.tickValues(ticks);

    spaceD3.svg.selectAll(".axis").remove();
    spaceD3.svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(-2, "+355+")")
        .call(ax.tickFormat(d3.format(".1 AU")));

    // label axis
    
}

spaceD3.drawLegend = function() {
}

spaceD3.offsetX = 20;
spaceD3.drawScene = function() {
    var h = 400;
    distanceMultiplier = $('#distance-multiplier-value').val();

    var x = d3.scale.linear()
        .domain([0, 770])
        .range([spaceD3.offsetX, 770*distanceMultiplier]);

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
    
    spaceD3.drawAxis(x);
    spaceD3.drawLegend();
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

    spaceD3.svg = d3.select("body")
        .append("svg")
        .attr("id", "space-d3")
        .attr("class", "d3")
        .append("g");

    spaceD3.drawScene();
}
