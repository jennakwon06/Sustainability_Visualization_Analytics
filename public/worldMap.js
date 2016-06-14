var path;
var projection;
var radius = d3.scale.sqrt() //accurate encoding https://groups.google.com/forum/#!topic/d3-js/mcJ8GE6_fq4
    .domain([0, 1e6])
    .range([0, 15]);

var tooltipMap;
var zoom;

function drawBubbles(results) {

    if (!d3.select(".bubble").empty()) {
        d3.select(".bubble").remove();
    }

    var arrayOfLocations = [];

    //@TODO figure out how to create an array of results?
    for (var i = 0; i < results.length; i++) {
        var temp = {
            "name": "",
            "address": "",
            "count": 1,
            "latitude": 0,
            "longitude": 0,
            "sustIndex": 0,
            "sustIndexCount": 0,
            "companyInfo" : "",
            //"companies": []
        };

        temp.name = results[i].name;
        temp.address = results[i].address;
        temp.latitude = results[i].latitude;
        temp.longitude = results[i].longitude;
        temp.sustIndex = isNaN(results[i].sustIndex) ? 0 : results[i].sustIndex;
        temp.sustIndexCount = results[i].sustIndex ? 1 : 0;
        temp.companyInfo = results[i];

        arrayOfLocations[i] = temp;
        //arrayOfLocations
    }

    // location accumulator
    arrayOfLocations.sort(function(a,b) {
        return (a.address > b.address) ? 1 : ((b.address > a.address) ? -1 : 0);} ); //SORT BY ADDRESS


    // pairwise merge from the back
    for (i = arrayOfLocations.length - 1; i > 0; i--) {
        if (arrayOfLocations[i - 1].address == arrayOfLocations[i].address) {
            arrayOfLocations[i - 1].count += arrayOfLocations[i].count;
            arrayOfLocations[i - 1].sustIndex += arrayOfLocations[i].sustIndex;
            arrayOfLocations[i - 1].sustIndexCount += arrayOfLocations[i].sustIndexCount;
            arrayOfLocations[i] = null;
        }
    }

    arrayOfLocations = arrayOfLocations.filter(Boolean);

    // normalize sust index
    for (i = arrayOfLocations.length - 1; i > 0; i--) {
        arrayOfLocations[i].sustIndex /= arrayOfLocations[i].sustIndexCount;
    }

    arrayOfLocations.sort(function (a,b) {
        return b.count - a.count;
    });

    if (d3.select(".tooltipMap").empty()){
        tooltipMap = d3.select("body").append("div")
            .attr("class", "tooltipMap")
            .style("opacity", 0);
    } else {
        tooltipMap = d3.select(".tooltipMap");
    }

    d3.select(".mapSvg g")
        //.insert('g', '.land + *')
        .append("g")
        .attr("class", "bubble")
        .selectAll("circle")
        .data(arrayOfLocations)
        .sort(function(a,b) {
            return b.count - a.count;}) //@SORT BUBBLES BY SIZE
        .enter() //A LOT OF EMPTY CIRCLE TAGS ARE GENERATED - CA THIS BE BETTER ?
        .append("circle")
        .attr("class", "mapCircle")
        .attr("address", function(d) {
            return d.address;
        })
        .attr("transform", function(d) {
            return "translate(" + projection([d.longitude, d.latitude]) + ")"; })
        .attr("r", function(d) {
            return (radius(d.count) * 200 / zoom.scale());
        })
        .style("fill", function(d) {
            return color(d.sustIndex);})
        .on("mouseover", function(d) {
            tooltipMap.transition()
                .duration(200)
                .style("opacity", .9)
                .style("left", (d3.event.pageX + 5) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            tooltipMap
                .html("City: " + d.address
                    + "<br> Sustainability Index: " + Math.round(d.sustIndex * 100) / 100);
        })
        .on("mouseout", function(d) {
            tooltipMap.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", function(d) {
            linkData(false, d.address, false, true, false);
        });
}

function drawMap(results) {

    if (d3.select(".mapSvg").empty()) {

        var width = $(".resultMapView").width();
        var height = $(".resultMapView").height();

        var x = d3.scale.linear()
            .domain([0, width])
            .range([0, width]);

        var y = d3.scale.linear()
            .domain([0, height])
            .range([height, 0]);

        projection = d3.geo.mercator()
            .translate([width / 2, height / 2])
            .scale((width - 1) / 2 / Math.PI);

        zoom = d3.behavior.zoom()
            .scaleExtent([1, 20])
            .scale(2)
            .x(x)
            .y(y)
            .on("zoom",function() {
                g.attr("transform", function(d) {
                    return "translate("+ d3.event.translate.join(",")+ ")scale(" + zoom.scale() + ")"
                });

                g.selectAll("circle")
                    .attr("r", function(d){
                        var self = d3.select(this);
                        var r = (radius(d.count) * 200) / zoom.scale();
                        //self.style("stroke-width", r < 4 ? (r < 2 ? 0.5 : 1) : 2);
                        return r;
                    });
            });

        var svg = d3.select("#worldMap").append("svg")
            .attr("class", "mapSvg")
            .attr("width", width)
            .attr("height", height)
            .style("margin-top", 0);

        var g = svg.append("g");

        g.call(zoom);

        path = d3.geo.path()
            .projection(projection);

        var z = color;

        // Add a legend for the color values.
        //var legend = svg.selectAll(".legend")
        //    .data(z.ticks(6).slice(1).reverse())
        //    .enter().append("g")
        //    .attr("class", "legend")
        //    .attr("transform", function(d, i) { return "translate(" + (width + 20 - 80) + "," + (20 + i * 20) + ")"; });
        //
        //legend.append("rect")
        //    .attr("width", 15)
        //    .attr("height", 15)
        //    .style("fill", z);
        //
        //legend.append("text").attr("x", 20)
        //    .attr("y", 10)
        //    .attr("dy", ".25em")
        //    .text(String);

        d3.json("/map1.json", function(error, world) {

            console.log("d3 asynchronous call for map");

            if (error) throw error;

            g.append("path")
                .datum({type: "Sphere"})
                .attr("class", "sphere")
                .attr("d", path);

            g.append("path")
                .datum(topojson.merge(world, world.objects.countries.geometries))
                .attr("class", "land")
                .attr("d", path);

            g.append("path")
                .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
                .attr("class", "boundary")
                .attr("d", path);

            //g.append("path")
            //    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
            //    .attr("class", "boundary")
            //    .attr("d", path);

            drawBubbles(results);
        });
    } else {
        drawBubbles(results);
    }
}