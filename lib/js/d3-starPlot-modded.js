// modified to be compatible with d3v4
// source: https://github.com/kevinschaul/d3-star-plot/blob/master/src/d3-starPlot.js

d3.starPlot = function() {
  var width = 200,
      margin = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      },
      labelMargin = 25,
      includeGuidelines = true,
      includeLabels = true,
      includeChart = true,
      includePoints = false,
      properties = [],
      scales = [],
      labels = nop,
      title = nop,

      g,
      datum,
      radius = width / 2,
      rotate = 0,
      origin = [radius, radius],
      radii = properties.length,
      radians = 2 * Math.PI / radii,
      zeroValue = 10, // radius in % of minimum value
      scale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, radius])

  function chart(selection) {
    if(selection.empty()) {
      console.error("Selection is not defined");
    }
    datum = selection.datum();
    g = selection
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    if (includeGuidelines) {
      drawGuidelines();
    }

    if(includeChart){
      drawChart();
    }

    if (includeLabels) {
      drawLabels();
    }
  }

  function drawGuidelines() {
    var r = rotate;
    properties.forEach(function(d, i) {
      var l, x, y;

      l = radius;
      x = l * Math.cos(r);
      y = l * Math.sin(r);
      g.append('line')
        .attr('class', 'star-axis')
        .attr('x1', origin[0])
        .attr('y1', origin[1])
        .attr('x2', origin[0] + x)
        .attr('y2', origin[1] + y)
        .attr('id', d);

      g.append('circle')
        .classed('data-point', true)
        .attr('cx', origin[0] + l * Math.cos(r))
        .attr('cy', origin[1] + l * Math.sin(r))
        .attr('r', 2.5).attr('fill', 'black');

      // outer line
      // x2 = l * Math.cos(r + radians);
      // y2 = l * Math.sin(r + radians);
      // g.append('line')
      //   .attr('class', 'star-axis-outer')
      //   .attr('x1', origin[0] + x).attr('y1', origin[1] + y)
      //   .attr('x2', origin[0] + x2).attr('y2', origin[1] + y2);

      // inner line (halfway point)
      // l = (radius - scale(zeroValue))/2 + scale(zeroValue);
      // x = l * Math.cos(r);
      // y = l * Math.sin(r);
      // x2 = l * Math.cos(r + radians);
      // y2 = l * Math.sin(r + radians);
      // g.append('line')
      //   .attr('class', 'star-axis-inner')
      //   .attr('x1', origin[0] + x).attr('y1', origin[1] + y)
      //   .attr('x2', origin[0] + x2).attr('y2', origin[1] + y2);

      // inner line (zero point)
      l = scale(zeroValue);
      x = l * Math.cos(r);
      y = l * Math.sin(r);
      x2 = l * Math.cos(r + radians);
      y2 = l * Math.sin(r + radians);
      g.append('line')
        .attr('class', 'star-axis-inner')
        .attr('x1', origin[0] + x).attr('y1', origin[1] + y)
        .attr('x2', origin[0] + x2).attr('y2', origin[1] + y2);

      r += radians;
    });
  }

  function drawLabels() {
    var r = rotate;
    const labelArrayHandler = (labels, labelElement) => {
      labels.forEach((d, i) => {
        labelElement.append("tspan")
          .attr('x', labelElement.attr('x')).attr('dy', i == 0 ? '-1em' : '1.2em')
          .text(d);
      });
    };
    g.selectAll('text.star-label').remove();

    properties.forEach(function(d, i) {
      var l, x, y;

      l = radius;
      x = (l + labelMargin) * Math.cos(r);
      y = (l + labelMargin) * Math.sin(r);
      let labelElement = g.append('text')
        .attr('class', 'star-label')
        .attr('x', origin[0] + x + (x > l*0.75 ? l*0.15 : 0) + (x < -l*0.75 ? -l*0.15 : 0))
        .attr('y', origin[1] + y)
        .style('text-anchor', 'middle')
        .style('dominant-baseline', 'central')
        .attr('id', d.replace(/ /g, '-'));

      if(typeof labels === "function"){
        let text = labels(labelElement, datum, d);
        if(text !== undefined){
          if (Array.isArray(text)) {
            labelArrayHandler(text,labelElement);
          } else {
            labelElement.text(text);
          }
        }
      }else if(Array.isArray(labels[i])){
        labelArrayHandler(labels[i], labelElement);
      }else{
        labelElement.text(labels[i]);
      }

      r += radians;
    })
  }

  function drawChart() {
    g.append('circle')
      .attr('class', 'star-origin')
      .attr('cx', origin[0])
      .attr('cy', origin[1])
      .attr('r', 2)

    var path = d3.radialLine()

    var pathData = [];
    var r = Math.PI / 2 + rotate;
    var pointR = rotate;
    var minValue = scale(zeroValue);
    properties.forEach(function(d, i) {
      var userScale = scales[i] || scales[0];
      const endpoint = [r,scale(userScale(datum[d]))]; // -> need to convert (theta, r) -> (x,y)
      pathData.push(endpoint);
      g.append('circle')
        .classed('data-point', true)
        .attr('cx', origin[0] + endpoint[1] * Math.cos(pointR))
        .attr('cy', origin[1] + endpoint[1] * Math.sin(pointR))
        .attr('r', 2.5).attr('fill', 'black')
        .attr("data-value",d);

      if (includeLabels) {
        g.append('text')
          .classed('data-point', true)
          .attr('x', origin[0] + (endpoint[1] + radius*0.1) * Math.cos(pointR))
          .attr('y', origin[1] + (endpoint[1] + radius*0.1) * Math.sin(pointR))
          .text(datum[d]);
      }

      // add spoke edge point
      pathData.push([r + radians/2, minValue]);
      r += radians;
      pointR += radians;
    });

    if(pathData.length > 0){
      g.append('path')
        .attr('class', 'star-path')
        .attr('transform', 'translate(' + origin[0] + ',' + origin[1] + ')')
        .attr('d', path(pathData) + 'Z');
    }

    g.append('text')
      .attr('class', 'star-title')
      .attr('x', origin[0])
      .attr('y', -(margin.top / 2))
      .text(title(datum))
      .style('text-anchor', 'middle')
  }

  function drawInteraction() {
    let pathGenerator = d3.line()
      .x(d => d[0]).y(d => d[1]);

    let r = rotate;
    const halfRadians = radians / 2;

    properties.forEach((d,i) => {
      let userScale = scales[i] || scales[0];
      let x1 = radius * Math.cos(r + halfRadians),
        y1 = radius * Math.sin(r + halfRadians),
        x2 = radius * Math.cos(r),
        y2 = radius * Math.sin(r),
        x3 = radius * Math.cos(r - halfRadians),
        y3 = radius * Math.sin(r - halfRadians);
      
      let datumToBind = {
        key: properties[i],
        datum: datum,
        x: scale(userScale(datum[d])) * Math.cos(r) + origin[0],
        y: scale(userScale(datum[d])) * Math.sin(r) + origin[1]
      };

      let pathData = [
        [origin[0], origin[1]],
        [origin[0] + x1, origin[1] + y1],
        [origin[0] + x2, origin[1] + y2],
        [origin[0] + x3, origin[1] + y3]
      ];

      g.append('path')
        .datum(datumToBind)
        .attr('id',d).attr('class', 'star-interaction')
        .attr('d', pathGenerator(pathData) + 'Z');

      r += radians;
    });
  }

  function nop() {
    return;
  }

  chart.rotate = function(degrees) {
    rotate = (degrees || 0) * (Math.PI / 180);
    return chart;
  };

  chart.interaction = function() {
    drawInteraction();
  };

  chart.properties = function(_) {
    if (!arguments.length) return properties;
    properties = _;
    radii = properties.length;
    radians = 2 * Math.PI / radii;
    return chart;
  };

  chart.scales = function(_) {
    if (!arguments.length) return scales;
    if (Array.isArray(_)) {
      scales = _;
    } else {
      scales = [_];
    }
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    radius = width / 2;
    origin = [radius, radius];
    scale.range([0, radius])
    return chart;
  };

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin = _;
    origin = [radius, radius];
    return chart;
  };

  chart.labelMargin = function(_) {
    if (!arguments.length) return labelMargin;
    labelMargin = _;
    return chart;
  };

  chart.title = function(_) {
    if (!arguments.length) return title;
    title = _;
    return chart;
  };

  chart.labels = function(_) {
    if (!arguments.length) return labels;
    labels = _;
    return chart;
  };

  chart.includeGuidelines = function(_) {
    if (!arguments.length) return includeGuidelines;
    includeGuidelines = _;
    return chart;
  };

  chart.includeLabels = function(_) {
    if (!arguments.length) return includeLabels;
    includeLabels = _;
    return chart;
  };

  chart.includeChart = function (_) {
    if (!arguments.length) return includeChart;
    includeChart = _;
    return chart;
  };

  chart.includePoints = function (_) {
    if (!arguments.length) return includePoints;
    includePoints = _;
    return chart;
  };

  chart.zeroValue = function(_) {
    if (!arguments.length) return zeroValue;
    zeroValue = _;
    return chart;
  };

  return chart;
}
