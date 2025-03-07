import requests
from bs4 import BeautifulSoup

def get_page_text(url):
    """Fetches the URL and returns the text content of the page."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    return soup.get_text()

def get_wayback_snapshot(url, timestamp):
    """Creates a Wayback Machine URL for the given URL and timestamp."""
    # Format the URL properly for the Wayback Machine
    if url.endswith('/'):
        url = url[:-1]
    
    wayback_url = f"http://web.archive.org/web/{timestamp}/{url}"
    print(f"Creating Wayback URL: {wayback_url}")
    return wayback_url 