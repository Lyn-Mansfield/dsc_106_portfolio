import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}

// Define as global variables, but actually defined in renderScatterPlot()
let xScale = d3.scaleTime()
let yScale = d3.scaleLinear()

function processCommits(data) {
    return d3.groups(data, (d) => d.commit)
        .map(([commit, lines]) => {
            let first = lines[0];
            let { author, date, time, timezone, datetime } = first;
            let ret = {
                id: commit,
                url: 'https://github.com/Lyn-Mansfield/dsc_106_portfolio/commit/' + commit,
                author,
                date,
                time,
                timezone,
                datetime,
                hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
                totalLines: lines.length,
            };

            Object.defineProperty(ret, 'lines', {
                value: lines,
                configurable: false,
                writable: false,
                enumerable: false,
            });

            return ret;
        });
}
function renderCommitInfo(data, commits) {
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code" style="margin-left: 0.25rem;">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Add avg file length, rounded to 2 places
    const fileLengths = d3.rollups(
        data,
        (v) => d3.max(v, (v) => v.line),
        (d) => d.file,
    );
    const averageFileLength = d3.mean(fileLengths, (d) => d[1]).toFixed(2);
    dl.append('dt').html('Avg File Length');
    dl.append('dd').text(averageFileLength);

    // Add max file length
    const maxFileLength = d3.max(fileLengths, (d) => d[1]);
    dl.append('dt').html('Max File Length');
    dl.append('dd').text(maxFileLength);

    // Add avg line length, rounded to 2 places
    const averageLineLength = d3.mean(data, d => d.length).toFixed(2);
    dl.append('dt').html('Avg Line Length');
    dl.append('dd').text(averageLineLength);

    // Add max line length
    const maxLineLength = d3.max(data, d => d.length);
    dl.append('dt').html('Max Line Length');
    dl.append('dd').text(maxLineLength);
}

let data = await loadData();
let commits = processCommits(data);
renderCommitInfo(data, commits);

let brushController;

function renderScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;

    const [minDate, maxDate] = d3.extent(commits, (d) => d.datetime);
    const dateRange = maxDate - minDate;
    const padding = dateRange * 0.03; // 5% padding
    xScale = xScale
        .domain([minDate - padding, maxDate])
        .range([0, width])
        .nice();
    yScale = yScale
        .domain([0, 24])
        .range([height, 0]);

    const svg = d3
        .select('#chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('overflow', 'visible');
    brushController = createBrushSelector(svg); // attach a brush to svg

    // Preprocessing step
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3
        .scaleSqrt()
        .domain([minLines, maxLines])
        .range([3, 21]);

    const dots = svg.append('g').attr('class', 'dots');
    dots.selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });


    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale) // Set Y axis to actual clock times
        .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');
    // Attach X axis
    svg.append('g')
        .attr('transform', `translate(0, ${usableArea.bottom})`)
        .attr('class', 'x-axis')
        .call(xAxis);
    // Attach Y axis
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
        .attr('class', 'y-axis')
        .call(yAxis);
    // Add gridlines BEFORE the axes
    const gridlines = svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${usableArea.left}, 0)`);
    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));
}

renderScatterPlot(data, commits);

function renderTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
    const lines = document.getElementById('lines-edited');

    if (Object.keys(commit).length === 0) return;

    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
        dateStyle: 'full',
    });
    lines.textContent = data.filter(d => d.commit === commit.id).length;
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    const xOffset = 10;
    tooltip.style.left = `${event.clientX + xOffset}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg) {
    // Get dimensions
    const width = parseInt(svg.attr('width'));
    const height = parseInt(svg.attr('height'));

    // CRITICAL: Add background rect to capture mouse events
    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'transparent')
        .attr('pointer-events', 'all')
        .attr('class', 'brush-overlay');

    // Create brush
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on('start brush end', brushed);
    // Attach brush to a group, not directly to SVG
    svg.append('g')
        .attr('class', 'brush')
        .call(brush);

    // Raise dots and everything after overlay
    svg.selectAll('.dots, .overlay ~ *').raise();

    return { brush, brushGroup: svg.select('g.brush') };
}
function brushed(event) {
    const selection = event.selection;
    const selectedCommits = selection
        ? commits.filter((d) => isCommitSelected(selection, d))
        : [];
    renderSelectionCount(selectedCommits);
    colorSelectedCommits(selectedCommits);
    renderLanguageBreakdown(selectedCommits);
}
function isCommitSelected(selection, commit) {
    if (!selection) {
        return false;
    }
    const [x0, x1] = selection.map((d) => d[0]);
    const [y0, y1] = selection.map((d) => d[1]);
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function renderSelectionCount(selectedCommits) {
    const countElement = d3.select('#selection-count');
    countElement.select('dd').text(`${selectedCommits.length}`);
}
function colorSelectedCommits(selectedCommits) {
    const svg = d3.select('svg');

    // Remove selected class from all dots
    svg.selectAll('circle').classed('selected', false);
    // Add selected class to dots matching selected commit IDs
    selectedCommits.forEach(selectedCommit => {
        svg.selectAll('circle')
            .filter(d => d.id === selectedCommit.id)  // Match by ID
            .classed('selected', true);
    });
}

function renderLanguageBreakdown(selectedCommits) {
    const container = document.getElementById('language-breakdown');

    if (selectedCommits.length === 0) {
        container.innerHTML = '';
        return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);

    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
        lines,
        (v) => v.length,
        (d) => d.type,
    );

    // Update DOM with breakdown
    container.innerHTML = '';

    for (const [language, count] of breakdown) {
        const proportion = count / lines.length;
        const formatted = d3.format('.1~%')(proportion);

        container.innerHTML += `
            <dt>${language.toUpperCase()}</dt>
            <dd>${count} lines (${formatted})</dd>
        `;
    }
}

