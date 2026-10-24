import { inr, fmtDate } from '../../utils/format';

/** Printable bill (works on 80mm thermal paper and on A4). */
export default function Receipt({ bill, site }) {
  if (!bill) return null;
  const saved = Number(bill.discount) > 0;
  return (
    <div className="dc-receipt">
      <div className="r-center">
        <div className="r-logo">ॐ</div>
        <div className="r-shop">THE DIVINE CORNER</div>
        {site && <div className="r-small">{site}</div>}
      </div>
      <div className="r-rule" />
      <div className="r-meta">
        <div><span>Bill</span><b>{bill.billNumber}</b></div>
        <div><span>Date</span><b>{fmtDate(bill.billDate, true)}</b></div>
        {bill.customerName && <div><span>Customer</span><b>{bill.customerName}</b></div>}
        <div><span>Mobile</span><b>{bill.customerPhone}</b></div>
      </div>
      <div className="r-rule" />
      <table className="r-items">
        <thead>
          <tr><th>Item</th><th className="n">Qty</th><th className="n">Rate</th><th className="n">Amt</th></tr>
        </thead>
        <tbody>
          {bill.items.map((i, idx) => (
            <tr key={idx}>
              <td>
                {i.productName}
                {Number(i.mrp) > Number(i.unitPrice) && <div className="r-mrp">MRP {inr(i.mrp)}</div>}
              </td>
              <td className="n">{i.quantity}</td>
              <td className="n">{inr(i.unitPrice)}</td>
              <td className="n">{inr(i.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="r-rule" />
      {saved && <div className="r-line"><span>MRP total</span><span>{inr(bill.subtotal)}</span></div>}
      {saved && <div className="r-line"><span>You saved</span><span>− {inr(bill.discount)}</span></div>}
      <div className="r-line r-total"><span>TOTAL ({bill.totalQuantity} items)</span><span>{inr(bill.total)}</span></div>
      <div className="r-line"><span>Paid ({bill.paymentMethod})</span><span>{inr(bill.amountPaid)}</span></div>
      {Number(bill.amountDue) > 0 && <div className="r-line r-due"><span>Balance due</span><span>{inr(bill.amountDue)}</span></div>}
      {bill.notes && <div className="r-notes">Note: {bill.notes}</div>}
      {bill.voided && <div className="r-void">VOID — {bill.voidReason}</div>}
      <div className="r-rule" />
      <div className="r-center r-small">Thank you! Visit again 🙏</div>

      <style jsx>{`
        .dc-receipt {
          width: 100%; max-width: 360px; margin: 0 auto; background: #fff; color: #111;
          font-family: 'Courier New', ui-monospace, monospace; font-size: 12.5px; line-height: 1.45; padding: 14px;
        }
        .r-center { text-align: center; }
        .r-logo { font-size: 22px; }
        .r-shop { font-weight: 800; font-size: 15px; letter-spacing: 0.08em; }
        .r-small { font-size: 11px; color: #444; }
        .r-rule { border-top: 1px dashed #999; margin: 8px 0; }
        .r-meta div { display: flex; justify-content: space-between; gap: 10px; }
        .r-meta span { color: #555; }
        .r-items { width: 100%; border-collapse: collapse; }
        .r-items th { text-align: left; font-size: 11px; color: #555; font-weight: 600; padding-bottom: 4px; }
        .r-items td { padding: 3px 0; vertical-align: top; }
        .r-items .n { text-align: right; white-space: nowrap; padding-left: 6px; }
        .r-mrp { font-size: 10.5px; color: #777; text-decoration: line-through; }
        .r-line { display: flex; justify-content: space-between; padding: 2px 0; }
        .r-total { font-weight: 800; font-size: 14px; border-top: 1px solid #111; margin-top: 4px; padding-top: 6px; }
        .r-due { font-weight: 800; }
        .r-notes { margin-top: 6px; font-size: 11.5px; }
        .r-void { margin-top: 8px; text-align: center; font-weight: 800; color: #b91c1c; border: 2px solid #b91c1c; padding: 4px; }
        @media print {
          .dc-receipt { max-width: 80mm; padding: 0; font-size: 12px; }
        }
      `}</style>
    </div>
  );
}
