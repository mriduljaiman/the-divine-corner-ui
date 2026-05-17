const Skeleton = ({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
  circle = false,
}) => {
  const getVariantStyles = () => {
    const base = {
      borderRadius: circle ? '50%' : variant === 'text' ? '4px' : '8px',
    };

    switch (variant) {
      case 'text':
        return { ...base, width: width || '100%', height: height || '16px' };
      case 'title':
        return { ...base, width: width || '60%', height: height || '28px' };
      case 'avatar':
        return { ...base, width: width || '48px', height: height || '48px', borderRadius: '50%' };
      case 'thumbnail':
        return { ...base, width: width || '100%', height: height || '200px' };
      case 'button':
        return { ...base, width: width || '120px', height: height || '40px' };
      case 'card':
        return { ...base, width: width || '100%', height: height || '300px' };
      case 'circle':
        return { ...base, width: width || '40px', height: height || '40px', borderRadius: '50%' };
      default:
        return { ...base, width: width || '100%', height: height || '20px' };
    }
  };

  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton ${className}`}
      style={{
        ...getVariantStyles(),
        marginBottom: count > 1 ? '8px' : 0,
      }}
    />
  ));

  return <>{items}</>;
};

export default Skeleton;
