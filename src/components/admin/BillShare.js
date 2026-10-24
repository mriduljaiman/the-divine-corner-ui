import { FiPrinter } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Receipt from './Receipt';
import { whatsappText, whatsappUrl } from '../../utils/pos';

/** Receipt + Print / WhatsApp actions. The receipt is the only thing printed. */
export default function BillShare({ bill, children }) {
  const site = typeof window !== 'undefined' ? window.location.origin : '';
  const host = site.replace(/^https?:\/\//, '');
  const print = () => window.print();
  const share = () => {
    window.open(whatsappUrl(bill.customerPhone, whatsappText(bill, site)), '_blank', 'noopener');
  };

  return (
    <>
      <div className="adm-print-area">
        <Receipt bill={bill} site={host} />
      </div>
      <div className="adm-no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
        <button type="button" className="adm-btn" onClick={print} style={{ flex: 1 }}><FiPrinter /> Print bill</button>
        <button type="button" className="adm-btn whatsapp" onClick={share} style={{ flex: 1 }}><FaWhatsapp size={18} /> WhatsApp</button>
        {children}
      </div>
    </>
  );
}
