console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

let pages = [
  { url: '/dsc_106_portfolio`', title: 'Home' },
  { url: '/dsc_106_portfolio/projects/', title: 'Projects' },
  { url: '/dsc_106_portfolio/contact/', title: 'Contact' },
  { url: 'https://github.com/Lyn-Mansfield', title: 'GitHub' },
];

let nav = document.createElement('nav');
document.body.prepend(nav);

for (let p of pages) {
  let url = p.url;
  let title = p.title;
  nav.insertAdjacentHTML('beforeend', `<a href="${url}">${title}</a>`);
}

let currentLink = navLinks.find(
  (a) => a.host === location.host && a.pathname === location.pathname,
);

if (currentLink !== undefined) {
  currentLink.classList.add('current');
}