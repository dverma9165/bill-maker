import React, { useState, useRef } from 'react';
import { flushSync } from 'react-dom';
import html2canvas from 'html2canvas';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Loader2, X } from 'lucide-react';
import Invoice from '../components/Invoice';
import DikshaInvoice, { emptyDikshaItem, formatInvoiceDate } from '../components/DikshaInvoice';

const APPSCRIPT_URL = import.meta.env.VITE_APPSCRIPT_URL;
const FOLDER_ID = import.meta.env.VITE_FOLDER_ID;
const SHEET_NAME = import.meta.env.VITE_SHEET_NAME;

const defaultInvoiceData = {
  supplierName: 'BHOLA AUTOMATION SALES & SERVICE',
  supplierAddress: 'Tarpongi, Ward No. 17, Near Bus Station\nTilda, Tarpongi, Raipur, Chhattisgarh,\n493221\nMobile No. : 8319384090, 8889430950\nEmail : padam.sinha950@gmail.com',
  recipientName: '',
  recipientMobile: '',
  recipientAddress: '',
  poNo: '',
  state: '',
  billNo: '',
  sn: '0001',
  date: `Date : ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`,
  acInfo: 'A/C No.\nIFSC\nBranch :',
  gstNo: 'GST No. : 22CSMPP0228F1ZZ',
  items: [
    { sn: '1', desc: '', hsn: '', qty: '', rate: '', val: '', cgstPct: '', cgstAmt: '', sgstPct: '', sgstAmt: '' },
    { sn: '2', desc: '', hsn: '', qty: '', rate: '', val: '', cgstPct: '', cgstAmt: '', sgstPct: '', sgstAmt: '' },
    { sn: '3', desc: '', hsn: '', qty: '', rate: '', val: '', cgstPct: '', cgstAmt: '', sgstPct: '', sgstAmt: '' },
    { sn: '4', desc: '', hsn: '', qty: '', rate: '', val: '', cgstPct: '', cgstAmt: '', sgstPct: '', sgstAmt: '' },
    { sn: '5', desc: '', hsn: '', qty: '', rate: '', val: '', cgstPct: '', cgstAmt: '', sgstPct: '', sgstAmt: '' },
    { sn: '6', desc: '', hsn: '', qty: '', rate: '', val: '', cgstPct: '', cgstAmt: '', sgstPct: '', sgstAmt: '' }
  ],
  totalVal: '',
  totalCgstPct: '',
  totalSgstPct: '',
  grossWords: '',
  addCgst: '',
  addSgst: '',
  igstPct: '',
  addIgst: '',
  taxAmountGst: '',
  totalAmount: '',
  terms: '1. Goods once sold will not returnable. if invoice is not paid within 30 day interest shall be charges @ 21%, Any\ndispute will be subject to Raipur Jurisdiction.\nTaxes has been charged according to GOVT OF INDIAN rules.',
  signFor: 'For : Padhmalochan Sinha'
};

const defaultDikshaData = {
  billNo: '',
  sn: '0001',
  customerName: '',
  customerGstin: '',
  customerMobile: '',
  billingAddress: '',
  placeOfSupply: '22-CHHATTISGARH',
  taxType: 'igst',
  reference: '',
  items: [emptyDikshaItem()]
};

