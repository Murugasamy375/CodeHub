import { useState } from "react";


function NotesPanel() {

  const [notes, setNotes] = useState("");


  const handleClear = () => {
    setNotes("");
  };


  return (
    <div className="notes-panel">

      <div className="notes-panel-header">

        <div>

          <span className="notes-label">
            NOTES
          </span>

          <h3>
            Your Notes
          </h3>

        </div>


        <button
          className="clear-notes-button"
          onClick={handleClear}
          disabled={!notes}
        >
          Clear
        </button>

      </div>


      <textarea
        className="notes-textarea"
        value={notes}
        onChange={(event) =>
          setNotes(event.target.value)
        }
        placeholder={
          "Paste the problem statement here " +
          "or write your own notes...\n\n" +
          "You can write algorithms, " +
          "explanations, important points, " +
          "code snippets, mistakes, or learnings."
        }
        spellCheck={true}
      />


      <div className="notes-footer">

        <span>
          {notes.length} characters
        </span>

        <span>
          Temporary notes
        </span>

      </div>

    </div>
  );
}


export default NotesPanel;