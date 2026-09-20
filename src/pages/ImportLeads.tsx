import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, AlertCircle, CheckCircle, ArrowRight, Download } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const ImportLeads = () => {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'mapping' | 'importing' | 'success'>('idle');
  const [error, setError] = useState('');
  const [importSummary, setImportSummary] = useState<any>(null);

  // Map Excel columns to DB fields
  const [mapping, setMapping] = useState<Record<string, string>>({
    fullName: '',
    company: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    website: '',
    industry: '',
    source: '',
    city: '',
    state: '',
    country: ''
  });

  const dbFields = [
    { key: 'fullName', label: 'Full Name (Required)' },
    { key: 'company', label: 'Company / Organization' },
    { key: 'email', label: 'Email Address' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'alternatePhone', label: 'Alternate Phone' },
    { key: 'website', label: 'Website' },
    { key: 'industry', label: 'Industry' },
    { key: 'source', label: 'Lead Source' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setStatus('parsing');
      
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
          
          if (rawData.length < 2) {
            throw new Error('File contains no data rows');
          }

          const fileColumns = rawData[0] as string[];
          setColumns(fileColumns);
          
          // Auto-mapping logic
          const initialMapping = { ...mapping };
          fileColumns.forEach(col => {
            if (col === undefined || col === null) return;
            const strCol = String(col);
            const lowerCol = strCol.toLowerCase();
            if (lowerCol.includes('name')) initialMapping.fullName = strCol;
            if (lowerCol.includes('company') || lowerCol.includes('business') || lowerCol.includes('organization')) initialMapping.company = strCol;
            if (lowerCol.includes('email')) initialMapping.email = strCol;
            if (lowerCol.includes('phone') || lowerCol.includes('contact')) initialMapping.phoneNumber = strCol;
            if (lowerCol.includes('website') || lowerCol.includes('url')) initialMapping.website = strCol;
            if (lowerCol.includes('city')) initialMapping.city = strCol;
            if (lowerCol.includes('source')) initialMapping.source = strCol;
          });
          setMapping(initialMapping);

          // Format data to array of objects based on headers
          const formattedData = rawData.slice(1).map((row: any) => {
            const obj: any = {};
            fileColumns.forEach((col, index) => {
              obj[col] = row[index];
            });
            return obj;
          });

          setData(formattedData);
          setStatus('mapping');
        } catch (err: any) {
          setError(err.message || 'Error parsing file');
          setStatus('idle');
        }
      };
      reader.readAsBinaryString(selectedFile);
    }
  };

  const handleImport = async () => {
    // Validation
    if (!mapping.fullName) {
      toast.error('Full Name mapping is required');
      return;
    }

    setStatus('importing');
    try {
      // Map data according to user selection
      const payload = data.map(row => {
        const leadObj: any = {};
        Object.entries(mapping).forEach(([dbKey, excelCol]) => {
          if (excelCol && row[excelCol]) {
            leadObj[dbKey] = String(row[excelCol]).trim();
          }
        });
        if (!leadObj.source) leadObj.source = 'Excel Import';
        return leadObj;
      }).filter(lead => lead.fullName); // Exclude empty rows

      const res = await api.post('/leads/import', { leads: payload });
      setImportSummary(res.data.summary);
      setStatus('success');
      toast.success(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error importing leads');
      setStatus('mapping');
      toast.error('Import failed');
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Full Name', 'Company', 'Email', 'Phone Number', 'City', 'Source'],
      ['John Doe', 'ABC Corp', 'john@abc.com', '1234567890', 'New York', 'Event']
    ];
    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Leads_Import_Template.xlsx");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Import Leads via Excel</h1>
        <button onClick={downloadTemplate} className="flex items-center text-sm text-primary hover:text-primary/80 font-medium">
          <Download className="w-4 h-4 mr-1" /> Download Template
        </button>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        {status === 'idle' || status === 'parsing' ? (
          <div className="text-center py-12">
            <Upload className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Upload Excel or CSV file</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">Upload your lead data to map columns and import directly into the CRM. Supported formats: .xlsx, .xls, .csv</p>
            <div className="mt-8">
              <label htmlFor="file-upload" className="cursor-pointer bg-primary text-primary-foreground px-6 py-2.5 rounded-md hover:bg-primary/90 font-medium shadow-sm transition-colors">
                <span>Browse Files</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
              </label>
            </div>
            {status === 'parsing' && <p className="mt-6 text-sm text-primary animate-pulse">Reading file...</p>}
            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </div>
        ) : status === 'mapping' ? (
          <div>
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Map Columns</h3>
                <p className="text-sm text-gray-500 mt-1">{data.length} valid rows found. Match your file columns to CRM fields.</p>
              </div>
              <button 
                onClick={handleImport}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md hover:bg-primary/90 font-medium shadow-sm flex items-center"
              >
                Proceed to Import <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-8">
              {dbFields.map((field) => (
                <div key={field.key} className="flex flex-col space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex justify-between">
                    {field.label}
                    {mapping[field.key] && <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">Mapped</span>}
                  </label>
                  <select 
                    value={mapping[field.key]} 
                    onChange={(e) => setMapping({...mapping, [field.key]: e.target.value})}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">-- Ignore this field --</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Data Preview (First 3 rows)</h4>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                    <tr>
                      {columns.slice(0, 8).map((col) => (
                        <th key={col} className="px-4 py-3 font-semibold">{col}</th>
                      ))}
                      {columns.length > 8 && <th className="px-4 py-3">...</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {data.slice(0, 3).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        {columns.slice(0, 8).map((col) => (
                          <td key={col} className="px-4 py-3 text-gray-700 truncate max-w-xs">{row[col] || '-'}</td>
                        ))}
                        {columns.length > 8 && <td className="px-4 py-3">...</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : status === 'importing' ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <h3 className="mt-6 text-lg font-medium text-gray-900">Importing {data.length} leads...</h3>
            <p className="mt-2 text-gray-500">Checking for duplicates and saving records.</p>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Import Successful!</h2>
            
            <div className="bg-gray-50 rounded-lg max-w-md mx-auto p-6 mt-8 border border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Successfully Imported</p>
                  <p className="text-2xl font-bold text-green-600">{importSummary?.successful || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100">
                  <p className="text-sm text-gray-500">Duplicates Skipped</p>
                  <p className="text-2xl font-bold text-orange-500">{importSummary?.duplicates || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button 
                onClick={() => { setFile(null); setData([]); setStatus('idle'); setImportSummary(null); }}
                className="border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 font-medium transition-colors"
              >
                Import Another File
              </button>
              <button 
                onClick={() => window.location.href = '/leads'}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 font-medium shadow-sm transition-colors"
              >
                View Leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportLeads;
