import difflib
import re
from utils import extract_significant_changes, get_formatted_dates
import datetime

def generate_diff_content(current_text, archived_text, url, timestamp):
    """Generates diff data between current and archived content."""
    # Split the text into lines for comparison
    current_lines = current_text.splitlines()
    archived_lines = archived_text.splitlines()
    
    # Get formatted dates
    formatted_archive_date, current_date = get_formatted_dates(timestamp)
    
    # Check if the archive date is today or in the future
    archive_date = datetime.datetime.strptime(formatted_archive_date, "%m-%d-%Y").date()
    today = datetime.datetime.now().date()
    
    # Add a note if the date was adjusted
    date_note = None
    if archive_date >= today:
        yesterday = today - datetime.timedelta(days=1)
        date_note = "Note: Archive dates cannot be today or in the future. The comparison is using yesterday's date instead."
    
    # Check if the content is identical
    is_identical = current_text == archived_text
    
    # Extract significant changes for the summary
    significant_added = []
    significant_removed = []
    
    # Only extract significant changes if the content is different
    if not is_identical:
        significant_added, significant_removed = extract_significant_changes(archived_lines, current_lines)
    
    # Generate the diff using difflib's SequenceMatcher
    matcher = difflib.SequenceMatcher(None, archived_lines, current_lines)
    
    # Create diff data
    diff_data = create_diff_data(matcher, archived_lines, current_lines)
    
    # Count the actual changes (non-equal lines)
    added_lines = sum(1 for item in diff_data if item['type'] == 'add')
    removed_lines = sum(1 for item in diff_data if item['type'] == 'remove')
    changed_lines = sum(1 for item in diff_data if item['type'] == 'change')
    
    # Create the response data
    response_data = {
        'url': url,
        'archived_date': formatted_archive_date,
        'current_date': current_date,
        'date_note': date_note,
        'diff_data': diff_data,
        'significant_added': significant_added,
        'significant_removed': significant_removed,
        'stats': {
            'total_lines': len(diff_data),
            'added_lines': added_lines,
            'removed_lines': removed_lines,
            'changed_lines': changed_lines,
            'is_identical': is_identical,
            'total_changes': added_lines + removed_lines + changed_lines
        }
    }
    
    return response_data

def create_diff_data(matcher, archived_lines, current_lines):
    """Create structured diff data from the sequence matcher."""
    diff_data = []
    line_num = 0
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # For equal blocks, just add a few context lines
            context_lines = min(3, i2 - i1)  # Show at most 3 context lines
            if context_lines > 0:
                for i in range(i2 - context_lines, i2):
                    line_num += 1
                    diff_data.append({
                        'type': 'equal',
                        'line_num': line_num,
                        'old_text': archived_lines[i],
                        'new_text': current_lines[j1 + (i - (i2 - context_lines))]
                    })
        elif tag == 'replace':
            # Lines were changed
            for i, j in zip(range(i1, i2), range(j1, j2)):
                line_num += 1
                old_line = archived_lines[i] if i < len(archived_lines) else ""
                new_line = current_lines[j] if j < len(current_lines) else ""
                word_diff = get_word_diff(old_line, new_line)
                diff_data.append({
                    'type': 'change',
                    'line_num': line_num,
                    'old_text': old_line,
                    'new_text': new_line,
                    'word_diff': word_diff
                })
        elif tag == 'delete':
            # Lines were removed
            for i in range(i1, i2):
                line_num += 1
                diff_data.append({
                    'type': 'remove',
                    'line_num': line_num,
                    'old_text': archived_lines[i],
                    'new_text': ''
                })
        elif tag == 'insert':
            # Lines were added
            for j in range(j1, j2):
                line_num += 1
                diff_data.append({
                    'type': 'add',
                    'line_num': line_num,
                    'old_text': '',
                    'new_text': current_lines[j]
                })
    
    return diff_data

def get_word_diff(old_line, new_line):
    """Generate word-level diff between two lines."""
    if not old_line and not new_line:
        return []
    
    # Split lines into words
    old_words = re.findall(r'\S+|\s+', old_line)
    new_words = re.findall(r'\S+|\s+', new_line)
    
    # Generate word diff
    matcher = difflib.SequenceMatcher(None, old_words, new_words)
    word_diff = []
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            word_diff.append({
                'type': 'equal',
                'text': ''.join(old_words[i1:i2])
            })
        elif tag == 'replace':
            word_diff.append({
                'type': 'remove',
                'text': ''.join(old_words[i1:i2])
            })
            word_diff.append({
                'type': 'add',
                'text': ''.join(new_words[j1:j2])
            })
        elif tag == 'delete':
            word_diff.append({
                'type': 'remove',
                'text': ''.join(old_words[i1:i2])
            })
        elif tag == 'insert':
            word_diff.append({
                'type': 'add',
                'text': ''.join(new_words[j1:j2])
            })
    
    return word_diff 