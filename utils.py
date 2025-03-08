import hashlib
from datetime import datetime

def get_hash(text):
    """Computes SHA-256 hash of given text."""
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def extract_meaningful_content(text):
    """Remove empty lines and normalize whitespace for better diff."""
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return "\n".join(lines)

def extract_significant_changes(archived_lines, current_lines):
    """Extract the most significant changes for a summary section."""
    import difflib
    differ = difflib.Differ()
    diff = list(differ.compare(archived_lines, current_lines))
    
    added = [line[2:] for line in diff if line.startswith('+ ')]
    removed = [line[2:] for line in diff if line.startswith('- ')]
    
    # Find the most significant changes (longer lines often contain more meaningful content)
    significant_added = sorted(added, key=len, reverse=True)[:5] if added else []
    significant_removed = sorted(removed, key=len, reverse=True)[:5] if removed else []
    
    return significant_added, significant_removed

def get_formatted_dates(timestamp):
    """Format dates in a consistent, human-readable format."""
    formatted_archive_date = f"{timestamp[4:6]}-{timestamp[6:8]}-{timestamp[0:4]}"
    current_date = datetime.now().strftime('%m-%d-%Y')
    return formatted_archive_date, current_date

def create_filename(url, timestamp):
    """Create a filename based on the URL and timestamp."""
    domain = url.split("//")[-1].split("/")[0]
    return f"diff_{domain}_{timestamp}_{datetime.now().strftime('%Y%m%d')}.html" 