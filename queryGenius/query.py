import streamlit as st
import numpy as np
import google.generativeai as genai
import json
import os
import re
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from dotenv import load_dotenv
import plotly.express as px
import plotly.graph_objects as go
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

load_dotenv()

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, OperationFailure, BulkWriteError
from typing import Optional, List, Dict, Any, Union
from urllib.parse import quote_plus
import time
from datetime import datetime
import numpy as np
from bson import ObjectId
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from statsmodels.tsa.arima.model import ARIMA
import warnings
warnings.filterwarnings('ignore')

def convert_datetime_for_json(data):
    """
    Recursively convert datetime objects to ISO strings for JSON serialization.
    """
    if isinstance(data, dict):
        return {key: convert_datetime_for_json(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [convert_datetime_for_json(item) for item in data]
    elif isinstance(data, datetime):
        return data.isoformat()
    else:
        return data

def get_mongo_client() -> Optional[MongoClient]:
    """
    Create and return MongoDB Atlas client with proper configuration.
    Returns None if connection fails.
    """
    mongodb_uri = os.getenv("MONGODB_URI")
    
    if not mongodb_uri:
        st.error("❌ **MONGODB_URI not found in environment variables**")
        st.info("""
        📝 **Please create a .env file with:**
        ```
        MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
        GOOGLE_API_KEY=your_google_api_key
        ```
        """)
        return None
    
    try:
        # Fix password encoding issues
        if "@" in mongodb_uri:
            parts = mongodb_uri.split('@')
            if len(parts) == 2:
                auth_part = parts[0]
                if '://' in auth_part:
                    protocol, credentials = auth_part.split('://', 1)
                    if ':' in credentials:
                        username, password = credentials.split(':', 1)
                        # URL encode special characters in password
                        encoded_password = quote_plus(password)
                        mongodb_uri = f"{protocol}://{username}:{encoded_password}@{parts[1]}"
        
        st.info(f"🔗 Connecting to MongoDB...")
        
        client = MongoClient(
            mongodb_uri,
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=30000,
            socketTimeoutMS=45000,
            retryWrites=True,
            maxPoolSize=100,
            connect=True
        )
        
        # Test connection with timeout
        start_time = time.time()
        client.admin.command('ping')
        connection_time = time.time() - start_time
        
        st.success(f"✅ **Connected to MongoDB!** ({(connection_time*1000):.0f}ms)")
        return client
        
    except Exception as e:
        error_msg = str(e)
        st.error(f"❌ **MongoDB Connection Failed:** {error_msg[:200]}")
        
        # Diagnostic messages
        if "bad auth" in error_msg.lower() or "authentication" in error_msg.lower():
            st.info("""
            🔐 **AUTHENTICATION ERROR:**
            1. **Check credentials** in your connection string
            2. **Create database user** in MongoDB Atlas:
               - Go to: Atlas → Security → Database Access
               - Click: "Add New Database User"
               - Authentication Method: "Password"
               - Set username & password
               - Privileges: "Read and write to any database"
            3. **Wait 1-2 minutes** after creating user
            """)
        elif "timed out" in error_msg.lower():
            st.info("""
            ⏱️ **CONNECTION TIMEOUT:**
            1. **Check internet connection**
            2. **Whitelist your IP** in MongoDB Atlas:
               - Go to: Atlas → Security → Network Access
               - Click: "Add IP Address"
               - Add: `0.0.0.0/0` (temporarily for testing)
               - Click: "Confirm"
            3. **Try again** after 1 minute
            """)
        elif "invalid" in error_msg.lower() or "uri" in error_msg.lower():
            st.info("""
            🔗 **INVALID CONNECTION STRING:**
            1. **Get fresh connection string:**
               - Login to MongoDB Atlas
               - Click your cluster → "Connect"
               - Choose "Connect your application"
               - Copy the connection string
            2. **Format should be:**
               ```
               mongodb+srv://username:password@cluster.mongodb.net/
               ```
            """)
        elif "network error" in error_msg.lower():
            st.info("""
            🌐 **NETWORK ERROR:**
            1. **Check firewall settings**
            2. **Try different network** (mobile hotspot)
            3. **Contact your network administrator**
            """)
        else:
            st.info("""
            ⚠️ **GENERAL TROUBLESHOOTING:**
            1. **Check if cluster is running** in MongoDB Atlas
            2. **Ensure you have sufficient credits** (free tier has limits)
            3. **Try re-creating the cluster**
            """)
        
        return None
def upload_to_mongo(file, collection_name: str = "dataset") -> int:
    """
    Upload CSV/Excel file to MongoDB Atlas.
    Returns number of records uploaded.
    """
    if file is None:
        st.error("❌ No file provided")
        return 0
    
    try:
        client = get_mongo_client()
        if client is None:
            st.error("❌ Cannot connect to MongoDB")
            return 0
        
        db = client["nl_mongo_db"]
        
        # Read file based on extension
        st.info(f"📄 Reading {file.name}...")
        
        # Save file to temp location for debugging
        import tempfile
        import shutil
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1]) as tmp_file:
            shutil.copyfileobj(file, tmp_file)
            tmp_file_path = tmp_file.name
        
        # Reset file pointer
        file.seek(0)
        
        df = None
        file_ext = file.name.lower()
        
        try:
            if file_ext.endswith(".csv"):
                # Try multiple CSV reading strategies
                try:
                    # Strategy 1: Default reading
                    df = pd.read_csv(file)
                except pd.errors.EmptyDataError:
                    st.error("❌ CSV file is completely empty")
                    return 0
                except pd.errors.ParserError as e:
                    st.warning(f"⚠️ First CSV parse failed: {str(e)[:100]}")
                    
                    # Strategy 2: Try with different parameters
                    try:
                        file.seek(0)
                        df = pd.read_csv(file, encoding='utf-8')
                    except:
                        try:
                            file.seek(0)
                            df = pd.read_csv(file, encoding='latin-1')
                        except:
                            try:
                                file.seek(0)
                                df = pd.read_csv(file, encoding='ISO-8859-1')
                            except:
                                # Strategy 3: Try with error handling
                                file.seek(0)
                                df = pd.read_csv(file, engine='python', on_bad_lines='skip')
                
                # If still None, try reading the temp file
                if df is None or df.empty:
                    try:
                        df = pd.read_csv(tmp_file_path, engine='python', on_bad_lines='skip')
                    except Exception as e:
                        st.error(f"❌ Failed to read CSV: {str(e)}")
                        
                        # Show file content for debugging
                        file.seek(0)
                        content = file.read(1000).decode('utf-8', errors='ignore')
                        st.code(f"First 1000 chars of file:\n{content}", language="text")
                        return 0
                        
            elif file_ext.endswith(".xlsx"):
                df = pd.read_excel(file, engine='openpyxl')
            elif file_ext.endswith(".xls"):
                df = pd.read_excel(file, engine='xlrd')
            else:
                st.error(f"❌ Unsupported file format: {file.name}")
                os.unlink(tmp_file_path)
                return 0
        
        except Exception as e:
            st.error(f"❌ Error reading file: {str(e)}")
            
            # Clean up temp file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            
            # Provide troubleshooting tips
            st.info("""
            🔧 **Troubleshooting file reading:**
            
            1. **Check file format:** Ensure it's a valid CSV/Excel file
            2. **Check encoding:** Try saving as UTF-8 CSV
            3. **Check content:** File should have column headers and data
            4. **Check file size:** File should not be empty
            5. **Try re-saving:** Open in Excel and save as CSV UTF-8
            
            **For CSV files:**
            - First line should be column headers
            - Use commas as separators (not semicolons)
            - Avoid special characters in headers
            """)
            return 0
        
        # Clean up temp file
        if os.path.exists(tmp_file_path):
            os.unlink(tmp_file_path)
        
        # Validate dataframe
        if df is None or df.empty:
            st.warning("⚠️ The uploaded file is empty or contains no data")
            return 0
        
        # Check if dataframe has columns
        if len(df.columns) == 0:
            st.error("❌ No columns found in the file")
            st.info("""
            The file appears to have no column headers. 
            CSV files should have column names in the first row.
            
            Example:
            ```
            name,email,marks,salary,job_location
            John,john@email.com,85,50000,Delhi
            ```
            """)
            return 0
        
        st.success(f"✅ Read {len(df):,} rows with {len(df.columns)} columns")
        
        # Show column info
        with st.expander("📋 Column Details", expanded=True):
            col_info = pd.DataFrame({
                'Column Name': df.columns,
                'Data Type': df.dtypes.astype(str).values,
                'Non-Null Count': df.notnull().sum().values,
                'Sample Value': df.iloc[0].values if len(df) > 0 else [''] * len(df.columns)
            })
            st.dataframe(col_info, use_container_width=True, hide_index=True)
        
        # Clean column names (remove spaces, special chars)
        original_cols = df.columns.tolist()
        df.columns = [str(col).strip().replace(' ', '_').replace('.', '_').replace('(', '').replace(')', '').lower() 
                     for col in df.columns]
        
        if original_cols != df.columns.tolist():
            st.info(f"📝 Column names cleaned")
            col1, col2 = st.columns(2)
            with col1:
                st.write("**Original:**")
                for col in original_cols[:5]:
                    st.write(f"- {col}")
            with col2:
                st.write("**Cleaned:**")
                for col in df.columns[:5]:
                    st.write(f"- {col}")
        
        # Convert to records and handle NaN values
        records = df.replace({np.nan: None}).to_dict(orient="records")
        
        # Create or get collection
        col = db[collection_name]
        
        # Clear old data if exists
        try:
            existing_count = col.count_documents({})
            if existing_count > 0:
                with st.spinner(f"🗑️ Clearing existing data ({existing_count:,} records)..."):
                    col.delete_many({})
                st.info(f"🗑️ Cleared {existing_count:,} existing records from '{collection_name}'")
        except Exception as e:
            st.warning(f"⚠️ Could not clear existing data: {str(e)[:100]}")
        
        # Insert new data in batches
        if records:
            batch_size = 500  # Reduced for better progress tracking
            total_inserted = 0
            progress_bar = st.progress(0)
            status_text = st.empty()
            
            for i in range(0, len(records), batch_size):
                batch = records[i:i + batch_size]
                try:
                    result = col.insert_many(batch, ordered=False)
                    total_inserted += len(result.inserted_ids)
                    
                    # Update progress
                    progress = min((i + len(batch)) / len(records), 1.0)
                    progress_bar.progress(progress)
                    status_text.text(f"📤 Uploading: {total_inserted:,} / {len(records):,} records")
                    
                except BulkWriteError as bwe:
                    # Handle partial failures
                    inserted = bwe.details.get('nInserted', 0)
                    total_inserted += inserted
                    errors = bwe.details.get('writeErrors', [])
                    if errors:
                        st.warning(f"⚠️ Some records failed. Successfully inserted {inserted} records")
                        
                except Exception as e:
                    st.warning(f"⚠️ Batch {i//batch_size + 1} failed: {str(e)[:100]}")
                    # Try inserting records one by one
                    successful_in_batch = 0
                    for record in batch:
                        try:
                            col.insert_one(record)
                            successful_in_batch += 1
                            total_inserted += 1
                        except:
                            continue
                    
                    if successful_in_batch > 0:
                        st.info(f"Inserted {successful_in_batch} records from failed batch")
            
            progress_bar.empty()
            status_text.empty()
            
            if total_inserted > 0:
                st.success(f"✅ Successfully uploaded **{total_inserted:,}** records to '{collection_name}'")
                
                # Show sample of uploaded data
                with st.expander("👀 Sample of Uploaded Data", expanded=False):
                    sample_data = list(col.find({}, {"_id": 0}).limit(5))
                    if sample_data:
                        st.dataframe(pd.DataFrame(sample_data), use_container_width=True)
                
                # Show collection info
                try:
                    col_stats = db.command("collstats", collection_name)
                    st.info(f"""
                    📊 **Collection Stats:**
                    - **Documents:** {col_stats.get('count', 0):,}
                    - **Size:** {col_stats.get('size', 0) / (1024*1024):.2f} MB
                    - **Storage:** {col_stats.get('storageSize', 0) / (1024*1024):.2f} MB
                    - **Avg Document Size:** {col_stats.get('avgObjSize', 0):.0f} bytes
                    """)
                except:
                    st.info(f"📊 **Upload Summary:** {total_inserted:,} documents uploaded")
                
                return total_inserted
            else:
                st.error("❌ No records were inserted")
                return 0
        else:
            st.warning("⚠️ No valid records to insert")
            return 0
            
    except Exception as e:
        st.error(f"❌ Unexpected error during upload: {str(e)}")
        import traceback
        st.code(traceback.format_exc(), language="python")
        return 0
        
    finally:
        try:
            if 'client' in locals() and client:
                client.close()
        except:
            pass
