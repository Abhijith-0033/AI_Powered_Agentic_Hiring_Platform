from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
import json

# Initialize Qdrant
qdrant_client = QdrantClient(
    url="https://10fce07a-a515-4c84-98b2-23385ce8fda9.europe-west3-0.gcp.cloud.qdrant.io:6333",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.XjHJpjv-22uKTP7o6ynI-fiZn5fDp0c28-_G2nfP5C8"
)

# Initialize embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Load FAQ data
with open('faqs.json', 'r') as f:
    faq_data = json.load(f)

# Create collection
collection_name = "faq_collection"

try:
    qdrant_client.create_collection(
        collection_name=collection_name,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE)
    )
    print(f"Created collection '{collection_name}'")
except Exception as e:
    print(f"Collection might already exist or error occurred: {e}")

# Upload FAQs
points = []
for idx, faq in enumerate(faq_data):
    text = f"{faq['question']} {' '.join(faq.get('keywords', []))}"
    embedding = model.encode(text).tolist()
    
    points.append(PointStruct(
        id=idx,
        vector=embedding,
        payload=faq
    ))

print(f"Uploading {len(points)} FAQs...")
qdrant_client.upsert(collection_name=collection_name, points=points)
print(f"✓ Uploaded {len(points)} FAQs to Qdrant!")

# Test search function
def search_faq(query, top_k=3):
    embedding = model.encode(query).tolist()
    return qdrant_client.query_points(
        collection_name=collection_name,
        query=embedding,
        limit=top_k
    ).points

print("\nTesting Search: 'How do I recover my account?'")
results = search_faq('How do I recover my account?')
for res in results:
    print(f"- [Score: {res.score:.4f}] {res.payload['question']}")
