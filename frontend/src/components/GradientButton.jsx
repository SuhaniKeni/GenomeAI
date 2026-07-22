import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './GradientButton.module.css';

const GradientButton = forwardRef(function GradientButton(
  { href, to, children, onClick, variant = 'primary', type = 'button', className = '' },
  ref
) {
  const Component = to ? Link : href ? 'a' : 'button';
  const btnClass = `${variant === 'primary' ? styles.primary : styles.secondary} ${className}`;

  if (to) {
    return (
      <Component to={to} onClick={onClick} className={btnClass} ref={ref}>
        {children}
      </Component>
    );
  }

  if (href) {
    return (
      <Component href={href} onClick={onClick} className={btnClass} ref={ref}>
        {children}
      </Component>
    );
  }

  return (
    <Component type={type} onClick={onClick} className={btnClass} ref={ref}>
      {children}
    </Component>
  );
});

export default GradientButton;

