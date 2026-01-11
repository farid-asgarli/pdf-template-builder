import os
import re
import requests
from urllib.parse import urlparse
from bs4 import BeautifulSoup

# Read links from the file
with open('links.html', 'r') as f:
    links = [line.strip().strip('"') for line in f.readlines() if line.strip()]

# Filter only questpdf.com links (skip GitHub links)
questpdf_links = [link for link in links if 'questpdf.com' in link]

print(f"Found {len(questpdf_links)} QuestPDF links to download")

# Create output directory if needed
output_dir = os.path.dirname(os.path.abspath(__file__))

for link in questpdf_links:
    try:
        print(f"Downloading: {link}")
        
        # Fetch the page
        response = requests.get(link, timeout=30)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract the main tag
        main_tag = soup.find('main')
        
        if main_tag:
            # Generate filename from URL path
            parsed = urlparse(link)
            path = parsed.path.strip('/')
            # Replace slashes with underscores and remove .html extension
            filename = path.replace('/', '_')
            if not filename.endswith('.html'):
                filename += '.html'
            
            # Save the main content
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(str(main_tag))
            
            print(f"  Saved: {filename}")
        else:
            print(f"  Warning: No <main> tag found in {link}")
            
    except Exception as e:
        print(f"  Error downloading {link}: {e}")

print("\nDone!")
