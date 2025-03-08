# Web Content Diff Checker

A Python web application that compares current web content with archived versions from the Wayback Machine, highlighting the differences between them.

## Features

- Enter any URL to check for content changes
- Compare current content with archived versions from the Wayback Machine
- View highlighted differences directly in the web app
- Search within the diff results
- Focus on changes or view all content
- Responsive design that works on desktop and mobile

## How It Works

1. Enter a URL and optionally specify an archive date (in YYYYMMDD format)
2. The app fetches the current content from the URL
3. It also fetches the archived version from the Wayback Machine
4. The app compares the two versions and generates a diff
5. Differences are displayed in the web interface with additions, removals, and changes highlighted

## Technologies Used

- Python 3.9+
- Flask web framework
- Requests for HTTP requests
- BeautifulSoup for HTML parsing
- difflib for generating diffs
- HTML/CSS/JavaScript for the frontend

## Deployment

This application is designed to be deployed on Vercel. The `vercel.json` configuration file is included for easy deployment.

### Deploying to Vercel

1. Fork or clone this repository
2. Connect your GitHub repository to Vercel
3. Vercel will automatically detect the Python application and deploy it

## Local Development

To run the application locally:

1. Clone the repository
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run the application: `python app.py`
6. Open your browser and navigate to `http://localhost:5000`

## Original Application

The original version of this application is archived in the `archive` directory. The new version maintains the same core functionality while adding the ability to:

- Enter URLs directly in the web interface
- View diffs in the browser without generating HTML files
- Provide a more interactive user experience

## License

MIT 