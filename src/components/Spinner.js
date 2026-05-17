import { FiLoader } from 'react-icons/fi';

const Spinner = ({ size = 'medium', color = 'primary', fullPage = false, text = '' }) => {
  const sizeMap = {
    small: 20,
    medium: 32,
    large: 48,
  };

  const spinnerSize = sizeMap[size] || size;

  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className="spinner-content">
          <FiLoader className="spinner-icon" style={{ width: spinnerSize, height: spinnerSize }} />
          {text && <p className="spinner-text">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`spinner spinner-${color}`}>
      <FiLoader className="spinner-icon" style={{ width: spinnerSize, height: spinnerSize }} />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
};

export default Spinner;
