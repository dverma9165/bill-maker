import React, { useState } from 'react';
import EditableField from './EditableField';

const DDP_SUPPLIER = {
  name: 'RAMESHWAR VERMA (Diksha Design & Print)',
  gstin: '22CSMPP0228F1ZZ (N/A)',
  addressLines: ['Main Road Village Arjuni, Post Arjuni', 'BalodaBazar, Bhatapara,', 'Raipur, CHHATTISGARH', 'Pin : 493331'],
  mobile: '+91 9977882148',
  email: 'rajv437@gmail.com',
  stateCode: '22',
  stateName: 'CHHATTISGARH',
};

const BANK = [
  ['Bank:', 'HDFC Bank LTD'],
  ['Account #:', '50100147485011'],
  ['IFSC Code:', 'HDFC0000916'],
  ['Branch:', 'Bhatapara'],
];

export const emptyDikshaItem = () => ({ name: '', hsn: '', rate: '', qty: '1', taxPct: '18' });

const toNum = (v) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

const round2 = (n) => Math.round(n * 100) / 100;

const formatINR = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatPct = (n) => Number(n).toFixed(1);

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const twoDigits = (n) => (n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));

// Indian numbering: 147500 -> "One Lakh, Forty-Seven Thousand, Five Hundred"
const integerToWordsIN = (num) => {
  if (num === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;
  if (crore) parts.push(integerToWordsIN(crore) + ' Crore');
  if (lakh) parts.push(twoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigits(thousand) + ' Thousand');
  if (hundred) parts.push(ONES[hundred] + ' Hundred');
  if (rest) parts.push(twoDigits(rest));
  return parts.join(', ');
};

const amountToWordsINR = (amount) => {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  let words = `INR ${integerToWordsIN(rupees)} Rupees`;
  if (paise) words += ` and ${twoDigits(paise)} Paise`;
  return words + ' Only.';
};

export const formatInvoiceDate = (date = new Date()) =>
  date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const TAX_TYPES = [
  { key: 'igst', label: 'IGST' },
  { key: 'cgst_sgst', label: 'CGST + SGST' },
];

const calculateDikshaTotals = (data) => {
  const rows = data.items.map((item) => {
    const rate = toNum(item.rate);
    const qty = toNum(item.qty);
    const pct = toNum(item.taxPct);
    const taxable = round2(rate * qty);
    const tax = round2(taxable * pct / 100);
    return { rate, qty, pct, taxable, tax, amount: round2(taxable + tax) };
  });

  const intra = data.taxType === 'cgst_sgst';
  const byRate = {};
  rows.forEach((r) => {
    if (r.tax > 0) byRate[r.pct] = round2((byRate[r.pct] || 0) + r.tax);
  });

  const taxLines = [];
  Object.keys(byRate).map(Number).sort((a, b) => a - b).forEach((pct) => {
    const amt = byRate[pct];
    if (intra) {
      const half = round2(amt / 2);
      taxLines.push({ label: `CGST ${formatPct(pct / 2)}%`, amount: half });
      taxLines.push({ label: `SGST ${formatPct(pct / 2)}%`, amount: round2(amt - half) });
    } else {
      taxLines.push({ label: `IGST ${formatPct(pct)}%`, amount: amt });
    }
  });

  const taxableTotal = round2(rows.reduce((s, r) => s + r.taxable, 0));
  const taxTotal = round2(rows.reduce((s, r) => s + r.tax, 0));
  const total = round2(taxableTotal + taxTotal);
  const payable = Math.round(total);
  const roundOff = round2(payable - total);
  const filled = data.items.filter((item, i) => item.name.trim() || rows[i].taxable);
  const totalQty = filled.reduce((s, item) => s + toNum(item.qty), 0);

  return { rows, taxLines, taxableTotal, taxTotal, total, payable, roundOff, itemCount: filled.length, totalQty };
};

// Shows "1,25,000.00" when idle and the raw number while being edited
const NumberField = ({ value, onChange, style }) => {
  const [focused, setFocused] = useState(false);
  const display = !focused && String(value).trim() !== '' && !isNaN(toNum(value)) ? formatINR(toNum(value)) : value;
  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      style={{ background: 'transparent', border: 'none', outline: 'none', width: '100%', padding: 0, margin: 0, font: 'inherit', color: 'inherit', textAlign: 'right', ...style }}
    />
  );
};

