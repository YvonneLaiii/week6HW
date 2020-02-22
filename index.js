'use strict';

(function() {

  let data = "";
  let csvData = "";
  let svgContainer = "";
  let tooltipSvg = "";
  let div = ""
  let width = 500;
  let height = 500;

  window.onload = function() {
    svgContainer = d3.select('body')
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    d3.csv("gapminder.csv")
      .then((data) => makeScatterPlot(data));
  }

  function makeScatterPlot(csvD) {
    csvData = csvD
    data = csvData.filter(function(d){return d.year==1980})
    let axesLimits = findMinMax(data.map((row) => parseFloat(row["fertility"])), data.map((row) => parseFloat(row["life_expectancy"])));
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    plotData(mapFunctions);

    makeLabel();
  }

  function plotTooltip(country) {
    tooltipSvg.selectAll("*").remove();
    let countryData = csvData.filter(function(d){return d.country==country})
    let yearLimits = d3.extent(countryData, d => d['year'])
    let xScale = d3.scaleLinear()
        .domain([yearLimits[0], yearLimits[1]])
        .range([25,375])

    let xAxis2 = tooltipSvg.append("g")
        .attr("transform", "translate(0," + 275 + ")")
        .call(d3.axisBottom(xScale))
    let pop = countryData.map((row) => parseInt(row["population"]));
    let populationLimits = [d3.min(pop),d3.max(pop)]
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
    let line = d3.line()
        .x(d => xScale(d['year']))
        .y(d => yScale(d['population']))

    tooltipSvg.append("path")
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

  function makeLabel() {
    svgContainer.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .style('font-size', '16pt')
      .text("Fertility vs Life Expectancy (1980)");

    svgContainer.append('text')
      .attr('x', width/2)
      .attr('y', height - 10)
      .style('font-size', '10pt')
      .text('Fertility');

    svgContainer.append('text')
      .attr('transform', 'translate(10, '+(height/2)+')rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy');
  }

  function plotData(map) {
    let xMap = map.xScale;
    let yMap = map.yScale;


    let pop = data.map((row) => +row["population"]);
    let pLimit = d3.extent(pop);
    let popFunc = d3.scaleLinear()
      .domain([pLimit[0], pLimit[1]])
      .range([3, 20]);

    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    tooltipSvg = div.append("svg")
        .attr('width', width-100)
        .attr('height', height-200)

    svgContainer.selectAll('.dots')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xMap(d['fertility']))
      .attr('cy', d => yMap(d['life_expectancy']))
        .attr('r', (d) => popFunc(d["population"]))
        .attr('stroke', "#0000FF")
        .attr('fill','white')
        .on("mouseover", (d) => {
          plotTooltip(d.country)
          div.transition()
            .duration(800)
            .style("opacity", 1);
          div.style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 50) + "px");
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
    let million = data.filter(function(d) { return +d['population'] > 100000000 })

    svgContainer.selectAll('.text')
        .data(million)
        .enter()
        .append('text')
            .attr('x', function(d) { return xMap(+d['fertility']) + 20})
            .attr('y', function(d) { return yMap(+d['life_expectancy'])})
            .text(function(d) { return d['country'] })
  }

  function drawAxes(limits, x, y) {
    let xValue = function(d) { return +d[x]; }
    let xScale = d3.scaleLinear()
      .domain([limits.xMin - 0.5, limits.xMax + 0.5])
      .range([50, width-50]);
    let xAxis = d3.axisBottom().scale(xScale);
    svgContainer.append("g")
      .attr('transform', 'translate(0, '+(height-50)+')')
      .call(xAxis);

    let yValue = function(d) { return +d[y]}

    let yScale = d3.scaleLinear()
      .domain([limits.yMax + 5, limits.yMin - 5]) // give domain buffer
      .range([50, height-50]);
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    return {
      xScale: xScale,
      yScale: yScale
    };
  }

  function findMinMax(x, y) {
    let xMin = d3.min(x);
    let xMax = d3.max(x);
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

})();
