document.addEventListener('DOMContentLoaded', function () {
  const diffForm = document.getElementById('diffForm');
  const loadingIndicator = document.getElementById('loading');
  const errorMessage = document.getElementById('errorMessage');
  const diffResults = document.getElementById('diffResults');
  const diffContent = document.getElementById('diffContent');
  const toggleChangesBtn = document.getElementById('toggleChangesBtn');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const keyAdditions = document.getElementById('keyAdditions');
  const keyRemovals = document.getElementById('keyRemovals');
  const diffInfo = document.getElementById('diffInfo');
  const changeStats = document.getElementById('changeStats');
  const oldVersionHeader = document.getElementById('oldVersionHeader');
  const newVersionHeader = document.getElementById('newVersionHeader');
  const archiveDateInput = document.getElementById('archiveDate');
  const timestampInput = document.getElementById('timestamp');

  // Custom date input elements
  const archiveMonthSelect = document.getElementById('archiveMonth');
  const archiveDaySelect = document.getElementById('archiveDay');
  const archiveYearSelect = document.getElementById('archiveYear');

  let currentDiffData = null;
  let showingOnlyChanges = false;

  // Initialize the custom date selectors
  const initDateSelectors = () => {
    // Get yesterday's date as the maximum allowed date
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Populate years (current year down to 10 years ago)
    const currentYear = now.getFullYear();
    for (let year = currentYear; year >= currentYear - 10; year--) {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      archiveYearSelect.appendChild(option);
    }

    // Populate days (1-31)
    updateDaysInMonth();

    // Set default to one year ago
    setDefaultDate();

    // Add event listeners for date changes
    archiveMonthSelect.addEventListener('change', function () {
      updateDaysInMonth();
      updateHiddenDateInputs();
    });

    archiveDaySelect.addEventListener('change', updateHiddenDateInputs);
    archiveYearSelect.addEventListener('change', function () {
      updateDaysInMonth();
      updateHiddenDateInputs();
    });
  };

  // Update the number of days based on the selected month and year
  const updateDaysInMonth = () => {
    const year = parseInt(archiveYearSelect.value);
    const month = parseInt(archiveMonthSelect.value);

    // Calculate the last day of the selected month
    const lastDay = new Date(year, month, 0).getDate();

    // Store the currently selected day if it exists
    const currentSelectedDay = archiveDaySelect.value;

    // Clear existing options
    archiveDaySelect.innerHTML = '';

    // Add new day options
    for (let day = 1; day <= lastDay; day++) {
      const option = document.createElement('option');
      option.value = String(day).padStart(2, '0');
      option.textContent = day;
      archiveDaySelect.appendChild(option);
    }

    // Try to restore the previously selected day if valid
    if (currentSelectedDay && parseInt(currentSelectedDay) <= lastDay) {
      archiveDaySelect.value = currentSelectedDay;
    }
  };

  // Update the hidden date inputs with the selected values
  const updateHiddenDateInputs = () => {
    const year = archiveYearSelect.value;
    const month = archiveMonthSelect.value;
    const day = archiveDaySelect.value;

    // Format as YYYY-MM-DD for the hidden date input
    const formattedDate = `${year}-${month}-${day}`;
    archiveDateInput.value = formattedDate;

    // Create a date object to validate
    const selectedDate = new Date(year, parseInt(month) - 1, parseInt(day));

    // Get yesterday's date for comparison
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    // If selected date is later than yesterday, set to yesterday
    if (selectedDate > yesterday) {
      showWarning("Today's or future dates cannot be used for comparison. Setting to yesterday's date.");

      // Set selectors to yesterday's date
      archiveYearSelect.value = yesterday.getFullYear();
      archiveMonthSelect.value = String(yesterday.getMonth() + 1).padStart(2, '0');
      updateDaysInMonth(); // Update days for the new month/year
      archiveDaySelect.value = String(yesterday.getDate()).padStart(2, '0');

      // Update the hidden input
      const yesterdayFormatted = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      archiveDateInput.value = yesterdayFormatted;

      // Update timestamp
      updateTimestamp(yesterday);
    } else {
      // Clear any existing warnings
      clearWarning();

      // Update timestamp with the valid date
      updateTimestamp(selectedDate);
    }
  };

  // Set default date to one year ago
  const setDefaultDate = () => {
    // Get current date components
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const currentDay = now.getDate();   // 1-31

    // Explicitly create date from one year ago
    const lastYear = currentYear - 1;
    const oneYearAgo = new Date(lastYear, currentMonth, currentDay);

    // Set the select elements to one year ago
    archiveYearSelect.value = lastYear;
    archiveMonthSelect.value = String(currentMonth + 1).padStart(2, '0');
    updateDaysInMonth(); // Make sure days are correct for the month/year
    archiveDaySelect.value = String(currentDay).padStart(2, '0');

    // Format date for the hidden input
    const formattedDate = `${lastYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    archiveDateInput.value = formattedDate;

    // Also set the hidden timestamp field
    updateTimestamp(oneYearAgo);
  };

  // Convert date to YYYYMMDD format for the API
  const updateTimestamp = (date) => {
    // Ensure we're working with the correct year
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');

    // Format as YYYYMMDD
    const timestamp = `${year}${month}${day}`;
    timestampInput.value = timestamp;
  };

  // Initialize date selectors
  initDateSelectors();

  // Handle form submission
  diffForm.addEventListener('submit', function (e) {
    e.preventDefault();

    const url = document.getElementById('url').value.trim();
    const timestamp = timestampInput.value;

    if (!url) {
      showError('Please enter a valid URL');
      return;
    }

    generateDiff(url, timestamp);
  });

  // Toggle between showing all lines and only changed lines
  toggleChangesBtn.addEventListener('click', function () {
    showingOnlyChanges = !showingOnlyChanges;
    toggleChangesBtn.textContent = showingOnlyChanges ? 'Show All Content' : 'Focus on Changes';
    toggleChangesBtn.setAttribute('aria-pressed', showingOnlyChanges);

    // Update the button's appearance based on state
    if (showingOnlyChanges) {
      toggleChangesBtn.classList.add('active-toggle');
    } else {
      toggleChangesBtn.classList.remove('active-toggle');
    }

    renderDiffContent(currentDiffData);
  });

  // Handle search functionality
  searchBtn.addEventListener('click', function () {
    searchInDiff(searchInput.value.trim());
  });

  searchInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      searchInDiff(searchInput.value.trim());
    }
  });

  // Function to generate diff
  function generateDiff(url, timestamp) {
    // Show loading indicator
    loadingIndicator.classList.remove('hidden');
    diffResults.classList.add('hidden');
    errorMessage.classList.add('hidden');

    // Make API request
    fetch('/generate-diff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, timestamp })
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to generate diff');
          });
        }
        return response.json();
      })
      .then(data => {
        // Hide loading indicator
        loadingIndicator.classList.add('hidden');

        // Check if there's a warning message from the server
        if (data.warning) {
          showWarning(data.warning);
        } else {
          clearWarning();
        }

        // Store the diff data
        currentDiffData = data.diff_data;

        // Update headers with dates
        oldVersionHeader.textContent = `Archived Version (${data.archived_date})`;
        newVersionHeader.textContent = `Current Version (${data.current_date})`;

        // Update diff info
        let diffInfoHTML = `
                <p>Comparing archived version from <strong>${data.archived_date}</strong> to current version from <strong>${data.current_date}</strong></p>
                <p>URL: <a href="${data.url}" target="_blank">${data.url}</a></p>
            `;

        // Add date note if present
        if (data.date_note) {
          diffInfoHTML += `<p class="date-note">${data.date_note}</p>`;
        }

        diffInfo.innerHTML = diffInfoHTML;

        // Update change stats
        changeStats.textContent = `${data.stats.added_lines} additions, ${data.stats.removed_lines} removals, ${data.stats.changed_lines} changes`;

        // If there are no changes, update the toggle button state
        if (data.stats.is_identical || (data.stats.added_lines === 0 && data.stats.removed_lines === 0 && data.stats.changed_lines === 0)) {
          // Disable the toggle button if there are no changes
          toggleChangesBtn.disabled = true;
          toggleChangesBtn.title = "No changes to focus on";

          // Add a clear message to the change stats if content is identical
          if (data.stats.is_identical) {
            changeStats.innerHTML = '<strong>The content is identical between the two versions</strong>';
          }
        } else {
          // Enable the toggle button if there are changes
          toggleChangesBtn.disabled = false;
          toggleChangesBtn.title = "Toggle between showing all content or only changes";
        }

        // Update significant changes
        keyAdditions.innerHTML = data.significant_added.map(item => `<li>${escapeHtml(item)}</li>`).join('');
        keyRemovals.innerHTML = data.significant_removed.map(item => `<li>${escapeHtml(item)}</li>`).join('');

        // Render diff content
        renderDiffContent(data.diff_data);

        // Show results
        diffResults.classList.remove('hidden');
      })
      .catch(error => {
        loadingIndicator.classList.add('hidden');
        showError(error.message);
      });
  }

  // Function to render diff content
  function renderDiffContent(diffData) {
    if (!diffData || !diffData.length) {
      // Create a full-width message
      const messageContainer = document.createElement('div');
      messageContainer.className = 'full-width-message';

      const messageElement = document.createElement('div');
      messageElement.className = 'no-changes';
      messageElement.textContent = 'No differences found';

      diffContent.innerHTML = '';
      diffContent.appendChild(messageContainer);
      messageContainer.appendChild(messageElement);
      return;
    }

    // Check if there are any changes (non-equal lines)
    const hasChanges = diffData.some(item => item.type !== 'equal');

    // If showing only changes and there are none, display a message
    if (showingOnlyChanges && !hasChanges) {
      // Create a full-width message
      diffContent.innerHTML = '';

      const messageContainer = document.createElement('div');
      messageContainer.className = 'full-width-message';

      const messageElement = document.createElement('div');
      messageElement.className = 'no-changes';
      messageElement.textContent = 'No differences found between the versions';

      messageContainer.appendChild(messageElement);
      diffContent.appendChild(messageContainer);
      return;
    }

    // If there are no changes at all, show a message even in normal mode
    if (!hasChanges) {
      // Create a full-width message
      diffContent.innerHTML = '';

      const messageContainer = document.createElement('div');
      messageContainer.className = 'full-width-message';

      const messageElement = document.createElement('div');
      messageElement.className = 'no-changes';
      messageElement.textContent = 'The content is identical between the two versions';

      messageContainer.appendChild(messageElement);
      diffContent.appendChild(messageContainer);
      return;
    }

    diffContent.innerHTML = '';

    let hasVisibleRows = false;

    diffData.forEach((item, index) => {
      // Skip equal lines if showing only changes
      if (showingOnlyChanges && item.type === 'equal') {
        return;
      }

      hasVisibleRows = true;

      const row = document.createElement('div');
      row.className = 'diff-row';
      row.setAttribute('role', 'row');

      const oldLineNum = document.createElement('div');
      oldLineNum.className = 'line-number';
      oldLineNum.setAttribute('role', 'cell');
      oldLineNum.textContent = item.type !== 'add' ? item.line_num : '';

      const oldContent = document.createElement('div');
      oldContent.className = 'content';
      oldContent.setAttribute('role', 'cell');

      const newLineNum = document.createElement('div');
      newLineNum.className = 'line-number';
      newLineNum.setAttribute('role', 'cell');
      newLineNum.textContent = item.type !== 'remove' ? item.line_num : '';

      const newContent = document.createElement('div');
      newContent.className = 'content';
      newContent.setAttribute('role', 'cell');

      // Add appropriate ARIA labels based on content type
      if (item.type === 'add') {
        newContent.setAttribute('aria-label', 'Added content: ' + (item.new_text || ''));
      } else if (item.type === 'remove') {
        oldContent.setAttribute('aria-label', 'Removed content: ' + (item.old_text || ''));
      } else if (item.type === 'change') {
        oldContent.setAttribute('aria-label', 'Changed from: ' + (item.old_text || ''));
        newContent.setAttribute('aria-label', 'Changed to: ' + (item.new_text || ''));
      }

      // Set content based on diff type
      if (item.type === 'equal') {
        oldContent.textContent = item.old_text;
        newContent.textContent = item.new_text;
      } else if (item.type === 'change') {
        // For changed lines, use word diff if available
        if (item.word_diff && item.word_diff.length) {
          let oldHtml = '';
          let newHtml = '';

          item.word_diff.forEach(wd => {
            if (wd.type === 'equal') {
              oldHtml += escapeHtml(wd.text);
              newHtml += escapeHtml(wd.text);
            } else if (wd.type === 'remove') {
              oldHtml += `<span class="diff-remove">${escapeHtml(wd.text)}</span>`;
            } else if (wd.type === 'add') {
              newHtml += `<span class="diff-add">${escapeHtml(wd.text)}</span>`;
            }
          });

          oldContent.innerHTML = oldHtml;
          newContent.innerHTML = newHtml;
        } else {
          oldContent.innerHTML = `<span class="diff-remove">${escapeHtml(item.old_text)}</span>`;
          newContent.innerHTML = `<span class="diff-add">${escapeHtml(item.new_text)}</span>`;
        }
      } else if (item.type === 'remove') {
        oldContent.innerHTML = `<span class="diff-remove">${escapeHtml(item.old_text)}</span>`;
      } else if (item.type === 'add') {
        newContent.innerHTML = `<span class="diff-add">${escapeHtml(item.new_text)}</span>`;
      }

      // Append elements to row
      row.appendChild(oldLineNum);
      row.appendChild(oldContent);
      row.appendChild(newLineNum);
      row.appendChild(newContent);
      diffContent.appendChild(row);
    });

    // If we filtered out all rows when showing only changes, display a message
    if (!hasVisibleRows && showingOnlyChanges) {
      // Create a full-width message
      diffContent.innerHTML = '';

      const messageContainer = document.createElement('div');
      messageContainer.className = 'full-width-message';

      const messageElement = document.createElement('div');
      messageElement.className = 'no-changes';
      messageElement.textContent = 'No differences found between the versions';

      messageContainer.appendChild(messageElement);
      diffContent.appendChild(messageContainer);
    }
  }

  // Function to search in diff
  function searchInDiff(query) {
    if (!query || !currentDiffData) return;

    // Remove existing highlights
    const highlights = document.querySelectorAll('.search-highlight');
    highlights.forEach(el => {
      const parent = el.parentNode;
      parent.textContent = parent.textContent;
    });

    const rows = document.querySelectorAll('.diff-row');
    rows.forEach(row => row.classList.remove('highlight-row'));

    // Convert to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();
    let foundMatch = false;

    // Search in content
    rows.forEach(row => {
      const contents = row.querySelectorAll('.content');
      let rowHasMatch = false;

      contents.forEach(content => {
        const text = content.textContent;
        if (text.toLowerCase().includes(lowerQuery)) {
          rowHasMatch = true;
          foundMatch = true;

          // Highlight matches
          const html = content.innerHTML;
          const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
          content.innerHTML = html.replace(regex, '<span class="search-highlight">$1</span>');
        }
      });

      if (rowHasMatch) {
        row.classList.add('highlight-row');

        // Scroll to first match
        if (foundMatch && !document.querySelector('.scrolled-to')) {
          row.classList.add('scrolled-to');
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });

    if (!foundMatch) {
      showError(`No matches found for "${query}"`);
    }
  }

  // Function to show warning message
  function showWarning(message) {
    // Check if warning element exists, if not create it
    let warningElement = document.getElementById('warningMessage');
    if (!warningElement) {
      warningElement = document.createElement('div');
      warningElement.id = 'warningMessage';
      warningElement.className = 'warning-message';
      warningElement.setAttribute('role', 'alert');
      warningElement.setAttribute('aria-live', 'polite');

      // Insert after the form
      diffForm.parentNode.insertBefore(warningElement, diffForm.nextSibling);
    }

    warningElement.textContent = message;
    warningElement.classList.remove('hidden');
  }

  // Function to clear warning message
  function clearWarning() {
    const warningElement = document.getElementById('warningMessage');
    if (warningElement) {
      warningElement.classList.add('hidden');
    }
  }

  // Helper function to show error messages
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }

  // Helper function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Helper function to escape regex special characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}); 