#!/usr/bin/env python3
"""
Simple Finnish Harbor Services Scraper
Scrapes all harbors from vierassatamat.fi and extracts their services/amenities.

Requirements:
    pip install requests beautifulsoup4

Usage:
    python harbor_scraper.py
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import csv

def get_all_harbors():
    """Get list of all harbors from the API"""
    print("Getting list of all harbors...")
    try:
        response = requests.get("https://www.vierassatamat.fi/api/get/list/fi")
        response.raise_for_status()
        harbors = response.json()
        print(f"Found {len(harbors)} harbors")
        return harbors
    except Exception as e:
        print(f"Error getting harbor list: {e}")
        return []

def scrape_harbor_services(harbor_url):
    """Extract services from a harbor page"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(harbor_url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find services section
        services_section = soup.find('div', class_='services')
        if not services_section:
            return []
        
        services = []
        
        # Get services from list items
        for li in services_section.find_all('li'):
            span = li.find('span')
            if span:
                service = span.get_text().strip()
                if service:
                    services.append(service)
        
        # Also check service icons (backup method)
        for icon in services_section.find_all('img', class_='service-icon'):
            alt_text = icon.get('alt', '').strip()
            if alt_text and alt_text not in services:
                services.append(alt_text)
        
        return services
        
    except Exception as e:
        print(f"Error scraping {harbor_url}: {e}")
        return []

def scrape_all_harbors():
    """Main function to scrape all harbor data"""
    harbors = get_all_harbors()
    if not harbors:
        return []
    
    results = []
    base_url = "https://www.vierassatamat.fi"
    
    for i, harbor in enumerate(harbors):
        print(f"Processing {i+1}/{len(harbors)}: {harbor.get('name', 'Unknown')}")
        
        # Build full URL
        harbor_url = base_url + harbor['href']
        
        # Get services
        services = scrape_harbor_services(harbor_url)
        
        # Combine all data
        harbor_data = {
            'id': harbor.get('id'),
            'name': harbor.get('name'),
            'title': harbor.get('title'),
            'group': harbor.get('group'),
            'latitude': harbor.get('coordLat'),
            'longitude': harbor.get('coordLon'),
            'url': harbor_url,
            'services': services,
            'service_count': len(services),
            'categories': harbor.get('categories', {})
        }
        
        results.append(harbor_data)
        
        # Be nice to their server
        time.sleep(0.5)
    
    return results

def save_results(data):
    """Save results to JSON and CSV files"""
    if not data:
        print("No data to save")
        return
    
    # Save to JSON
    with open('finnish_harbors.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Saved {len(data)} harbors to 'finnish_harbors.json'")
    
    # Save to CSV
    with open('finnish_harbors.csv', 'w', newline='', encoding='utf-8') as f:
        fieldnames = ['id', 'name', 'title', 'group', 'latitude', 'longitude', 
                     'service_count', 'services', 'url']
        
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for harbor in data:
            row = harbor.copy()
            row['services'] = '; '.join(harbor['services'])  # Convert list to string
            writer.writerow(row)
    
    print(f"Saved {len(data)} harbors to 'finnish_harbors.csv'")
    
    # Show all unique services found
    all_services = set()
    for harbor in data:
        all_services.update(harbor['services'])
    
    unique_services = sorted(list(all_services))
    print(f"\nFound {len(unique_services)} unique services across all harbors:")
    for service in unique_services:
        print(f"  - {service}")
    
    # Save unique services list
    with open('all_services.json', 'w', encoding='utf-8') as f:
        json.dump(unique_services, f, indent=2, ensure_ascii=False)
    print(f"\nSaved complete services list to 'all_services.json'")

def main():
    print("=== Finnish Harbor Services Scraper ===")
    print("This will scrape all harbors from vierassatamat.fi")
    print("It may take a while to be respectful to their servers...\n")
    
    # Scrape all harbors
    harbor_data = scrape_all_harbors()
    
    if harbor_data:
        # Save results
        save_results(harbor_data)
        
        # Show summary
        print(f"\n=== SUMMARY ===")
        print(f"Total harbors scraped: {len(harbor_data)}")
        
        # Show example
        if harbor_data:
            example = harbor_data[0]
            print(f"\nExample harbor:")
            print(f"  Name: {example['name']}")
            print(f"  Location: {example['group']}")
            print(f"  Services: {example['services'][:3]}..." if len(example['services']) > 3 else f"  Services: {example['services']}")
        
        print(f"\nFiles created:")
        print(f"  - finnish_harbors.json (complete data)")
        print(f"  - finnish_harbors.csv (spreadsheet format)")
        print(f"  - all_services.json (list of all unique services)")
        
    else:
        print("Failed to scrape harbor data")

if __name__ == "__main__":
    main()
