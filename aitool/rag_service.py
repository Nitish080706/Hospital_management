import os
import chromadb
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hospital.db")
CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_data")

class RAGService:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        self.collection = self.chroma_client.get_or_create_collection(name="emergency_protocols")

    def _db(self):
        return sqlite3.connect(DB_PATH)

    def emergency_query(self, patient_id: str, query: str) -> dict:
        

        conn = self._db()
        cur = conn.cursor()
        cur.execute(
            "SELECT patient_id,name,age,gender,blood_group,allergies,medicines,diagnosis "
            "FROM patients WHERE patient_id=?",
            (patient_id,)
        )
        row = cur.fetchone()
        conn.close()

        patient_context = {}
        if row:
            patient_context = {
                "patient_id": row[0],
                "name": row[1],
                "age": row[2],
                "gender": row[3],
                "blood_group": row[4],
                "allergies": row[5],
                "medicines": row[6],
                "diagnosis": row[7],
            }



        results = self.collection.query(
            query_texts=[query],
            n_results=2
        )
        
        docs = []
        if results and results["documents"]:
            for i, doc in enumerate(results["documents"][0]):
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                docs.append({
                    "content": doc,
                    "severity": meta.get("severity", "medium"),
                    "title": meta.get("title", "Protocol")
                })
                

        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        docs.sort(key=lambda x: severity_order.get(x["severity"], 99))

        return {
            "status": "SUCCESS",
            "patient_context": patient_context if patient_context else "PATIENT_NOT_FOUND",
            "retrieved_protocols": docs,
            "query": query
        }

rag_service = RAGService()
