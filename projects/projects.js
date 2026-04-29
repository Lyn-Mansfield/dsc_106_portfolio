import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Pie Chart Block
let selectedIndex = -1;
let selectedYear = -1;
function updateSelectedYear(newYear) {
    selectedYear = newYear;
    // Set text box to reflect current year selection
    d3.select('p')
    .text(selectedYear !== -1 ? `Current year selected: ${selectedYear}` : '');
}

function renderPieChart(projectsGiven) {
    let rolledData = d3.rollups(
        projectsGiven,
        (v) => v.length,
        (d) => d.year,
    );
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });

    // Update selectedIndex if possible if selectedYear is in use
    if (selectedYear !== -1) {
        selectedIndex = data.findIndex(item => item.label === selectedYear); // Defaults to -1 if not found
        if (selectedIndex === -1) {
            updateSelectedYear(-1);
        }
    }
    // Clear old data
    let newSVG = d3.select('svg');
    newSVG.selectAll('path').remove();
    let newLegend = d3.select('.legend');
    newLegend.selectAll('li').remove();
    // Define each new arc piece
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    // Draw each arc piece to make a whole pie chart
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let arcs = arcData.map((d) => arcGenerator(d));
    arcs.forEach((arc, i) => {
        newSVG
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(i))
        .on('click', () => {
            selectedIndex = selectedIndex === i ? -1 : i;
            newSelectedYear = selectedIndex === -1 ? -1 : data[i].label;
            updateSelectedYear(newSelectedYear);

            newSVG
            .selectAll('path')
            .attr('class', (_, idx) => (
                idx === selectedIndex ? "selected" : null
            )); // make class selected if it's the selected slice, otherwise no class 
            
            newLegend
            .selectAll('li')
            .attr('class', (_, idx) => (
                idx === selectedIndex ? "selected" : null
            ));

            displayFilteredProjects("new year");
        })
    });
    console.log("Successfully rendered projects pie chart!")

    // Add new legend data
    data.forEach((d, i) => {
        newLegend
        .append('li')
        .attr('style', `--color:${colors(i)}`) // set the style attribute while passing in parameters
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); // set the inner html of <li>
    });
    
    console.log("Successfully rendered projects pie chart legend!")
}

// Search Bar Block
let queryFilter = '';
let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
    // Update query value
    queryFilter = event.target.value;
    displayFilteredProjects("new query");
});

function displayFilteredProjects(updateEvent) {
    let filteredProjects = allProjects.filter((project) => {
        // Text filter
        let values = Object.values(project).join('\n').toLowerCase();
        let matchesText = values.includes(queryFilter.toLowerCase());

        // Year filter
        let matchesYear = true; // default to true if no year filter is in effect
        if (selectedYear !== -1) {
            matchesYear = project.year === selectedYear;
        }
        
        return matchesText && matchesYear;
    });
    // Render filtered projects
    if (updateEvent === "new query") {
        renderPieChart(filteredProjects); // don't update pie chart if we're just selecting a new year
    }
    renderProjects(filteredProjects, projectsContainer, 'h2');
}

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