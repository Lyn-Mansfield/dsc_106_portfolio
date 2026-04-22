console.log('GOOD MORNING ROKU CITY :D');

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
    ? "/"                    // Local server
    : "/dsc_106_portfolio/"; // GitHub Pages repo name

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
function getSystemPreference() {
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Make auto option capital case
let auto_option = getSystemPreference()
auto_option = auto_option.charAt(0).toUpperCase() + auto_option.slice(1);
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

// Function for changing color scheme
function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    console.log('color scheme changed to', colorScheme);
    // If using auto color, see what color is preferred
    if (colorScheme === 'light dark') {
        colorScheme = getSystemPreference();
    }
    // Apply different styling if using dark mode
    if (colorScheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    console.log('currently using', colorScheme, 'mode');
}

// Listener for changing modes
let select = document.querySelector("select");

select.addEventListener('input', function (event) {
    setColorScheme(event.target.value);
    // Remember chosen value
    localStorage.colorScheme = event.target.value;
});

// Load saved color mode if remembered
if ("colorScheme" in localStorage) {
    console.log("Previous color scheme save found! Loading...");
    setColorScheme(localStorage.colorScheme);
    // Set select element to same setting to maintain parity
    select.value = localStorage.colorScheme;
}

// Listener for correcting contact form
let contactForm = document.querySelector("form")
contactForm?.addEventListener('submit', function (event) {
    event.preventDefault();

    let data = new FormData(contactForm);
    let url = contactForm.action + "?";
    for (let [name, value] of data) {
        console.log(name, encodeURIComponent(value))
        url = url + name + "=" + encodeURIComponent(value) + "&";
    }
    console.log(url);
    location.href = url;
})

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}


export function renderProjects(projects, containerElement, headingLevel='h2') {
    if (containerElement === null) {
        throw new Error('containerElement cannot be null');
    }
    // Should be given a JS array, not a JSON string
    if (!Array.isArray(projects)) {
        throw new Error('projects should be valid JSON');
    }

    containerElement.innerHTML = '';
    projects.forEach(project => {
        console.log(project);
        const article = document.createElement('article');
        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="${project.title}">
            <p>${project.description}</p>
        `;
        containerElement.appendChild(article);
    });
}