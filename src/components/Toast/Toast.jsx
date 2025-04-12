import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

/**
 * Toast notification component for displaying temporary messages
 * @param {Object} props - Component props
 * @param {string} props.message - The message to display
 * @param {string} props.type - Toast type (info, success, warning, error)
 * @param {Function} props.onClose - Function to call when toast should close
 */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);
  
  return (
    <div className={`toast ${type}`}>
      <span>{message}</span>
      <button className="toast-close" onClick={onClose} aria-label="Close notification">×</button>
    </div>
  );
};

// Add prop validation
Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  onClose: PropTypes.func.isRequired
};

// Default props
Toast.defaultProps = {
  type: 'info'
};

export default React.memo(Toast); // Use React.memo to prevent unnecessary re-renders