import { useRef, type ChangeEvent } from "react";
import { BsTrash } from "react-icons/bs";
import "../CsvSelectModal/CsvSelectModal.css";

interface Props {
  selectedName?: string | null;
  onUpload: (file: File) => void;
  onClearSelected: () => void;
  onClose: () => void;
}

export default function TicketUploadModal({
  selectedName,
  onUpload,
  onClearSelected,
  onClose,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onUpload(file);
    e.target.value = "";
  }

  return (
    <div className="csm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csm-box">
        <div className="csm-header">
          <span className="csm-title">Import Tickets</span>
          <button className="csm-close" onClick={onClose}>x</button>
        </div>

        <div className="csm-section">
          <p className="csm-section-label">Upload ticket file</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Choose CSV file
          </button>
        </div>

        {selectedName && (
          <>
            <div className="csm-divider">
              <span>selected</span>
            </div>

            <div className="csm-selected">
              <span className="csm-selected-name">{selectedName}</span>
              <button
                className="csm-selected-delete"
                title="Remove selected ticket file"
                onClick={onClearSelected}
              >
                <BsTrash />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
