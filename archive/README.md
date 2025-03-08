# Web Content Diff Checker

A tool to compare the current version of a web page with an archived version from the Wayback Machine, highlighting the differences in a user-friendly HTML report.

## Features

- Fetches current web page content
- Retrieves archived content from the Wayback Machine
- Generates a visual diff showing what has changed
- Highlights additions, removals, and modifications
- Provides a summary of the most significant changes
- Interactive controls to focus on changes or view all content
- Responsive design for desktop and mobile viewing

## Project Structure

```
.
├── main.py                # Main entry point
├── web_fetcher.py         # Web content fetching functions
├── diff_generator.py      # Diff generation functions
├── utils.py               # Utility functions
└── static/                # Static assets
    ├── styles.css         # CSS styles
    └── scripts.js         # JavaScript functionality
```

## Requirements

- Python 3.6+
- Required packages:
  - requests
  - beautifulsoup4
  - difflib (standard library)

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```
   python -m venv venv
   ```
3. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`
4. Install dependencies:
   ```
   pip install requests beautifulsoup4
   ```

## Usage

Run the script with:

```
python main.py
```

By default, it will compare the current version of the New York Fed website with an archived version from January 1, 2022.

To customize the URL and timestamp, edit the variables in `main.py`:

```python
target_url = "https://your-url-here.com"
timestamp = "YYYYMMDD"  # Format: Year, Month, Day
```

## Output

The script generates an HTML file with the diff results and automatically opens it in your default web browser. The file is saved in the current directory with a name based on the domain and timestamps.

## License

MIT 