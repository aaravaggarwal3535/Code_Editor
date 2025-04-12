import React from 'react';
import PropTypes from 'prop-types';
import './ShortcutsModal.css';

/**
 * Modal component to display keyboard shortcuts
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the modal
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {Array} props.shortcuts - Array of keyboard shortcuts objects {key, description}
 */
const ShortcutsModal = ({ show, onClose, shortcuts }) => {
  if (!show) return null;

  return (
    <div className="modal-backdrop">
      <div 
        className="shortcuts-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
      >
        <div className="modal-header">
          <h2 id="shortcuts-modal-title">Keyboard Shortcuts</h2>
          <button 
            onClick={onClose} 
            className="modal-close-btn" 
            aria-label="Close keyboard shortcuts dialog"
          >
            &times;
          </button>
        </div>
        <div className="modal-content">
          <table className="shortcuts-table">
            <thead>
              <tr>
                <th>Shortcut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shortcuts.map((shortcut, index) => (
                <tr key={index}>
                  <td className="shortcut-key"><kbd>{shortcut.key}</kbd></td>
                  <td>{shortcut.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn">Close</button>
        </div>
      </div>
    </div>
  );
};

ShortcutsModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  shortcuts: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired
    })
  ).isRequired
};

export default React.memo(ShortcutsModal);