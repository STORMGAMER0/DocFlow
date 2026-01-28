import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDocuments, uploadDocument, deleteDocument } from "../services/api";
import { useWebSocket } from "../hooks/useWebSocket";
import SearchBar from "../components/SearchBar";
import BatchUpload from "../components/BatchUpload";
import { toast } from "react-toastify";
import {
  FiLogOut,
  FiUpload,
  FiSearch,
  FiPackage,
  FiFile,
  FiCheckSquare,
  FiSquare,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiX,
} from "react-icons/fi";
import { colors, styles, mergeStyles } from "../styles";

function Dashboard({ token, setToken }) {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const navigate = useNavigate();
  const { messages, isConnected } = useWebSocket(token);
  const [uploadMode, setUploadMode] = useState("single");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' or 'desc'

  // Fetch documents on load
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Update documents when WebSocket message arrives
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.type === "processing_complete") {
        fetchDocuments(); // Refresh list
      }
    }
  }, [messages]);

  // Update documents when WebSocket message arrives and show toasts
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];

      // Show toast notifications based on message type
      switch (lastMessage.type) {
        case "connected":
          toast.info(`🔗 ${lastMessage.message}`);
          break;

        case "processing_started":
          toast.info(`📄 Processing started: ${lastMessage.filename}`, {
            autoClose: 2000,
          });
          break;

        case "status_update":
          const statusEmojis = {
            processing_ocr: "🔍",
            extracting_metadata: "📊",
            summarizing: "🤖",
            completed: "✅",
          };
          const emoji = statusEmojis[lastMessage.status] || "⏳";
          toast.info(`${emoji} ${lastMessage.message || lastMessage.status}`, {
            autoClose: 2000,
          });
          break;

        case "ocr_complete":
          toast.success(
            `✅ Text extracted: ${lastMessage.char_count} characters`,
            {
              autoClose: 2000,
            },
          );
          break;

        case "metadata_extracted":
          const parts = [];
          if (lastMessage.dates_count > 0)
            parts.push(`${lastMessage.dates_count} dates`);
          if (lastMessage.emails_count > 0)
            parts.push(`${lastMessage.emails_count} emails`);
          if (lastMessage.amounts_count > 0)
            parts.push(`${lastMessage.amounts_count} amounts`);

          if (parts.length > 0) {
            toast.success(`📊 Metadata found: ${parts.join(", ")}`, {
              autoClose: 3000,
            });
          }
          break;

        case "summary_generated":
          toast.success("🤖 AI summary generated", {
            autoClose: 2000,
          });
          break;

        case "processing_complete":
          toast.success(
            `🎉 Document processed: ${lastMessage.filename || "Success"}`,
            {
              autoClose: 4000,
            },
          );
          fetchDocuments(); // Refresh list
          break;

        case "processing_failed":
          toast.error(
            `❌ Processing failed: ${lastMessage.error || "Unknown error"}`,
            {
              autoClose: 5000,
            },
          );
          fetchDocuments(); // Refresh to show failed status
          break;

        default:
          // Don't show toast for unknown message types
          break;
      }
    }
  }, [messages]);

  const fetchDocuments = async () => {
    try {
      const response = await getDocuments();
      setDocuments(response.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warning("Please select a file first");
      return;
    }

    setUploading(true);
    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      toast.success("📤 File uploaded! Processing started...");
      fetchDocuments();
    } catch (error) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId, e) => {
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    // Optimistic update - remove from UI immediately
    const previousDocuments = [...documents];
    const previousSearchResults = searchResults ? [...searchResults] : null;

    // Update UI immediately
    setDocuments((docs) => docs.filter((doc) => doc.id !== docId));
    if (searchResults) {
      setSearchResults((results) => results.filter((doc) => doc.id !== docId));
    }

    // Show optimistic toast
    toast.info("🗑️ Deleting document...", { autoClose: 1000 });

    try {
      // Delete in background
      await deleteDocument(docId);
      toast.success("✅ Document deleted successfully");
    } catch (error) {
      // Rollback on error
      setDocuments(previousDocuments);
      if (previousSearchResults) {
        setSearchResults(previousSearchResults);
      }
      toast.error("❌ Delete failed: " + error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    navigate("/login");
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing_ocr: "bg-blue-100 text-blue-800",
      extracting_metadata: "bg-purple-100 text-purple-800",
      summarizing: "bg-indigo-100 text-indigo-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Show search results if available, otherwise show all documents
  const displayDocuments = searchResults !== null ? searchResults : documents;
  // Toggle document selection
const toggleDocumentSelection = (docId, e) => {
  e.stopPropagation();
  setSelectedDocIds(prev => 
    prev.includes(docId) 
      ? prev.filter(id => id !== docId)
      : [...prev, docId]
  );
};

// Select all documents
const toggleSelectAll = () => {
  if (selectedDocIds.length === displayDocuments.length) {
    setSelectedDocIds([]);
  } else {
    setSelectedDocIds(displayDocuments.map(doc => doc.id));
  }
};

// Delete multiple documents
const handleBulkDelete = async () => {
  if (selectedDocIds.length === 0) {
    toast.warning('No documents selected');
    return;
  }

  if (!window.confirm(`Delete ${selectedDocIds.length} document(s)?`)) {
    return;
  }

  // Optimistic update
  const previousDocuments = [...documents];
  const previousSearchResults = searchResults ? [...searchResults] : null;
  
  setDocuments(docs => docs.filter(doc => !selectedDocIds.includes(doc.id)));
  if (searchResults) {
    setSearchResults(results => results.filter(doc => !selectedDocIds.includes(doc.id)));
  }
  
  toast.info(`🗑️ Deleting ${selectedDocIds.length} document(s)...`, { autoClose: 1000 });

  // Delete all in parallel
  const deletePromises = selectedDocIds.map(id => deleteDocument(id));
  
  try {
    await Promise.all(deletePromises);
    toast.success(`✅ ${selectedDocIds.length} document(s) deleted successfully`);
    setSelectedDocIds([]);
    fetchDocuments(); // Refresh to be sure
  } catch (error) {
    // Rollback on error
    setDocuments(previousDocuments);
    if (previousSearchResults) {
      setSearchResults(previousSearchResults);
    }
    toast.error('❌ Some deletes failed: ' + error.message);
    setSelectedDocIds([]);
  }
};

// Sort documents
const toggleSortOrder = () => {
  setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
};

// Apply sorting to displayed documents
const sortedDocuments = [...displayDocuments].sort((a, b) => {
  const dateA = new Date(a.upload_time || 0);
  const dateB = new Date(b.upload_time || 0);
  return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
});

// Handle paste from clipboard
const handlePaste = (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf('image') !== -1) {
      const file = items[i].getAsFile();
      if (file) {
        setSelectedFile(file);
        toast.success(`📋 Pasted: ${file.name}`);
        return;
      }
    }
  }
};

// Handle drag and drop
const handleDragOver = (e) => {
  e.preventDefault();
  e.stopPropagation();
};

const handleDrop = (e) => {
  e.preventDefault();
  e.stopPropagation();
  
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    setSelectedFile(files[0]);
    toast.success(`📁 Dropped: ${files[0].name}`);
  }
};
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6" }}>
      {/* Header */}
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.white,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "1rem 2rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              style={{
                fontSize: "2rem",
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.info} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              📄
            </div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.info} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              DocFlow
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: isConnected
                  ? colors.successLight
                  : colors.dangerLight,
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: isConnected ? "#065f46" : "#991b1b",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isConnected ? colors.success : colors.danger,
                }}
              />
              {isConnected ? "Connected" : "Disconnected"}
            </div>
            <button
              onClick={handleLogout}
              style={mergeStyles(styles.button.base, styles.button.danger)}
              onMouseEnter={(e) =>
                Object.assign(e.target.style, styles.button.dangerHover)
              }
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = colors.danger;
                e.target.style.transform = "none";
                e.target.style.boxShadow = "none";
              }}
            >
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Search Section */}
        <div
          style={{
            ...styles.card.base,
            marginBottom: "2rem",
            background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.gray[50]} 100%)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <FiSearch style={{ fontSize: "1.5rem", color: colors.primary }} />
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: colors.gray[800],
              }}
            >
              Search Documents
            </h2>
          </div>
          <SearchBar onSearchResults={setSearchResults} />
          {searchResults !== null && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                backgroundColor: colors.primaryLight,
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
                color: colors.primary,
                fontWeight: "500",
              }}
            >
              📊 Found {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* Upload Section with Tabs */}
        <div style={styles.card.base}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              borderBottom: `2px solid ${colors.gray[200]}`,
            }}
          >
            <button
              onClick={() => setUploadMode("single")}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                color:
                  uploadMode === "single" ? colors.primary : colors.gray[600],
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  uploadMode === "single"
                    ? `3px solid ${colors.primary}`
                    : "3px solid transparent",
                cursor: "pointer",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (uploadMode !== "single")
                  e.target.style.color = colors.gray[800];
              }}
              onMouseLeave={(e) => {
                if (uploadMode !== "single")
                  e.target.style.color = colors.gray[600];
              }}
            >
              <FiFile />
              Single Upload
            </button>
            <button
              onClick={() => setUploadMode("batch")}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "0.875rem",
                fontWeight: "600",
                color:
                  uploadMode === "batch" ? colors.primary : colors.gray[600],
                backgroundColor: "transparent",
                border: "none",
                borderBottom:
                  uploadMode === "batch"
                    ? `3px solid ${colors.primary}`
                    : "3px solid transparent",
                cursor: "pointer",
                marginBottom: "-2px",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              onMouseEnter={(e) => {
                if (uploadMode !== "batch")
                  e.target.style.color = colors.gray[800];
              }}
              onMouseLeave={(e) => {
                if (uploadMode !== "batch")
                  e.target.style.color = colors.gray[600];
              }}
            >
              <FiPackage />
              Batch Upload
            </button>
          </div>

          {/* Single Upload */}
{uploadMode === "single" && (
  <div>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        marginBottom: "1rem",
      }}
    >
      <FiUpload
        style={{ fontSize: "1.5rem", color: colors.primary }}
      />
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: "bold",
          color: colors.gray[800],
        }}
      >
        Upload Document
      </h2>
    </div>

    {/* Drag & Drop + Paste Area */}
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onPaste={handlePaste}
      tabIndex={0}
      style={{
        border: `2px dashed ${colors.gray[300]}`,
        borderRadius: "0.75rem",
        padding: "2rem",
        marginBottom: "1rem",
        textAlign: "center",
        backgroundColor: colors.gray[50],
        cursor: "pointer",
        transition: "all 0.2s ease",
        outline: "none",
      }}
      onMouseEnter={(e) => {
        e.target.style.borderColor = colors.primary;
        e.target.style.backgroundColor = colors.primaryLight;
      }}
      onMouseLeave={(e) => {
        e.target.style.borderColor = colors.gray[300];
        e.target.style.backgroundColor = colors.gray[50];
      }}
      onFocus={(e) => {
        e.target.style.borderColor = colors.primary;
        e.target.style.backgroundColor = colors.primaryLight;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = colors.gray[300];
        e.target.style.backgroundColor = colors.gray[50];
      }}
      onClick={() => document.getElementById('single-file-input').click()}
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
        Click, drag & drop, or paste (Ctrl+V)
      </p>
      <p style={{ fontSize: '0.875rem', color: colors.gray[500] }}>
        PDF, JPG, JPEG, PNG
      </p>
      <p style={{ 
        fontSize: '0.75rem', 
        color: colors.gray[400],
        marginTop: '0.5rem',
        fontStyle: 'italic',
      }}>
        💡 Tip: Copy an image and press Ctrl+V here
      </p>
    </div>

    {/* Hidden file input */}
    <input
      id="single-file-input"
      type="file"
      onChange={handleFileChange}
      accept=".pdf,.png,.jpg,.jpeg"
      style={{ display: 'none' }}
    />

    {/* Selected file preview */}
    {selectedFile && (
      <div
        style={{
          marginBottom: '1rem',
          padding: "0.75rem 1rem",
          backgroundColor: colors.gray[50],
          borderRadius: "0.5rem",
          fontSize: "0.875rem",
          color: colors.gray[700],
          display: "flex",
          alignItems: "center",
          justifyContent: 'space-between',
          gap: "0.5rem",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiFile style={{ color: colors.primary }} />
          <span style={{ fontWeight: "500" }}>Selected:</span>{" "}
          {selectedFile.name}
          <span style={{ color: colors.gray[500], fontSize: '0.75rem' }}>
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </span>
        </div>
        <button
          onClick={() => setSelectedFile(null)}
          style={{
            background: 'none',
            border: 'none',
            color: colors.danger,
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <FiX style={{ fontSize: '1.25rem' }} />
        </button>
      </div>
    )}

    {/* Upload button */}
    <button
      onClick={handleUpload}
      disabled={uploading || !selectedFile}
      style={mergeStyles(
        styles.button.base,
        styles.button.primary,
        { width: '100%', justifyContent: 'center', padding: '0.875rem' },
        uploading || !selectedFile ? styles.button.disabled : {},
      )}
      onMouseEnter={(e) => {
        if (!uploading && selectedFile) {
          Object.assign(e.target.style, styles.button.primaryHover);
        }
      }}
      onMouseLeave={(e) => {
        if (!uploading && selectedFile) {
          e.target.style.backgroundColor = colors.primary;
          e.target.style.transform = "none";
          e.target.style.boxShadow = "none";
        }
      }}
    >
      <FiUpload />
      {uploading ? "Uploading..." : "Upload Document"}
    </button>
  </div>
)}
          {/* Batch Upload */}
          {uploadMode === "batch" && (
            <BatchUpload onUploadComplete={fetchDocuments} />
          )}
        </div>
        {/* Documents List */}
        <div style={styles.card.base}>
          {/* Header with controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <FiFile style={{ fontSize: "1.5rem", color: colors.primary }} />
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: colors.gray[800],
                }}
              >
                {searchResults !== null ? "Search Results" : "Your Documents"}
              </h2>
              <div
                style={{
                  ...styles.badge.base,
                  ...styles.badge.info,
                  fontSize: "0.875rem",
                  padding: "0.5rem 1rem",
                }}
              >
                {displayDocuments.length} document
                {displayDocuments.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Action buttons */}
            <div
              style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}
            >
              {/* Sort button */}
              <button
                onClick={toggleSortOrder}
                style={mergeStyles(
                  styles.button.base,
                  styles.button.secondary,
                  { padding: "0.5rem 1rem" },
                )}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = colors.gray[600];
                  e.target.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.gray[500];
                  e.target.style.transform = "none";
                }}
              >
                {sortOrder === "desc" ? <FiArrowDown /> : <FiArrowUp />}
                {sortOrder === "desc" ? "Newest First" : "Oldest First"}
              </button>

              {/* Select all button */}
              {displayDocuments.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  style={mergeStyles(
                    styles.button.base,
                    selectedDocIds.length > 0
                      ? styles.button.primary
                      : styles.button.secondary,
                    { padding: "0.5rem 1rem" },
                  )}
                  onMouseEnter={(e) => {
                    if (selectedDocIds.length === 0) {
                      e.target.style.backgroundColor = colors.gray[600];
                    } else {
                      Object.assign(e.target.style, styles.button.primaryHover);
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDocIds.length === 0) {
                      e.target.style.backgroundColor = colors.gray[500];
                      e.target.style.transform = "none";
                    } else {
                      e.target.style.backgroundColor = colors.primary;
                      e.target.style.transform = "none";
                      e.target.style.boxShadow = "none";
                    }
                  }}
                >
                  {selectedDocIds.length === displayDocuments.length ? (
                    <FiCheckSquare />
                  ) : (
                    <FiSquare />
                  )}
                  {selectedDocIds.length === displayDocuments.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
              )}

              {/* Bulk delete button */}
              {selectedDocIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  style={mergeStyles(styles.button.base, styles.button.danger, {
                    padding: "0.5rem 1rem",
                  })}
                  onMouseEnter={(e) =>
                    Object.assign(e.target.style, styles.button.dangerHover)
                  }
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = colors.danger;
                    e.target.style.transform = "none";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <FiTrash2 />
                  Delete {selectedDocIds.length}
                </button>
              )}
            </div>
          </div>

          {/* Selection banner */}
          {selectedDocIds.length > 0 && (
            <div
              style={{
                padding: "1rem",
                backgroundColor: colors.primaryLight,
                borderRadius: "0.5rem",
                marginBottom: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  color: colors.primary,
                  fontWeight: "600",
                  fontSize: "0.875rem",
                }}
              >
                {selectedDocIds.length} document
                {selectedDocIds.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => setSelectedDocIds([])}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.primary,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                Clear selection
              </button>
            </div>
          )}

          {displayDocuments.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "4rem 2rem",
                color: colors.gray[500],
              }}
            >
              <div
                style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.5 }}
              >
                📂
              </div>
              <p
                style={{
                  fontSize: "1.125rem",
                  fontWeight: "500",
                  marginBottom: "0.5rem",
                }}
              >
                {searchResults !== null
                  ? "No results found"
                  : "No documents yet"}
              </p>
              <p style={{ fontSize: "0.875rem" }}>
                {searchResults !== null
                  ? "Try a different search term"
                  : "Upload your first document to get started!"}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "1rem" }}>
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/document/${doc.id}`)}
                  style={{
                    ...styles.card.base,
                    padding: "1.25rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    border: selectedDocIds.includes(doc.id)
                      ? `2px solid ${colors.primary}`
                      : `1px solid ${colors.gray[200]}`,
                    backgroundColor: selectedDocIds.includes(doc.id)
                      ? colors.primaryLight
                      : colors.white,
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedDocIds.includes(doc.id)) {
                      Object.assign(e.currentTarget.style, styles.card.hover);
                      e.currentTarget.style.borderColor = colors.primary;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedDocIds.includes(doc.id)) {
                      e.currentTarget.style.boxShadow =
                        styles.card.base.boxShadow;
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = colors.gray[200];
                    }
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      gap: "1rem",
                      alignItems: "center",
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => toggleDocumentSelection(doc.id, e)}
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "0.5rem",
                        border: `2px solid ${selectedDocIds.includes(doc.id) ? colors.primary : colors.gray[300]}`,
                        backgroundColor: selectedDocIds.includes(doc.id)
                          ? colors.primary
                          : colors.white,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.stopPropagation();
                        if (!selectedDocIds.includes(doc.id)) {
                          e.target.style.borderColor = colors.primary;
                          e.target.style.backgroundColor = colors.primaryLight;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedDocIds.includes(doc.id)) {
                          e.target.style.borderColor = colors.gray[300];
                          e.target.style.backgroundColor = colors.white;
                        }
                      }}
                    >
                      {selectedDocIds.includes(doc.id) ? (
                        <FiCheckSquare
                          style={{ fontSize: "1.25rem", color: colors.white }}
                        />
                      ) : (
                        <FiSquare
                          style={{
                            fontSize: "1.25rem",
                            color: colors.gray[400],
                          }}
                        />
                      )}
                    </button>

                    {/* Document Icon */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "0.5rem",
                        background: `linear-gradient(135deg, ${colors.primaryLight} 0%, ${colors.infoLight} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        flexShrink: 0,
                      }}
                    >
                      📄
                    </div>

                    {/* Document Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3
                        style={{
                          fontWeight: "600",
                          marginBottom: "0.5rem",
                          color: colors.gray[800],
                          fontSize: "1rem",
                        }}
                      >
                        {doc.filename}
                      </h3>
                      <div
                        style={{
                          display: "flex",
                          gap: "1rem",
                          fontSize: "0.75rem",
                          color: colors.gray[600],
                          flexWrap: "wrap",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                          }}
                        >
                          <strong>ID:</strong> {doc.id}
                        </span>
                        <span
                          style={{
                            ...styles.badge.base,
                            ...(doc.status === "completed"
                              ? styles.badge.success
                              : doc.status === "failed"
                                ? styles.badge.danger
                                : doc.status === "processing_ocr"
                                  ? styles.badge.info
                                  : styles.badge.warning),
                          }}
                        >
                          {doc.status.replace("_", " ")}
                        </span>
                        {doc.upload_time && (
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <strong>Uploaded:</strong>{" "}
                            {new Date(doc.upload_time).toLocaleString()}
                          </span>
                        )}
                      </div>
                      {doc.content && (
                        <p
                          style={{
                            marginTop: "0.5rem",
                            fontSize: "0.875rem",
                            color: colors.gray[600],
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {doc.content.substring(0, 100)}...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    style={mergeStyles(
                      styles.button.base,
                      styles.button.danger,
                      { padding: "0.5rem 1rem" },
                    )}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      Object.assign(e.target.style, styles.button.dangerHover);
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = colors.danger;
                      e.target.style.transform = "none";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* WebSocket Messages (Debug) */}
        {messages.length > 0 && (
          <div
            style={{
              ...styles.card.base,
              marginTop: "2rem",
              background: `linear-gradient(135deg, ${colors.gray[50]} 0%, ${colors.white} 100%)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: colors.success,
                  animation: "pulse 2s ease-in-out infinite",
                }}
              />
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: colors.gray[800],
                }}
              >
                Recent Updates
              </h2>
            </div>
            <div
              style={{
                maxHeight: "250px",
                overflowY: "auto",
                backgroundColor: colors.white,
                borderRadius: "0.5rem",
                border: `1px solid ${colors.gray[200]}`,
              }}
            >
              {messages
                .slice(-5)
                .reverse()
                .map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.75rem 1rem",
                      borderBottom:
                        idx < 4 ? `1px solid ${colors.gray[100]}` : "none",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      transition: "background-color 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.gray[50])
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: colors.primary,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: "600", color: colors.primary }}>
                      {msg.type}
                    </span>
                    <span style={{ color: colors.gray[600], flex: 1 }}>
                      {msg.message || JSON.stringify(msg)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
