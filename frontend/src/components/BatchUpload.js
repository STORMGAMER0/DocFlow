import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUpload, FiX, FiFile, FiCheckCircle } from 'react-icons/fi';
import { uploadDocumentBatch } from '../services/api';
import { colors, styles, mergeStyles } from '../styles';

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

  const getTotalSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  return (
    <div>
      {/* File Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label
          htmlFor="batch-upload"
          style={{
            display: 'block',
            padding: '3rem 2rem',
            border: `2px dashed ${colors.gray[300]}`,
            borderRadius: '0.75rem',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            backgroundColor: colors.gray[50],
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              e.target.style.borderColor = colors.primary;
              e.target.style.backgroundColor = colors.primaryLight;
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              e.target.style.borderColor = colors.gray[300];
              e.target.style.backgroundColor = colors.gray[50];
            }
          }}
        >
          <FiUpload style={{ 
            fontSize: '3rem', 
            color: colors.gray[400],
            marginBottom: '1rem',
          }} />
          <p style={{ 
            fontSize: '1rem', 
            fontWeight: '600',
            color: colors.gray[700],
            marginBottom: '0.5rem',
          }}>
            Click to select files or drag and drop
          </p>
          <p style={{ fontSize: '0.875rem', color: colors.gray[500] }}>
            PDF, JPG, JPEG, PNG (Multiple files allowed)
          </p>
          <input
            id="batch-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg"
            multiple
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              color: colors.gray[800],
            }}>
              Selected Files ({selectedFiles.length})
            </h3>
            <div style={{
              fontSize: '0.875rem',
              color: colors.gray[600],
            }}>
              Total: {formatFileSize(getTotalSize())}
            </div>
          </div>
          
          <div style={{
            maxHeight: '300px',
            overflowY: 'auto',
            border: `1px solid ${colors.gray[200]}`,
            borderRadius: '0.5rem',
            backgroundColor: colors.white,
          }}>
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: index < selectedFiles.length - 1 ? `1px solid ${colors.gray[100]}` : 'none',
                  transition: 'background-color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray[50]}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  {/* File Icon */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '0.5rem',
                    backgroundColor: colors.primaryLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <FiFile style={{ fontSize: '1.25rem', color: colors.primary }} />
                  </div>

                  {/* File Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: '500',
                      color: colors.gray[800],
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {file.name}
                    </div>
                    <div style={{ 
                      fontSize: '0.75rem', 
                      color: colors.gray[500],
                      marginTop: '0.25rem',
                    }}>
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                {!uploading && (
                  <button
                    onClick={() => handleRemoveFile(index)}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: 'transparent',
                      color: colors.gray[400],
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = colors.dangerLight;
                      e.target.style.color = colors.danger;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = colors.gray[400];
                    }}
                  >
                    <FiX style={{ fontSize: '1.25rem' }} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.75rem',
          }}>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: colors.gray[700],
            }}>
              Uploading {selectedFiles.length} files...
            </span>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '600',
              color: colors.primary,
            }}>
              {uploadProgress}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '12px',
            backgroundColor: colors.gray[200],
            borderRadius: '9999px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.info} 100%)`,
              transition: 'width 0.3s ease',
              borderRadius: '9999px',
            }} />
          </div>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleBatchUpload}
        disabled={uploading || selectedFiles.length === 0}
        style={mergeStyles(
          styles.button.base,
          styles.button.primary,
          { width: '100%', justifyContent: 'center', fontSize: '1rem', padding: '1rem' },
          (uploading || selectedFiles.length === 0) ? styles.button.disabled : {}
        )}
        onMouseEnter={(e) => {
          if (!uploading && selectedFiles.length > 0) {
            Object.assign(e.target.style, styles.button.primaryHover);
          }
        }}
        onMouseLeave={(e) => {
          if (!uploading && selectedFiles.length > 0) {
            e.target.style.backgroundColor = colors.primary;
            e.target.style.transform = 'none';
            e.target.style.boxShadow = 'none';
          }
        }}
      >
        <FiUpload />
        {uploading
          ? `Uploading... (${uploadProgress}%)`
          : `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
        }
      </button>

      {/* Upload Results */}
      {uploadResults && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          backgroundColor: colors.successLight,
          border: `1px solid ${colors.success}`,
          borderRadius: '0.75rem',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1rem',
          }}>
            <FiCheckCircle style={{ fontSize: '1.5rem', color: colors.success }} />
            <h3 style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: '#065f46',
            }}>
              Upload Complete!
            </h3>
          </div>
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#15803d',
            marginBottom: '0.75rem',
          }}>
            {uploadResults.message}
          </p>
          {uploadResults.data && uploadResults.data.length > 0 && (
            <div style={{ 
              marginTop: '0.75rem',
              padding: '0.75rem',
              backgroundColor: colors.white,
              borderRadius: '0.5rem',
            }}>
              {uploadResults.data.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: '0.75rem',
                    color: '#15803d',
                    padding: '0.25rem 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    backgroundColor: colors.success,
                  }} />
                  <span style={{ fontWeight: '500' }}>{item.filename}</span>
                  <span>-</span>
                  <span style={{ 
                    ...styles.badge.base,
                    ...styles.badge.success,
                    padding: '0.125rem 0.5rem',
                  }}>
                    {item.status}
                  </span>
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