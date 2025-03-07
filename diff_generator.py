import difflib
import re
from utils import extract_significant_changes, get_formatted_dates, create_filename

def generate_diff_html(current_text, archived_text, url, timestamp):
    """Generates an HTML file showing the differences between current and archived content."""
    # Split the text into lines for comparison
    current_lines = current_text.splitlines()
    archived_lines = archived_text.splitlines()
    
    # Get formatted dates
    formatted_archive_date, current_date = get_formatted_dates(timestamp)
    
    # Extract significant changes for the summary
    significant_added, significant_removed = extract_significant_changes(archived_lines, current_lines)
    
    # Generate the diff using difflib's SequenceMatcher
    matcher = difflib.SequenceMatcher(None, archived_lines, current_lines)
    
    # Create a custom HTML diff table without navigation columns
    diff_table = create_custom_diff_table(matcher, archived_lines, current_lines, 
                                         formatted_archive_date, current_date)
    
    # Create the enhanced HTML
    enhanced_html = create_enhanced_html(
        url, 
        formatted_archive_date, 
        current_date, 
        significant_added, 
        significant_removed, 
        diff_table, 
        current_lines, 
        archived_lines
    )
    
    # Create and save the file
    filename = create_filename(url, timestamp)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(enhanced_html)
    
    return filename

def create_custom_diff_table(matcher, archived_lines, current_lines, archived_date, current_date):
    """Create a custom HTML diff structure using semantic elements instead of a table."""
    # Start the diff container
    diff_html = f'''
    <div class="diff-grid">
        <div class="diff-header">
            <div class="line-number">Line</div>
            <div class="content-column">Archived Version ({archived_date})</div>
            <div class="line-number">Line</div>
            <div class="content-column">Current Version ({current_date})</div>
        </div>
        <div class="diff-body">
    '''
    
    # Process the diff blocks
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Lines are identical
            for line_num in range(i1, i2):
                diff_html += f'''
                <div class="diff-row">
                    <div class="line-number">{line_num + 1}</div>
                    <div class="content">{html_escape(archived_lines[line_num])}</div>
                    <div class="line-number">{j1 + (line_num - i1) + 1}</div>
                    <div class="content">{html_escape(current_lines[j1 + (line_num - i1)])}</div>
                </div>
                '''
        elif tag == 'replace':
            # Lines are different - use word-level diff for better visualization
            for line_num in range(max(i2 - i1, j2 - j1)):
                old_line = archived_lines[i1 + line_num] if i1 + line_num < i2 else ""
                new_line = current_lines[j1 + line_num] if j1 + line_num < j2 else ""
                
                old_line_num = i1 + line_num + 1 if i1 + line_num < i2 else ""
                new_line_num = j1 + line_num + 1 if j1 + line_num < j2 else ""
                
                # If both lines exist, do word-level diff
                if old_line and new_line:
                    old_formatted, new_formatted = get_word_diff(old_line, new_line)
                else:
                    old_formatted = f'<span class="diff_sub">{html_escape(old_line)}</span>' if old_line else ""
                    new_formatted = f'<span class="diff_add">{html_escape(new_line)}</span>' if new_line else ""
                
                diff_html += f'''
                <div class="diff-row">
                    <div class="line-number">{old_line_num}</div>
                    <div class="content">{old_formatted}</div>
                    <div class="line-number">{new_line_num}</div>
                    <div class="content">{new_formatted}</div>
                </div>
                '''
        elif tag == 'delete':
            # Lines only in archived version
            for line_num in range(i1, i2):
                diff_html += f'''
                <div class="diff-row">
                    <div class="line-number">{line_num + 1}</div>
                    <div class="content"><span class="diff_sub">{html_escape(archived_lines[line_num])}</span></div>
                    <div class="line-number"></div>
                    <div class="content"></div>
                </div>
                '''
        elif tag == 'insert':
            # Lines only in current version
            for line_num in range(j1, j2):
                diff_html += f'''
                <div class="diff-row">
                    <div class="line-number"></div>
                    <div class="content"></div>
                    <div class="line-number">{line_num + 1}</div>
                    <div class="content"><span class="diff_add">{html_escape(current_lines[line_num])}</span></div>
                </div>
                '''
    
    # Close the diff container
    diff_html += '''
        </div>
    </div>
    '''
    
    return diff_html

