import os
import datetime
from web_fetcher import get_page_text, get_wayback_snapshot
from utils import get_hash, extract_meaningful_content
from diff_generator import generate_diff_html

def validate_timestamp(timestamp):
    """
    Validates that the provided timestamp is not later than yesterday.
    
    Args:
        timestamp (str): A timestamp in YYYYMMDD format
        
    Returns:
        str: A valid timestamp (either the input or yesterday's date)
    """
    try:
        # Parse the timestamp
        timestamp_date = datetime.datetime.strptime(timestamp, "%Y%m%d").date()
        
        # Get today and yesterday's date
        today = datetime.datetime.now().date()
        yesterday = today - datetime.timedelta(days=1)
        
        # If timestamp is today or later, use yesterday instead
        if timestamp_date >= today:
            print(f"Warning: The selected date ({timestamp_date.strftime('%Y-%m-%d')}) is too recent for comparison.")
            print(f"Archive dates cannot be today or in the future as there would be no historical snapshot to compare.")
            new_timestamp = yesterday.strftime("%Y%m%d")
            print(f"Using yesterday's date instead: {yesterday.strftime('%Y-%m-%d')}")
            return new_timestamp
        return timestamp
    except ValueError:
        # If timestamp format is invalid, use yesterday's date
        yesterday = datetime.datetime.now().date() - datetime.timedelta(days=1)
        new_timestamp = yesterday.strftime("%Y%m%d")
        print(f"Invalid timestamp format. Using yesterday's date instead: {yesterday.strftime('%Y-%m-%d')}")
        return new_timestamp

def main():
    target_url = "https://www.newyorkfed.org/aboutthefed"
    # Specify the timestamp in YYYYMMDD format for the previous date.
    timestamp = "20220101"
    
    # Validate the timestamp to ensure it's not later than yesterday
    timestamp = validate_timestamp(timestamp)

    # Get today's content
    current_text = get_page_text(target_url)
    if not current_text:
        print("Failed to fetch current content.")
        exit(1)
    current_hash = get_hash(current_text)
    print(f"Successfully fetched current content ({len(current_text)} characters)")

    # Get archived snapshot URL
    snapshot_url = get_wayback_snapshot(target_url, timestamp)
    
    print(f"Attempting to fetch content from: {snapshot_url}")
    archived_text = get_page_text(snapshot_url)
    if archived_text:
        print(f"Successfully fetched archived content ({len(archived_text)} characters)")
        archived_hash = get_hash(archived_text)
        print(f"Current hash: {current_hash[:10]}...")
        print(f"Archived hash: {archived_hash[:10]}...")
        if current_hash != archived_hash:
            print("The page content has changed since the archived snapshot.")
            
            # Clean up and normalize text for better comparison
            clean_current = extract_meaningful_content(current_text)
            clean_archived = extract_meaningful_content(archived_text)
            
            # Generate and save HTML diff file
            diff_file = generate_diff_html(clean_current, clean_archived, target_url, timestamp)
            print(f"\nDifferences have been saved to {diff_file}")
            
            # Open the diff file in the default browser
            print("Opening diff in your browser...")
            os.system(f"open {diff_file}")
        else:
            print("The page content is identical to the archived snapshot.")
    else:
        print("Failed to retrieve content from the archived snapshot.")

if __name__ == "__main__":
    main() 