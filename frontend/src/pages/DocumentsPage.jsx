import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, uploadDocument, deleteDocument } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const ACCEPTED_TYPES = '.pdf,.txt,.docx';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleAuthError(err) {
    if (err.response?.status === 401) {
      logout();
      navigate('/login');
      return true;
    }
    return false;
  }

  async function fetchDocuments() {
    try {
      const data = await getDocuments();
      setDocuments(Array.isArray(data) ? data : data.documents || []);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError('Failed to load documents.');
    } finally {
      setLoadingDocs(false);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');
    setUploading(true);

    try {
      await uploadDocument(file);
      setSuccessMsg(`"${file.name}" uploaded and ingested successfully.`);
      await fetchDocuments();
    } catch (err) {
      if (handleAuthError(err)) return;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(id) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setError('');
    setSuccessMsg('');
    setDeletingId(id);
    setConfirmDeleteId(null);

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => (d._id || d.id) !== id));
      setSuccessMsg('Document deleted.');
    } catch (err) {
      if (handleAuthError(err)) return;
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Delete failed. Please try again.';
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117]">
      <Navbar />

      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-white">Documents</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Upload and manage company knowledge documents
              </p>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={handleUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 text-sm transition-colors cursor-pointer ${
                  uploading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  <>
                    <span>＋</span> Upload Document
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-3">
                ✕
              </button>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 flex items-center justify-between">
              <span>{successMsg}</span>
              <button
                onClick={() => setSuccessMsg('')}
                className="text-green-400 hover:text-green-300 ml-3"
              >
                ✕
              </button>
            </div>
          )}

          {/* Table */}
          {loadingDocs ? (
            <p className="text-gray-500 text-center py-12">Loading documents…</p>
          ) : documents.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-3xl mb-2">📄</p>
              <p>No documents uploaded yet.</p>
              <p className="text-sm mt-1">
                Upload a .pdf, .txt, or .docx file to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-800">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#161825] text-gray-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium">Filename</th>
                    <th className="px-4 py-3 font-medium">Upload Date</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {documents.map((doc) => {
                    const id = doc._id || doc.id;
                    return (
                      <tr key={id} className="hover:bg-[#161825]/50 transition-colors">
                        <td className="px-4 py-3 text-white font-medium">
                          {doc.filename || doc.originalName || doc.name || '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          {formatDate(doc.uploadDate || doc.createdAt || doc.uploaded_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                            {doc.status || 'Ingested'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {confirmDeleteId === id ? (
                            <span className="text-xs text-gray-400">
                              Are you sure?{' '}
                              <button
                                onClick={() => handleDelete(id)}
                                disabled={deletingId === id}
                                className="text-red-400 hover:text-red-300 font-medium ml-1"
                              >
                                {deletingId === id ? 'Deleting…' : 'Yes, delete'}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-400 hover:text-gray-300 ml-2"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => handleDelete(id)}
                              className="text-red-400 hover:text-red-300 text-xs font-medium"
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
