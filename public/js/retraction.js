/* global d3, $ */

// Dummy Values
var values = {
  continentYear: [5, 5, 10, 15, 20],
  countryYear: [10, 5, 15, 30, 10],
  journalYear: [5, 10, 3, 20, 15]
};


function updateGraph(newData) {
  var svg;
  var rects;
  var x = d3.scale.linear()
              .domain([0, d3.max(newData)])
              .range([0, 420]);

  /* Drop any existing SVG elements */
  Array.prototype.forEach.call(document.getElementsByClassName("chart"),
                               function dropInnerHTMLOf(element) {
                                 /* Drop everything inside this chart */
                                 element.innerHTML = "";  // eslint-disable-line no-param-reassign
                               });

  svg = d3.select("div.chart")
          .append("svg")
          .attr("class", "svgchart")
          .attr("width", 960)
          .attr("height", 500);

  rects = svg.selectAll("rect")
             .data(newData)
             .enter()
             .append("rect");

  rects.attr("width", function setWidthFromScale(d) {
    return x(d);
  })
  .attr("height", 20)
  .attr("y", function setYFromIndex(d, i) {
    return 30 * i;
  });
}

// updates graph
function updateSelection() {
    // make function to remove before every update
  var x = document.getElementById("graphs").value;
  updateGraph(values[x]); // adding string rather than selection and doesnt remove old selections
}

document.addEventListener("DOMContentLoaded", function onDOMContentLoad() {
  updateSelection(values.journalYear);
});