const DikshaInvoice = React.forwardRef(({ data, onChange }, ref) => {
  const totals = calculateDikshaTotals(data);

  const handleChange = (field, value) => onChange({ ...data, [field]: value });

  const handleItemChange = (index, field, value) => {
    const items = data.items.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange({ ...data, items });
  };

  const addItem = () => onChange({ ...data, items: [...data.items, emptyDikshaItem()] });
  const removeItem = (index) => {
    if (data.items.length === 1) return;
    onChange({ ...data, items: data.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="ddp-invoice" ref={ref}>
      {/* Header */}
      <div className="ddp-row ddp-between">
        <div className="ddp-title">TAX INVOICE</div>
        <div className="ddp-original">ORIGINAL FOR RECIPIENT</div>
      </div>

      <div className="ddp-row ddp-between" style={{ alignItems: 'flex-start', marginTop: '10px' }}>
        <div>
          <div className="ddp-company">{DDP_SUPPLIER.name}</div>
          <div><span className="ddp-b">GSTIN</span> <span className="ddp-b ddp-lg">{DDP_SUPPLIER.gstin}</span></div>
          {DDP_SUPPLIER.addressLines.map((line) => <div key={line}>{line}</div>)}
          <div>
            <span className="ddp-b">Mobile</span> {DDP_SUPPLIER.mobile}
            <span className="ddp-b" style={{ marginLeft: '10px' }}>Email</span> {DDP_SUPPLIER.email}
          </div>
        </div>
        <img src="/diksha-logo-01.png" alt="Diksha Design & Print" className="ddp-logo" />
      </div>

      {/* Invoice meta */}
      <div className="ddp-grid" style={{ marginTop: '20px' }}>
        <div className="ddp-flex">
          <span style={{ whiteSpace: 'nowrap' }}>Invoice #:&nbsp;</span>
          <EditableField value={data.billNo} onChange={(v) => handleChange('billNo', v)} className="ddp-b ddp-lg" />
        </div>
        <div>Invoice Date: <span className="ddp-b ddp-lg">{data.invoiceDate || formatInvoiceDate()}</span></div>
      </div>

      <div className="ddp-grid" style={{ marginTop: '14px' }}>
        <div>
          <div className="ddp-label">Customer Details:</div>
          <EditableField value={data.customerName} onChange={(v) => handleChange('customerName', v)} className="ddp-b" multiline={true} placeholder="Customer / Company Name" />
          <div className="ddp-flex" data-html2canvas-ignore={data.customerGstin ? undefined : 'true'}>
            <span className="ddp-b" style={{ whiteSpace: 'nowrap' }}>GSTIN:&nbsp;</span>
            <EditableField value={data.customerGstin} onChange={(v) => handleChange('customerGstin', v)} className="ddp-b" placeholder="Customer GSTIN (optional)" />
          </div>
          <div className="ddp-flex" data-html2canvas-ignore={data.customerMobile ? undefined : 'true'}>
            <span className="ddp-b" style={{ whiteSpace: 'nowrap' }}>Mobile:&nbsp;</span>
            <EditableField value={data.customerMobile} onChange={(v) => handleChange('customerMobile', v)} placeholder="Customer Mobile (optional)" />
          </div>
        </div>
        <div>
          <div className="ddp-label">Billing Address:</div>
          <EditableField value={data.billingAddress} onChange={(v) => handleChange('billingAddress', v)} multiline={true} placeholder="Enter billing address" />
        </div>
      </div>

      <div className="ddp-grid" style={{ marginTop: '14px' }}>
        <div>
          <div className="ddp-label">Place of Supply:</div>
          <EditableField value={data.placeOfSupply} onChange={(v) => handleChange('placeOfSupply', v)} className="ddp-b" placeholder="e.g. 22-CHHATTISGARH" />
        </div>
        <div className="ddp-flex" style={{ alignItems: 'flex-start' }} data-html2canvas-ignore={data.reference ? undefined : 'true'}>
          <span style={{ whiteSpace: 'nowrap' }}>Reference:&nbsp;</span>
          <EditableField value={data.reference} onChange={(v) => handleChange('reference', v)} placeholder="PO / Reference (optional)" />
        </div>
      </div>

      {/* Items */}
      <table className="ddp-table">
        <colgroup>
          <col style={{ width: '5%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '13%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="ddp-left">#</th>
            <th className="ddp-left">Item</th>
            <th>Rate / Item</th>
            <th>Qty</th>
            <th>Taxable Value</th>
            <th>Tax Amount</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, index) => {
            const row = totals.rows[index];
            return (
              <tr key={index}>
                <td className="ddp-left">
                  {index + 1}
                  {data.items.length > 1 && (
                    <button type="button" className="ddp-remove no-print" data-html2canvas-ignore="true" onClick={() => removeItem(index)} title="Remove item">×</button>
                  )}
                </td>
                <td className="ddp-left">
                  <EditableField value={item.name} onChange={(v) => handleItemChange(index, 'name', v)} multiline={true} className="ddp-item-name" placeholder="Item / Service description" />
                  <div className="ddp-flex ddp-small" data-html2canvas-ignore={item.hsn ? undefined : 'true'}>
                    <span style={{ whiteSpace: 'nowrap' }}>HSN/SAC:&nbsp;</span>
                    <EditableField value={item.hsn} onChange={(v) => handleItemChange(index, 'hsn', v)} placeholder="optional" />
                  </div>
                </td>
                <td className="ddp-b"><NumberField value={item.rate} onChange={(v) => handleItemChange(index, 'rate', v)} /></td>
                <td><NumberField value={item.qty} onChange={(v) => handleItemChange(index, 'qty', v)} style={{ textAlign: 'right' }} /></td>
                <td>{row.taxable ? formatINR(row.taxable) : ''}</td>
                <td>
                  <span style={{ whiteSpace: 'nowrap' }}>
                    {row.taxable ? formatINR(row.tax) : ''} (
                    <input
                      type="text"
                      inputMode="decimal"
                      value={item.taxPct}
                      onChange={(e) => handleItemChange(index, 'taxPct', e.target.value)}
                      className="ddp-pct"
                      data-inline="true"
                    />%)
                  </span>
                </td>
                <td>{row.taxable ? formatINR(row.amount) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ddp-controls no-print" data-html2canvas-ignore="true">
        <button type="button" className="ddp-add" onClick={addItem}>+ Add Item</button>
        <div className="ddp-taxtype">
          <span>Tax Type:</span>
          {TAX_TYPES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={(data.taxType || 'igst') === key ? 'active' : ''}
              onClick={() => handleChange('taxType', key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="ddp-summary">
        <div className="ddp-sum-row ddp-b"><span>Taxable Amount</span><span>₹{formatINR(totals.taxableTotal)}</span></div>
        {totals.taxLines.map((line) => (
          <div key={line.label} className="ddp-sum-row ddp-b ddp-small"><span>{line.label}</span><span>₹{formatINR(line.amount)}</span></div>
        ))}
        {totals.roundOff !== 0 && (
          <div className="ddp-sum-row ddp-small"><span>Round Off</span><span>{totals.roundOff > 0 ? '+' : '-'}₹{formatINR(Math.abs(totals.roundOff))}</span></div>
        )}
        <div className="ddp-sum-row ddp-total"><span>Total</span><span>₹{formatINR(totals.payable)}</span></div>
      </div>

      <div className="ddp-row ddp-between ddp-words">
        <span className="ddp-xs">Total Items / Qty : {totals.itemCount} / {totals.totalQty}</span>
        <span className="ddp-xs">Total amount (in words): {amountToWordsINR(totals.payable)}</span>
      </div>
      <div className="ddp-payable">
        <span>Amount Payable:</span><span>₹{formatINR(totals.payable)}</span>
      </div>

      {/* Footer */}
      <div className="ddp-row ddp-between" style={{ marginTop: '22px', alignItems: 'flex-start' }}>
        <div>
          <div className="ddp-b" style={{ marginBottom: '6px' }}>Bank Details:</div>
          <table className="ddp-bank">
            <tbody>
              {BANK.map(([label, value]) => (
                <tr key={label}><td>{label}</td><td className="ddp-b">{value}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="ddp-sign">
          <div className="ddp-small">For {DDP_SUPPLIER.name}</div>
          <div style={{ height: '80px' }}></div>
          <div className="ddp-small">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
});

export default DikshaInvoice;
