/**
 * ValidationPanel Component
 *
 * Shows errors and warnings from effect validation.
 * Categorized by type with actionable suggestions.
 */

import React, { useState } from "react";

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  id: string;
  severity: ValidationSeverity;
  category: string;
  message: string;
  details?: string;
  suggestion?: string;
  location?: {
    node?: string;
    pass?: number;
    line?: number;
  };
}

export interface ValidationPanelProps {
  /** Validation issues to display */
  issues: ValidationIssue[];
  /** Callback when an issue is clicked */
  onIssueClick?: (issue: ValidationIssue) => void;
  /** Show only specific severity levels */
  severityFilter?: ValidationSeverity[];
  /** Show only specific categories */
  categoryFilter?: string[];
}

export function ValidationPanel({ issues, onIssueClick, severityFilter, categoryFilter }: ValidationPanelProps) {
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [activeSeverities, setActiveSeverities] = useState<Set<ValidationSeverity>>(new Set(["error", "warning", "info"]));
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());

  // Get all unique categories
  const allCategories = Array.from(new Set(issues.map((i) => i.category))).sort();

  // Initialize active categories
  React.useEffect(() => {
    if (activeCategories.size === 0 && allCategories.length > 0) {
      setActiveCategories(new Set(allCategories));
    }
  }, [allCategories.length]);

  // Apply filters
  const filteredIssues = issues.filter((issue) => {
    const severityMatch = !severityFilter || severityFilter.length === 0 || severityFilter.includes(issue.severity) || activeSeverities.has(issue.severity);

    const categoryMatch = !categoryFilter || categoryFilter.length === 0 || categoryFilter.includes(issue.category) || activeCategories.has(issue.category);

    return severityMatch && categoryMatch;
  });

  // Count by severity
  const counts = {
    error: issues.filter((i) => i.severity === "error").length,
    warning: issues.filter((i) => i.severity === "warning").length,
    info: issues.filter((i) => i.severity === "info").length,
  };

  const toggleExpanded = (issueId: string) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  const toggleSeverity = (severity: ValidationSeverity) => {
    const newSeverities = new Set(activeSeverities);
    if (newSeverities.has(severity)) {
      newSeverities.delete(severity);
    } else {
      newSeverities.add(severity);
    }
    setActiveSeverities(newSeverities);
  };

  const toggleCategory = (category: string) => {
    const newCategories = new Set(activeCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setActiveCategories(newCategories);
  };

  const getSeverityColor = (severity: ValidationSeverity) => {
    switch (severity) {
      case "error":
        return { bg: "#7f1d1d", border: "#ef4444", text: "#fca5a5" };
      case "warning":
        return { bg: "#713f12", border: "#f59e0b", text: "#fcd34d" };
      case "info":
        return { bg: "#1e3a8a", border: "#3b82f6", text: "#93c5fd" };
    }
  };

  const getSeverityIcon = (severity: ValidationSeverity) => {
    switch (severity) {
      case "error":
        return "✖";
      case "warning":
        return "⚠";
      case "info":
        return "ℹ";
    }
  };

  return (
    <div
      style={{
        padding: "16px",
        background: "#0f172a",
        borderRadius: "8px",
        border: "1px solid #334155",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <h3 style={{ margin: 0, color: "#f1f5f9", fontSize: "16px" }}>Validation Results</h3>
        <div
          style={{
            display: "flex",
            gap: "12px",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <button
            onClick={() => toggleSeverity("error")}
            style={{
              padding: "4px 10px",
              background: activeSeverities.has("error") ? "#7f1d1d" : "#334155",
              color: activeSeverities.has("error") ? "#fca5a5" : "#94a3b8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ✖ {counts.error}
          </button>
          <button
            onClick={() => toggleSeverity("warning")}
            style={{
              padding: "4px 10px",
              background: activeSeverities.has("warning") ? "#713f12" : "#334155",
              color: activeSeverities.has("warning") ? "#fcd34d" : "#94a3b8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ⚠ {counts.warning}
          </button>
          <button
            onClick={() => toggleSeverity("info")}
            style={{
              padding: "4px 10px",
              background: activeSeverities.has("info") ? "#1e3a8a" : "#334155",
              color: activeSeverities.has("info") ? "#93c5fd" : "#94a3b8",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            ℹ {counts.info}
          </button>
        </div>
      </div>

      {/* Category filters */}
      {allCategories.length > 0 && (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "12px",
              color: "#94a3b8",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Categories:
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {allCategories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                style={{
                  padding: "4px 10px",
                  background: activeCategories.has(category) ? "#3b82f6" : "#334155",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Issues list */}
      <div style={{ maxHeight: "500px", overflowY: "auto" }}>
        {filteredIssues.length === 0 ? (
          <div
            style={{
              padding: "48px 32px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "14px",
            }}
          >
            {issues.length === 0 ? (
              <div>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
                <div style={{ color: "#10b981", fontWeight: 600, fontSize: "16px" }}>No validation issues</div>
                <div style={{ marginTop: "8px" }}>Everything looks good!</div>
              </div>
            ) : (
              <div>No issues match your filters</div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredIssues.map((issue) => {
              const colors = getSeverityColor(issue.severity);
              const icon = getSeverityIcon(issue.severity);
              const isExpanded = expandedIssues.has(issue.id);

              return (
                <div
                  key={issue.id}
                  style={{
                    padding: "12px",
                    background: "#1e293b",
                    border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.border}`,
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    toggleExpanded(issue.id);
                    onIssueClick?.(issue);
                  }}
                >
                  {/* Issue header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "start",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "16px",
                        color: colors.text,
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {icon}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "6px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            padding: "2px 6px",
                            background: colors.bg,
                            color: colors.text,
                            borderRadius: "4px",
                          }}
                        >
                          {issue.category}
                        </span>
                        {issue.location && (
                          <span style={{ fontSize: "12px", color: "#64748b" }}>
                            {issue.location.node && `Node: ${issue.location.node}`}
                            {issue.location.pass !== undefined && ` • Pass ${issue.location.pass}`}
                            {issue.location.line !== undefined && ` • Line ${issue.location.line}`}
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          color: "#f1f5f9",
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: isExpanded ? "8px" : 0,
                        }}
                      >
                        {issue.message}
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div style={{ marginTop: "12px" }}>
                          {issue.details && (
                            <div
                              style={{
                                padding: "10px",
                                background: "#0f172a",
                                borderRadius: "4px",
                                marginBottom: "10px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#94a3b8",
                                  marginBottom: "6px",
                                }}
                              >
                                Details:
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#cbd5e1",
                                  fontFamily: "monospace",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {issue.details}
                              </div>
                            </div>
                          )}
                          {issue.suggestion && (
                            <div
                              style={{
                                padding: "10px",
                                background: "#064e3b",
                                border: "1px solid #10b981",
                                borderRadius: "4px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "#6ee7b7",
                                  marginBottom: "6px",
                                }}
                              >
                                💡 Suggestion:
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#d1fae5",
                                }}
                              >
                                {issue.suggestion}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    >
                      ▼
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {filteredIssues.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid #334155",
            fontSize: "13px",
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Showing {filteredIssues.length} of {issues.length} issue
          {issues.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