let commitProgress = 100;
// Will get updated as user changes slider
let filteredCommits = commits;

let timeScale = d3
    .scaleTime()
    .domain([
        d3.min(commits, (d) => d.datetime),
        d3.max(commits, (d) => d.datetime),
    ])
    .range([0, 100]);
let commitMaxTime = timeScale.invert(commitProgress);

const commitProgressInput = document.getElementById('commit-progress');
const commitTimeDisplay = document.getElementById('commit-time');

function onTimeSliderChange() {
    commitProgress = +commitProgressInput.value;
    commitMaxTime = timeScale.invert(commitProgress);
    commitTimeDisplay.textContent = commitMaxTime.toLocaleString('en', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);
    updateScatterPlot(data, filteredCommits);
    updateBrushSelection();
    updateFileDisplay(filteredCommits);
}
commitProgressInput.addEventListener('input', onTimeSliderChange);
onTimeSliderChange(); // Initialize display on page load

function updateScatterPlot(data, commits) {
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };

    const svg = d3.select('#chart').select('svg');

    xScale = xScale.domain(d3.extent(commits, (d) => d.datetime));

    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

    const xAxis = d3.axisBottom(xScale);
    // CHANGE: we should clear out the existing xAxis and then create a new one.
    const xAxisGroup = svg.select('g.x-axis');
    xAxisGroup.selectAll('*').remove();
    xAxisGroup.call(xAxis);

    const dots = svg.select('g.dots');

    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
    dots
        .selectAll('circle')
        .data(sortedCommits, (d) => d.id)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines))
        .attr('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', (event, commit) => {
            d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
            renderTooltipContent(commit);
            updateTooltipVisibility(true);
            updateTooltipPosition(event);
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).style('fill-opacity', 0.7);
            updateTooltipVisibility(false);
        });
}

function updateBrushSelection() {
    const currentSelection = d3.brushSelection(brushController.brushGroup.node());
    if (currentSelection) {
        brushController.brushGroup.call(brushController.brush.move, currentSelection);
    }
}

function updateFileDisplay(filteredCommits) {
    let lines = filteredCommits.flatMap((d) => d.lines);
    let files = d3
        .groups(lines, (d) => d.file)
        .map(([name, lines]) => {
            return { name, lines };
        })
        .sort((a, b) => b.lines.length - a.lines.length);

    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let filesContainer = d3
        .select('#files')
        .selectAll('div')
        .data(files, (d) => d.name)
        .join(
            (enter) =>
                enter.append('div').call((div) => {
                    div.append('dt').append('code');
                    div.append('dd');
                }),
        )


    // Append one div for each line
    filesContainer
        .select('dd')
        .selectAll('div')
        .data((d) => d.lines)
        .join('div')
        .attr('class', 'loc')
        .attr('style', (d) => `--color: ${colors(d.type)}`);

    // Update file names
    filesContainer.select('dt > code').text((d) => d.name);
}