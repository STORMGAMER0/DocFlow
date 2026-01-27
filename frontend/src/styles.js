// Shared color palette
export const colors = {
  primary: '#2563eb',      // Blue
  primaryHover: '#1d4ed8',
  primaryLight: '#dbeafe',
  
  success: '#10b981',      // Green
  successLight: '#d1fae5',
  
  warning: '#f59e0b',      // Orange
  warningLight: '#fef3c7',
  
  danger: '#ef4444',       // Red
  dangerHover: '#dc2626',
  dangerLight: '#fee2e2',
  
  info: '#3b82f6',        // Light Blue
  infoLight: '#dbeafe',
  
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  white: '#ffffff',
  black: '#000000',
};

// Shared styles
export const styles = {
  // Buttons
  button: {
    base: {
      padding: '0.75rem 1.5rem',
      borderRadius: '0.5rem',
      border: 'none',
      fontWeight: '600',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    primary: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    primaryHover: {
      backgroundColor: colors.primaryHover,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
    },
    danger: {
      backgroundColor: colors.danger,
      color: colors.white,
    },
    dangerHover: {
      backgroundColor: colors.dangerHover,
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px rgba(239, 68, 68, 0.2)',
    },
    secondary: {
      backgroundColor: colors.gray[500],
      color: colors.white,
    },
    disabled: {
      backgroundColor: colors.gray[300],
      cursor: 'not-allowed',
      opacity: 0.6,
    },
  },
  
  // Cards
  card: {
    base: {
      backgroundColor: colors.white,
      borderRadius: '0.75rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
      transition: 'all 0.2s ease',
    },
    hover: {
      boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
      transform: 'translateY(-2px)',
    },
  },
  
  // Inputs
  input: {
    base: {
      padding: '0.75rem 1rem',
      border: `1px solid ${colors.gray[300]}`,
      borderRadius: '0.5rem',
      fontSize: '0.875rem',
      transition: 'all 0.2s ease',
      width: '100%',
    },
    focus: {
      outline: 'none',
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px ${colors.primaryLight}`,
    },
  },
  
  // Badges
  badge: {
    base: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      display: 'inline-block',
    },
    success: {
      backgroundColor: colors.successLight,
      color: '#065f46',
    },
    warning: {
      backgroundColor: colors.warningLight,
      color: '#92400e',
    },
    info: {
      backgroundColor: colors.infoLight,
      color: '#1e40af',
    },
    danger: {
      backgroundColor: colors.dangerLight,
      color: '#991b1b',
    },
  },
};

// Helper to merge styles
export const mergeStyles = (...styleObjects) => {
  return Object.assign({}, ...styleObjects);
};