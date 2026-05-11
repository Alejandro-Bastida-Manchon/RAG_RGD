# src/chunking.py
import re
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_text_splitters import MarkdownHeaderTextSplitter
import os
from collections import Counter

def load_markdown(filepath: str, source_id, full_name):
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


MD_DOCUMENTS = {
    "rgpd": {
        "filepath": "data/scratch/RGPD.md",
        "source_id": "RGPD",
        "full_name": "Reglamento General de Protección de Datos (UE) 2016/679"
    },
    "lopdgdd": {
        "filepath": "data/scratch/RGPD_España.md",
        "source_id": "LOPDGDD",
        "full_name": "Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales"
    },
    "guia_aepd": {
        "filepath": "data/scratch/guia_AEPD.md",
        "source_id": "GUIA_AEPD",
        "full_name": "Guía RGPD para Responsables de Tratamiento (AEPD)"
    },
    "lopdgdd_guia": {
        "filepath": "data/scratch/guia_PD_defecto.md",
        "source_id": "LOPDGDD_GUIA",
        "full_name": "Guía práctica LOPDGDD"
    },
}

def chunk_markdown_document(filepath: str, source_id: str, full_name: str, chunk_size: int = 800, chunk_overlap: int = 150):
    text = load_markdown(filepath, source_id, full_name)

    header_splitter = MarkdownHeaderTextSplitter(
        headers_to_split_on=[
            ("#",  "titulo_1"),
            ("##", "titulo_2"),
            ("###","titulo_3"),
        ],
        strip_headers=False  
    )

    header_chunks = header_splitter.split_text(text)

    char_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n- (", "\n", ". ", " ", ""],
        length_function=len,
    )

    final_chunks = []
    for i, chunk in enumerate(header_chunks):
        if len(chunk.page_content) > chunk_size:
            sub_chunks = char_splitter.split_documents([chunk])
            final_chunks.extend(sub_chunks)
        else:
            final_chunks.append(chunk)

    for i, chunk in enumerate(final_chunks):
        chunk.metadata["source_id"] = source_id
        chunk.metadata["full_name"] = full_name
        chunk.metadata["chunk_id"] = i
        chunk.metadata["chunk_size"] = len(chunk.page_content)

    return final_chunks



def chunk_all_documents(chunk_size: int = 800, chunk_overlap: int = 150):
    all_chunks = []

    for key, meta in MD_DOCUMENTS.items():
        if not os.path.exists(meta["filepath"]):
            print(f"No encontrado: {meta['filepath']} — omitido")
            continue

        chunks = chunk_markdown_document(
            filepath=meta["filepath"],
            source_id=meta["source_id"],
            full_name=meta["full_name"],
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        all_chunks.extend(chunks)
    return all_chunks


def print_chunk_stats(chunks):
    sizes = [len(c.page_content) for c in chunks]
    sources = Counter(c.metadata.get("source_id", "?") for c in chunks)
    
    print(f"Total chunks  : {len(chunks)}")
    print(f"Tamaño medio  : {sum(sizes) // len(sizes)} chars")
    print(f"Tamaño mínimo : {min(sizes)} chars")
    print(f"Tamaño máximo : {max(sizes)} chars")
    print(f"Chunks por fuente:")
    for src, count in sources.items():
        print(f"  {src:<15} {count}")


if __name__ == "__main__":
    chunks = chunk_all_documents()
    print_chunk_stats(chunks)
    print(f"Metadata : {chunks[5].metadata}")
    print(f"Contenido: {chunks[5].page_content[:400]}")