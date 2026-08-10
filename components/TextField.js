export default function TextField({
  textarea = false,
  className = "",
  ...props
}) {
  if (textarea) {
    return (
      <textarea
        className={className}
        {...props}
      />
    );
  }

  return (
    <input
      className={className}
      {...props}
    />
  );
}