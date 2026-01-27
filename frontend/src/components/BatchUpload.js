import React, { useState } from 'react';
import { uploadDocumentBatch } from '../services/api';
import { toast } from 'react-toastify';

function BatchUpload({ onUploadComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setUploadResults(null);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

const handleBatchUpload = async () => {
  if (selectedFiles.length === 0) {
    toast.warning('Please select files first');
    return;
  }

  setUploading(true);
  setUploadProgress(0);

  try {
    const response = await uploadDocumentBatch(selectedFiles, (progress) => {
      setUploadProgress(progress);
    });

    setUploadResults(response.data);
    toast.success(`🎉 Successfully uploaded ${selectedFiles.length} files!`);
    setSelectedFiles([]);
    
    if (onUploadComplete) {
      onUploadComplete();
    }
  } catch (error) {
    toast.error('Batch upload failed: ' + (error.response?.data?.detail || error.message));
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        📦 Batch Upload (Multiple Files)
      </h2>

      {/* File Input */}
      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.png,.jpg,.jpeg"
          multiple
          disabled={uploading}
          style={{ 
            width: '100%',
            padding: '0.5rem', 
            border: '2px dashed #d1d5db', 
            borderRadius: '0.375rem',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        />
        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
          Select multiple PDF or image files
        </p>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
            Selected Files ({selectedFiles.length})
          </h3>
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            border: '1px solid #e5e7eb', 
            borderRadius: '0.375rem',
            padding: '0.5rem'
          }}>
            {selectedFiles.map((file, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.5rem',
                  borderBottom: index < selectedFiles.length - 1 ? '1px solid #f3f4f6' : 'none'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
                {!uploading && (
                  <button 
                    onClick={() => handleRemoveFile(index)}
                    style={{ 
                      padding: '0.25rem 0.5rem', 
                      backgroundColor: '#fee2e2', 
                      color: '#991b1b',
                      borderRadius: '0.25rem', 
                      border: 'none', 
                      cursor: 'pointer',
                      fontSize: '0.75rem'
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Uploading...</span>
            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{uploadProgress}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '9999px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${uploadProgress}%`, 
              height: '100%', 
              backgroundColor: '#3b82f6',
              transition: 'width 0.3s'
            }} />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button 
        onClick={handleBatchUpload}
        disabled={uploading || selectedFiles.length === 0}
        style={{ 
          width: '100%',
          padding: '0.75rem', 
          backgroundColor: uploading ? '#9ca3af' : selectedFiles.length === 0 ? '#d1d5db' : '#3b82f6', 
          color: 'white', 
          borderRadius: '0.375rem', 
          border: 'none', 
          cursor: uploading || selectedFiles.length === 0 ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem'
        }}
      >
        {uploading 
          ? `Uploading ${selectedFiles.length} files... (${uploadProgress}%)`
          : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
        }
      </button>

      {/* Upload Results */}
      {uploadResults && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #86efac',
          borderRadius: '0.375rem' 
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#166534', marginBottom: '0.5rem' }}>
            ✅ Upload Complete
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#15803d' }}>
            {uploadResults.message}
          </p>
          {uploadResults.data && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#15803d' }}>
              {uploadResults.data.map((item, idx) => (
                <div key={idx}>
                  • {item.filename} - {item.status}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BatchUpload;