// html2canvas cannot faithfully rasterize live <input>/<textarea> content (it can
// clip or overlap wrapped lines). Swap every field for a static div with identical
// computed styling right before the snapshot is taken, so the capture matches
// exactly what is on screen.
const replaceFieldsWithStaticText = (clonedDoc, clonedRoot) => {
  const root = clonedRoot || clonedDoc;
  const fields = root.querySelectorAll('input, textarea');
  fields.forEach((field) => {
    const computed = window.getComputedStyle(field);
    const isTextarea = field.tagName === 'TEXTAREA';
    const replacement = clonedDoc.createElement('div');
    replacement.textContent = field.value;
    replacement.className = field.className;
    replacement.style.width = computed.width;
    replacement.style.minHeight = computed.height;
    replacement.style.fontFamily = computed.fontFamily;
    replacement.style.fontSize = computed.fontSize;
    replacement.style.fontWeight = computed.fontWeight;
    replacement.style.lineHeight = computed.lineHeight;
    replacement.style.color = computed.color;
    replacement.style.textAlign = computed.textAlign;
    replacement.style.whiteSpace = isTextarea ? 'pre-wrap' : 'pre';
    replacement.style.overflowWrap = isTextarea ? 'break-word' : 'normal';
    replacement.style.overflow = 'hidden';
    replacement.style.background = 'transparent';
    replacement.style.margin = '0';
    replacement.style.padding = '0';
    if (field.dataset.inline) {
      // An inline-block with overflow:hidden takes its baseline from its bottom
      // edge, which lifts the text above the surrounding line. Keep it visible
      // so it sits on the same baseline as the text around it.
      replacement.style.display = 'inline-block';
      replacement.style.overflow = 'visible';
      replacement.style.minHeight = '0';
      replacement.style.verticalAlign = 'baseline';
    }
    field.parentNode.replaceChild(replacement, field);
  });
};

const captureInvoiceCanvas = (element) => html2canvas(element, {
  scale: 2,
  backgroundColor: '#ffffff',
  width: element.scrollWidth,
  height: element.scrollHeight,
  onclone: (clonedDoc, clonedElement) => {
    replaceFieldsWithStaticText(clonedDoc, clonedElement);
  }
});

const getTrailingNumber = (value) => {
  const match = String(value || '').match(/\d+$/);
  return match ? parseInt(match[0], 10) : 0;
};

const getPrefix = (value) => String(value || '').replace(/\d+$/, '');

const incrementTrailingNumber = (value) => {
  const match = String(value).match(/\d+$/);
  if (!match) return value;
  return String(value).replace(/\d+$/, String(parseInt(match[0], 10) + 1).padStart(match[0].length, '0'));
};

// True when `current` is still valid (not behind) compared to the next number
// worked out from the sheet. A different prefix (e.g. a new month for DDP
// bills) means the sheet's number should win.
const isNotBehind = (current, next) =>
  !!current && getPrefix(current) === getPrefix(next) && getTrailingNumber(current) >= getTrailingNumber(next);

const DDP_PREFIX = 'DDP/';
const isDdpBill = (billNo) => String(billNo || '').trim().toUpperCase().startsWith(DDP_PREFIX);

const getDdpPrefix = (date = new Date()) =>
  `${DDP_PREFIX}${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/`;

// Works out the next numbers from the HIGHEST values in the sheet (not just the
// last row), so a reordered sheet or blank trailing row can't make the
// numbering restart. Cache is bypassed so mobile never gets a stale response.
// Both templates share one sheet: DDP/... rows belong to the Diksha template,
// all other rows to the Bhola template. SN is shared by both.
const fetchNextNumbers = async () => {
  const res = await fetch(`${APPSCRIPT_URL}?sheet=${SHEET_NAME}&_t=${Date.now()}`, { cache: 'no-store' });
  const result = await res.json();

  let newBillNo = 'Bill No. 001';
  let maxDdp = 0;
  let newSn = '0001';

  if (result.success && result.data && result.data.length > 1) {
    let maxBillNo = '';
    let maxSn = 0;
    result.data.slice(1).forEach((row) => {
      const billNo = row[4] ? String(row[4]).trim() : ''; // Bill Number is at index 4
      if (isDdpBill(billNo)) {
        maxDdp = Math.max(maxDdp, getTrailingNumber(billNo));
      } else if (billNo && /\d+$/.test(billNo) && getTrailingNumber(billNo) >= getTrailingNumber(maxBillNo)) {
        maxBillNo = billNo;
      }
      const snNum = parseInt(row[0], 10); // SN is at index 0
      if (!isNaN(snNum) && snNum > maxSn) maxSn = snNum;
    });

    if (maxBillNo) newBillNo = incrementTrailingNumber(maxBillNo);
    if (maxSn) newSn = String(maxSn + 1).padStart(4, '0');
  }

  return {
    billNo: newBillNo,
    ddpBillNo: getDdpPrefix() + String(maxDdp + 1).padStart(3, '0'),
    sn: newSn,
    headers: (result.success && result.data && result.data[0]) || [],
    rows: (result.success && result.data) || []
  };
};

