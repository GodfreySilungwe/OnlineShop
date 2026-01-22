#!/usr/bin/env python3
"""
Script to generate PNG images from Mermaid diagram markdown files using mermaid.ink API
"""

import requests
import base64
import os
from pathlib import Path

# List of diagram files and their output names
diagrams = {
    r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\docs\class_diagram.md': 'class_diagram.png',
    r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\docs\sequence_checkout_flow.md': 'sequence_checkout_flow.png',
    r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\docs\activity_checkout_flow.md': 'activity_checkout_flow.png',
    r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\docs\component_interaction_diagram.md': 'component_interaction_diagram.png',
}

output_dir = r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\docs\diagrams'
os.makedirs(output_dir, exist_ok=True)

print("📊 Converting Mermaid diagrams to PNG...")

for input_file, output_name in diagrams.items():
    try:
        # Read the markdown file
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Extract mermaid code (between ```mermaid and ```)
        start = content.find('```mermaid\n') + len('```mermaid\n')
        end = content.find('\n```', start)
        
        if start == -1 or end == -1:
            print(f"⚠️  Could not find mermaid code in {input_file}")
            continue
        
        mermaid_code = content[start:end].strip()
        
        # Use kroki.io API as alternative (more reliable)
        diagram_data = base64.b64encode(mermaid_code.encode()).decode()
        
        # Use Kroki.io service for conversion
        url = f"https://kroki.io/mermaid/png/{diagram_data}"
        
        print(f"⏳ Converting {output_name}...", end=' ')
        
        response = requests.get(url, timeout=30)
        
        if response.status_code == 200:
            output_path = os.path.join(output_dir, output_name)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            print(f"✅ Created: {output_path}")
        else:
            print(f"❌ Failed (HTTP {response.status_code})")
    
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n✨ All diagrams converted!")
print(f"📁 Output directory: {output_dir}")
