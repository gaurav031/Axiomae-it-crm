import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Plus, FileText, Download, Trash2, Eye, Edit2, Search, RefreshCw, Tag } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const CATEGORY_LABELS: Record<string, string> = {
  NDA: 'NDA',
  Contract: 'Contract',
  Invoice: 'Invoice',
  InternshipOffer: 'Internship Offer',
  JobOffer: 'Job Offer',
  Certificate: 'Certificate',
  Other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  NDA: 'bg-red-50 text-red-700 border-red-200',
  Contract: 'bg-blue-50 text-blue-700 border-blue-200',
  Invoice: 'bg-green-50 text-green-700 border-green-200',
  InternshipOffer: 'bg-purple-50 text-purple-700 border-purple-200',
  JobOffer: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Certificate: 'bg-amber-50 text-amber-700 border-amber-200',
  Other: 'bg-gray-50 text-gray-700 border-gray-200',
};

const Documents = () => {
  const [searchParams] = useSearchParams();
  const preClientId = searchParams.get('clientId') || '';
  const preClientName = searchParams.get('clientName') || '';

  const [activeTab, setActiveTab] = useState<'templates' | 'generated'>('templates');
  const [templates, setTemplates] = useState<any[]>([]);
  const [generated, setGenerated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [seeding, setSeeding] = useState(false);

  // Generator state
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [filledData, setFilledData] = useState<Record<string, string>>({});
  const [relatedToType, setRelatedToType] = useState<'Client' | 'Lead' | 'None'>('None');
  const [relatedId, setRelatedId] = useState(preClientId);
  const [relatedName, setRelatedName] = useState(preClientName);
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [renderedHtml, setRenderedHtml] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await api.get(`/documents/templates?${params}`);
      setTemplates(res.data);
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchGenerated = async () => {
    try {
      setLoading(true);
      const res = await api.get('/documents/generated');
      setGenerated(res.data);
    } catch {
      toast.error('Failed to load generated documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadsClients = async () => {
    try {
      const [lRes, cRes] = await Promise.all([api.get('/leads'), api.get('/clients')]);
      setLeads(lRes.data);
      setClients(cRes.data);
    } catch {}
  };

  useEffect(() => {
    fetchTemplates();
    fetchGenerated();
    fetchLeadsClients();
  }, [categoryFilter]);

  useEffect(() => {
    if (preClientId) { setRelatedToType('Client'); setRelatedId(preClientId); setRelatedName(preClientName); }
  }, [preClientId]);

  const handleSeedTemplates = async () => {
    try {
      setSeeding(true);
      const res = await api.post('/documents/templates/seed');
      toast.success(res.data.message);
      fetchTemplates();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to seed templates');
    } finally {
      setSeeding(false);
    }
  };

  const openGenerator = (template: any) => {
    setSelectedTemplate(template);
    const initial: Record<string, string> = {};
    template.variables.forEach((v: any) => { initial[v.key] = v.defaultValue || ''; });
    setFilledData(initial);
    setShowPreview(false);
    setRenderedHtml('');
    setShowGenerator(true);
  };

  const renderHtml = () => {
    if (!selectedTemplate) return '';
    let html = selectedTemplate.body;
    Object.entries(filledData).forEach(([key, value]) => {
      html = html.replaceAll(`{{${key}}}`, value || `<span style="color:red">[${key}]</span>`);
    });
    return html;
  };

  const handlePreview = () => {
    setRenderedHtml(renderHtml());
    setShowPreview(true);
  };

  const handleDownloadPdf = async () => {
    if (!previewRef.current) return;
    try {
      setGenerating(true);
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`${selectedTemplate.name.replace(/\s+/g, '_')}.pdf`);

      // Save to history
      await api.post('/documents/generated', {
        templateId: selectedTemplate._id,
        templateName: selectedTemplate.name,
        category: selectedTemplate.category,
        relatedToType,
        relatedToId: relatedId || undefined,
        relatedToName: relatedName || '',
        filledData,
      });
      toast.success('PDF downloaded & saved to history!');
      fetchGenerated();
    } catch (err) {
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteGenerated = async (id: string) => {
    if (!confirm('Delete this document from history?')) return;
    try {
      await api.delete(`/documents/generated/${id}`);
      toast.success('Deleted');
      fetchGenerated();
    } catch { toast.error('Failed to delete'); }
  };

  const filteredTemplates = templates.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-0.5">Generate and manage NDA, contracts, invoices, offer letters & certificates</p>
        </div>
        {templates.length === 0 && (
          <button onClick={handleSeedTemplates} disabled={seeding}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 text-sm font-medium shadow-sm disabled:opacity-60">
            <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Load Default Templates'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1">
          {(['templates', 'generated'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab === 'templates' ? `Templates (${templates.length})` : `Generated (${generated.length})`}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-52" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['', ...Object.keys(CATEGORY_LABELS)].map(cat => (
                <button key={cat} onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${categoryFilter === cat ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary/40'}`}>
                  {cat === '' ? 'All' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {loading ? <div className="py-12 text-center text-gray-400">Loading templates...</div> :
          filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
              <FileText className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No templates yet</p>
              <button onClick={handleSeedTemplates} disabled={seeding}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                Load Default Templates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map(template => (
                <div key={template._id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[template.category] || CATEGORY_COLORS.Other}`}>
                      {CATEGORY_LABELS[template.category] || template.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{template.name}</h3>
                  {template.description && <p className="text-sm text-gray-500 mb-3 flex-1">{template.description}</p>}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.variables.map((v: any) => (
                      <span key={v.key} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{`{{${v.key}}}`}</span>
                    ))}
                  </div>
                  <button onClick={() => openGenerator(template)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
                    <FileText className="w-4 h-4" /> Generate Document
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'generated' && (
        <div className="space-y-4">
          {generated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <FileText className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No documents generated yet</p>
              <p className="text-sm text-gray-400 mt-1">Go to Templates and generate a document</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Document</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Related To</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Generated By</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {generated.map(doc => (
                    <tr key={doc._id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-900">{doc.templateName}</td>
                      <td className="px-5 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.Other}`}>{CATEGORY_LABELS[doc.category] || doc.category}</span></td>
                      <td className="px-5 py-3 text-gray-500">{doc.relatedToName || '—'} {doc.relatedToType !== 'None' && <span className="text-gray-400 text-xs">({doc.relatedToType})</span>}</td>
                      <td className="px-5 py-3 text-gray-500">{doc.generatedBy?.name || '—'}</td>
                      <td className="px-5 py-3 text-gray-400">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDeleteGenerated(doc._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Document Generator Modal ── */}
      {showGenerator && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl my-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Generate: {selectedTemplate.name}</h2>
              <p className="text-sm text-gray-500 mt-1">Fill in the required fields, then preview and download as PDF</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Link to Client/Lead */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Link Document To (Optional)</p>
                <div className="flex gap-3 items-center flex-wrap">
                  <select value={relatedToType} onChange={e => { setRelatedToType(e.target.value as any); setRelatedId(''); setRelatedName(''); }}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                    <option value="None">None</option>
                    <option value="Client">Client</option>
                    <option value="Lead">Lead</option>
                  </select>
                  {relatedToType === 'Client' && (
                    <select value={relatedId} onChange={e => { const c = clients.find(c => c._id === e.target.value); setRelatedId(e.target.value); setRelatedName(c?.companyName || ''); }}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none flex-1">
                      <option value="">Select Client...</option>
                      {clients.map(c => <option key={c._id} value={c._id}>{c.companyName}</option>)}
                    </select>
                  )}
                  {relatedToType === 'Lead' && (
                    <select value={relatedId} onChange={e => { const l = leads.find(l => l._id === e.target.value); setRelatedId(e.target.value); setRelatedName(l?.fullName || ''); }}
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none flex-1">
                      <option value="">Select Lead...</option>
                      {leads.map(l => <option key={l._id} value={l._id}>{l.fullName} {l.company ? `(${l.company})` : ''}</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Variable Fields */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">Document Fields</p>
                <div className="grid grid-cols-2 gap-4">
                  {selectedTemplate.variables.map((v: any) => (
                    <div key={v.key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{v.label} <span className="text-gray-400 font-mono">{`{{${v.key}}}`}</span></label>
                      <input value={filledData[v.key] || ''} onChange={e => setFilledData({ ...filledData, [v.key]: e.target.value })}
                        placeholder={v.defaultValue || `Enter ${v.label}...`}
                        className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="mx-6 mb-4">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Preview</span>
                    <span className="text-xs text-gray-400">This is how your PDF will look</span>
                  </div>
                  <div className="max-h-96 overflow-y-auto bg-white p-2">
                    <div ref={previewRef} dangerouslySetInnerHTML={{ __html: renderedHtml }} className="text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowGenerator(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100">Cancel</button>
              <div className="flex gap-3">
                <button onClick={handlePreview} className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5">
                  <Eye className="w-4 h-4" /> {showPreview ? 'Refresh Preview' : 'Preview'}
                </button>
                {showPreview && (
                  <button onClick={handleDownloadPdf} disabled={generating}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm disabled:opacity-60">
                    <Download className="w-4 h-4" /> {generating ? 'Generating...' : 'Download PDF'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
