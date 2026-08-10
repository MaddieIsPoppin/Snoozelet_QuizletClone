export default function SpanishTextField({
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