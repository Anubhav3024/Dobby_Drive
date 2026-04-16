export default function Input({ label, ...props }) {
  return (
    <label className="input-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
