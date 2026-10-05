function LanguageSelector({
  language,
  onChange,
}) {
  return (
    <select
      className="language-selector"
      value={language}
      onChange={(event) =>
        onChange(event.target.value)
      }
    >
      <option value="python">
        Python
      </option>

      <option value="java">
        Java
      </option>
    </select>
  );
}

export default LanguageSelector;