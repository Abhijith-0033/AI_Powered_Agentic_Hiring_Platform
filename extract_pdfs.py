import pdfplumber
import json

results = {}

# Extract hireX.pdf
with pdfplumber.open('hireX.pdf') as pdf:
    pages_data = []
    for i, page in enumerate(pdf.pages):
        page_info = {'page': i+1, 'text': '', 'tables': []}
        text = page.extract_text()
        if text:
            page_info['text'] = text
        tables = page.extract_tables()
        if tables:
            for table in tables:
                page_info['tables'].append(table)
        pages_data.append(page_info)
    results['hireX'] = pages_data

with open('hirex_content.txt', 'w', encoding='utf-8') as f:
    for page in results['hireX']:
        f.write(f"\n{'='*60}\n")
        f.write(f"PAGE {page['page']}\n")
        f.write(f"{'='*60}\n")
        if page['text']:
            f.write(page['text'])
            f.write('\n')
        if page['tables']:
            f.write(f"\n--- TABLES ---\n")
            for j, table in enumerate(page['tables']):
                f.write(f"Table {j+1}:\n")
                for row in table:
                    f.write(' | '.join([str(cell).replace('\n', ' ') if cell else '' for cell in row]))
                    f.write('\n')
                f.write('\n')

print("hireX.pdf extracted to hirex_content.txt")

# Extract Final Report-3.pdf
with pdfplumber.open('Final Report-3.pdf') as pdf:
    pages_data = []
    for i, page in enumerate(pdf.pages[:20]):  # First 20 pages
        page_info = {'page': i+1, 'text': '', 'tables': []}
        text = page.extract_text()
        if text:
            page_info['text'] = text
        tables = page.extract_tables()
        if tables:
            for table in tables:
                page_info['tables'].append(table)
        pages_data.append(page_info)

with open('finalreport_content.txt', 'w', encoding='utf-8') as f:
    for page in pages_data:
        f.write(f"\n{'='*60}\n")
        f.write(f"PAGE {page['page']}\n")
        f.write(f"{'='*60}\n")
        if page['text']:
            f.write(page['text'])
            f.write('\n')
        if page['tables']:
            f.write(f"\n--- TABLES ---\n")
            for j, table in enumerate(page['tables']):
                f.write(f"Table {j+1}:\n")
                for row in table:
                    f.write(' | '.join([str(cell).replace('\n', ' ') if cell else '' for cell in row]))
                    f.write('\n')
                f.write('\n')

print("Final Report-3.pdf extracted to finalreport_content.txt")
