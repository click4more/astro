/**
 * Draws a 2D scatterplot showing
 * - distance from the star
 * - power radiated by the star
 * - the "habitable zone"
 * ...each exoplanet is a dot.
 */

(function(){
    function filterData(data){
        var f = [];
        for(var i = 0; i < data.length; i++){
            var d = data[i];
            if(d.st_teff == ""){
                continue;
            }
            if(d.st_mass == ""){
                continue;
            }
            if(d.pl_orbsmax == ""){
                continue;
            }
            if(parseFloat(d.pl_masse) == 0) {
                continue;
            }
            f.push({
                st_teff: parseFloat(d.st_teff),
                st_mass: parseFloat(d.st_mass),
                pl_orbsmax: parseFloat(d.pl_orbsmax),
                pl_masse: parseFloat(d.pl_masse)
            });
        }
        // sort by descending size
        f.sort(function(a,b){return b.pl_masse-a.pl_masse;});
        return f;
    }

    function createBrush(){
        var brush = d3.svg.brush()
            .on("brush", brush)
            .on("brushend", brushend)
            .x(this.scaleX)
            .y(this.scaleY);
        brush(this.svg);

        // Highlight the selected circles.
        var fnX = this.fnX, fnY = this.fnY, fnClass = this.fnClass;
        function brush() {
          var e = brush.extent();
          svg.selectAll("circle").attr("class", function(d) {
            return e[0][0] <= fnX(d) && fnX(d) <= e[1][0]
                && e[0][1] <= fnY(d) && fnY(d) <= e[1][1]
                ? fnClass(d) : null;
          });
        }

        // If the brush is empty, select all circles.
        function brushend() {
            if (!brush.empty()) return;
            svg.selectAll("circle").attr("class", fnClass);
        }
    }

    function createScatter(data){

        /* SETUP SCALING */
        var scaleX = this.scaleX = d3.scale.log()
            .domain([0.01, 90.0])
            .range([this.margin[3], this.size[0]-this.margin[1]]);
        var scaleY = this.scaleY = d3.scale.log()
            .domain([3000, 10000])
            .range([this.size[1]-this.margin[2], this.margin[0]]);

        /* PLOT AXES */
        var fnFmt = function(fn) { return function (n) {
                // no labels for 6-9, 60-90, 600-900 etc since those are too 
                // closely spaced on a log axis
                var log = Math.log(n) / Math.log(10);
                var digit = Math.round(Math.exp(Math.log(10)*(log-Math.floor(log))));
                if (digit != 2 && digit != 5 && digit != 1) {
                    return "";
                } else {
                    var s = fn(n); 
                    var i, ix=s.indexOf(".");
                    if(ix > -1){
                        for( i = s.length; i >= ix; i--){
                            if(s[i-1]!='0' && s[i-1]!='.') break;
                        }
                        s = s.substring(0,i); 
                    }
                    return s;
                }
            };
        };
        var axisX = d3.svg.axis()
            .scale(scaleX)
            .orient("bottom")
            .tickFormat(fnFmt(d3.format(".2f")));
        var axisY = d3.svg.axis()
            .scale(scaleY)
            .orient("left")
            .tickFormat(fnFmt(d3.format(".0f")));
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate("+this.margin[3]+",0)")
            .call(axisY);
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0,"+(this.size[1]-this.margin[2])+")")
            .call(axisX);
        svg.append("text")
            .attr("class", "axislabel")
            .attr("x", 10)
            .attr("y", this.size[1]/2)
            .text("Star temp (K)");
        svg.append("text")
            .attr("class", "axislabel")
            .attr("x", this.size[0]/2)
            .attr("y", this.size[1]-10)
            .text("Distance from star (AU)");

        /* PLOT POINTS */
        var planetSize = function(d, opts) {
            if(d.pl_masse < 0.0){
                return opts[0]; // disabled..
            } else if(d.pl_masse < 10){
                return opts[1]; // normal
            } else {
                return opts[2]; // gasgiant
            }
        };
        var fnX = this.fnX = function(d){return d.pl_orbsmax;};
        var fnY = this.fnY = function(d){return d.st_teff;};
        var fnClass = this.fnClass = function(d){
            // tiny, normal, and gas giant, respectively
            return planetSize(d, ["", "planet normal", "planet gasgiant"]);
        };
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
                .attr("cx", function(d) {
                    return scaleX(fnX(d));
                }).attr("cy", function(d) {
                    return scaleY(fnY(d));
                }).attr("r", function(d) {
                    return planetSize(d, [3, 6, 10]);
                }).attr("class", fnClass);

    
        /* PLOT HABITABLE ZONE */
        var svgHz = svg.append("g").attr("id", "habzone");
        var habzone = [];
        for(var temp = 3000; temp < 10000; temp += 200){
            var tfactor = Math.pow(temp / 5780, 0.333333333);
            habzone.splice(0,0, [
                0.75 * tfactor,
                temp
            ]);
            habzone.push([
                1.5 * tfactor,
                temp
            ]);
        }
        var line = d3.svg.line()
            .x(function(d){return scaleX(d[0]);})
            .y(function(d){return scaleY(d[1]);})
            .interpolate("linear");
        svgHz.append("svg:path")
            .attr("d", line(habzone));
        /* label it */
        svgHz.append("svg:text")
            .attr("x", scaleX(1))
            .attr("y", this.margin[0]+30)
            .text("Habit.");
        svgHz.append("svg:text")
            .attr("x", scaleX(1))
            .attr("y", this.margin[0]+40)
            .text("zone");
        svgHz.append("svg:text")
            .attr("x", scaleX(0.1))
            .attr("y", this.margin[0]+30)
            .text("Too hot (no liquid water)");
        svgHz.append("svg:text")
            .attr("x", scaleX(3))
            .attr("y", this.margin[0]+30)
            .text("Too cold (no liquid water)");
    }

    window.ExoD3 = function(id, data){
        // geometry
        this.size = [800,600];
        this.margin = [10, 0, 50, 100];

        // functions
        this.createScatter = createScatter;
        this.createBrush = createBrush;        

        // data
        this.data = filterData(data);
        console.log("filtered data, kept "+this.data.length+"/"+data.length);

        // dom
        var svg = d3.select("body")
            .append("svg")
            .attr("id", id)
            .attr("width",this.size[0])
            .attr("height",this.size[1]);
        this.svg = svg.append("g").attr("id", "exoD3svg");

        this.createScatter(this.data);
        this.createBrush();
        
    };
})();

$(function(){
    $.get("data/solar_and_exoplanets.csv", function(data){
        var lines = data.split("\n");
        var data = [];
        var headers = lines[0].split(",");
        var n = lines.length, m = headers.length;
        for(var i = 1; i < n; i++){
            if(lines[i].trim() == "") continue;
            var row = lines[i].split(","), datum = {};
            if(row.length != m){ throw "invalid csv: "+row; }
            for(var j = 0; j < m; j++){
                datum[headers[j]] = row[j];
            }
            data.push(datum);
        }

        exoD3 = ExoD3("exoD3", data);
    }, "text");
});

