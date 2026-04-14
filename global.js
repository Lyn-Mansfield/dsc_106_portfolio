console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// Add nav menu 
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

// Add all pages to nav menu
for (let p of pages) {
  let url = p.url;
  url = !url.startsWith('http') ? BASE_PATH + url : url;
  let title = p.title;
  
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname,
  );
  nav.append(a);   
}

// Add light/dark mode selector label
let auto_option = matchMedia("(prefers-color-scheme: light)") ? "light" : "dark";
print(auto_option)
document.body.insertAdjacentHTML(
  'afterbegin',
  `
	<label class="color-scheme">
		Theme:
		<select>
			<option value="light dark"> Auto (${auto_option}) </option>
            <option value="light"> Light </option>
            <option value="dark"> Dark </option>
		</select>
	</label>`,
);

// Listener for changing modes
let select = document.querySelector(selector)
select.addEventListener('input', function (event) {
  console.log('color scheme changed to', event.target.value);
  document.documentElement.style.setProperty('color-scheme', event.target.value);
});