def fetch_schema(collection_name: str = "dataset") -> Dict[str, Any]:
    """
    Return first document for schema display.
    """
    client = get_mongo_client()
    if client is None:
        return {"error": "No database connection"}
    
    db = client["nl_mongo_db"]
    
    try:
        col = db[collection_name]
        
        # Check if collection exists
        if collection_name not in db.list_collection_names():
            return {"error": f"Collection '{collection_name}' not found"}
        
        # Check if collection has data
        count = col.count_documents({})
        if count == 0:
            return {"message": "Collection is empty", "count": 0}
        
        # Get sample document(s) to understand schema
        sample = col.find_one({}, {"_id": 0})

        if not sample:
            return {"message": "No documents found", "count": count}

        # Convert datetime objects in sample document for JSON serialization
        processed_sample = convert_datetime_for_json(sample)

        # Get field types from multiple samples
        samples = list(col.find({}, {"_id": 0}).limit(10))
        field_info = {}

        for doc in samples:
            for key, value in doc.items():
                if key not in field_info:
                    field_info[key] = {
                        "type": type(value).__name__,
                        "sample_values": set(),
                        "count": 0
                    }

                field_info[key]["sample_values"].add(str(value)[:50])
                field_info[key]["count"] += 1

        # Convert sets to lists for JSON serialization
        for key in field_info:
            field_info[key]["sample_values"] = list(field_info[key]["sample_values"])[:5]

        schema_info = {
            "collection": collection_name,
            "count": count,
            "sample_document": processed_sample,
            "fields": list(field_info.keys()),
            "field_details": field_info,
            "timestamp": datetime.now().isoformat()
        }
        
        return schema_info
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def execute_mongo_query(query_pipeline: List[Dict], collection_name: str = "dataset") -> List[Dict]:
    """
    Run aggregation pipeline and return results.
    """
    client = get_mongo_client()
    if client is None:
        return []
    
    db = client["nl_mongo_db"]
    
    try:
        # Check if collection exists
        if collection_name not in db.list_collection_names():
            st.error(f"❌ Collection '{collection_name}' not found")
            return []
        
        col = db[collection_name]
        
        # Check if collection has data
        if col.count_documents({}) == 0:
            st.warning(f"⚠️ Collection '{collection_name}' is empty")
            return []
        
        # Execute aggregation pipeline
        start_time = time.time()
        result = list(col.aggregate(query_pipeline))
        execution_time = time.time() - start_time
        
        if result:
            st.success(f"✅ Query executed in {execution_time*1000:.0f}ms, returned {len(result)} records")
        
        # Convert all datetime objects and ObjectIds for JSON serialization
        result = convert_datetime_for_json(result)
        for doc in result:
            if '_id' in doc and isinstance(doc['_id'], ObjectId):
                doc['_id'] = str(doc['_id'])
        
        return result
        
    except Exception as e:
        st.error(f"❌ Query execution error: {str(e)[:200]}")
        return []
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_all_collections() -> List[str]:
    """
    Get all collection names from the database.
    """
    client = get_mongo_client()
    if client is None:
        return []
    
    db = client["nl_mongo_db"]
    
    try:
        collections = db.list_collection_names()
        return sorted(collections)
    except Exception as e:
        st.error(f"❌ Error fetching collections: {str(e)[:100]}")
        return []
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_collection_stats(collection_name: str = "dataset") -> Dict[str, Any]:
    """
    Get statistics for a collection.
    """
    client = get_mongo_client()
    if client is None:
        return {}
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return {"error": f"Collection '{collection_name}' not found"}
        
        col = db[collection_name]
        
        # Get basic stats
        stats = {
            "name": collection_name,
            "count": col.count_documents({}),
            "indexes": len(col.index_information()),
            "fields": [],
            "created": None,
            "size_mb": 0,
            "storage_mb": 0
        }
        
        # Try to get collection stats
        try:
            coll_stats = db.command("collstats", collection_name)
            stats.update({
                "size_mb": coll_stats.get("size", 0) / (1024 * 1024),
                "storage_mb": coll_stats.get("storageSize", 0) / (1024 * 1024),
                "avg_obj_size": coll_stats.get("avgObjSize", 0),
                "nindexes": coll_stats.get("nindexes", 0),
                "total_index_size_mb": coll_stats.get("totalIndexSize", 0) / (1024 * 1024)
            })
        except:
            pass
        
        # Get sample document for fields
        sample = col.find_one({}, {"_id": 0})
        if sample:
            stats["fields"] = list(sample.keys())
            
            # Try to infer data types
            field_types = {}
            for key, value in sample.items():
                field_types[key] = type(value).__name__
            stats["field_types"] = field_types
        
        return stats
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_collection_data(collection_name: str = "dataset", limit: int = 1000, skip: int = 0) -> pd.DataFrame:
    """
    Get data from a collection as pandas DataFrame.
    """
    client = get_mongo_client()
    if client is None:
        return pd.DataFrame()
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return pd.DataFrame()
        
        col = db[collection_name]
        
        # Get data with limit and skip
        cursor = col.find({}, {"_id": 0}).skip(skip).limit(limit)
        data = list(cursor)
        
        if data:
            df = pd.DataFrame(data)
            return df
        else:
            return pd.DataFrame()
            
    except Exception:
        return pd.DataFrame()
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def delete_collection(collection_name: str) -> bool:
    """
    Delete a collection from the database.
    """
    client = get_mongo_client()
    if client is None:
        return False
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            st.error(f"❌ Collection '{collection_name}' not found")
            return False
        
        # Get count before deletion
        col = db[collection_name]
        count = col.count_documents({})
        
        # Drop collection
        db.drop_collection(collection_name)
        
        st.success(f"✅ Deleted collection '{collection_name}' with {count:,} records")
        return True
        
    except Exception as e:
        st.error(f"❌ Error deleting collection: {str(e)}")
        return False
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def search_in_collection(collection_name: str, search_text: str, field: str = None) -> List[Dict]:
    """
    Search for text in a collection using regex.
    """
    client = get_mongo_client()
    if client is None:
        return []
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return []
        
        col = db[collection_name]
        
        # Create search query
        if field:
            # Search in specific field
            query = {field: {"$regex": search_text, "$options": "i"}}
        else:
            # Search in all string fields
            sample_doc = col.find_one({}, {"_id": 0})
            if not sample_doc:
                return []
            
            string_fields = [k for k, v in sample_doc.items() if isinstance(v, str)]
            if not string_fields:
                return []
            
            # Create OR query for all string fields
            or_conditions = [{f: {"$regex": search_text, "$options": "i"}} for f in string_fields]
            query = {"$or": or_conditions} if len(or_conditions) > 1 else or_conditions[0]
        
        # Execute search
        results = list(col.find(query, {"_id": 0}).limit(100))
        return results
        
    except Exception:
        return []
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_collection_aggregations(collection_name: str) -> Dict[str, Any]:
    """
    Get common aggregations for a collection.
    """
    client = get_mongo_client()
    if client is None:
        return {}
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return {}
        
        col = db[collection_name]
        
        # Get sample document to identify numeric fields
        sample = col.find_one({}, {"_id": 0})
        if not sample:
            return {}
        
        numeric_fields = [k for k, v in sample.items() if isinstance(v, (int, float))]
        aggregations = {"numeric_fields": numeric_fields}
        
        # Calculate basic stats for each numeric field
        for field in numeric_fields:
            try:
                pipeline = [
                    {
                        "$group": {
                            "_id": None,
                            f"avg_{field}": {"$avg": f"${field}"},
                            f"min_{field}": {"$min": f"${field}"},
                            f"max_{field}": {"$max": f"${field}"},
                            f"sum_{field}": {"$sum": f"${field}"},
                            f"std_{field}": {"$stdDevSamp": f"${field}"}
                        }
                    }
                ]
                
                result = list(col.aggregate(pipeline))
                if result:
                    aggregations[field] = result[0]
            except:
                continue
        
        # Get value counts for string fields (top 10)
        string_fields = [k for k, v in sample.items() if isinstance(v, str)]
        for field in string_fields[:5]:  # Limit to 5 fields to avoid performance issues
            try:
                pipeline = [
                    {"$group": {"_id": f"${field}", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 10}
                ]
                result = list(col.aggregate(pipeline))
                aggregations[f"top_{field}"] = result
            except:
                continue
        
        return aggregations
        
    except Exception:
        return {}
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def test_mongo_connection() -> Dict[str, Any]:
    """
    Test MongoDB connection and return detailed status.
    """
    start_time = time.time()
    client = get_mongo_client()
    
    if client is None:
        return {
            "connected": False,
            "error": "Failed to create client. Check MONGODB_URI in .env file.",
            "response_time": time.time() - start_time
        }
    
    try:
        # Test ping
        ping_result = client.admin.command('ping')
        
        # Get database info
        db = client["nl_mongo_db"]
        collections = db.list_collection_names()
        
        # Get server info
        server_info = client.server_info()
        
        result = {
            "connected": True,
            "database": "nl_mongo_db",
            "collections_count": len(collections),
            "collections": collections,
            "server_version": server_info.get("version", "Unknown"),
            "host": str(client.address),
            "response_time": time.time() - start_time,
            "timestamp": datetime.now().isoformat()
        }
        
        return result
        
    except Exception as e:
        return {
            "connected": False,
            "error": str(e),
            "response_time": time.time() - start_time
        }
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_database_info() -> Dict[str, Any]:
    """
    Get comprehensive database information.
    """
    client = get_mongo_client()
    if client is None:
        return {"error": "No connection"}
    
    db = client["nl_mongo_db"]
    
    try:
        collections = db.list_collection_names()
        info = {
            "database": "nl_mongo_db",
            "total_collections": len(collections),
            "collections": [],
            "total_documents": 0,
            "total_size_mb": 0,
            "server_info": client.server_info()
        }
        
        # Get info for each collection
        for collection in collections:
            col = db[collection]
            try:
                coll_stats = db.command("collstats", collection)
                stats = {
                    "name": collection,
                    "count": coll_stats.get("count", 0),
                    "size_mb": coll_stats.get("size", 0) / (1024 * 1024),
                    "storage_mb": coll_stats.get("storageSize", 0) / (1024 * 1024),
                    "avg_obj_size": coll_stats.get("avgObjSize", 0),
                    "indexes": coll_stats.get("nindexes", 0),
                    "total_index_size_mb": coll_stats.get("totalIndexSize", 0) / (1024 * 1024)
                }
                
                # Add to totals
                info["total_documents"] += stats["count"]
                info["total_size_mb"] += stats["size_mb"]
                
                info["collections"].append(stats)
            except:
                # Fallback if collstats fails
                stats = {
                    "name": collection,
                    "count": col.count_documents({}),
                    "size_mb": 0,
                    "indexes": len(col.index_information())
                }
                info["collections"].append(stats)
        
        return info
        
    except Exception as e:
        return {"error": str(e)}
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_field_distinct_values(collection_name: str, field_name: str, limit: int = 100) -> List:
    """
    Get distinct values for a specific field.
    """
    client = get_mongo_client()
    if client is None:
        return []
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return []
        
        col = db[collection_name]
        values = col.distinct(field_name)
        return list(values)[:limit]
        
    except Exception:
        return []
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def export_collection_to_csv(collection_name: str) -> str:
    """
    Export collection data to CSV format.
    """
    df = get_collection_data(collection_name, limit=10000)
    
    if df.empty:
        return ""
    
    csv_content = df.to_csv(index=False)
    return csv_content

def create_index(collection_name: str, field: str, unique: bool = False) -> bool:
    """
    Create an index on a field.
    """
    client = get_mongo_client()
    if client is None:
        return False
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return False
        
        col = db[collection_name]
        col.create_index([(field, 1)], unique=unique)
        return True
        
    except Exception:
        return False
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def backup_collection(collection_name: str) -> List[Dict]:
    """
    Backup collection data.
    """
    client = get_mongo_client()
    if client is None:
        return []
    
    db = client["nl_mongo_db"]
    
    try:
        if collection_name not in db.list_collection_names():
            return []
        
        col = db[collection_name]
        data = list(col.find({}, {"_id": 0}))
        return data
        
    except Exception:
        return []
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def restore_collection(collection_name: str, data: List[Dict]) -> bool:
    """
    Restore collection data.
    """
    if not data:
        return False
    
    client = get_mongo_client()
    if client is None:
        return False
    
    db = client["nl_mongo_db"]
    
    try:
        col = db[collection_name]
        
        # Clear existing data
        col.delete_many({})
        
        # Insert backup data in batches
        batch_size = 1000
        for i in range(0, len(data), batch_size):
            batch = data[i:i + batch_size]
            col.insert_many(batch)
        
        return True
        
    except Exception:
        return False
    finally:
        try:
            if client:
                client.close()
        except:
            pass

def get_query_examples(collection_name: str = "dataset") -> List[Dict[str, str]]:
    """
    Get query examples based on collection schema.
    """
    schema = fetch_schema(collection_name)
    
    if "error" in schema or "message" in schema:
        return []
    
    fields = schema.get("fields", [])
    examples = []
    
    # Basic queries
    examples.append({
        "query": "Show all data",
        "description": "Display all records",
        "pipeline": "[]"
    })
    
    # Sort queries
    for field in fields:
        examples.append({
            "query": f"Sort by {field} ascending",
            "description": f"Sort data by {field}",
            "pipeline": f'[{{"$sort": {{"{field}": 1}}}}]'
        })
        
        examples.append({
            "query": f"Sort by {field} descending",
            "description": f"Sort data by {field} in reverse",
            "pipeline": f'[{{"$sort": {{"{field}": -1}}}}]'
        })
    
    # Limit queries
    examples.append({
        "query": "Show first 10 records",
        "description": "Limit results",
        "pipeline": '[{"$limit": 10}]'
    })
    
    examples.append({
        "query": "Show top 5 records",
        "description": "Get top records",
        "pipeline": '[{"$limit": 5}]'
    })
    
    # Projection queries
    if len(fields) > 0:
        examples.append({
            "query": f"Show only {fields[0]} field",
            "description": "Select specific fields",
            "pipeline": f'[{{"$project": {{"{fields[0]}": 1, "_id": 0}}}}]'
        })
    
    return examples[:20]  # Limit to 20 examples

def validate_query_pipeline(pipeline: List[Dict]) -> Dict[str, Any]:
    """
    Validate a MongoDB aggregation pipeline.
    """
    if not isinstance(pipeline, list):
        return {"valid": False, "error": "Pipeline must be a list"}
    
    valid_stages = {
        "$match", "$group", "$sort", "$limit", "$skip", "$project",
        "$unwind", "$lookup", "$addFields", "$count", "$facet",
        "$bucket", "$sortByCount", "$graphLookup", "$search"
    }
    
    for i, stage in enumerate(pipeline):
        if not isinstance(stage, dict):
            return {"valid": False, "error": f"Stage {i} must be a dictionary"}
        
        if len(stage) != 1:
            return {"valid": False, "error": f"Stage {i} must have exactly one operator"}

        operator = list(stage.keys())[0]
        if operator not in valid_stages:
            return {"valid": False, "error": f"Invalid operator '{operator}' in stage {i}"}

    return {"valid": True, "message": "Pipeline is valid"}

def trend_prediction_model(data: pd.DataFrame, target_column: str, periods: int = 12) -> Dict[str, Any]:
    """
    Perform trend prediction using ARIMA model.
    """
    try:
        if data.empty or target_column not in data.columns:
            return {"error": "Invalid data or target column"}

        # Prepare time series data
        ts_data = data.copy()
        if 'date' in ts_data.columns:
            ts_data['date'] = pd.to_datetime(ts_data['date'], errors='coerce')
            ts_data = ts_data.dropna(subset=['date'])
            ts_data = ts_data.set_index('date').sort_index()

        # Aggregate by date if multiple entries
        if ts_data.index.duplicated().any():
            ts_data = ts_data.groupby(ts_data.index).sum()

        # Fit ARIMA model
        model = ARIMA(ts_data[target_column], order=(5,1,0))
        model_fit = model.fit()

        # Forecast
        forecast = model_fit.forecast(steps=periods)
        forecast_dates = pd.date_range(start=ts_data.index[-1], periods=periods+1, freq='D')[1:]

        # Convert historical data to ensure JSON serializable
        historical_dict = {}
        for idx, val in ts_data[target_column].tail(30).items():
            key = idx.strftime('%Y-%m-%d') if hasattr(idx, 'strftime') else str(idx)
            historical_dict[key] = float(val)

        return {
            "historical": historical_dict,
            "forecast": dict(zip(forecast_dates.strftime('%Y-%m-%d'), forecast.values)),
            "model_summary": str(model_fit.summary())
        }

    except Exception as e:
        return {"error": str(e)}

def anomaly_detection(data: pd.DataFrame, contamination: float = 0.1) -> Dict[str, Any]:
    """
    Detect anomalies using Isolation Forest.
    """
    try:
        if data.empty:
            return {"error": "No data provided"}

        # Select numeric columns
        numeric_cols = data.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return {"error": "No numeric columns found"}

        # Prepare data
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(data[numeric_cols])

        # Fit Isolation Forest
        iso_forest = IsolationForest(contamination=contamination, random_state=42)
        anomalies = iso_forest.fit_predict(scaled_data)

        # Get anomaly scores
        scores = iso_forest.decision_function(scaled_data)

        # Create results
        results = data.copy()
        results['anomaly_score'] = scores
        results['is_anomaly'] = anomalies == -1

        anomaly_count = results['is_anomaly'].sum()
        total_count = len(results)

        # Convert anomalous records to dict, handling datetime objects
        anomalous_df = results[results['is_anomaly']].head(10)
        anomalous_records = []
        for _, row in anomalous_df.iterrows():
            record = convert_datetime_for_json(row.to_dict())
            anomalous_records.append(record)

        return {
            "anomaly_count": int(anomaly_count),
            "total_records": total_count,
            "anomaly_percentage": (anomaly_count / total_count) * 100,
            "anomalous_records": anomalous_records,
            "contamination_used": contamination
        }

    except Exception as e:
        return {"error": str(e)}

def correlation_analysis(data1: pd.DataFrame, data2: pd.DataFrame, method: str = 'pearson') -> Dict[str, Any]:
    """
    Perform correlation analysis between two datasets.
    """
    try:
        if data1.empty or data2.empty:
            return {"error": "One or both datasets are empty"}

        # Find common columns
        common_cols = set(data1.columns) & set(data2.columns)
        numeric_common = [col for col in common_cols if pd.api.types.is_numeric_dtype(data1[col]) and pd.api.types.is_numeric_dtype(data2[col])]

        if not numeric_common:
            return {"error": "No common numeric columns found"}

        correlations = {}
        for col in numeric_common:
            corr = data1[col].corr(data2[col], method=method)
            correlations[col] = corr

        # Overall correlation matrix
        combined_data = pd.concat([data1[numeric_common], data2[numeric_common]], axis=1, keys=['dataset1', 'dataset2'])
        corr_matrix = combined_data.corr(method=method)

        return {
            "column_correlations": correlations,
            "correlation_matrix": corr_matrix.to_dict(),
            "strongest_correlations": sorted(correlations.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
        }

    except Exception as e:
        return {"error": str(e)}

def generate_ml_report(trend_results: Dict, anomaly_results: Dict, correlation_results: Dict) -> str:
    """
    Generate automated ML report.
    """
    try:
        report = f"""
# UIDAI Data Analysis Report
Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Trend Prediction Analysis
"""

        if 'error' not in trend_results:
            report += f"""
- Historical data points analyzed: {len(trend_results.get('historical', {}))}
- Forecast periods: {len(trend_results.get('forecast', {}))}
- Model: ARIMA(5,1,0)
"""
        else:
            report += f"- Error: {trend_results['error']}\n"

        report += "\n## Anomaly Detection Results\n"
        if 'error' not in anomaly_results:
            report += f"""
- Total records analyzed: {anomaly_results.get('total_records', 0)}
- Anomalies detected: {anomaly_results.get('anomaly_count', 0)}
- Anomaly percentage: {anomaly_results.get('anomaly_percentage', 0):.2f}%
- Contamination parameter: {anomaly_results.get('contamination_used', 0)}
"""
        else:
            report += f"- Error: {anomaly_results['error']}\n"

        report += "\n## Correlation Analysis\n"
        if 'error' not in correlation_results:
            strongest = correlation_results.get('strongest_correlations', [])
            report += f"""
- Columns analyzed: {len(correlation_results.get('column_correlations', {}))}
- Strongest correlations:
"""
            for col, corr in strongest:
                report += f"  - {col}: {corr:.3f}\n"
        else:
            report += f"- Error: {correlation_results['error']}\n"

        report += "\n## Recommendations\n"
        report += "- Monitor trends for policy planning\n"
        report += "- Investigate detected anomalies\n"
        report += "- Use correlation insights for targeted interventions\n"

        return report

    except Exception as e:
        return f"Error generating report: {str(e)}"


# Set page config
st.set_page_config(
    page_title="QueryGenius - NL to MongoDB",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for professional look
st.markdown("""
<style>
    /* Main container */
    .main {
        background-color: #f8f9fa;
    }
    
    /* Sidebar styling */
    .css-1d391kg {
        background-color: #2c3e50;
    }
    
    .sidebar .sidebar-content {
        background-color: #2c3e50;
    }
    
    /* Header styling */
    .stTitle {
        color: #2c3e50;
        font-weight: 700;
        font-size: 2.5rem;
        padding-bottom: 10px;
        border-bottom: 3px solid #3498db;
        margin-bottom: 20px;
    }
    
    /* Card-like containers */
    .card {
        background-color: white;
        border-radius: 12px;
        padding: 25px;
        box-shadow: 0 6px 15px rgba(0,0,0,0.08);
        margin-bottom: 25px;
        border: none;
        transition: transform 0.3s ease;
    }
    
    .card:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(0,0,0,0.12);
    }
    
    /* Button styling */
    .stButton > button {
        background: linear-gradient(135deg, #3498db 0%, #2c3e50 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 600;
        transition: all 0.3s ease;
        width: 100%;
    }
    
    .stButton > button:hover {
        background: linear-gradient(135deg, #2980b9 0%, #1a252f 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 15px rgba(0,0,0,0.2);
    }
    
    /* Primary button */
    .primary-button > button {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%) !important;
    }
    
    /* Tab styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 0px;
        background-color: #ecf0f1;
        border-radius: 10px;
        padding: 5px;
    }
    
    .stTabs [data-baseweb="tab"] {
        background-color: transparent;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 600;
        color: #7f8c8d;
        border: none;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: white !important;
        color: #3498db !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    
    /* Metric cards */
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 6px 15px rgba(0,0,0,0.1);
    }
    
    .metric-card h3 {
        color: white;
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
    }
    
    .metric-card .value {
        font-size: 28px;
        font-weight: 700;
        margin: 10px 0;
    }
    
    /* File uploader styling */
    .uploadedFile {
        background-color: #e8f4f8;
        border: 2px dashed #3498db;
        border-radius: 10px;
        padding: 30px;
        text-align: center;
        transition: all 0.3s ease;
    }
    
    .uploadedFile:hover {
        background-color: #d4edf7;
        border-color: #2980b9;
    }
    
    /* Dataframe styling */
    .dataframe {
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        border: 1px solid #e0e0e0;
    }
    
    /* Success/Error messages */
    .stSuccess {
        background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
        border: none;
        color: #155724;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
    }
    
    .stError {
        background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
        border: none;
        color: #721c24;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
    }
    
    .stInfo {
        background: linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%);
        border: none;
        color: #0c5460;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
    }
    
    /* Badge styling */
    .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        margin: 2px;
    }
    
    .badge-success {
        background-color: #28a745;
        color: white;
    }
    
    .badge-warning {
        background-color: #ffc107;
        color: #212529;
    }
    
    .badge-info {
        background-color: #17a2b8;
        color: white;
    }
    
    /* Progress bar */
    .stProgress > div > div > div {
        background-color: #3498db;
    }
    
    /* Expander styling */
    .streamlit-expanderHeader {
        background-color: #f8f9fa;
        border-radius: 8px;
        font-weight: 600;
    }
    
    /* Selectbox styling */
    .stSelectbox > div > div {
        border-radius: 8px;
        border: 2px solid #e0e0e0;
    }
    
    /* Text input styling */
    .stTextInput > div > div > input {
        border-radius: 8px;
        border: 2px solid #e0e0e0;
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #3498db;
        box-shadow: 0 0 0 0.2rem rgba(52, 152, 219, 0.25);
    }
    
    /* Divider */
    hr {
        border: none;
        height: 2px;
        background: linear-gradient(to right, transparent, #3498db, transparent);
        margin: 30px 0;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'current_collection' not in st.session_state:
    st.session_state.current_collection = None
if 'all_collections' not in st.session_state:
    st.session_state.all_collections = []
if 'uploaded_files' not in st.session_state:
    st.session_state.uploaded_files = []
if 'database_info' not in st.session_state:
    st.session_state.database_info = {}

# Sidebar
with st.sidebar:
    st.markdown("""
    <div style='text-align: center; padding: 20px 0;'>
        <h1 style='color: white; font-size: 28px; margin-bottom: 10px;'>🚀 QueryGenius</h1>
        <p style='color: #bdc3c7; font-size: 14px; margin-bottom: 30px;'>Natural Language to MongoDB Query Engine</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Navigation
    st.markdown("---")
    page = st.radio(
        "📌 **NAVIGATION**",
        ["📤 Add Files", "🔍 Explore Data", "🤖 ML Analysis", "⚙️ Database Settings"],
        key="nav",
        label_visibility="collapsed"
    )
    
    # Database Status
    st.markdown("---")
    st.markdown("### 📊 Database Status")
    
    # Test connection
    if st.button("🔄 Test Connection", use_container_width=True):
        with st.spinner("Testing connection..."):
            connection_status = test_mongo_connection()
            if connection_status.get("connected", False):
                st.success("✅ Connected!")
                st.session_state.database_info = connection_status
            else:
                st.error("❌ Connection Failed")
    
    # Get all collections if connected
    try:
        collections = get_all_collections()
        st.session_state.all_collections = collections
        
        if collections:
            st.success(f"✅ **{len(collections)}** collections found")
            
            # Collection selector
            selected_collection = st.selectbox(
                "**Select Collection**",
                ["-- Select --"] + collections,
                key="sidebar_collection"
            )
            
            if selected_collection != "-- Select --":
                st.session_state.current_collection = selected_collection
                
                # Show collection stats
                stats = get_collection_stats(selected_collection)
                if stats:
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("📝 Records", f"{stats.get('count', 0):,}")
                    with col2:
                        st.metric("📊 Fields", len(stats.get('fields', [])))
        else:
            st.info("📭 No collections yet")
    except Exception as e:
        st.error("❌ Database error")
    
    # Quick Actions
    st.markdown("---")
    st.markdown("### ⚡ Quick Actions")
    
    if st.session_state.current_collection:
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🗑️ Delete", use_container_width=True):
                st.warning(f"Delete collection '{st.session_state.current_collection}'?")
                if st.button("Confirm Delete", type="primary"):
                    if delete_collection(st.session_state.current_collection):
                        st.success("Collection deleted!")
                        st.session_state.all_collections = get_all_collections()
                        st.session_state.current_collection = None
                        st.rerun()
        with col2:
            if st.button("🔄 Refresh", use_container_width=True):
                st.session_state.all_collections = get_all_collections()
                st.rerun()
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #95a5a6; font-size: 12px; padding: 20px 0;'>
        <p>QueryGenius v1.0</p>
        <p>Powered by MongoDB + Gemini AI</p>
    </div>
    """, unsafe_allow_html=True)

# Main content based on selected page
if page == "📤 Add Files":
    # Header
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        st.title("📤 Upload Data Files")
        st.markdown("Upload CSV or Excel files to create MongoDB collections")
    
    # File Upload Card
    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)
        
        st.markdown("### 📁 Upload New File")
        
        col1, col2 = st.columns([2, 1])
        with col1:
            uploaded_file = st.file_uploader(
                "**Drag and drop or click to browse**",
                type=["csv", "xlsx"],
                help="Supported formats: CSV, Excel (.xlsx)",
                key="main_file_uploader"
            )
        
        with col2:
            default_name = f"dataset_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            collection_name = st.text_input(
                "**Collection Name**",
                value=default_name,
                help="Unique name for your MongoDB collection"
            )
        
        if uploaded_file:
            # File preview section
            st.markdown("---")
            st.markdown("### 📄 File Preview")
            
            try:
                if uploaded_file.name.endswith('.csv'):
                    df_preview = pd.read_csv(uploaded_file)
                else:
                    df_preview = pd.read_excel(uploaded_file, engine='openpyxl')
                
                # File info in metrics
                col1, col2, col3, col4 = st.columns(4)
                with col1:
                    st.metric("📊 Rows", f"{len(df_preview):,}")
                with col2:
                    st.metric("📈 Columns", len(df_preview.columns))
                with col3:
                    file_size_kb = uploaded_file.size / 1024
                    st.metric("💾 Size", f"{file_size_kb:.1f} KB")
                with col4:
                    st.metric("📝 File Type", uploaded_file.name.split('.')[-1].upper())
                
                # Data preview
                st.markdown("#### Sample Data (First 10 rows)")
                st.dataframe(df_preview.head(10), use_container_width=True)
                
                # Column info
                with st.expander("📋 Column Information", expanded=True):
                    col_info = pd.DataFrame({
                        'Column': df_preview.columns,
                        'Data Type': df_preview.dtypes.astype(str).values,
                        'Non-Null Count': df_preview.notnull().sum().values,
                        'Null Count': df_preview.isnull().sum().values
                    })
                    st.dataframe(col_info, use_container_width=True, hide_index=True)
                
                # Upload button
                st.markdown("---")
                col1, col2 = st.columns([3, 1])
                with col2:
                    if st.button("🚀 **Upload to Database**", type="primary", use_container_width=True, 
                               help="Upload data to MongoDB Atlas"):
                        with st.spinner("Uploading to MongoDB..."):
                            progress_bar = st.progress(0)
                            
                            # Simulate progress
                            for i in range(100):
                                progress_bar.progress(i + 1)
                            
                            count = upload_to_mongo(uploaded_file, collection_name)
                            
                            if count > 0:
                                st.success(f"✅ Successfully uploaded **{count:,}** records to collection: `{collection_name}`")
                                st.balloons()
                                
                                # Update session state
                                st.session_state.uploaded_files.append({
                                    'filename': uploaded_file.name,
                                    'collection': collection_name,
                                    'rows': count,
                                    'timestamp': datetime.now(),
                                    'size_kb': file_size_kb
                                })
                                st.session_state.all_collections = get_all_collections()
                                
                                # Show schema
                                with st.expander("🗃️ Collection Schema", expanded=True):
                                    schema = fetch_schema(collection_name)
                                    if schema:
                                        st.json(schema, expanded=False)
                                        
                                        # Show field badges
                                        st.markdown("**Fields:**")
                                        for field in schema.keys():
                                            st.markdown(f'<span class="badge badge-info">{field}</span>', 
                                                       unsafe_allow_html=True)
                            else:
                                st.error("❌ Failed to upload data. Please check your connection.")
                
            except Exception as e:
                st.error(f"❌ Error reading file: {str(e)}")
                st.info("Please ensure the file is in correct format and not corrupted.")
        
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Upload History Section
    if st.session_state.uploaded_files:
        st.markdown("### 📋 Upload History")
        
        history_df = pd.DataFrame(st.session_state.uploaded_files)
        if not history_df.empty:
            # Format timestamp
            history_df['timestamp'] = pd.to_datetime(history_df['timestamp']).dt.strftime('%Y-%m-%d %H:%M:%S')
            
            # Display as cards
            cols = st.columns(2)
            for idx, row in history_df.iterrows():
                with cols[idx % 2]:
                    with st.container():
                        st.markdown(f"""
                        <div class="card" style="padding: 15px;">
                            <h4>📁 {row['filename']}</h4>
                            <p><strong>Collection:</strong> <code>{row['collection']}</code></p>
                            <p><strong>Records:</strong> {row['rows']:,}</p>
                            <p><strong>Size:</strong> {row.get('size_kb', 0):.1f} KB</p>
                            <p><strong>Uploaded:</strong> {row['timestamp']}</p>
                        </div>
                        """, unsafe_allow_html=True)

elif page == "🔍 Explore Data":
    # Header
    col1, col2 = st.columns([3, 1])
    with col1:
        st.title("🔍 Explore & Query Data")
        st.markdown("Query your data using natural language or explore visually")
    
    # Collection Selector
    if st.session_state.all_collections:
        selected_collection = st.selectbox(
            "**Select Collection to Explore**",
            st.session_state.all_collections,
            index=0 if not st.session_state.current_collection or 
                      st.session_state.current_collection not in st.session_state.all_collections 
                   else st.session_state.all_collections.index(st.session_state.current_collection),
            key="main_collection_selector"
        )
        st.session_state.current_collection = selected_collection
        
        if selected_collection:
            # Collection Stats
            stats = get_collection_stats(selected_collection)
            
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>Total Records</h3>
                    <div class="value">{stats.get('count', 0):,}</div>
                </div>
                """, unsafe_allow_html=True)
            with col2:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>Fields</h3>
                    <div class="value">{len(stats.get('fields', []))}</div>
                </div>
                """, unsafe_allow_html=True)
            with col3:
                size_mb = stats.get('size_bytes', 0) / (1024 * 1024)
                st.markdown(f"""
                <div class="metric-card">
                    <h3>Size</h3>
                    <div class="value">{size_mb:.2f} MB</div>
                </div>
                """, unsafe_allow_html=True)
            with col4:
                st.markdown(f"""
                <div class="metric-card">
                    <h3>Indexes</h3>
                    <div class="value">{stats.get('indexes', 0)}</div>
                </div>
                """, unsafe_allow_html=True)
            
            # Tabs for different views
            tab1, tab2, tab3, tab4 = st.tabs(["📋 View Data", "💬 NL Query", "🔍 Search", "📊 Analytics"])
            
            with tab1:
                # View all data
                st.markdown(f"### 📊 Data Preview: `{selected_collection}`")
                
                # Load data
                df = get_collection_data(selected_collection, limit=1000)
                
                if not df.empty:
                    # Show data with filters
                    st.dataframe(df, use_container_width=True, height=500)
                    
                    # Show data info
                    with st.expander("📈 Data Summary", expanded=False):
                        st.write(f"**Shape:** {df.shape[0]} rows × {df.shape[1]} columns")
                        
                        # Numeric columns summary
                        numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
                        if len(numeric_cols) > 0:
                            st.markdown("**Numeric Columns:**")
                            for col in numeric_cols:
                                st.write(f"- **{col}:** Min={df[col].min():.2f}, Max={df[col].max():.2f}, "
                                        f"Mean={df[col].mean():.2f}, Std={df[col].std():.2f}")
                        
                        # Download button
                        csv = df.to_csv(index=False)
                        st.download_button(
                            label="📥 Download Dataset",
                            data=csv,
                            file_name=f"{selected_collection}_data.csv",
                            mime="text/csv",
                            use_container_width=True
                        )
                else:
                    st.info("No data found in this collection.")
            
            with tab2:
                # Natural Language Query
                st.markdown(f"### 💬 Natural Language Query")
                st.markdown("Ask questions about your data in plain English")
                
                # Query examples
                with st.expander("📚 Query Examples", expanded=False):
                    examples = [
                        "Show top 5 employees by marks",
                        "Find all people in Mumbai",
                        "Average salary by city",
                        "Count employees in each location",
                        "Employees with salary above 50000",
                        "Sort by salary descending",
                        "Group by job_location and show average marks",
                        "Find duplicate emails",
                        "Highest and lowest marks",
                        "Distribution of salaries"
                    ]
                    
                    cols = st.columns(2)
                    for idx, example in enumerate(examples):
                        with cols[idx % 2]:
                            if st.button(f"✨ {example}", key=f"example_{idx}", use_container_width=True):
                                st.session_state.query_text = example
                
                # Query input
                query = st.text_area(
                    "**Enter your query**",
                    value=st.session_state.get('query_text', ''),
                    placeholder="e.g., 'Show top 5 employees by marks in Mumbai'",
                    height=100,
                    key="nl_query_input"
                )
                
                api_key = os.getenv("GOOGLE_API_KEY")
                
                if api_key:
                    col1, col2 = st.columns([4, 1])
                    with col2:
                        if st.button("🚀 **Execute Query**", type="primary", use_container_width=True):
                            st.session_state.run_nl_query = True
                    
                    if st.session_state.get('run_nl_query', False) and query:
                        with st.spinner("🧠 Converting to MongoDB query..."):
                            try:
                                # Configure Google Generative AI
                                genai.configure(api_key=api_key)
                                model = genai.GenerativeModel('gemini-2.5-flash')
                                
                                # Get schema for prompt
                                schema = fetch_schema(selected_collection)
                                
                                # Create prompt
                                prompt = f"""
                                You are a MongoDB expert. Convert this natural language query to a MongoDB aggregation pipeline.
                                
                                COLLECTION: {selected_collection}
                                SCHEMA: {json.dumps(schema, indent=2) if schema else 'No schema'}
                                QUERY: "{query}"
                                
                                IMPORTANT:
                                1. Return ONLY a valid JSON array
                                2. No markdown, no explanations
                                3. Use $regex with 'i' for text searches
                                4. If unsure, return []
                                
                                RESPONSE:
                                """
                                
                                response = model.generate_content(prompt)
                                raw_pipeline = response.text
                                
                                # Clean response
                                cleaned = raw_pipeline.strip()
                                if cleaned.startswith("```json"):
                                    cleaned = cleaned[7:]
                                if cleaned.startswith("```"):
                                    cleaned = cleaned[3:]
                                if cleaned.endswith("```"):
                                    cleaned = cleaned[:-3]
                                cleaned = cleaned.strip()
                                
                                # Try to parse
                                try:
                                    pipeline = json.loads(cleaned.replace("'", '"'))
                                    
                                    # Show pipeline
                                    with st.expander("🔧 Generated MongoDB Pipeline", expanded=True):
                                        st.code(json.dumps(pipeline, indent=2), language="json")
                                    
                                    # Execute
                                    results = execute_mongo_query(pipeline, selected_collection)
                                    
                                    if results:
                                        df_results = pd.DataFrame(results)
                                        if '_id' in df_results.columns:
                                            df_results = df_results.drop('_id', axis=1)
                                        
                                        st.success(f"✅ Retrieved **{len(df_results)}** records")
                                        st.dataframe(df_results, use_container_width=True)
                                        
                                        # Show stats
                                        if not df_results.empty:
                                            with st.expander("📊 Query Statistics", expanded=False):
                                                numeric_cols = df_results.select_dtypes(include=['int64', 'float64']).columns
                                                for col in numeric_cols:
                                                    col1, col2, col3 = st.columns(3)
                                                    with col1:
                                                        st.metric(f"Avg {col}", f"{df_results[col].mean():.2f}")
                                                    with col2:
                                                        st.metric(f"Min {col}", f"{df_results[col].min():.2f}")
                                                    with col3:
                                                        st.metric(f"Max {col}", f"{df_results[col].max():.2f}")
                                        
                                        # Download
                                        csv_results = df_results.to_csv(index=False)
                                        st.download_button(
                                            "📥 Download Results",
                                            csv_results,
                                            f"{selected_collection}_query_results.csv",
                                            "text/csv",
                                            use_container_width=True
                                        )
                                    else:
                                        st.info("No results found for your query.")
                                
                                except json.JSONDecodeError:
                                    st.error("Could not parse the AI response.")
                                    st.code(raw_pipeline, language="text")
                                
                            except Exception as e:
                                st.error(f"Error: {str(e)[:200]}")
                        
                        st.session_state.run_nl_query = False
                else:
                    st.warning("⚠️ Google API key not found. Please set GOOGLE_API_KEY in .env file")
            
            with tab3:
                # Search Tab
                st.markdown("### 🔍 Search in Collection")
                
                col1, col2 = st.columns([3, 1])
                with col1:
                    search_text = st.text_input("Search text", placeholder="Enter search term...")
                with col2:
                    search_field = st.selectbox("Field", ["All Fields"] + stats.get('fields', []))
                
                if search_text:
                    with st.spinner("Searching..."):
                        if search_field == "All Fields":
                            results = search_in_collection(selected_collection, search_text)
                        else:
                            results = search_in_collection(selected_collection, search_text, search_field)
                        
                        if results:
                            df_search = pd.DataFrame(results)
                            st.success(f"Found {len(df_search)} matches")
                            st.dataframe(df_search, use_container_width=True)
                        else:
                            st.info("No matches found")
            
            with tab4:
                # Analytics Tab
                st.markdown("### 📊 Data Analytics")
                
                df = get_collection_data(selected_collection, limit=1000)
                
                if not df.empty:
                    # Numeric Analysis
                    numeric_cols = df.select_dtypes(include=['int64', 'float64']).columns
                    
                    if len(numeric_cols) > 0:
                        st.markdown("#### 🔢 Numeric Analysis")
                        
                        selected_num_col = st.selectbox("Select numeric column", numeric_cols)
                        
                        if selected_num_col:
                            col1, col2, col3, col4 = st.columns(4)
                            with col1:
                                st.metric("Mean", f"{df[selected_num_col].mean():.2f}")
                            with col2:
                                st.metric("Median", f"{df[selected_num_col].median():.2f}")
                            with col3:
                                st.metric("Std Dev", f"{df[selected_num_col].std():.2f}")
                            with col4:
                                st.metric("Range", f"{df[selected_num_col].max() - df[selected_num_col].min():.2f}")
                            
                            # Histogram
                            fig, ax = plt.subplots(figsize=(10, 4))
                            ax.hist(df[selected_num_col].dropna(), bins=30, edgecolor='black', alpha=0.7)
                            ax.set_xlabel(selected_num_col)
                            ax.set_ylabel('Frequency')
                            ax.set_title(f'Distribution of {selected_num_col}')
                            ax.grid(True, alpha=0.3)
                            st.pyplot(fig)
                    
                    # Categorical Analysis
                    cat_cols = df.select_dtypes(include=['object']).columns
                    
                    if len(cat_cols) > 0:
                        st.markdown("#### 📊 Categorical Analysis")
                        
                        selected_cat_col = st.selectbox("Select categorical column", cat_cols)
                        
                        if selected_cat_col:
                            value_counts = df[selected_cat_col].value_counts().head(10)
                            
                            col1, col2 = st.columns([2, 1])
                            with col1:
                                fig, ax = plt.subplots(figsize=(10, 4))
                                value_counts.plot(kind='bar', ax=ax, color='skyblue')
                                ax.set_xlabel(selected_cat_col)
                                ax.set_ylabel('Count')
                                ax.set_title(f'Top 10 Values in {selected_cat_col}')
                                ax.tick_params(axis='x', rotation=45)
                                ax.grid(True, alpha=0.3)
                                st.pyplot(fig)
                            
                            with col2:
                                st.dataframe(value_counts)
                    
                    # Correlation Matrix
                    if len(numeric_cols) >= 2:
                        st.markdown("#### 🔗 Correlation Matrix")
                        fig, ax = plt.subplots(figsize=(8, 6))
                        corr_matrix = df[numeric_cols].corr()
                        sns.heatmap(corr_matrix, annot=True, cmap='coolwarm', center=0, ax=ax)
                        st.pyplot(fig)
                else:
                    st.info("No data available for analytics.")
    else:
        # No collections
        st.info("""
        ## 📭 No Collections Found
        
        To get started:
        1. Go to **📤 Add Files** in the sidebar
        2. Upload a CSV or Excel file
        3. Give it a collection name
        4. Click **Upload to Database**
        
        Then come back here to explore and query your data!
        """)

elif page == "🤖 ML Analysis":
    # Header
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        st.title("🤖 ML Analysis Dashboard")
        st.markdown("Advanced analytics for UIDAI data using Machine Learning")

    # Collection selection for ML analysis
    st.markdown("---")
    st.markdown("### 📊 Select Dataset for Analysis")

    if st.session_state.all_collections:
        selected_collection_ml = st.selectbox(
            "**Choose a collection for ML analysis**",
            ["-- Select Collection --"] + st.session_state.all_collections,
            key="ml_collection"
        )

        if selected_collection_ml != "-- Select Collection --":
            # Get data from collection
            try:
                client = get_mongo_client()
                if client:
                    db = client["nl_mongo_db"]
                    collection = db[selected_collection_ml]

                    # Convert to DataFrame
                    data = list(collection.find({}, {"_id": 0}))
                    df = pd.DataFrame(data)

                    if not df.empty:
                        st.success(f"✅ Loaded {len(df)} records from '{selected_collection_ml}'")

                        # ML Analysis Tabs
                        tab1, tab2, tab3, tab4, tab5 = st.tabs([
                            "📈 Trend Prediction",
                            "🔍 Anomaly Detection",
                            "📊 Correlation Analysis",
                            "📋 Dashboard",
                            "📄 Report Generation"
                        ])

                        with tab1:
                            st.markdown("### 📈 Trend Prediction Model")
                            st.markdown("Predict future trends using ARIMA time series forecasting")

                            # Select target column
                            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                            if numeric_cols:
                                target_col = st.selectbox("Select target column for prediction", numeric_cols, key="trend_target")
                                periods = st.slider("Forecast periods", 1, 24, 12, key="forecast_periods")

                                if st.button("🚀 Run Trend Prediction", key="trend_btn"):
                                    with st.spinner("Analyzing trends..."):
                                        trend_results = trend_prediction_model(df, target_col, periods)

                                    if 'error' not in trend_results:
                                        st.success("✅ Trend analysis completed!")

                                        # Plot historical + forecast
                                        fig = go.Figure()

                                        # Historical data
                                        hist_dates = list(trend_results['historical'].keys())
                                        hist_values = list(trend_results['historical'].values())
                                        fig.add_trace(go.Scatter(x=hist_dates, y=hist_values, mode='lines+markers', name='Historical'))

                                        # Forecast
                                        forecast_dates = list(trend_results['forecast'].keys())
                                        forecast_values = list(trend_results['forecast'].values())
                                        fig.add_trace(go.Scatter(x=forecast_dates, y=forecast_values, mode='lines+markers', name='Forecast', line=dict(dash='dash')))

                                        fig.update_layout(title=f"Trend Prediction for {target_col}", xaxis_title="Date", yaxis_title=target_col)
                                        st.plotly_chart(fig, use_container_width=True)

                                        with st.expander("📊 Model Details"):
                                            st.code(trend_results['model_summary'])
                                    else:
                                        st.error(f"❌ {trend_results['error']}")
                            else:
                                st.warning("No numeric columns found for trend analysis")

                        with tab2:
                            st.markdown("### 🔍 Anomaly Detection")
                            st.markdown("Identify suspicious patterns using Isolation Forest algorithm")

                            contamination = st.slider("Contamination (expected anomaly %)", 0.01, 0.5, 0.1, key="contamination")

                            if st.button("🔍 Detect Anomalies", key="anomaly_btn"):
                                with st.spinner("Detecting anomalies..."):
                                    anomaly_results = anomaly_detection(df, contamination)

                                if 'error' not in anomaly_results:
                                    st.success("✅ Anomaly detection completed!")

                                    # Metrics
                                    col1, col2, col3 = st.columns(3)
                                    with col1:
                                        st.metric("Total Records", anomaly_results['total_records'])
                                    with col2:
                                        st.metric("Anomalies Found", anomaly_results['anomaly_count'])
                                    with col3:
                                        st.metric("Anomaly %", f"{anomaly_results['anomaly_percentage']:.2f}%")

                                    # Anomalous records
                                    if anomaly_results['anomalous_records']:
                                        st.markdown("### 🚨 Anomalous Records")
                                        anomaly_df = pd.DataFrame(anomaly_results['anomalous_records'])
                                        st.dataframe(anomaly_df, use_container_width=True)

                                        # Visualization
                                        fig = px.scatter(df, x=df.index, y=df.select_dtypes(include=[np.number]).columns[0] if len(df.select_dtypes(include=[np.number]).columns) > 0 else df.columns[0],
                                                       color=df.index.isin(anomaly_df.index) if hasattr(anomaly_df, 'index') else [False]*len(df),
                                                       title="Anomaly Detection Results")
                                        st.plotly_chart(fig, use_container_width=True)
                                else:
                                    st.error(f"❌ {anomaly_results['error']}")

                        with tab3:
                            st.markdown("### 📊 Correlation Analysis")
                            st.markdown("Analyze relationships between different datasets")

                            # Select second dataset for correlation
                            other_collections = [c for c in st.session_state.all_collections if c != selected_collection_ml]
                            if other_collections:
                                corr_collection = st.selectbox("Select second dataset for correlation", ["-- None --"] + other_collections, key="corr_collection")

                                if corr_collection != "-- None --":
                                    method = st.selectbox("Correlation method", ["pearson", "spearman", "kendall"], key="corr_method")

                                    if st.button("📊 Analyze Correlation", key="corr_btn"):
                                        with st.spinner("Analyzing correlations..."):
                                            # Get second dataset
                                            corr_data = list(db[corr_collection].find({}, {"_id": 0}))
                                            df2 = pd.DataFrame(corr_data)

                                            correlation_results = correlation_analysis(df, df2, method)

                                        if 'error' not in correlation_results:
                                            st.success("✅ Correlation analysis completed!")

                                            # Display strongest correlations
                                            st.markdown("### 🔗 Strongest Correlations")
                                            for col, corr in correlation_results['strongest_correlations']:
                                                st.write(f"**{col}**: {corr:.3f}")

                                            # Correlation heatmap
                                            corr_matrix = pd.DataFrame(correlation_results['correlation_matrix'])
                                            fig = px.imshow(corr_matrix, title="Correlation Matrix", aspect="auto")
                                            st.plotly_chart(fig, use_container_width=True)
                                        else:
                                            st.error(f"❌ {correlation_results['error']}")
                                else:
                                    st.info("Select a second dataset to perform correlation analysis")
                            else:
                                st.warning("No other collections available for correlation analysis")

                        with tab4:
                            st.markdown("### 📋 ML Dashboard")
                            st.markdown("Comprehensive visualization dashboard")

                            # Quick metrics
                            col1, col2, col3, col4 = st.columns(4)
                            with col1:
                                st.metric("Total Records", len(df))
                            with col2:
                                st.metric("Numeric Columns", len(df.select_dtypes(include=[np.number]).columns))
                            with col3:
                                st.metric("Date Columns", len([col for col in df.columns if 'date' in col.lower()]))
                            with col4:
                                st.metric("Location Columns", len([col for col in df.columns if any(x in col.lower() for x in ['state', 'district', 'pincode'])]))

                            # Data overview plots
                            if len(df.select_dtypes(include=[np.number]).columns) > 0:
                                st.markdown("### 📊 Data Distributions")
                                numeric_df = df.select_dtypes(include=[np.number])
                                fig = px.box(numeric_df, title="Numeric Data Distributions")
                                st.plotly_chart(fig, use_container_width=True)

                            # Time series if date column exists
                            date_cols = [col for col in df.columns if 'date' in col.lower()]
                            if date_cols and len(df.select_dtypes(include=[np.number]).columns) > 0:
                                st.markdown("### 📈 Time Series Trends")
                                df_ts = df.copy()
                                df_ts[date_cols[0]] = pd.to_datetime(df_ts[date_cols[0]], errors='coerce')
                                df_ts = df_ts.dropna(subset=[date_cols[0]])
                                df_ts = df_ts.set_index(date_cols[0])

                                numeric_cols = df_ts.select_dtypes(include=[np.number]).columns[:3]  # Top 3 numeric columns
                                if len(numeric_cols) > 0:
                                    fig = px.line(df_ts, y=numeric_cols, title="Time Series Trends")
                                    st.plotly_chart(fig, use_container_width=True)

                        with tab5:
                            st.markdown("### 📄 Automated Report Generation")
                            st.markdown("Generate comprehensive ML analysis reports")

                            if st.button("📄 Generate Full Report", key="report_btn"):
                                with st.spinner("Generating report..."):
                                    # Run all analyses
                                    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

                                    trend_results = {}
                                    anomaly_results = {}
                                    correlation_results = {}

                                    if numeric_cols:
                                        trend_results = trend_prediction_model(df, numeric_cols[0], 12)
                                        anomaly_results = anomaly_detection(df, 0.1)

                                        # Try correlation with another dataset if available
                                        other_collections = [c for c in st.session_state.all_collections if c != selected_collection_ml]
                                        if other_collections:
                                            corr_data = list(db[other_collections[0]].find({}, {"_id": 0}))
                                            df2 = pd.DataFrame(corr_data)
                                            correlation_results = correlation_analysis(df, df2, 'pearson')
                                        else:
                                            correlation_results = {"error": "No second dataset available"}

                                    report = generate_ml_report(trend_results, anomaly_results, correlation_results)

                                st.success("✅ Report generated!")
                                st.markdown("### 📋 Analysis Report")
                                st.code(report, language="markdown")

                                # Download button
                                st.download_button(
                                    label="📥 Download Report",
                                    data=report,
                                    file_name=f"ml_analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md",
                                    mime="text/markdown",
                                    key="download_report"
                                )

                    else:
                        st.warning("Selected collection is empty")
                else:
                    st.error("Database connection failed")

            except Exception as e:
                st.error(f"Error loading data: {str(e)}")
        else:
            st.info("Please select a collection to perform ML analysis")
    else:
        st.warning("No collections available. Please upload data first.")

elif page == "⚙️ Database Settings":
    st.title("⚙️ Database Settings")
    
    # Test Connection
    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### 🔗 Connection Status")
        
        if st.button("🔄 Test Database Connection", use_container_width=True):
            with st.spinner("Testing connection..."):
                connection_status = test_mongo_connection()
                
                if connection_status.get("connected", False):
                    st.success("✅ **Connected Successfully!**")
                    
                    # Display connection info
                    col1, col2 = st.columns(2)
                    with col1:
                        st.metric("Database", connection_status.get("database", "N/A"))
                        st.metric("Collections", connection_status.get("collections_count", 0))
                    with col2:
                        server_info = connection_status.get("server_info", {})
                        st.metric("MongoDB Version", server_info.get("version", "N/A"))
                        st.metric("Host", server_info.get("host", "N/A"))
                    
                    # Show collections
                    if connection_status.get("collections"):
                        st.markdown("**Available Collections:**")
                        for col in connection_status["collections"]:
                            st.markdown(f"- `{col}`")
                else:
                    st.error("❌ **Connection Failed**")
                    st.code(connection_status.get("error", "Unknown error"), language="text")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # Database Information
    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### 📊 Database Information")
        
        if st.button("📋 Get Database Info", use_container_width=True):
            with st.spinner("Fetching database information..."):
                db_info = get_database_info()
                
                if db_info:
                    st.success(f"Database: **{db_info.get('database')}**")
                    st.metric("Total Collections", db_info.get("total_collections", 0))
                    
                    # Show collections table
                    collections_data = []
                    for col in db_info.get("collections", []):
                        collections_data.append({
                            "Collection": col.get("name"),
                            "Records": col.get("count", 0),
                            "Fields": len(col.get("fields", [])),
                            "Indexes": col.get("indexes", 0)
                        })
                    
                    if collections_data:
                        st.dataframe(pd.DataFrame(collections_data), use_container_width=True)
                else:
                    st.error("Failed to fetch database information")
        st.markdown('</div>', unsafe_allow_html=True)
    
    # System Information
    with st.container():
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.markdown("### ℹ️ System Information")
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Python Version", os.sys.version.split()[0])
            st.metric("Streamlit Version", st.__version__)
        with col2:
            try:
                import pymongo
                st.metric("PyMongo Version", pymongo.__version__)
            except:
                st.metric("PyMongo Version", "N/A")
            
            try:
                import pandas as pd
                st.metric("Pandas Version", pd.__version__)
            except:
                st.metric("Pandas Version", "N/A")
        st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
col1, col2, col3 = st.columns(3)
with col1:
    st.markdown("**QueryGenius v1.0**")
with col2:
    st.markdown("Made with ❤️ using Streamlit")
with col3:
    st.markdown(f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")