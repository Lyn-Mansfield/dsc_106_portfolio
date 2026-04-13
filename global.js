console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Generate nav menu 
let pages = [
  { url: '', title: 'Home' },
  { url: 'projects/', title: 'Projects' },
  { url: 'contact/', title: 'Contact' },
  { url: 'https://github.com/Lyn-Mansfield', title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"                            // Local server
  : "/dsc_106_portfolio/";         // GitHub Pages repo name

for (let p of pages) {
  let url = p.url;
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let title = p.title;
  
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

// Identify current page nav link and give it appropriate tag
let navLinks = $$("nav a")
let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname,
);

console.log(currentLink)

if (currentLink !== undefined) {
  currentLink.classList.add('current');
}