def get_word_diff(old_line, new_line):
    """Generate word-level diff between two lines."""
    # Split the lines into words
    old_words = re.findall(r'\S+|\s+', old_line)
    new_words = re.findall(r'\S+|\s+', new_line)
    
    # Create a sequence matcher for the words
    matcher = difflib.SequenceMatcher(None, old_words, new_words)
    
    # Build the formatted output for each line
    old_formatted = []
    new_formatted = []
    
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == 'equal':
            # Words are the same
            old_text = html_escape(''.join(old_words[i1:i2]))
            new_text = html_escape(''.join(new_words[j1:j2]))
            old_formatted.append(old_text)
            new_formatted.append(new_text)
        elif tag == 'replace':
            # Words are different
            old_text = html_escape(''.join(old_words[i1:i2]))
            new_text = html_escape(''.join(new_words[j1:j2]))
            old_formatted.append(f'<span class="diff_sub">{old_text}</span>')
            new_formatted.append(f'<span class="diff_add">{new_text}</span>')
        elif tag == 'delete':
            # Words only in old line
            old_text = html_escape(''.join(old_words[i1:i2]))
            old_formatted.append(f'<span class="diff_sub">{old_text}</span>')
        elif tag == 'insert':
            # Words only in new line
            new_text = html_escape(''.join(new_words[j1:j2]))
            new_formatted.append(f'<span class="diff_add">{new_text}</span>')
    
    return ''.join(old_formatted), ''.join(new_formatted)

def html_escape(text):
    """Escape HTML special characters in text."""
    if not text:
        return ""
    return text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace(' ', '&nbsp;')

def create_enhanced_html(url, formatted_archive_date, current_date, significant_added, 
                         significant_removed, table_content, current_lines, archived_lines):
    """Creates the enhanced HTML with CSS and JavaScript included."""
    # Read CSS and JavaScript from external files
    try:
        with open('static/styles.css', 'r', encoding='utf-8') as css_file:
            css_content = css_file.read()
    except FileNotFoundError:
        css_content = "/* CSS file not found */"
    
    try:
        with open('static/scripts.js', 'r', encoding='utf-8') as js_file:
            js_content = js_file.read()
    except FileNotFoundError:
        js_content = "// JavaScript file not found"
    
    # Create the HTML
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Changes on {url.split("//")[-1].split("/")[0]}</title>
    <style>
        {css_content}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>Content Changes on {url.split("//")[-1].split("/")[0]}</h1>
            <div class="summary">
                <p>Comparing archived version from <strong>{formatted_archive_date}</strong> to current version from <strong>{current_date}</strong></p>
                <p>URL: <a href="{url}" target="_blank">{url}</a></p>
            </div>
        </header>
        
        <div class="change-summary">
            <div class="change-count">
                <p>{sum(1 for line in current_lines if line and line not in archived_lines)} additions, {sum(1 for line in archived_lines if line and line not in current_lines)} removals</p>
            </div>
            <div class="significant-changes">
                <h3>Key Additions:</h3>
                <div class="added-content">
                    <ul>
                        {"".join(f"<li>{item}</li>" for item in significant_added[:3])}
                    </ul>
                </div>
                <h3>Key Removals:</h3>
                <div class="removed-content">
                    <ul>
                        {"".join(f"<li>{item}</li>" for item in significant_removed[:3])}
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="controls">
            <button id="toggleChangesBtn" onclick="toggleChangesView()">Focus on Changes</button>
        </div>
        
        <div class="diff-container">
            {table_content}
        </div>
        
        <footer>
            Generated on {current_date} by Web Content Diff Checker
        </footer>
    </div>
    
    <script>
        {js_content}
    </script>
</body>
</html>''' 