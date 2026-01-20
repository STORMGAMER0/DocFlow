from elasticsearch import Elasticsearch
import os
from services.api.logging_config import logger

ES_HOST = os.getenv("ELASTICSEARCH_HOST", "elasticsearch:9200")

def get_es_client():
    """Get Elasticsearch client"""
    return Elasticsearch([f"http://{ES_HOST}"])

def ensure_index_exists():
    """Create the documents index if it doesn't exist"""
    es = get_es_client()
    index_name = "documents"
    
    if not es.indices.exists(index=index_name):
        # Create index with mappings
        es.indices.create(
            index=index_name,
            body={
                "mappings": {
                    "properties": {
                        "document_id": {"type": "keyword"},
                        "filename": {"type": "text"},
                        "content": {"type": "text"},
                        "owner_id": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "upload_time": {"type": "date"},
                        "metadata": {"type": "object"}
                    }
                }
            }
        )
        logger.info("elasticsearch_index_created", index=index_name)
    
def index_document(doc_id: int, filename: str, content: str, owner_id: int, metadata: dict = None):
    """Index a document in Elasticsearch"""
    es = get_es_client()
    
    try:
        doc_body = {
            "document_id": doc_id,
            "filename": filename,
            "content": content,
            "owner_id": owner_id,
            "metadata": metadata or {}
        }
        
        es.index(index="documents", id=doc_id, document=doc_body)
        logger.info("document_indexed", doc_id=doc_id)
        return True
    except Exception as e:
        logger.error("elasticsearch_index_failed", doc_id=doc_id, error=str(e))
        return False

def search_documents(query: str, owner_id: int, from_: int = 0, size: int = 10):
    """Search documents in Elasticsearch"""
    es = get_es_client()
    
    try:
        search_body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": ["filename^2", "content", "metadata.*"],
                                "fuzziness": "AUTO"
                            }
                        },
                        {
                            "term": {
                                "owner_id": owner_id
                            }
                        }
                    ]
                }
            },
            "highlight": {
                "fields": {
                    "content": {},
                    "filename": {}
                }
            },
            "from": from_,
            "size": size
        }
        
        results = es.search(index="documents", body=search_body)
        
        return {
            "total": results["hits"]["total"]["value"],
            "documents": [
                {
                    "id": int(hit["_id"]),
                    "filename": hit["_source"]["filename"],
                    "score": hit["_score"],
                    "highlights": hit.get("highlight", {})
                }
                for hit in results["hits"]["hits"]
            ]
        }
    except Exception as e:
        logger.error("elasticsearch_search_failed", error=str(e))
        return {"total": 0, "documents": []}

def delete_document_from_index(doc_id: int):
    """Delete a document from Elasticsearch"""
    es = get_es_client()
    
    try:
        es.delete(index="documents", id=doc_id)
        logger.info("document_removed_from_index", doc_id=doc_id)
        return True
    except Exception as e:
        logger.error("elasticsearch_delete_failed", doc_id=doc_id, error=str(e))
        return False