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
    <div className="p-5 rounded-xl border border-slate-800 bg-[#0B0F17] shadow-sm space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <Scan className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">Statutory Document Vault & OCR Engine</h3>
          <p className="text-xs text-slate-400">Upload certificates, licenses, or inspection reports for metadata extraction</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Document Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. DGMS Quarterly Electrical Fitness Clearance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-[#080C13] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Document Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-[#080C13] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="CERTIFICATES">Safety Certificates</option>
              <option value="INSPECTION_REPORTS">Inspection Reports</option>
              <option value="APPROVAL_DOCS">Approval & Licenses</option>
              <option value="COMPLIANCE_EVIDENCE">Compliance Evidence</option>
              <option value="CONTRACTOR_DOCS">Contractor Clearance</option>
              <option value="MACHINE_DOCS">Machinery Fitness</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">
            Raw Document Content / Scan Snippet (for OCR Parser)
          </label>
          <textarea
            rows={2}
            placeholder="Paste text from scanned document or certificate (e.g. 'DGMS/2026/041 Certificate of Fitness under Coal Mines Regulation 102 valid until 2026-12-31')..."
            value={ocrText}
            onChange={(e) => setOcrText(e.target.value)}
            className="w-full px-3 py-2 bg-[#080C13] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-black font-semibold text-xs transition-colors flex items-center gap-2 shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>{uploading ? "Parsing & Validating OCR..." : "Upload & Run OCR Extraction"}</span>
        </button>
      </form>

      {/* OCR Extraction Result Card */}
      {result && (
        <div className="p-4 rounded-lg border border-emerald-800/60 bg-emerald-950/20 text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Document Processed & Verified</span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 ml-auto">
              Confidence: {Math.round(result.ocr?.confidence_score * 100)}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-slate-300">
            <div>
              <span className="text-slate-500 block">Doc ID:</span>
              <span className="text-amber-400">{result.document?.doc_id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Extracted Number:</span>
              <span>{result.ocr?.doc_number}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Issue Date:</span>
              <span>{result.document?.issue_date}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Expiry Date:</span>
              <span>{result.document?.expiry_date}</span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-1 border-t border-emerald-900/40">
            Issuing Authority: <span className="text-slate-200 font-medium">{result.ocr?.issuing_authority}</span>
          </div>
        </div>
      )}
    </div>
  );
};
