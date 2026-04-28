import os
import chromadb

CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_data")

def seed_documents():
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(name="emergency_protocols")

    docs = [
        {
            "id": "cpr-001",
            "text": "Cardiopulmonary Resuscitation (CPR) Protocol: 1. Ensure scene safety. 2. Check for responsiveness. 3. Call for emergency backup. 4. Begin chest compressions at 100-120 per minute. 5. Administer 2 rescue breaths after every 30 compressions.",
            "meta": {"title": "CPR Protocol", "severity": "critical"}
        },
        {
            "id": "allergy-001",
            "text": "Anaphylaxis Management: 1. Administer Epinephrine intramuscularly immediately (0.3mg-0.5mg for adults). 2. Call for code team. 3. DO NOT administer Epinephrine if patient is actively on MAOIs unless cardiac arrest is imminent, due to severe hypertensive crisis risk.",
            "meta": {"title": "Anaphylaxis / Epinephrine Contraindications", "severity": "critical"}
        },
        {
            "id": "stroke-001",
            "text": "Acute Ischemic Stroke Protocol: 1. Assess ABCs. 2. Perform rapid neuro exam (NIHSS). 3. Obtain non-contrast head CT within 20 mins. 4. If onset < 4.5 hours and no hemorrhage, consider IV Alteplase (tPA).",
            "meta": {"title": "Ischemic Stroke Protocol", "severity": "high"}
        },
        {
            "id": "icu-001",
            "text": "ICU Admission Checklist: 1. Confirm advanced airway if GCS < 8. 2. Secure IV access (central line if needed). 3. Initiate continuous cardiac monitoring. 4. Ensure DVT prophylaxis is ordered.",
            "meta": {"title": "ICU Checklist", "severity": "medium"}
        }
    ]

    print("Seeding ChromaDB with emergency protocols...")
    for doc in docs:
        collection.upsert(
            documents=[doc["text"]],
            metadatas=[doc["meta"]],
            ids=[doc["id"]]
        )
    print("Seeding complete.")

def seed_custom_documents(docs):
    
    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(name="emergency_protocols")
    
    for doc in docs:
        if "id" not in doc or "text" not in doc or "meta" not in doc:
            raise ValueError(f"Invalid document format: {doc}")
        collection.upsert(
            documents=[doc["text"]],
            metadatas=[doc["meta"]],
            ids=[doc["id"]]
        )

def seed_pdf_document(file_bytes, filename):
    
    from pypdf import PdfReader
    import io
    
    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    for page in reader.pages:
        full_text += page.extract_text() + "\n"
    
    if not full_text.strip():
        raise ValueError("Could not extract any text from the PDF.")

    client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
    collection = client.get_or_create_collection(name="emergency_protocols")
    

    chunk_size = 2000
    overlap = 200
    chunks = []
    for i in range(0, len(full_text), chunk_size - overlap):
        chunks.append(full_text[i : i + chunk_size])
    
    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"title": filename, "severity": "medium", "source": "pdf_upload", "chunk": i} for i in range(len(chunks))]
    
    collection.upsert(
        documents=chunks,
        metadatas=metadatas,
        ids=ids
    )
    return f"{filename} ({len(chunks)} chunks)"

if __name__ == "__main__":
    seed_documents()
