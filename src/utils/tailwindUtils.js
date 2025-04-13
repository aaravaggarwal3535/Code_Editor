/**
 * Tailwind CSS utility helper functions
 * These functions help create consistent styling patterns with Tailwind
 */

/**
 * Combines Tailwind classes conditionally
 * @param  {...any} classes - Class names to combine
 * @returns {string} - Combined class string with duplicates removed
 */
export const classNames = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Creates button styles based on variant and size
 * @param {Object} options - Style options
 * @returns {string} - Tailwind CSS classes for the button
 */
export const getButtonStyles = ({ variant = 'primary', size = 'md', isFullWidth = false, isDisabled = false }) => {
  const baseStyles = 'rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50';
  const widthStyles = isFullWidth ? 'w-full' : '';
  
  // Size variations
  const sizeStyles = {
    xs: 'py-1 px-2 text-xs',
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-2.5 px-5 text-lg',
    xl: 'py-3 px-6 text-xl'
  };
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary-light ' + 
             (isDisabled ? 'opacity-50 cursor-not-allowed' : ''),
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 ' + 
               (isDisabled ? 'opacity-50 cursor-not-allowed' : ''),
    outline: 'bg-transparent border border-primary text-primary hover:bg-primary-light hover:bg-opacity-10 focus:ring-primary-light ' + 
             (isDisabled ? 'opacity-50 cursor-not-allowed' : ''),
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-400 ' + 
            (isDisabled ? 'opacity-50 cursor-not-allowed' : ''),
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 ' + 
             (isDisabled ? 'opacity-50 cursor-not-allowed' : ''),
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-200 ' + 
           (isDisabled ? 'opacity-50 cursor-not-allowed' : '')
  };
  
  return classNames(
    baseStyles,
    sizeStyles[size] || sizeStyles.md,
    variantStyles[variant] || variantStyles.primary,
    widthStyles
  );
};

/**
 * Creates input styles based on variant and state
 * @param {Object} options - Style options
 * @returns {string} - Tailwind CSS classes for the input
 */
export const getInputStyles = ({ hasError = false, isDisabled = false, size = 'md' }) => {
  const baseStyles = 'block w-full rounded border transition-colors focus:outline-none focus:ring-2';
  
  // Status styles
  const statusStyles = hasError 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
    : 'border-gray-300 focus:border-primary focus:ring-primary-light';
  
  // Disabled styles
  const disabledStyles = isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white';
  
  // Size styles
  const sizeStyles = {
    sm: 'py-1.5 px-2 text-sm',
    md: 'py-2 px-3 text-base',
    lg: 'py-2.5 px-4 text-lg'
  };
  
  return classNames(
    baseStyles,
    statusStyles,
    disabledStyles,
    sizeStyles[size] || sizeStyles.md
  );
};

/**
 * Creates card styles based on variant
 * @param {Object} options - Style options
 * @returns {string} - Tailwind CSS classes for the card
 */
export const getCardStyles = ({ variant = 'default', padding = 'md', withShadow = true }) => {
  const baseStyles = 'rounded-lg overflow-hidden';
  
  // Shadow styles
  const shadowStyles = withShadow ? 'shadow-md' : '';
  
  // Padding variations
  const paddingStyles = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white border border-gray-200 dark:bg-dark dark:border-gray-700',
    flat: 'bg-gray-100 dark:bg-dark-lighter',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border border-gray-300 dark:bg-dark dark:border-gray-600',
    primary: 'bg-primary-light bg-opacity-10 border border-primary-light',
  };
  
  return classNames(
    baseStyles,
    shadowStyles,
    paddingStyles[padding] || paddingStyles.md,
    variantStyles[variant] || variantStyles.default
  );
};

/**
 * Creates badge styles based on variant and size
 * @param {Object} options - Style options
 * @returns {string} - Tailwind CSS classes for the badge
 */
export const getBadgeStyles = ({ variant = 'default', size = 'md' }) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';
  
  // Size styles
  const sizeStyles = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-3.5 py-1.5'
  };
  
  // Variant styles
  const variantStyles = {
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    primary: 'bg-primary-light bg-opacity-20 text-primary-dark',
    secondary: 'bg-secondary-light bg-opacity-20 text-secondary-dark',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:bg-opacity-30 dark:text-blue-300',
  };
  
  return classNames(
    baseStyles,
    sizeStyles[size] || sizeStyles.md,
    variantStyles[variant] || variantStyles.default
  );
};

/**
 * Creates modal/dialog styles based on size and position
 * @param {Object} options - Style options
 * @returns {Object} - Object containing overlay and modal Tailwind CSS classes
 */
export const getModalStyles = ({ size = 'md', position = 'center' }) => {
  // Overlay base styles
  const overlayStyles = 'fixed inset-0 bg-black bg-opacity-50 transition-opacity flex z-50';
  
  // Positioning styles
  const positionStyles = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-10',
    bottom: 'items-end justify-center pb-10'
  };
  
  // Content base styles
  const contentBaseStyles = 'bg-white dark:bg-dark rounded-lg shadow-lg overflow-hidden relative transition-all transform';
  
  // Size styles
  const sizeStyles = {
    sm: 'max-w-sm w-full',
    md: 'max-w-md w-full',
    lg: 'max-w-lg w-full',
    xl: 'max-w-xl w-full',
    '2xl': 'max-w-2xl w-full',
    full: 'max-w-full w-11/12 h-5/6'
  };
  
  return {
    overlay: classNames(
      overlayStyles,
      positionStyles[position] || positionStyles.center
    ),
    content: classNames(
      contentBaseStyles,
      sizeStyles[size] || sizeStyles.md
    )
  };
};

/**
 * Creates form group styles 
 * @param {Object} options - Style options
 * @returns {Object} - Object containing form group related Tailwind CSS classes
 */
export const getFormStyles = ({ spacing = 'md', layout = 'vertical' }) => {
  // Group spacing styles
  const spacingStyles = {
    sm: 'space-y-2',
    md: 'space-y-4',
    lg: 'space-y-6'
  };
  
  // Label styles base
  const labelBase = 'block text-gray-700 dark:text-gray-300';
  
  // Label size based on layout
  const labelLayoutStyles = {
    vertical: 'mb-1 font-medium',
    horizontal: 'mb-0 font-medium'
  };
  
  // Help text styles
  const helpTextStyles = 'text-xs text-gray-500 mt-1';
  
  // Error text styles
  const errorTextStyles = 'text-xs text-red-500 mt-1';
  
  return {
    group: classNames(
      layout === 'horizontal' ? 'flex items-center' : '',
      layout === 'vertical' ? spacingStyles[spacing] || spacingStyles.md : ''
    ),
    label: classNames(
      labelBase,
      labelLayoutStyles[layout] || labelLayoutStyles.vertical
    ),
    helpText: helpTextStyles,
    errorText: errorTextStyles
  };
};