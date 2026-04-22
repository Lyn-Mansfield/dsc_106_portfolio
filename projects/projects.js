import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
// Update title
const projectnum = await projects.length;
const projectTitle = document.querySelector('.project-title');
projectTitle.innerText(`${projectnum} Projects`);
// Fill page with actual projects
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');