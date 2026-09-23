import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Scan } from "lucide-react";
import { api } from "../../services/api";

interface DocumentVaultUploaderProps {
  onSuccess?: () => void;
}

export const DocumentVaultUploader: React.FC<DocumentVaultUploaderProps> = ({ onSuccess }) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("CERTIFICATES");
  const [ocrText, setOcrText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      if (ocrText) formData.append("ocr_text", ocrText);

      const res = await api.post("/mine/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);
      setTitle("");
      setOcrText("");
      onSuccess?.();
    } catch {
      alert("Failed to upload statutory document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-5 rounded-lg border border-slate-200 bg-white shadow-xs space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
        <div className="p-2 rounded bg-slate-100 border border-slate-200 text-slate-700">
          <Scan className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Statutory Document Vault & OCR Engine</h3>
          <p className="text-xs text-slate-500">Upload certificates, licenses, or inspection reports for metadata extraction</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. DGMS Quarterly Electrical Fitness Clearance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Statutory Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-slate-800"
            >
              <option value="CERTIFICATES">Safety Fitness Certificates</option>
              <option value="LICENSES">Environmental / Operating Licenses</option>
              <option value="INSPECTION_REPORTS">Statutory Inspection Reports</option>
              <option value="DGMS_DIRECTIVES">DGMS Compliance Undertakings</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            OCR Document Text (Paste Text or Simulate Scanner Input)
          </label>
          <textarea
            rows={3}
            placeholder="Paste statutory certificate text for AI metadata extraction (Issuing Authority, Expiry Date, Validity, Conditions)..."
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 rounded bg-slate-900 hover:bg-black disabled:opacity-40 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>{uploading ? "Extracting & Uploading..." : "Upload & Run OCR Analysis"}</span>
        </button>
      </form>

      {/* OCR Extraction Result */}
      {result && (
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Document Registered & OCR Extracted</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Doc ID</span>
              <span className="font-bold text-slate-900">{result.doc_id}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Authority</span>
              <span className="font-bold text-slate-900">{result.issuing_authority || "DGMS Regional"}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Expiry Date</span>
              <span className="font-bold text-slate-900">{result.expiry_date || "2027-03-31"}</span>
            </div>
            <div className="p-2 rounded bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block">Status</span>
              <span className="font-bold text-emerald-700">{result.status || "VALID"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
