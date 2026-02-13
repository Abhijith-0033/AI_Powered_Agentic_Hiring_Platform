import fitz

doc = fitz.open()
page = doc.new_page()
page.insert_text((50, 50), "This is a dummy PDF for testing resume parsing.\n\nName: John Doe\nEmail: john.doe@example.com\nSkills: Python, Node.js")
doc.save("dummy_resume.pdf")
print("dummy_resume.pdf created")
