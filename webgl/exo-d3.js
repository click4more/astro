/**
 * Draws a 2D scatterplot showing
 * - distance from the star
 * - power radiated by the star
 * - the "habitable zone"
 * ...each exoplanet is a dot.
 */

var exoD3 = window.exoD3 = {};
exoD3.selected = [];

(function(){
    function cleanData(data){
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
            var name = d.pl_hostname=="Sol" ? d.pl_letter : d.pl_hostname + d.pl_letter;
            var displayable = d.pl_rade != "";
            var planet = {
                st_teff: parseFloat(d.st_teff),
                st_mass: parseFloat(d.st_mass),
                pl_orbsmax: parseFloat(d.pl_orbsmax),
                pl_masse: parseFloat(d.pl_masse),
                pl_massj: parseFloat(d.pl_massj),
                pl_disc: d['pl_disc\r'],
                pl_orbper: d.pl_orbper,
                name: name,
                displayable: displayable,
                pl_rade: parseFloat(d.pl_rade)
            };
            f.push(planet);
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
        var eD3 = this;
        function brush() {
            eD3.filter.extent = brush.extent();
            eD3.updateFilter();
            if(isVisible($('#space-d3'))) spaceD3.drawScene();
        }

        // If the brush is empty, select all circles.
        function brushend() {
            var e = brush.extent();
            if(Math.abs(Math.log(e[0][0]/e[1][0])) > 0.2) return;
            if(Math.abs(Math.log(e[0][1]/e[1][1])) > 0.2) return;
            eD3.filter.extent = null;
            eD3.updateFilter();
            exoD3.selected = [];
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
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate("+this.margin[3]+",0)")
            .call(axisY);
        this.svg.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0,"+(this.size[1]-this.margin[2])+")")
            .call(axisX);
        this.svg.append("text")
            .attr("class", "axislabel")
            .attr("x", 20)
            .attr("y", this.size[1]/2)
            .text("Star temp (K)");
        this.svg.append("text")
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
        this.svgPlot.selectAll("circle")
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
        var svgHz = this.svg.append("g").attr("id", "habzone");
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
            .attr("x", scaleX(0.02))
            .attr("y", this.margin[0]+30)
            .text("Too hot (no liquid water)");
        svgHz.append("svg:text")
            .attr("x", scaleX(3))
            .attr("y", this.margin[0]+30)
            .text("Too cold (no liquid water)");
        
    }
    
    function createLegend(){
        /* PLOT LEGEND - circles and labels */
        this.planetTypes = [
            {'name':'normal', 'enabled':true, 'r':6},
            {'name':'gasgiant', 'enabled':true, 'r':10}];
        var svgLegend = this.svg.append("svg:g").data(this.planetTypes);
        var xC = this.size[0] - 150, xL = this.size[0]-130;
        var y1 = 100, y2 = 125;
        var eD3 = this; 
        svgLegend.append("circle")
            .attr("cx", xC).attr("cy", y1)
            .attr("r", 6)
            .attr("class", "legend planet normal")
            .on("mousedown", function(){
                eD3.filter.type.normal = !eD3.filter.type.normal;
                $(this).attr("class",eD3.filter.type.normal ?
                    "legend planet normal" : "legend");
                eD3.updateFilter();
            });
        svgLegend.append("text")
            .attr("x", xL).attr("y", y1)
            .attr("class", "legendlabel")
            .text("Earth-like gravity");
        svgLegend.append("circle")
            .attr("cx", xC).attr("cy", y2)
            .attr("r", 10)
            .attr("class", "legend planet gasgiant")
            .on("mousedown", function(){
                eD3.filter.type.gasgiant = !eD3.filter.type.gasgiant;
                $(this).attr("class", eD3.filter.type.gasgiant ?
                    "legend planet gasgiant" : "legend");
                eD3.updateFilter();
            });
        svgLegend.append("text")
            .attr("x", xL).attr("y", y2)
            .attr("class", "legendlabel")
            .text(">10x Earth mass.");
        svgLegend.append("text")
            .attr("x", xL).attr("y", y2+15)
            .attr("class", "legendlabel")
            .text("Likely gas giant.");
    }

    function updateFilter(){
        exoD3.selected = [];

        var eD3 = this;
        eD3.svgPlot.selectAll("circle").attr("class", function(d) {
            var sel = true;
            var e = eD3.filter.extent;
            if(e){
                sel = e[0][0] <= eD3.fnX(d) && eD3.fnX(d) <= e[1][0]
                    && e[0][1] <= eD3.fnY(d) && eD3.fnY(d) <= e[1][1];
            }
            var gg = eD3.fnClass(d).endswith("gasgiant");
            sel = sel && (!gg || eD3.filter.type.gasgiant);
            sel = sel && (gg || eD3.filter.type.normal);

            // Let space view know which planets to display
            if(sel && d.displayable) exoD3.selected.push(d);

            return sel ? eD3.fnClass(d) : null; 
        });
    }

    window.ExoD3 = function(id, data){
        // geometry
        this.size = [540,540];
        this.margin = [10, 0, 50, 100];

        // data
        this.data = cleanData(data);
        console.log("cleaned data, kept "+this.data.length+"/"+data.length);
        this.filter = {
            type: {
                gasgiant: true,
                normal: true
            }, 
            extent: null
        };

        // dom
        var svg = d3.select("body")
            .append("svg")
            .attr("id", id)
            .attr("width",this.size[0])
            .attr("height",this.size[1]);
        this.svg = svg.append("g").attr("id", "exoD3svg");
        this.svgPlot = this.svg.append("g");

        // functions
        this.createScatter = createScatter;
        this.createBrush = createBrush;        
        this.createLegend = createLegend;
        this.updateFilter = updateFilter;

        this.createScatter(this.data);
        this.createBrush();
        this.createLegend();
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

        window.exoD3 = new ExoD3("exoD3", data);
    }, "text");
});

