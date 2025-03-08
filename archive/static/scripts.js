let showingAllLines = true;
let viewMode = 'all'; // 'all' or 'changes'

function showAll() {
  const rows = document.querySelectorAll(".diff-body .diff-row");
  rows.forEach(row => {
    row.style.display = "";
    row.classList.remove('context-row');
  });
  viewMode = 'all';
  showingAllLines = true;
}

function hideUnchangedAndFocus() {
  const rows = document.querySelectorAll(".diff-body .diff-row");
  let hasHiddenRows = false;

  rows.forEach(row => {
    row.classList.remove('context-row');
    if (!row.innerHTML.includes("diff_add") &&
      !row.innerHTML.includes("diff_sub") &&
      !row.innerHTML.includes("diff_chg")) {
      row.style.display = "none";
      hasHiddenRows = true;
    }
  });

  // Scroll to first change
  if (hasHiddenRows) {
    const firstChange = document.querySelector(".diff_add, .diff_sub, .diff_chg");
    if (firstChange) {
      firstChange.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  viewMode = 'changes';
  showingAllLines = false;
}

function toggleChangesView() {
  const button = document.getElementById('toggleChangesBtn');

  if (showingAllLines) {
    // Currently showing all lines, switch to changes only
    hideUnchangedAndFocus();
    button.textContent = 'Show All Lines';
  } else {
    // Currently showing changes only, switch to all lines
    showAll();
    button.textContent = 'Focus on Changes';
  }
}

function searchInDiff(query) {
  if (!query) return;

  // Case-insensitive search
  const searchRegex = new RegExp(query, 'i');
  const rows = document.querySelectorAll('.diff-body .diff-row');
  let foundAny = false;

  // First, remove any existing highlights
  document.querySelectorAll('.search-highlight').forEach(el => {
    el.outerHTML = el.innerHTML;
  });

  // Then search and highlight
  rows.forEach(row => {
    const text = row.textContent;
    if (searchRegex.test(text)) {
      foundAny = true;
      row.style.display = '';

      // Highlight the matching text
      const contentCells = row.querySelectorAll('.content');
      contentCells.forEach(cell => {
        const html = cell.innerHTML;
        cell.innerHTML = html.replace(
          new RegExp(`(${query})`, 'gi'),
          '<span class="search-highlight">$1</span>'
        );
      });

      // Scroll to the first match
      if (!document.querySelector('.scrolled-to')) {
        row.classList.add('scrolled-to');
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (!row.querySelector('.diff_add, .diff_sub') && !showingAllLines) {
      row.style.display = 'none';
    }
  });

  if (!foundAny) {
    alert('No matches found for: ' + query);
  }
}

// Initialize the UI
document.addEventListener('DOMContentLoaded', function () {
  // Add controls to the UI
  const controls = document.querySelector('.controls');
  if (controls) {
    // Add a search box
    const searchBox = document.createElement('div');
    searchBox.className = 'search-box';
    searchBox.innerHTML = `
      <input type="text" id="searchInput" placeholder="Search in diff...">
      <button id="searchBtn">Search</button>
    `;
    controls.appendChild(searchBox);

    // Initialize the search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    searchBtn.addEventListener('click', function () {
      searchInDiff(searchInput.value);
    });

    searchInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchInDiff(searchInput.value);
      }
    });

    // Set initial button text
    const toggleBtn = document.getElementById('toggleChangesBtn');
    if (toggleBtn) {
      toggleBtn.textContent = 'Focus on Changes';
    }
  }

  // Add hover effect to highlight corresponding lines
  const diffRows = document.querySelectorAll('.diff-body .diff-row');
  diffRows.forEach(row => {
    row.addEventListener('mouseenter', function () {
      this.classList.add('highlight-row');
    });
    row.addEventListener('mouseleave', function () {
      this.classList.remove('highlight-row');
    });
  });

  // Check if diff container is scrollable
  const diffContainer = document.querySelector('.diff-container');
  if (diffContainer) {
    const checkScrollable = () => {
      if (diffContainer.scrollWidth > diffContainer.clientWidth) {
        diffContainer.classList.add('scrollable');
      } else {
        diffContainer.classList.remove('scrollable');
      }
    };

    // Check on load and on resize
    checkScrollable();
    window.addEventListener('resize', checkScrollable);
  }
}); 