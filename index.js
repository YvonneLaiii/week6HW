// 'use strict';
// (function() {
//   let data = "";
//   let svgContainer = "";
//   let width = 700;
//   let height = 700;
//   window.onload = function() {
//     svgContainer = d3.select('body')
//       .append('svg')
//       .attr('width', width)
//       .attr('height', height);
//
//     d3.csv("gapminder.csv")
//       .then((csvData) => data = csv)
//       .then(() => makeScatterPlot());
//
//   }
//
//   function makeScartterPlot(csv) {
//     data = csv.filter(function(d){return d.year>=1980});
//
//
//     filteredData = [];
//     for (let i = 0; i < data.length; i++) {
//       if (data)
//     }
//
//     makeLabel();
//     let fertility = data.map((row) => parseFloat(row["fertility"]));
//     let lifeExpectancy = data.map((row) => parseFloat(row["life_expectancy"]));
//     let limits = findMinMax(fertility, lifeExpectancy);
//     let mapFunctions = drawTicks(limits);
//     plotData(mapFunctions);
//   }
//
//   function makeLabel() {
//
//   }
//   function plotData(map) {
//
//   }
//
//
//   function drawTicks(limits) {
//     let xValue = function(d) { return + d["Sp. Def"];}
//
//     let xScale = d3.scaleLinear()
//       .domain([limits.xMin-10, limits.xMax - 10])
//       .range([50, width - 50]);
//
//     let xMap = function(d) { return xScale(xValue(d)); };
//     let xAxis = d3.axisBottom().scale(xScale);
//
//     svgContainer.append("g")
//       .attr('transform', 'translate(0, '+(heigh-50)+')')
//       .call(xAxis);
//
//     let yValue = function(d) { return + d['Total']}
//     let yScale = d3.scaleLinear()
//       .domain([limits.yMax, limits.yMin - 40]) // give domain buffer
//       .range([50, heigh-50]);
//
//     let yMap = function (d) { return yScale(yValue(d)); };
//     let yAxis = d3.axisLeft().scale(yScale);
//
//     svgContainer.append('g')
//       .attr('transform', 'translate(50, 0)')
//       .call(yAxis);
//
//     return {
//       x: xMap,
//       y: yMap,
//       xScale: xScale,
//       yScale: yScale,
//       color: color
//     };
//   }
//

//
// })
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
    data = csvD.filter(function(d){return d.year==1980}) // assign data as global variable
    csvData = csvD
    let fertility = data.map((row) => parseFloat(row["fertility"]));
    let lifeExpectancy = data.map((row) => parseFloat(row["life_expectancy"]));
    let axesLimits = findMinMax(fertility, lifeExpectancy);
    let mapFunctions = drawAxes(axesLimits, "fertility", "life_expectancy");

    plotData(mapFunctions);

    makeLabels();
  }

  function plotTooltip(country) {
    tooltipSvg.selectAll("*").remove();
    let countryData = csvData.filter(function(d){return d.country==country})
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

  function plotData(map) {
    let pop = data.map((row) => +row["population"]);
    let pLimit = d3.extent(pop);
    let popFunc = d3.scaleLinear()
      .domain([pLimit[0], pLimit[1]])
      .range([3, 20]);

    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    tooltipSvg = div.append("svg")
        .attr('width', 400)
        .attr('height', 300)

    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => map.xScale(d['fertility']))
      .attr('cy', d => map.yScale(d['life_expectancy']))
        .attr('r', (d) => popFunc(d["population"]))
        .attr('stroke', "#4286f4")
        .attr('fill','white')
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
