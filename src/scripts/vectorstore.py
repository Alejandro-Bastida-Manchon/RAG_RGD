# src/vectorstore.py
import os
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

load_dotenv()

EMBED_MODEL = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"

def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name=EMBED_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )


def build_vectorstore(chunks: list[Document], persist_dir: str = ".chroma") -> Chroma:
    print(f"Generando embeddings para {len(chunks)} chunks")

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=get_embeddings(),
        persist_directory=persist_dir,
        collection_name="rag_RGPD"
    )
    print(f"Chunks indexados: {vectorstore._collection.count()}")
    return vectorstore


def load_vectorstore(persist_dir: str = ".chroma") -> Chroma:
    vectorstore = Chroma(
        persist_directory=persist_dir,
        embedding_function=get_embeddings(),
        collection_name="rag_RGPD"
    )

    print(f"Chunks disponibles: {vectorstore._collection.count()}")

    return vectorstore



if __name__ == "__main__":
    persist_dir = ".chroma"
    # Borra el .chroma anterior 
    import shutil
    if os.path.exists(persist_dir):
        shutil.rmtree(persist_dir)
        print("Vectorstore anterior eliminado.")

    from chunking import chunk_all_documents

    chunks = chunk_all_documents()
    vectorstore = build_vectorstore(chunks, persist_dir)
    