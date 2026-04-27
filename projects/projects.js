import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Pie Chart Block

// Define each arc piece
let data = [
  { value: 1, label: 'apples' },
  { value: 2, label: 'oranges' },
  { value: 3, label: 'mangos' },
  { value: 4, label: 'pears' },
  { value: 5, label: 'limes' },
  { value: 5, label: 'cherries' },
];

let colors = d3.scaleOrdinal(d3.schemeTableau10);
let sliceGenerator = d3.pie().value((d) => d.value);
let arcData = sliceGenerator(data);
// Draw each arc piece to make a whole pie chart
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arcs = arcData.map((d) => arcGenerator(d));
arcs.forEach((arc, i) => {
  d3.select('svg')
  .append('path')
  .attr('d', arc)
  .attr('fill', colors(i));
});
console.log("Successfully rendered projects pie chart!")

// Render pie chart legend
let legend = d3.select('.legend');
data.forEach((d, i) => {
  legend
  .append('li')
  .attr('style', `--color:${colors(i)}`) // set the style attribute while passing in parameters
  .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
});
console.log("Successfully rendered projects pie chart legend!")

// Import Projects Data Block
const projects = await fetchJSON('../lib/projects.json');
// Update title
const projectnum = await projects.length;
const projectTitle = document.querySelector('#project-title');
projectTitle.innerText = `${projectnum} Projects`;
// Fill page with actual projects
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');