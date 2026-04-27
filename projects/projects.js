import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Pie Chart Block
let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let arc = arcGenerator({
    startAngle: 0,
    endAngle: 2 * Math.PI,
});
d3.select('svg').append('path').attr('d', arc).attr('fill', 'red');

// Calculate total length of data
let data = [1, 2];
let total = 0;
for (let d of data) {
  total += d;
}

let angle = 0;
let arcData = [];
// Define each arc piece
for (let d of data) {
    total += d;
    let endAngle = angle + (d / total) * 2 * Math.PI;
    arcData.push({ startAngle: angle, endAngle });
    angle = endAngle;
}
// Draw each arc piece to make a whole pie chart
let arcs = arcData.map((d) => arcGenerator(d));
arcs.forEach((arc) => {
    d3.select('svg').append('path').attr('d', arc).attr('fill', () => d3.scaleOrdinal(d3.schemeCategory10)(Math.random()));
});

// Import Projects Data Block
const projects = await fetchJSON('../lib/projects.json');
// Update title
const projectnum = await projects.length;
const projectTitle = document.querySelector('#project-title');
projectTitle.innerText = `${projectnum} Projects`;
// Fill page with actual projects
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');