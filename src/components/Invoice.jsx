import React from 'react';
import EditableField from './EditableField';

function numberToWords(num) {
    if (num === 0) return 'Zero Rupees Only.';
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

    if ((num = num.toString()).length > 9) return 'Amount too large';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str ? str.trim() + ' Rupees Only.' : '';
}

const Invoice = React.forwardRef(({ data, onChange }, ref) => {
  const calculateTotals = (newData) => {
    let totalVal = 0;

    newData.items.forEach(item => {
        totalVal += parseFloat(item.val) || 0;
    });

    const cPct = parseFloat(newData.totalCgstPct) || 0;
    const sPct = parseFloat(newData.totalSgstPct) || 0;
    const iPct = parseFloat(newData.igstPct) || 0;

    const totalCgstAmt = cPct ? (totalVal * (cPct / 100)) : 0;
    const totalSgstAmt = sPct ? (totalVal * (sPct / 100)) : 0;
    const computedIgst = iPct ? (totalVal * (iPct / 100)) : 0;

    const addCgst = totalCgstAmt;
    const addSgst = totalSgstAmt;
    const addIgst = computedIgst || (parseFloat(newData.addIgst) || 0);
    
    const taxAmountGst = addCgst + addSgst + addIgst;
    const totalAmount = Math.round(totalVal + taxAmountGst);
    const words = numberToWords(totalAmount);

    onChange({
        ...newData,
        totalVal: totalVal > 0 ? totalVal.toFixed(2) : '',
        totalCgstAmt: totalCgstAmt > 0 ? totalCgstAmt.toFixed(2) : '',
        totalSgstAmt: totalSgstAmt > 0 ? totalSgstAmt.toFixed(2) : '',
        addCgst: addCgst > 0 ? addCgst.toFixed(2) : '',
        addSgst: addSgst > 0 ? addSgst.toFixed(2) : '',
        addIgst: addIgst > 0 ? addIgst.toFixed(2) : '',
        taxAmountGst: taxAmountGst > 0 ? taxAmountGst.toFixed(2) : '',
        totalAmount: totalAmount > 0 ? totalAmount.toFixed(2) : '',
        grossWords: words
    });
  };

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    // Trigger calculation if any global tax fields change
    if (field === 'addIgst' || field === 'totalCgstPct' || field === 'totalSgstPct' || field === 'igstPct') {
        calculateTotals(newData);
    } else {
        onChange(newData);
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...data.items];
    let item = { ...newItems[index], [field]: value };
    
    // Auto-calculate val from qty and rate
    if (field === 'qty' || field === 'rate') {
       const qty = parseFloat(item.qty) || 0;
       const rate = parseFloat(item.rate) || 0;
       if (qty && rate) item.val = (qty * rate).toFixed(2);
       else item.val = '';
    }
    
    // Auto-calculate cgstAmt and sgstAmt
    if (field === 'val' || field === 'cgstPct' || field === 'sgstPct' || field === 'qty' || field === 'rate') {
       const val = parseFloat(item.val) || 0;
       const cPct = parseFloat(item.cgstPct) || 0;
       const sPct = parseFloat(item.sgstPct) || 0;
       
       if (cPct && val) item.cgstAmt = (val * (cPct/100)).toFixed(2);
       else if (field === 'cgstPct' && !cPct) item.cgstAmt = '';
       
       if (sPct && val) item.sgstAmt = (val * (sPct/100)).toFixed(2);
       else if (field === 'sgstPct' && !sPct) item.sgstAmt = '';
    }
    
    newItems[index] = item;
    calculateTotals({ ...data, items: newItems });
  };

  return (
    <div className="invoice-container" ref={ref} style={{ backgroundColor: 'white' }}>
      <table className="main-table">
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '7%' }} />
          <col style={{ width: '5%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <tbody>
          {/* Header */}
          <tr>
            <td colSpan="10" className="header" style={{ textAlign: 'center', fontWeight: 'bold' }}>TAX INVOICE</td>
          </tr>
          
          {/* Top Section Rows */}
          <tr>
            <td colSpan="2" rowSpan="4" className="valign-top p-5">
              <div>Supplier's Detail :</div>
              <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <EditableField value={data.supplierName} onChange={(v) => handleChange('supplierName', v)} className="bold-text" style={{ fontSize: '16px' }} />
              </div>
              <div style={{ marginTop: '2px' }}>
                <EditableField value={data.supplierAddress} onChange={(v) => handleChange('supplierAddress', v)} multiline={true} />
              </div>
              <div style={{ marginTop: '8px' }}>
                <EditableField value={data.gstNo} onChange={(v) => handleChange('gstNo', v)} className="bold-text" />
              </div>
            </td>
            <td colSpan="4" rowSpan="4" className="valign-top p-5">
              <div>Recipient's Details :</div>
              <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center' }}>
                <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>Name :</span> 
                <EditableField value={data.recipientName} onChange={(v) => handleChange('recipientName', v)} />
              </div>
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'center' }}>
                <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>Mobile :</span> 
                <EditableField value={data.recipientMobile} onChange={(v) => handleChange('recipientMobile', v)} />
              </div>
              <div style={{ marginTop: '2px', display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ whiteSpace: 'nowrap', marginRight: '4px' }}>Address :</span>
                <EditableField value={data.recipientAddress} onChange={(v) => handleChange('recipientAddress', v)} multiline={true} />
              </div>
            </td>
            <td colSpan="2" rowSpan="2" className="text-center p-5 valign-top">
              <span className="bold-text">Supply PO No. :</span> <EditableField value={data.poNo} onChange={(v) => handleChange('poNo', v)} />
            </td>
            <td colSpan="2" className="text-center p-5">
              <EditableField value={data.billNo} onChange={(v) => handleChange('billNo', v)} />
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="text-center p-5">
              <EditableField value={data.date} onChange={(v) => handleChange('date', v)} />
            </td>
          </tr>
          <tr>
            <td className="text-center p-5">State</td>
            <td className="text-center p-5"><EditableField value={data.state} onChange={(v) => handleChange('state', v)} /></td>
            <td colSpan="2" rowSpan="2" className="text-center p-5 valign-top">
              <EditableField value={data.acInfo} onChange={(v) => handleChange('acInfo', v)} className="bold-text" multiline={true} />
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="p-5"></td>
          </tr>

          {/* Table Headers */}
          <tr>
            <th rowSpan="2" className="text-center p-5">S.N.</th>
            <th rowSpan="2" className="text-left p-5">Description of Goods or<br />services</th>
            <th rowSpan="2" className="text-center p-5">HSN/SAC</th>
            <th rowSpan="2" className="text-center p-5">QTY.</th>
            <th rowSpan="2" className="text-center p-5">RATE</th>
            <th rowSpan="2" className="text-center p-5">VALUE</th>
            <th colSpan="2" className="text-center p-5">CGST</th>
            <th colSpan="2" className="text-center p-5">SGST</th>
          </tr>
          <tr>
            <th className="text-center p-5">CGST</th>
            <th className="text-center p-5">AMOUNT</th>
            <th className="text-center p-5">SGST</th>
            <th className="text-center p-5">AMOUNT</th>
          </tr>

          {/* Data Rows */}
          {data.items.map((item, index) => (
            <tr key={index}>
              <td className="text-center p-5"><EditableField value={item.sn} onChange={(v) => handleItemChange(index, 'sn', v)} /></td>
              <td className="p-5"><EditableField value={item.desc} onChange={(v) => handleItemChange(index, 'desc', v)} /></td>
              <td className="text-center p-5"><EditableField value={item.hsn} onChange={(v) => handleItemChange(index, 'hsn', v)} /></td>
              <td className="text-center p-5"><EditableField value={item.qty} onChange={(v) => handleItemChange(index, 'qty', v)} /></td>
              <td className="text-right p-5"><EditableField value={item.rate} onChange={(v) => handleItemChange(index, 'rate', v)} /></td>
              <td className="text-right p-5"><EditableField value={item.val} onChange={(v) => handleItemChange(index, 'val', v)} /></td>
              <td className="text-center p-5"><EditableField value={item.cgstPct} onChange={(v) => handleItemChange(index, 'cgstPct', v)} /></td>
              <td className="text-right p-5"><EditableField value={item.cgstAmt} onChange={(v) => handleItemChange(index, 'cgstAmt', v)} /></td>
              <td className="text-center p-5"><EditableField value={item.sgstPct} onChange={(v) => handleItemChange(index, 'sgstPct', v)} /></td>
              <td className="text-right p-5"><EditableField value={item.sgstAmt} onChange={(v) => handleItemChange(index, 'sgstAmt', v)} /></td>
            </tr>
          ))}

          {/* TOTAL Row */}
          <tr>
            <td className="text-center p-5"></td>
            <td className="p-5 bold-text">TOTAL</td>
            <td className="text-center p-5"></td>
            <td className="text-center p-5"></td>
            <td className="text-right p-5"></td>
            <td className="text-right p-5"><EditableField value={data.totalVal} onChange={(v) => handleChange('totalVal', v)} className="bold-text" /></td>
            <td className="text-center p-5"><EditableField value={data.totalCgstPct} onChange={(v) => handleChange('totalCgstPct', v)} className="bold-text" /></td>
            <td className="text-right p-5"><EditableField value={data.totalCgstAmt} onChange={(v) => handleChange('totalCgstAmt', v)} className="bold-text" /></td>
            <td className="text-center p-5"><EditableField value={data.totalSgstPct} onChange={(v) => handleChange('totalSgstPct', v)} className="bold-text" /></td>
            <td className="text-right p-5"><EditableField value={data.totalSgstAmt} onChange={(v) => handleChange('totalSgstAmt', v)} className="bold-text" /></td>
          </tr>

          {/* Footer Section */}
          <tr>
            <td colSpan="6" className="text-left p-5">
              <div>Gross invoice value (in Words) :</div>
              <div style={{ marginTop: '4px' }}>
                <EditableField value={data.grossWords} onChange={(v) => handleChange('grossWords', v)} multiline={true} className="bold-text" />
              </div>
            </td>
            <td colSpan="3" className="text-left p-5">Add :CGST</td>
            <td className="text-right p-5"><EditableField value={data.addCgst} onChange={(v) => handleChange('addCgst', v)} /></td>
          </tr>
          <tr>
            <td colSpan="6" rowSpan="5" className="text-left valign-top p-5 relative">
              <div className="terms-text">
                <EditableField value={data.terms} onChange={(v) => handleChange('terms', v)} multiline={true} />
              </div>
              <div className="customer-sign">Customer Sign.</div>
            </td>
            <td colSpan="3" className="text-left p-5">Add : SGST</td>
            <td className="text-right p-5"><EditableField value={data.addSgst} onChange={(v) => handleChange('addSgst', v)} /></td>
          </tr>
          <tr>
            <td colSpan="3" className="text-left p-5">
              ADD : IGST <EditableField value={data.igstPct} onChange={(v) => handleChange('igstPct', v)} style={{ display: 'inline', width: '50px', marginLeft: '8px' }} />
            </td>
            <td className="text-right p-5"><EditableField value={data.addIgst} onChange={(v) => handleChange('addIgst', v)} /></td>
          </tr>
          <tr>
            <td colSpan="3" className="text-left p-5">Tax Amount : GST</td>
            <td className="text-right p-5"><EditableField value={data.taxAmountGst} onChange={(v) => handleChange('taxAmountGst', v)} /></td>
          </tr>
          <tr>
            <td colSpan="3" className="text-left p-5 bold-text">Total Amount</td>
            <td className="text-right p-5 bold-text"><EditableField value={data.totalAmount} onChange={(v) => handleChange('totalAmount', v)} className="bold-text" style={{ fontSize: '13px' }} /></td>
          </tr>
          <tr>
            <td colSpan="4" className="text-center valign-top p-5" style={{ height: '70px', textAlign: 'center' }}>
              <EditableField value={data.signFor} onChange={(v) => handleChange('signFor', v)} className="bold-text text-center" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
});

export default Invoice;
