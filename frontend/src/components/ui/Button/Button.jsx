import "./Button.css";

function Button({ children, className = "", icon: Icon = null, variant = "primary", ...props }) {
  return (
    <button className={`button button--${variant} ${className}`.trim()} {...props}>
      {Icon ? <Icon size={16} strokeWidth={2.4} /> : null}
      {children}
    </button>
  );
}

export default Button;
