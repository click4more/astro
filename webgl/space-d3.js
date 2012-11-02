var spaceD3 = window.spaceD3 = {};

spaceD3.drawCircles = function(data, cx, cy, cr, cs, cf, selector, classname) {
    // first clear
    spaceD3.svg.selectAll(selector).remove();

    // draw orbits for solar system planets
    var fmt0 = d3.format(".0f");
    var fmt1 = d3.format(".1f");
    var circles = spaceD3.svg.selectAll(selector)
        .data(data)
        .enter()
        .append("circle")
        .attr("class", classname)
        .on("mouseover", function(d){
             $("#planetdata").html(
                 "<h2>"+d.name+"</h2>"+
                 "<div><emph>Mass: </emph> "+fmt0(d.pl_massj * 317)+"</div>"+
                 "<div><emph>Length of year: </emph> "+fmt1(d.pl_orbper)+" Earth days</div>"+
                 "<div><emph>Discovered: </emph> "+d.pl_disc+"</div>");
        });

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

    var numFrames = 20;
    var duration = 500; // milliseconds 
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
    }, 10);
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

spaceD3.drawAxisWithTickValues = function(ticks) {
    spaceD3.ax.tickValues(ticks);

    spaceD3.svg.selectAll(".axis").remove();
    spaceD3.svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, 4)")
        .call(spaceD3.ax.tickFormat(d3.format(".1 AU")));

};

spaceD3.drawAxis = function(xs) {
    spaceD3.ax = d3.svg.axis()
        .scale(xs)
        .orient("bottom");
    
    var ticks = [0, 770];
    for(var i=0; i<spaceD3.solarData.length; i++) {
        px = spaceD3.solarData[i]['au'];
        ticks.push(px);
    }
    spaceD3.ax.currentTickValues = ticks;
    spaceD3.drawAxisWithTickValues(ticks);
}

spaceD3.labelAxis = function() {
    spaceD3.svg.append("text")
        .attr("class", "axis-label")
        .attr("x", 790)
        .attr("y", 390)
        .text("Units: AU (distance from Earth to Sun)");
}

spaceD3.addTick = function() {
    var mouse = d3.mouse(this);
   
    var distanceMultiplier = parseFloat($('#distance-multiplier-value').val());
    var pixValue = parseFloat(mouse[0] - 10);
    var orbitAu = (pixValue/(distanceMultiplier - spaceD3.offsetX/770)).toFixed(3);

    var newTickValues = spaceD3.ax.currentTickValues.slice();
    newTickValues.push(orbitAu);
    spaceD3.drawAxisWithTickValues(newTickValues);
    
    spaceD3.svg.selectAll(".reference-tick-line").remove();
    spaceD3.svg.append("svg:line")
        .attr("class", "reference-tick-line")
        .attr("x1", pixValue + spaceD3.offsetX)
        .attr("y1", 0)
        .attr("x2", pixValue + spaceD3.offsetX)
        .attr("y2", 400);
}

spaceD3.removeReferenceLine = function() {
    spaceD3.svg.selectAll(".reference-tick-line").remove();
    spaceD3.drawAxisWithTickValues(spaceD3.ax.currentTickValues);
}

