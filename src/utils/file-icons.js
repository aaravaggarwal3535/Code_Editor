/**
 * File icons utility for mapping file types to appropriate icon classes
 * Uses the file-icons.css stylesheets to display proper icons based on file extension
 */

// Icon mapping for common file extensions
const fileIconMap = {
  // JavaScript and TypeScript
  'js': 'js-icon medium-yellow',
  'jsx': 'react-icon medium-blue',
  'ts': 'ts-icon medium-blue',
  'tsx': 'tsx-icon medium-blue',
  
  // Web
  'html': 'html5-icon medium-orange',
  'css': 'css3-icon medium-blue',
  'scss': 'sass-icon medium-pink',
  'less': 'less-icon dark-blue',
  'json': 'json-icon medium-yellow',
  
  // Python
  'py': 'python-icon medium-blue',
  'pyc': 'python-icon medium-blue',
  'ipynb': 'jupyter-icon medium-orange',
  
  // Java
  'java': 'java-icon medium-red',
  'class': 'java-icon medium-red',
  'jar': 'java-icon medium-red',
  
  // C/C++
  'c': 'c-icon medium-blue',
  'cpp': 'cpp-icon medium-blue',
  'h': 'c-icon medium-blue',
  'hpp': 'cpp-icon medium-blue',
  
  // C#
  'cs': 'csharp-icon medium-green',
  
  // Ruby
  'rb': 'ruby-icon medium-red',
  
  // PHP
  'php': 'php-icon medium-blue',
  
  // Go
  'go': 'go-icon medium-blue',
  
  // Rust
  'rs': 'rust-icon medium-orange',
  
  // Document formats
  'md': 'markdown-icon medium-blue',
  'txt': 'text-icon',
  'pdf': 'pdf-icon medium-red',
  'doc': 'word-icon medium-blue',
  'docx': 'word-icon medium-blue',
  'xls': 'excel-icon medium-green',
  'xlsx': 'excel-icon medium-green',
  'ppt': 'powerpoint-icon medium-red',
  'pptx': 'powerpoint-icon medium-red',
  
  // Config files
  'json': 'json-icon medium-yellow',
  'yaml': 'yaml-icon medium-yellow',
  'yml': 'yaml-icon medium-yellow',
  'toml': 'config-icon',
  'ini': 'config-icon',
  'env': 'config-icon',
  'config': 'config-icon',
  
  // Data formats
  'csv': 'spreadsheet-icon medium-green',
  'xml': 'code-icon medium-orange',
  'svg': 'svg-icon medium-yellow',
  
  // Image formats
  'png': 'image-icon medium-purple',
  'jpg': 'image-icon medium-purple',
  'jpeg': 'image-icon medium-purple',
  'gif': 'image-icon medium-purple',
  'bmp': 'image-icon medium-purple',
  'ico': 'image-icon medium-purple',
  
  // Audio/Video formats
  'mp3': 'audio-icon medium-purple',
  'wav': 'audio-icon medium-purple',
  'mp4': 'video-icon medium-purple',
  'mov': 'video-icon medium-purple',
  'avi': 'video-icon medium-purple',
  
  // Archive formats
  'zip': 'zip-icon',
  'tar': 'zip-icon',
  'gz': 'zip-icon',
  'rar': 'zip-icon',
  '7z': 'zip-icon',
};

/**
 * Get the appropriate icon class for a file based on its extension
 * @param {string} fileName - The name of the file
 * @returns {string} - CSS class name for the file icon
 */
export function getFileIconClass(fileName) {
  // Get file extension
  const extension = fileName.split('.').pop().toLowerCase();
  
  // Return the mapped icon class or default icon
  return fileIconMap[extension] || 'default-icon';
}

/**
 * Get the appropriate icon class for a folder
 * @param {boolean} isExpanded - Whether the folder is expanded
 * @returns {string} - CSS class name for the folder icon
 */
export function getFolderIconClass(isExpanded = false) {
  return isExpanded ? 'folder-open-icon' : 'folder-icon';
}