// Extra columns are located by their header name, so they work wherever they sit in the sheet
const findColumn = (headers, name) =>
  (headers || []).findIndex((h) => String(h || '').trim().toLowerCase() === name.toLowerCase());

const getExtraColumns = (headers) => {
  const gstinCol = findColumn(headers, 'GSTIN');
  let dataCol = findColumn(headers, 'Invoice Data');
  if (dataCol < 0) dataCol = gstinCol === 6 ? 7 : 6;
  return { gstinCol, dataCol };
};

// Moves bill number / SN forward to the sheet's next values, never backwards
const applyNextNumbers = (prev, nextBillNo, nextSn) => {
  const billNo = isNotBehind(prev.billNo, nextBillNo) ? prev.billNo : nextBillNo;
  const sn = parseInt(prev.sn, 10) >= parseInt(nextSn, 10) ? prev.sn : nextSn;
  if (billNo === prev.billNo && sn === prev.sn) return prev;
  return { ...prev, billNo, sn };
};

const TEMPLATES = {
  bhola: { label: 'Bhola Automation', billKey: 'billNo' },
  diksha: { label: 'Diksha Design & Print', billKey: 'ddpBillNo' }
};

const TEMPLATE_STORAGE_KEY = 'billmaker.template';

const loadTemplate = () => {
  try {
    const saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return TEMPLATES[saved] ? saved : 'bhola';
  } catch {
    return 'bhola';
  }
};

const toText = (value) => (value === null || value === undefined ? '' : String(value));

// Builds the edit state from a sheet row coming from the "All Invoices" page.
// Column G (index 6) holds the full invoice JSON for bills saved after the edit
// feature was added; older bills only have the basic columns to start from.
const buildEditState = (row, headers) => {
  const billNo = toText(row[4]).trim();
  const template = isDdpBill(billNo) ? 'diksha' : 'bhola';
  const { gstinCol, dataCol } = getExtraColumns(headers);
  let saved = null;
  try {
    saved = row[dataCol] ? JSON.parse(row[dataCol]) : null;
  } catch {
    saved = null;
  }
  const base = template === 'diksha'
    ? {
        ...defaultDikshaData,
        customerName: toText(row[1]),
        customerMobile: toText(row[2]),
        billingAddress: toText(row[3]),
        customerGstin: gstinCol >= 0 ? toText(row[gstinCol]) : ''
      }
    : { ...defaultInvoiceData, recipientName: toText(row[1]), recipientMobile: toText(row[2]), recipientAddress: toText(row[3]) };

  return {
    template,
    originalBillNo: billNo,
    hasFullData: !!saved,
    data: { ...base, ...(saved || {}), billNo, sn: toText(saved?.sn || row[0]) }
  };
};

