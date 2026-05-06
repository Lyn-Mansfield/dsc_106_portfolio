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
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
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
console.log(commits);

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
    createBrushSelector(svg); // attach a brush to svg

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
        .call(xAxis);
    // Attach Y axis
    svg.append('g')
        .attr('transform', `translate(${usableArea.left}, 0)`)
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