# src/rag_chain.py

import os
import sys
from dotenv import load_dotenv
from langchain_community.llms import Ollama
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

load_dotenv()


def build_rag_chain(vectorstore, chunks):
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from retriever import build_hybrid_retriever

    hybrid_fn = build_hybrid_retriever(vectorstore, chunks)

    prompt_template = """Eres un asistente jurídico especializado en protección de datos personales.
Tienes acceso a los siguientes documentos:
- RGPD: Reglamento General de Protección de Datos (UE) 2016/679
- LOPDGDD: Ley Orgánica de Protección de Datos y Garantía de Derechos Digitales (España)
- Guía AEPD: Guía del RGPD para Responsables de Tratamiento
- Guía PD por Defecto: Guía de Protección de Datos por Defecto (AEPD)

Responde la pregunta basándote ÚNICAMENTE en el contexto proporcionado.
Si necesitas relacionar información de varios documentos, hazlo explícitamente indicando la fuente.
Si la información no está en el contexto, di: "No encuentro esa información en los documentos proporcionados."

Reglas:
- No inventes artículos ni cifras
- Cita la fuente y el artículo cuando sea posible
- Si hay diferencias entre el RGPD y la LOPDGDD, señálalas

CONTEXTO:
{context}

PREGUNTA:
{question}

RESPUESTA:"""

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["context", "question"]
    )

    llm = Ollama(model="mistral", temperature=0.1)

    def format_context(docs):
        chunks_formateados = []
        for doc in docs:
            source = doc.metadata.get("source_id", "?")
            titulo = doc.metadata.get("titulo_2",
                     doc.metadata.get("titulo_1", ""))
            page = doc.metadata.get("page", "")

            if page:
                header = f"[{source} | Pág. {page}]"
            elif titulo:
                header = f"[{source} | {str(titulo)[:60]}]"
            else:
                header = f"[{source}]"

            chunks_formateados.append(f"{header}\n{doc.page_content}")

        return "\n\n---\n\n".join(chunks_formateados)

    def full_chain(question: str) -> str:
        docs = hybrid_fn(question)
        context = format_context(docs)
        formatted_prompt = prompt.format(context=context, question=question)
        return llm.invoke(formatted_prompt)

    return full_chain, hybrid_fn


def ask(chain_fn, hybrid_fn, question: str, verbose: bool = True):
    if verbose:
        print(f"PREGUNTA: {question}")

    docs = hybrid_fn(question)

    if verbose:
        print(f"\nChunks recuperados ({len(docs)}):")
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source_id", "?")
            titulo = doc.metadata.get("titulo_2",
                     doc.metadata.get("titulo_1", ""))
            print(f"  [{i+1}] {source:<15} | "
                  f"{str(titulo)[:40]:<40} | "
                  f"{doc.page_content[:80].strip()}...")

    response = chain_fn(question)

    if verbose:
        print(f"\nRESPUESTA:{response}")

    return response, docs


if __name__ == "__main__":
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from chunking import chunk_all_documents
    from vectorstore import load_vectorstore

    chunks = chunk_all_documents()
    vectorstore = load_vectorstore()
    chain_fn, hybrid_fn = build_rag_chain(vectorstore, chunks)

    preguntas = [
        "¿Qué es el derecho al olvido y en qué artículo se regula?",
        "¿Cuáles son las tres estrategias para implementar la protección de datos por defecto?",
        "¿Cuándo es obligatorio designar un DPD y qué posición debe tener en la organización?",
        "¿Qué algoritmos de cifrado específicos exige el RGPD?",
    ]

    for pregunta in preguntas:
        ask(chain_fn, hybrid_fn, pregunta)
        print()