const CreateBill = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(loadTemplate);
  const [invoiceData, setInvoiceData] = useState(defaultInvoiceData);
  const [dikshaData, setDikshaData] = useState(defaultDikshaData);
  const [editState, setEditState] = useState(() => (location.state?.editRow ? buildEditState(location.state.editRow, location.state.headers) : null));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const invoiceRef = useRef(null);

  const isSavingRef = useRef(false);

  // Drop the router state so a page reload opens a fresh bill instead of re-entering edit mode
  React.useEffect(() => {
    if (location.state?.editRow) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const setEditData = (data) => setEditState(prev => ({ ...prev, data }));

  const cancelEdit = () => {
    setEditState(null);
    navigate('/view');
  };

  const changeTemplate = (key) => {
    setTemplate(key);
    setMessage({ text: '', type: '' });
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, key);
    } catch {
      // storage unavailable (private mode etc.) - selection just won't persist
    }
  };

  // Always read the latest numbers straight from the sheet. On mobile the PWA is
  // often resumed from the background with numbers fetched long ago, so we
  // refresh on mount, when the app comes back to the foreground, and before save.
  const refreshBillNumbers = React.useCallback(async () => {
    try {
      const next = await fetchNextNumbers();
      // Never move backwards (keeps a number the user bumped up manually)
      setInvoiceData(prev => applyNextNumbers(prev, next.billNo, next.sn));
      setDikshaData(prev => applyNextNumbers(prev, next.ddpBillNo, next.sn));
    } catch (error) {
      console.error('Error fetching last bill:', error);
      setInvoiceData(prev => (prev.billNo ? prev : { ...prev, billNo: 'Bill No. 001', sn: '0001' }));
      setDikshaData(prev => (prev.billNo ? prev : { ...prev, billNo: getDdpPrefix() + '001', sn: '0001' }));
    }
  }, []);

  React.useEffect(() => {
    refreshBillNumbers();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !isSavingRef.current) {
        refreshBillNumbers();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
    };
  }, [refreshBillNumbers]);

  const handleSave = async () => {
    if (!invoiceRef.current) return;
    setIsSaving(true);
    isSavingRef.current = true;
    setMessage({ text: '', type: '' });

    const isEditing = !!editState;
    const activeTemplate = isEditing ? editState.template : template;
    const isDiksha = activeTemplate === 'diksha';
    const setActiveData = isEditing ? setEditData : (isDiksha ? setDikshaData : setInvoiceData);

    try {
      let currentData = isEditing ? editState.data : (isDiksha ? dikshaData : invoiceData);

      // Also reads the sheet headers, used to place the GSTIN / Invoice Data columns
      const latest = await fetchNextNumbers();

      // The Apps Script update needs the sheet row number (header = row 1), so
      // look the bill up in the fresh sheet data by its bill number
      let editRowIndex = 0;
      if (isEditing) {
        const dataIndex = latest.rows.findIndex(
          (row, i) => i > 0 && toText(row[4]).trim() === editState.originalBillNo
        );
        if (dataIndex < 1) {
          throw new Error(`Bill ${editState.originalBillNo} not found in the sheet`);
        }
        editRowIndex = dataIndex + 1;
      }

      if (!isEditing) {
        // 0. Make sure this bill number / SN is not already used in the sheet
        const updated = applyNextNumbers(currentData, latest[TEMPLATES[activeTemplate].billKey], latest.sn);
        if (updated !== currentData) {
          currentData = updated;
          // Render the corrected number before the snapshot is taken
          flushSync(() => setActiveData(currentData));
        }
      }

      // Keep the original invoice date when the bill is edited later
      if (isDiksha && !currentData.invoiceDate) {
        currentData = { ...currentData, invoiceDate: formatInvoiceDate() };
      }

      // 1. Capture Image
      const canvas = await captureInvoiceCanvas(invoiceRef.current);
      const base64Data = canvas.toDataURL('image/jpeg');
      const fileName = `${currentData.billNo.replace(/[^a-zA-Z0-9]/g, '_')}_invoice.jpg`;

      // 2. Upload Image to Drive
      const uploadFormData = new URLSearchParams();
      uploadFormData.append('action', 'uploadFile');
      uploadFormData.append('base64Data', base64Data);
      uploadFormData.append('fileName', fileName);
      uploadFormData.append('mimeType', 'image/jpeg');
      uploadFormData.append('folderId', FOLDER_ID);

      const uploadResponse = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        body: uploadFormData,
      });
      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload image');
      }

      const fileUrl = uploadResult.fileUrl;

      // 3. Save Data to Sheets
      // Schema: [SN, Customer Name, Mobile Number, Address, Bill Number, Bill Image]
      // plus the "GSTIN" and "Invoice Data" (JSON) columns, found by header name
      const rowData = isDiksha
        ? [
            currentData.sn,
            currentData.customerName,
            currentData.customerMobile,
            currentData.billingAddress,
            currentData.billNo,
            fileUrl
          ]
        : [
            currentData.sn,
            currentData.recipientName,
            currentData.recipientMobile,
            currentData.recipientAddress,
            currentData.billNo,
            fileUrl
          ];

      const { gstinCol, dataCol } = getExtraColumns(latest.headers);
      const setCell = (index, value) => {
        while (rowData.length <= index) rowData.push('');
        rowData[index] = value;
      };
      if (gstinCol >= 0) setCell(gstinCol, isDiksha ? (currentData.customerGstin || '') : '');
      setCell(dataCol, JSON.stringify(currentData));

      const insertFormData = new URLSearchParams();
      insertFormData.append('action', isEditing ? 'update' : 'insert');
      insertFormData.append('sheetName', SHEET_NAME);
      insertFormData.append('rowData', JSON.stringify(rowData));
      if (isEditing) {
        insertFormData.append('rowIndex', String(editRowIndex));
        insertFormData.append('billNo', editState.originalBillNo);
      }

      const insertResponse = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        body: insertFormData,
      });
      const insertResult = await insertResponse.json();

      if (!insertResult.success) {
        throw new Error(insertResult.error || 'Failed to save to sheets');
      }

      if (isEditing) {
        setEditState(null);
        navigate('/view');
        return;
      }

      setMessage({ text: 'Bill saved successfully to Sheets and Drive!', type: 'success' });
      
      // Auto-increment the bill number and SN for the next bill
      const numMatch = currentData.billNo.match(/\d+$/);
      let newBillNo = currentData.billNo;
      if (numMatch) {
        const nextNum = parseInt(numMatch[0]) + 1;
        newBillNo = currentData.billNo.replace(/\d+$/, String(nextNum).padStart(numMatch[0].length, '0'));
      }

      let newSn = currentData.sn;
      if (newSn) {
         const snNum = parseInt(newSn, 10);
         if (!isNaN(snNum)) {
            newSn = String(snNum + 1).padStart(4, '0');
         }
      }

      setActiveData(prev => ({ ...prev, billNo: newBillNo, sn: newSn }));
      // SN is shared by both templates, so sync the other one too
      refreshBillNumbers();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'An error occurred while saving', type: 'error' });
    } finally {
      setIsSaving(false);
      isSavingRef.current = false;
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="no-print page-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">{editState ? 'Edit Invoice' : 'Create Invoice'}</h1>
          <p className="page-subtitle">{editState ? `Editing ${editState.originalBillNo}` : 'Generate and save a new tax invoice'}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {message.text && (
            <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500' }}>
              {message.text}
            </div>
          )}
          {editState ? (
            <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={isSaving}>
              <X size={18} />
              Cancel
            </button>
          ) : (
          <div className="template-switch" role="tablist" aria-label="Invoice template">
            {Object.entries(TEMPLATES).map(([key, { label }]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={template === key}
                className={template === key ? 'active' : ''}
                onClick={() => changeTemplate(key)}
                disabled={isSaving}
              >
                {label}
              </button>
            ))}
          </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {editState ? 'Update Bill' : 'Save & Upload'}
          </button>
        </div>
      </div>

      {editState && !editState.hasFullData && (
        <div className="no-print" style={{ padding: '10px 16px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>
          This bill was saved before editing was available, so only customer details were loaded. Please fill the items again before updating.
        </div>
      )}

      <div className="invoice-wrapper">
        <div ref={invoiceRef} style={{ padding: '30px', backgroundColor: '#ffffff' }}>
          {editState ? (
            editState.template === 'diksha' ? (
              <DikshaInvoice data={editState.data} onChange={setEditData} />
            ) : (
              <Invoice data={editState.data} onChange={setEditData} />
            )
          ) : template === 'diksha' ? (
            <DikshaInvoice data={dikshaData} onChange={setDikshaData} />
          ) : (
            <Invoice data={invoiceData} onChange={setInvoiceData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateBill;
