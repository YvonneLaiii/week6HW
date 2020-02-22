'use strict';

(function() {

  let data = "no data";
  let raw = "";
  let svgContainer = ""; // keep SVG reference in global scope
  let tooltipSvg = "";
  let div = ""

  // load data and make scatter plot after window loads
  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data));
  }

  // make scatter plot with trend line
  function makeScatterPlot(csvData) {
    data = csvData.filter(function(d){return d.year==1980}) // assign data as global variable
    raw = csvData
    // get arrays of fertility rate data and life Expectancy data
    let fertility_data = data.map((row) => parseFloat(row["fertility"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    // find data limits
    let axesLimits = findMinMax(fertility_data, life_expectancy_data);
    // draw axes and return scaling + mapping functions
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy", svgContainer);

    // plot data as points and add tooltip functionality
    plotData(mapFunctions);

    // draw title and axes labels
    makeLabels();
  }

  function plotTooltip(country) {
    tooltipSvg.selectAll("*").remove();
    let countryData = raw.filter(function(d){return d.country==country})
    // get year min and max for us
    let yearLimits = d3.extent(countryData, d => d['year'])
    // get scaling function for years (x axis)
    let xScale = d3.scaleLinear()
        .domain([yearLimits[0], yearLimits[1]])
        .range([25,375])

    let xAxis2 = tooltipSvg.append("g")
        .attr("transform", "translate(0," + 275 + ")")
        .call(d3.axisBottom(xScale))

    // get min and max life expectancy for US
    let pop = countryData.map((row) => parseInt(row["population"]));
    let populationLimits = [d3.min(pop),d3.max(pop)]
    // get scaling function for y axis
    let yScale = d3.scaleLinear()
        .domain([populationLimits[1], populationLimits[0]])
        .range([25,275])

    let yAxis2 = tooltipSvg.append("g")
        .attr("transform", "translate(" + 25 + ",0)")
        .call(d3.axisRight(yScale)
            .tickFormat(function(d) {
              var s = d/1000000;
              return s + "M";
            }))
    // d3's line generator
    let line = d3.line()
        .x(d => xScale(d['year'])) // set the x values for the line generator
        .y(d => yScale(d['population'])) // set the y values for the line generator

    // append line to svg
    tooltipSvg.append("path")
        // difference between data and datum:
        // https://stackoverflow.com/questions/13728402/what-is-the-difference-d3-datum-vs-data
        .datum(countryData)
        .attr("d", function(d) { return line(d) })
        .attr("fill", "steelblue")
        .attr("stroke", "steelblue")

    tooltipSvg.append('text')
      .attr('x', 100)
      .attr('y', 20)
      .style('font-size', '10pt')
      .text('Time vs Country for ' + country);
    tooltipSvg.append('text')
      .attr('x', 200)
      .attr('y', 298)
      .style('font-size', '8pt')
      .text('year');
    tooltipSvg.append('text')
      .attr('transform', 'translate(15, 200)rotate(-90)')
      .style('font-size', '8pt')
      .text('Population');
  }

  // make title and axes labels
  function makeLabels() {
    svgContainer.append('text')
      .attr('x', 100)
      .attr('y', 40)
      .style('font-size', '14pt')
      .text("Fertility vs Life Expectancy (1980)");

    svgContainer.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  // plot all the data points on the SVG
  // and add tooltip functionality
  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["population"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    // make tooltip
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    tooltipSvg = div.append("svg")
        .attr('width', 400)
        .attr('height', 300)


    // append data to SVG and plot as points
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => map.xScale(d['fertility']))
      .attr('cy', d => map.yScale(d['life_expectancy']))
        .attr('r', (d) => pop_map_func(d["population"]))
        .attr('stroke', "#4286f4")
        .attr('fill','white')
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          plotTooltip(d.country)
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
    let pop100 = data.filter(function(d) { return +d['population'] > 100000000 })

    svgContainer.selectAll('.text')
        .data(pop100)
        .enter()
        .append('text')
            .attr('x', function(d) { return map.xScale(+d['fertility']) + 20})
            .attr('y', function(d) { return map.yScale(+d['life_expectancy'])})
            .text(function(d) { return d['country'] })
  }

  // draw the axes and ticks
  function drawAxes(limits, x, y, container) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }
    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5]) // give domain buffer room
      .range([50, 450]);
    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    container.append("g")
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, 450]);
    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    container.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      xScale: xScale,
      yScale: yScale
    };
  }

  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);

    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

})();
