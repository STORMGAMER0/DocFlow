import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiTrash2,
  FiCalendar,
  FiMail,
  FiDollarSign,
  FiFileText,
  FiCpu,
  FiInfo,
  FiCopy,
} from "react-icons/fi";
import { getDocument, deleteDocument } from "../services/api";
import { colors, styles, mergeStyles } from "../styles";

function DocumentDetail({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const response = await getDocument(id);
      setDocument(response.data);
    } catch (error) {
      toast.error("Failed to load document");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this document?")) return;

    // Navigate immediately for snappy UX
    toast.info("🗑️ Deleting document...", { autoClose: 1000 });
    navigate("/dashboard");

    try {
      // Delete in background after navigation
      await deleteDocument(id);
      toast.success("✅ Document deleted successfully");
    } catch (error) {
      toast.error("❌ Delete failed: " + error.message);
      // User is already on dashboard, they can see it's still there if it failed
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.gray[100],
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "4rem",
              marginBottom: "1rem",
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            📄
          </div>
          <p style={{ fontSize: "1.125rem", color: colors.gray[600] }}>
            Loading document...
          </p>
        </div>
      </div>
    );
  }

  const metadata = document.metadata_results || {};
  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: styles.badge.success,
      failed: styles.badge.danger,
      processing_ocr: styles.badge.info,
      pending: styles.badge.warning,
    };
    return statusStyles[status] || styles.badge.info;
  };

  const copyToClipboard = async () => {
    if (!document.content) {
      toast.warning("No text to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(document.content);
      toast.success("📋 Text copied to clipboard!");
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = document.content;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        toast.success("📋 Text copied to clipboard!");
      } catch (err) {
        toast.error("Failed to copy text");
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: colors.gray[100] }}>
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
          <button
            onClick={() => navigate("/dashboard")}
            style={mergeStyles(styles.button.base, styles.button.secondary)}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = colors.gray[600];
              e.target.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = colors.gray[500];
              e.target.style.transform = "none";
            }}
          >
            <FiArrowLeft />
            Back to Dashboard
          </button>
          <button
            onClick={handleDelete}
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
            <FiTrash2 />
            Delete Document
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Document Header */}
        <div
          style={{
            ...styles.card.base,
            marginBottom: "2rem",
            background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.gray[50]} 100%)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "start", gap: "1.5rem" }}>
            {/* Document Icon */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "1rem",
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.info} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.5rem",
                flexShrink: 0,
                boxShadow: "0 4px 6px rgba(37, 99, 235, 0.2)",
              }}
            >
              📄
            </div>

            {/* Document Info */}
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: "1.875rem",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                  color: colors.gray[900],
                }}
              >
                {document.filename}
              </h1>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  fontSize: "0.875rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FiInfo style={{ color: colors.gray[400] }} />
                  <span style={{ color: colors.gray[600] }}>ID:</span>
                  <span style={{ fontWeight: "600", color: colors.gray[800] }}>
                    {document.id}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FiFileText style={{ color: colors.gray[400] }} />
                  <span style={{ color: colors.gray[600] }}>Status:</span>
                  <span
                    style={{
                      ...styles.badge.base,
                      ...getStatusBadge(document.status),
                    }}
                  >
                    {document.status.replace("_", " ")}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <FiCalendar style={{ color: colors.gray[400] }} />
                  <span style={{ color: colors.gray[600] }}>Uploaded:</span>
                  <span style={{ fontWeight: "500", color: colors.gray[700] }}>
                    {document.upload_time
                      ? new Date(document.upload_time).toLocaleString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Summary */}
        {metadata.summary && (
          <div
            style={{
              ...styles.card.base,
              marginBottom: "2rem",
              borderLeft: `4px solid ${colors.primary}`,
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
              <FiCpu style={{ fontSize: "1.5rem", color: colors.primary }} />
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: colors.gray[800],
                }}
              >
                AI Summary
              </h2>
            </div>
            <p
              style={{
                color: colors.gray[700],
                lineHeight: "1.7",
                fontSize: "1rem",
                padding: "1rem",
                backgroundColor: colors.gray[50],
                borderRadius: "0.5rem",
                fontStyle: "italic",
              }}
            >
              "{metadata.summary}"
            </p>
          </div>
        )}

        {/* Metadata */}
        <div style={{ ...styles.card.base, marginBottom: "2rem" }}>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1.5rem",
              color: colors.gray[800],
            }}
          >
            📊 Extracted Metadata
          </h2>

          <div style={{ display: "grid", gap: "1.5rem" }}>
            {/* Dates */}
            {metadata.dates && metadata.dates.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <FiCalendar
                    style={{ fontSize: "1.25rem", color: colors.info }}
                  />
                  <strong
                    style={{ color: colors.gray[700], fontSize: "0.875rem" }}
                  >
                    Dates ({metadata.dates.length})
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {metadata.dates.map((date, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: colors.infoLight,
                        color: "#1e40af",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      {date}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Emails */}
            {metadata.emails && metadata.emails.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <FiMail
                    style={{ fontSize: "1.25rem", color: colors.warning }}
                  />
                  <strong
                    style={{ color: colors.gray[700], fontSize: "0.875rem" }}
                  >
                    Email Addresses ({metadata.emails.length})
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {metadata.emails.map((email, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: colors.warningLight,
                        color: "#92400e",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Amounts */}
            {metadata.amounts && metadata.amounts.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <FiDollarSign
                    style={{ fontSize: "1.25rem", color: colors.success }}
                  />
                  <strong
                    style={{ color: colors.gray[700], fontSize: "0.875rem" }}
                  >
                    Currency Amounts ({metadata.amounts.length})
                  </strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {metadata.amounts.map((amount, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: colors.successLight,
                        color: "#065f46",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                      }}
                    >
                      {amount}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* No Metadata */}
            {(!metadata.dates || metadata.dates.length === 0) &&
              (!metadata.emails || metadata.emails.length === 0) &&
              (!metadata.amounts || metadata.amounts.length === 0) && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: colors.gray[500],
                  }}
                >
                  <p style={{ fontStyle: "italic" }}>
                    No metadata extracted from this document
                  </p>
                </div>
              )}
          </div>
        </div>

        {/* Extracted Text */}
        {document.content && (
          <div style={styles.card.base}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "1rem",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <FiFileText
                  style={{ fontSize: "1.5rem", color: colors.primary }}
                />
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "bold",
                    color: colors.gray[800],
                  }}
                >
                  Extracted Text
                </h2>
                <span
                  style={{
                    ...styles.badge.base,
                    ...styles.badge.info,
                  }}
                >
                  {document.content.length.toLocaleString()} characters
                </span>
              </div>

              {/* Copy Button */}
              <button
                onClick={copyToClipboard}
                style={mergeStyles(styles.button.base, styles.button.primary, {
                  padding: "0.5rem 1rem",
                })}
                onMouseEnter={(e) =>
                  Object.assign(e.target.style, styles.button.primaryHover)
                }
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = colors.primary;
                  e.target.style.transform = "none";
                  e.target.style.boxShadow = "none";
                }}
              >
                <FiCopy />
                Copy to Clipboard
              </button>
            </div>

            <div
              style={{
                backgroundColor: colors.gray[900],
                padding: "1.5rem",
                borderRadius: "0.75rem",
                maxHeight: "500px",
                overflowY: "auto",
                whiteSpace: "pre-wrap",
                fontFamily: '"Fira Code", "Courier New", monospace',
                fontSize: "0.875rem",
                lineHeight: "1.7",
                color: colors.gray[100],
                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.3)",
                position: "relative",
              }}
            >
              {document.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentDetail;
