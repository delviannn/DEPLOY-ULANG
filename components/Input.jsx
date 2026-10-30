export default function Input({ label, name, type = "text", textarea = false, error, ...props }) {
  const kelas =
    "w-full rounded-lg border border-garis bg-latar px-3 py-2.5 text-base text-teks placeholder:text-teks-lembut transition-all duration-200 focus:border-utama focus:outline-none focus:ring-2 focus:ring-utama/20";

  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-teks">
      {label}
      {textarea ? (
        <textarea id={props.id || name} name={name} rows={4} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={kelas} {...props} />
      ) : (
        <input id={props.id || name} name={name} type={type} aria-invalid={Boolean(error)} aria-describedby={error ? `${name}-error` : undefined} className={kelas} {...props} />
      )}
      {error && <span id={`${name}-error`} className="text-xs font-medium text-red-700">{error}</span>}
    </label>
  );
}
