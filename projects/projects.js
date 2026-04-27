import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Pie Chart Block

// Define each arc piece
let data = [1, 2, 3, 4, 5, 5];
let sliceGenerator = d3.pie();
let arcData = sliceGenerator(data);
// Draw each arc piece to make a whole pie chart
let arcs = arcData.map((d) => arcGenerator(d));
arcs.forEach((arc) => {
    d3.select('svg')
    .append('path')
    .attr('d', arc)
    .attr('fill', () => d3.scaleOrdinal(d3.schemeCategory10)(Math.random()));
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