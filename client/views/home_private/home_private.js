Template.HomePrivate.rendered = function() {
    $.getScript("/filters.js");
    $.getScript("/worldmap.js");
    $.getScript("/scatterplot.js");
};

var i = 0;

//PDFs = Meteor.subscribe('fs.files');

console.log(PDFs);
console.log(PDFs.find().fetch());


var findPDFs = function(company) {


    // Check if database is correctly set up
    console.log(PDFs.find().count());
    console.log(PDFs.find({}));

    var regex = new RegExp('^' + company, 'i');

    // @TODO use regex to find a file by name
    return PDFs.find({}).fetch();
};

Template.HomePrivate.events({
    // Reset all on buttons with
    'click #resetEmissions' : function (e) {
        ghg1Chart.filterAll();
        ghg2Chart.filterAll();
        ghg3Chart.filterAll();
    },

    'click #collapseFilterButton': function(e) {
        if (i % 2 == 0) {
            $('#controlBar').animate({
                left: "0px"
            }, 500, function() {});

            $('#filterBar').animate({
                opacity: 0
            }, 500, function() {});

            $('#resultBar').css({"width" : "96vw","position" :"fixed"});

            $(".glyphicon-arrow-left").addClass( "glyphicon-arrow-right");
            $(".glyphicon-arrow-right").removeClass( "glyphicon-arrow-left");

        } else {
            $(".glyphicon-arrow-right").addClass( "glyphicon-arrow-left");
            $(".glyphicon-arrow-left").removeClass( "glyphicon-arrow-right");

            $('#resultBar').removeAttr("style");
            $('#controlBar').removeAttr("style");

            $('#filterBar').animate({
                opacity: 1
            }, 500, function() {

            });
        }
        i++;
    },

    // Update number counter button
    'click rect': function (e) {
        $('.companiesCount').html(globalFilter.top(Infinity).length);

    },

    'click #resetAllFiltersButton': function(e) {
        dc.redrawAll();
        dc.filterAll();
    },

    'click #applyFilterButton': function (e) {
        e.preventDefault();
        var results = globalFilter.top(Infinity);

        // @TODO Fill the list view
        var table = $(".resultsTable");

        //clear table
        $('.resultsTable > tbody').empty();

        for (var i = results.length - 1; i >= 0; i--) {
            var tr = document.createElement('tr');

            tr.className += "clickableRow";
            tr.id += results[i].Name;
            tr.setAttribute("data-toggle", "modal");
            tr.setAttribute("data-target", "#myModal");

            var td1 = document.createElement('td');
            var td2 = document.createElement('td');
            var td3 = document.createElement('td');
            var td4 = document.createElement('td');

            td1.appendChild(document.createTextNode(results[i].Name));
            td2.appendChild(document.createTextNode(results[i].industry));
            td3.appendChild(document.createTextNode(results[i].sector));
            td4.appendChild(document.createTextNode(results[i].country));

            tr.appendChild(td1);
            tr.appendChild(td2);
            tr.appendChild(td3);
            tr.appendChild(td4);
            //tr.data(results[i]);
            table.append(tr);
        }



        // @TODO enable buttons
        $('#saveResultButton').removeClass("disabled");
        $('#resultListViewButton').removeClass("disabled");
        $('#resultMapViewButton').removeClass("disabled");
        $('#resultScatterPlotViewButton').removeClass("disabled");

        // @TODO insert to database
        Filters.insert({
        });

        //@TODO DRAW MAP
        if (d3.select(".mapSvg").empty()) {
            drawMap();
        }
        drawBubblesOnMap(results);

        //@TODO DRAW SCATTER PLOT
        drawBubblesOnScatterPlot(results);
    },

    'click #saveResultButton': function (e) {
        e.preventDefault();

        var resultsArr = [];

        $(".clickableRow").each(function (i) {
            resultsArr.push(this.id);
        });

        console.log("inserting!");
        Meteor.call('saveResults', resultsArr, Meteor.userId(), new Date());
    },

    // highlight table row clicked
    'click .clickableRow': function (e) {
        var name = $(e.currentTarget).attr('id');
        $(e.currentTarget).addClass('highlight');
        $(e.currentTarget).siblings().removeClass('highlight');

        d3.csv("/data/envDataOnSP500.csv", function(error, data) {

            // clear prev resuits
            $('.list-group').empty();

            for (var i = 0; i < data.length; i++) {
                if (data[i].Name == name) {
                    d3.select(".list-group")
                        .append("li")
                        .attr("class", "modal-list-item list-group-item")
                        .attr("value", 10)
                        .attr("id", 10)
                        .text(data[i].GR_name);


                    // TODO FIND FILES BY NAME
                    var path = "/reports/" + data[i].GR_name;
                    //
                    //var files = fs.readdirSync('/report/');
                    //console.log(files);

                    // TODO SOLUTION 1) USE SHELLJS TO LIST FILES. NOT WORKING? THROWS ERROR "CAN'T FIND VARIABLE SHELL"
                    var list = shell.ls("/reports");
                    console.log(list);

                    // TODO SOLUTION 2) USE MONGO DB
                    console.log(findPDFs(data[i].GR_name));

                    break;
                }
            }
        });
    },

    'click #closeModalButton': function (e) {
        $('tbody > .clickableRow').removeClass('highlight');
    },

    'click #resultListViewButton': function (e) {
        $('.resultListView').attr("style", "display: block");
        $('.resultMapView').attr("style", "display: none");
        $('.resultScatterPlotView').attr("style", "display: none");

    },

    'click #resultMapViewButton': function (e) {
        $('.resultListView').attr("style", "display: none");
        $('.resultMapView').attr("style", "display: block");
        $('.resultScatterPlotView').attr("style", "display: none");

    },


    'click #resultScatterPlotViewButton': function (e) {
        $('.resultListView').attr("style", "display: none");
        $('.resultMapView').attr("style", "display: none");
        $('.resultScatterPlotView').attr("style", "display: block");

    },

    // @TODO   MAP STUFF

    'click .bubble': function (e) {
        d3.select(".list-group")
            .append("li")
            .attr("class", "modal-list-item list-group-item")
            .attr("value", 10)
            .attr("id", 10)
            .text(data[i].GR_name);
    }


});

Template.HomePrivate.helpers({
    pdfs: function () {
        return PDFs.find(); // Where Images is an FS.Collection instance
    }

});
