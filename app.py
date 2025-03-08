from flask import Flask, render_template, request, jsonify
import os
import datetime
from web_fetcher import get_page_text, get_wayback_snapshot
from utils import get_hash, extract_meaningful_content
from diff_generator import generate_diff_content

app = Flask(__name__)

def validate_timestamp(timestamp):
    """
    Validates that the provided timestamp is not later than yesterday.
    
    Args:
        timestamp (str): A timestamp in YYYYMMDD format
        
    Returns:
        tuple: (valid_timestamp, warning_message)
    """
    try:
        # Parse the timestamp
        timestamp_date = datetime.datetime.strptime(timestamp, "%Y%m%d").date()
        
        # Get yesterday's date
        today = datetime.datetime.now().date()
        yesterday = today - datetime.timedelta(days=1)
        
        # If timestamp is today or later, use yesterday instead
        if timestamp_date >= today:
            warning_message = f"Warning: The selected date ({timestamp_date.strftime('%Y-%m-%d')}) is too recent for comparison. Using yesterday's date instead."
            new_timestamp = yesterday.strftime("%Y%m%d")
            return new_timestamp, warning_message
        return timestamp, None
    except ValueError:
        # If timestamp format is invalid, use yesterday's date
        yesterday = datetime.datetime.now().date() - datetime.timedelta(days=1)
        new_timestamp = yesterday.strftime("%Y%m%d")
        warning_message = "Invalid date format. Using yesterday's date instead."
        return new_timestamp, warning_message

@app.route('/')
def index():
    """Render the main page with the URL input form."""
    return render_template('index.html')

@app.route('/generate-diff', methods=['POST'])
def generate_diff():
    """Generate a diff between current and archived versions of a URL."""
    data = request.json
    target_url = data.get('url')
    timestamp = data.get('timestamp', '20220101')  # Default to Jan 1, 2022 if not provided
    
    if not target_url:
        return jsonify({'error': 'URL is required'}), 400
    
    # Validate the timestamp to ensure it's not later than yesterday
    timestamp, warning_message = validate_timestamp(timestamp)
    
    # Get current content
    current_text = get_page_text(target_url)
    if not current_text:
        return jsonify({'error': 'Failed to fetch current content'}), 400
    
    # Get archived snapshot URL
    snapshot_url = get_wayback_snapshot(target_url, timestamp)
    archived_text = get_page_text(snapshot_url)
    
    if not archived_text:
        return jsonify({'error': 'Failed to fetch archived content'}), 400
    
    # Clean up and normalize text for better comparison
    clean_current = extract_meaningful_content(current_text)
    clean_archived = extract_meaningful_content(archived_text)
    
    # Generate diff content
    diff_content = generate_diff_content(clean_current, clean_archived, target_url, timestamp)
    
    # Add warning message if present
    if warning_message:
        diff_content['warning'] = warning_message
    
    return jsonify(diff_content)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True) 