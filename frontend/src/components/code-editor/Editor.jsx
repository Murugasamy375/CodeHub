import Editor from "@monaco-editor/react";

function CodeEditorComponent({
  code,
  language,
  onChange,
}) {
  return (
    <div className="monaco-wrapper">
      <Editor
        height="100%"
        language={
          language === "python"
            ? "python"
            : "java"
        }
        value={code}
        onChange={(value) =>
          onChange(value || "")
        }
        theme="vs-dark"
        options={{
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          padding: {
            top: 12,
          },
        }}
      />
    </div>
  );
}

export default CodeEditorComponent;