spaceD3.drawLegend = function() {
    // size legend
    var xpos = 720;
    var ypos = 380;
    var linewidth = 70;

    var kmEarthRadius = spaceD3.solarsystemData['Earth']['radiuse'];
    var r = function(d) {
        return spaceD3.r(d*kmEarthRadius);
    };
    var rawData = [1, 5, 10, 20];
    var processedData = [r(1), r(5), r(10), r(20)];
    var identityFunction = function(d) {
        return d;
    }
    var yf = function(d) {
        return ypos - d;
    };
    spaceD3.drawCircles(processedData, xpos, yf, identityFunction, null, null, ".size-legend", "size-legend");

    var lines = spaceD3.svg.selectAll(".legend-line")
        .data(processedData)
        .enter()
        .append("svg:line")
        .attr("class", "legend-line")
        .attr("x1", xpos)
        .attr("y1", function(d) {
            return ypos-2*d;
        })
        .attr("x2", xpos+linewidth)
        .attr("y2", function(d) {
            return ypos-2*d;
        });

    var labels = spaceD3.svg.selectAll(".legend-label")
        .data(rawData)
        .enter()
        .append("svg:text")
        .attr("class", "legend-label")
        .attr("x", function(d) {
            var x = xpos+linewidth;
            if(d<10) return x-5;
            return x-10;
        })
        .attr("y", function(d) {
            return ypos-2*r(d)-2;
        })
        .text(identityFunction);

    var units = spaceD3.svg.append("svg:text")
        .attr("class", "legend-label")
        .attr("x", xpos - 50)
        .attr("y", ypos + 13)
        .text("Size units in Earth radius");

    /*
    // color legend
    var colorLegendX = 420;
    var colorLegendY = 340;
    var colorLegendWidth = 200;
    var colorLegendHeight = 20;
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

    spaceD3.svg.selectAll(".color-legend")
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
    spaceD3.svg.selectAll(".color-legend-reference-line")
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
    spaceD3.svg.append("svg:text")
        .attr("class", "color-legend-reference-label")
        .attr("x", colorLegendX)
        .attr("y", colorLegendY - 15)
        .text("1");
    
    spaceD3.svg.append("svg:text")
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

    spaceD3.svg.selectAll(".color-legend-caption")
        .data(colorLegendCaption)
        .enter()
        .append("svg:text")
        .attr("class", "color-legend-caption")
        .attr("x", colorLegendX)
        .attr("y", function(d, i) {
            return colorLegendY + colorLegendHeight + (i+1)*10;
        })
        .text(function(d) {
            return d;
        });
    */
};

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
    spaceD3.r = r;

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
    
    /*
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
        return "rgba("+r+","+g+","+b+",0.6)";
    }
    var cf = function(d) {
        var c = spaceD3.bodyMap[d['pl_hostname']+d['pl_letter']].exoplanetColor;
        var r = Math.floor(c.r*255);
        var g = Math.floor(c.g*255);
        var b = Math.floor(c.b*255);
        return "rgba("+r+","+g+","+b+",0.1)";
    }
    spaceD3.drawCircles(spaceD3.exoplanetData, xf, h/2, rf, cs, cf, ".planet.extrasolar", "planet extrasolar");
    
    */
    // draw the exoplanets
    xf = function(d) {
        var pd = x(d['pl_orbsmax']);
        return pd;
    };
    var kmEarthRadius = spaceD3.solarsystemData['Earth']['radiuse'];
    rf = function(d) {
        return r(d['pl_rade']*kmEarthRadius);
    };
    var cs = function(d) {
        var c = spaceD3.bodyMap[d['name']].exoplanetColor;
        var r = Math.floor(c.r*255);
        var g = Math.floor(c.g*255);
        var b = Math.floor(c.b*255);
        return "rgba("+r+","+g+","+b+",0.65)";
    }
    var cf = function(d) {
        var c = spaceD3.bodyMap[d['name']].exoplanetColor;
        var r = Math.floor(c.r*255);
        var g = Math.floor(c.g*255);
        var b = Math.floor(c.b*255);
        return "rgba("+r+","+g+","+b+",0.1)";
    }
    var exos;
    if(exoD3.selected && exoD3.selected.length) {
        exos= exoD3.selected;
    }else {
        exos = spaceD3.exoplanetData;
    }
    spaceD3.drawCircles(exos, xf, h/2, rf, cs, cf, ".planet.extrasolar", "planet extrasolar");
    
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
        .attr("class", "d3");
    
    spaceD3.svg.on("mousemove", spaceD3.addTick);
    spaceD3.svg.on("mouseout", spaceD3.removeReferenceLine);

    spaceD3.drawScene();
    spaceD3.drawLegend();
}
