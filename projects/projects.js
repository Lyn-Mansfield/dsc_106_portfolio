import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Pie Chart Block
let selectedIndex = -1;
function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Clear old svg data to prevent overlap
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    // Define each new arc piece
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
        .attr('fill', colors(i))
        .on('click', () => {
            selectedIndex = selectedIndex === i ? -1 : i;
            
            d3.select('svg')
            .selectAll('path')
            .attr('class', (_, idx) => (
                idx === selectedIndex ? "selected" : null
            )) // make class selected if it's the selected slice, otherwise no class 
        })
    });
    console.log("Successfully rendered projects pie chart!")

    // Render new pie chart legend
    let legend = d3.select('.legend');
    // Clear old legend
    legend.selectAll('li').remove();
    data.forEach((d, i) => {
        legend
        .append('li')
        .attr('style', `--color:${colors(i)}`) // set the style attribute while passing in parameters
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
    console.log("Successfully rendered projects pie chart legend!")
}

// Search Bar Block
let query = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
    // Update query value
    query = event.target.value;
    // Filter projects
    let filteredProjects = allProjects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query.toLowerCase());
    });
    // Render filtered projects
    renderPieChart(filteredProjects);
    renderProjects(filteredProjects, projectsContainer, 'h2');
});

// Import Projects Data Block
const allProjects = await fetchJSON('../lib/projects.json');
// Update title
const projectnum = await allProjects.length;
const projectTitle = document.querySelector('#project-title');
projectTitle.innerText = `${projectnum} Projects`;
// Fill page with all projects initially
const projectsContainer = document.querySelector('.projects');
renderPieChart(allProjects);
renderProjects(allProjects, projectsContainer, 'h2');