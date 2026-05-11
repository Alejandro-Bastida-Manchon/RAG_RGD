import logging
import time
from pathlib import Path
import glob
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TableStructureOptions,
)
from docling.document_converter import DocumentConverter, PdfFormatOption
import re

_log = logging.getLogger(__name__)

def main():
    logging.basicConfig(level=logging.INFO)

    data_folder = glob.glob("data/*.pdf")
    if not data_folder:
        _log.warning("No se encontraron archivos PDF en la carpeta 'data/'.")
        return
    
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = False  
    pipeline_options.do_table_structure = False

    doc_converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
        }
    )

    start_time = time.time()
    
    conv_results = doc_converter.convert_all(data_folder)
    
    _log.info("Iniciando conversión de documentos")

    output_dir = Path("scratch")
    output_dir.mkdir(parents=True, exist_ok=True)

    for result in conv_results:
        if result.document:
            doc_filename = result.input.file.stem
            output_path = output_dir / f"{doc_filename}.md"
            
            with output_path.open("w", encoding="utf-8") as fp:
                fp.write(result.document.export_to_markdown())
            
            _log.info(f"Guardado: {output_path}")

    end_time = time.time() - start_time
    _log.info(f"Proceso completado en {end_time:.2f} segundos.")


if __name__ == "__main__":
    main()