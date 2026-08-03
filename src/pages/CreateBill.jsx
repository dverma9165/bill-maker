import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Save, Loader2 } from 'lucide-react';
import Invoice from '../components/Invoice';

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

const CreateBill = () => {
  const [invoiceData, setInvoiceData] = useState(defaultInvoiceData);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const invoiceRef = useRef(null);

  React.useEffect(() => {
    // Fetch last bill number and SN
    const fetchLastBill = async () => {
      try {
        const res = await fetch(`${APPSCRIPT_URL}?sheet=${SHEET_NAME}`);
        const result = await res.json();
        
        let newBillNo = 'Bill No. 001';
        let newSn = '0001';

        if (result.success && result.data && result.data.length > 1) {
          const lastRow = result.data[result.data.length - 1];
          const lastSn = lastRow[0]; // SN is at index 0
          const lastBillNo = lastRow[4]; // Bill Number is at index 4

          if (lastBillNo) {
            const numMatch = lastBillNo.match(/\d+$/);
            if (numMatch) {
              const nextNum = parseInt(numMatch[0]) + 1;
              newBillNo = lastBillNo.replace(/\d+$/, String(nextNum).padStart(numMatch[0].length, '0'));
            }
          }

          if (lastSn) {
             const snNum = parseInt(lastSn, 10);
             if (!isNaN(snNum)) {
                newSn = String(snNum + 1).padStart(4, '0');
             }
          }
        }
        setInvoiceData(prev => ({ ...prev, billNo: newBillNo, sn: newSn }));
      } catch (error) {
        console.error('Error fetching last bill:', error);
        setInvoiceData(prev => ({ ...prev, billNo: 'Bill No. 001', sn: '0001' }));
      }
    };

    fetchLastBill();
  }, []);

  const handleSave = async () => {
    if (!invoiceRef.current) return;
    setIsSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // 1. Capture Image
      const canvas = await captureInvoiceCanvas(invoiceRef.current);
      const base64Data = canvas.toDataURL('image/jpeg');
      const fileName = `${invoiceData.billNo.replace(/[^a-zA-Z0-9]/g, '_')}_invoice.jpg`;

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
      const rowData = [
        invoiceData.sn,
        invoiceData.recipientName,
        invoiceData.recipientMobile,
        invoiceData.recipientAddress,
        invoiceData.billNo,
        fileUrl
      ];

      const insertFormData = new URLSearchParams();
      insertFormData.append('action', 'insert');
      insertFormData.append('sheetName', SHEET_NAME);
      insertFormData.append('rowData', JSON.stringify(rowData));

      const insertResponse = await fetch(APPSCRIPT_URL, {
        method: 'POST',
        body: insertFormData,
      });
      const insertResult = await insertResponse.json();

      if (!insertResult.success) {
        throw new Error(insertResult.error || 'Failed to save to sheets');
      }

      setMessage({ text: 'Bill saved successfully to Sheets and Drive!', type: 'success' });
      
      // Auto-increment the bill number and SN for the next bill
      const numMatch = invoiceData.billNo.match(/\d+$/);
      let newBillNo = invoiceData.billNo;
      if (numMatch) {
        const nextNum = parseInt(numMatch[0]) + 1;
        newBillNo = invoiceData.billNo.replace(/\d+$/, String(nextNum).padStart(numMatch[0].length, '0'));
      }
      
      let newSn = invoiceData.sn;
      if (newSn) {
         const snNum = parseInt(newSn, 10);
         if (!isNaN(snNum)) {
            newSn = String(snNum + 1).padStart(4, '0');
         }
      }

      setInvoiceData(prev => ({ ...prev, billNo: newBillNo, sn: newSn }));
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'An error occurred while saving', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="no-print page-header-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Create Invoice</h1>
          <p className="page-subtitle">Generate and save a new tax invoice</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {message.text && (
            <div style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7', color: message.type === 'error' ? '#991b1b' : '#166534', display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '500' }}>
              {message.text}
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save & Upload
          </button>
        </div>
      </div>

      <div className="invoice-wrapper">
        <div ref={invoiceRef} style={{ padding: '30px', backgroundColor: '#ffffff' }}>
          <Invoice data={invoiceData} onChange={setInvoiceData} />
        </div>
      </div>
    </div>
  );
};

export default CreateBill;
