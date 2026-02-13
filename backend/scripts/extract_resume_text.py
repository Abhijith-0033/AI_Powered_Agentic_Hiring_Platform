import sys
import json
import os

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    from docx import Document
except ImportError:
    Document = None

def extract_text_from_pdf(file_path):
    if not fitz:
        return None, "PyMuPDF (fitz) is not installed."
    
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text() + "\n"
        return text, None
    except Exception as e:
        return None, str(e)

def extract_text_from_docx(file_path):
    if not Document:
        return None, "python-docx is not installed."
    
    try:
        doc = Document(file_path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text, None
    except Exception as e:
        return None, str(e)

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]

    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File not found: {file_path}"}))
        sys.exit(1)

    ext = os.path.splitext(file_path)[1].lower()
    text = None
    error = None

    if ext == ".pdf":
        text, error = extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        text, error = extract_text_from_docx(file_path)
    else:
        error = f"Unsupported file type: {ext}"

    if error:
        print(json.dumps({"success": False, "error": error}))
        sys.exit(1)
    
    # Check for empty text (scanned PDF)
    if not text or len(text.strip()) < 50:
         print(json.dumps({
            "success": False, 
            "error": "Extracted text is too short. The file might be a scanned image or empty. Please upload a text-based PDF or DOCX."
        }))
         sys.exit(1)

    print(json.dumps({"success": True, "text": text}))

if __name__ == "__main__":
    main()
