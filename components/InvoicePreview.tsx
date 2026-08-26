import { money, formatInvoiceDate } from "@/lib/utils";

export default function InvoicePreview(props:any){
  const {company,address,customer,invoiceNumber,invoiceDate,dueDate,terms,lines,subtotal,discount,tax,total,paymentMade,balanceDue,taxEnabled}=props;
  return <div className="invoice-page">
    <div className="invoice-header">
      <div className="invoice-company">
        {company?.logo_data&&<img className="invoice-logo" src={company.logo_data} alt="Company logo"/>}
        <div className="invoice-company-name">{company?.name}</div>
        <div className="invoice-company-line">{address?.street}</div>
        <div className="invoice-company-line">{address?.city}, {address?.state} {address?.zip}</div>
        {(address?.phone||company?.phone)&&<div className="invoice-company-line">{address?.phone||company?.phone}</div>}
        {company?.email&&<div className="invoice-company-line">{company.email}</div>}
        {company?.website&&<div className="invoice-company-line">{company.website}</div>}
      </div>
      <div className="invoice-meta">
        <div className="invoice-title">INVOICE</div>
        <div className="invoice-number">{invoiceNumber}</div>
        <div className="balance-label">Balance Due</div>
        <div className="balance">{money(balanceDue)}</div>
        <div className="invoice-dates">
          <div><span>Invoice Date :</span> {formatInvoiceDate(invoiceDate)}</div>
          <div><span>Terms :</span> {terms ? terms.split("\n")[0] : "Due on Receipt"}</div>
          <div><span>Due Date :</span> {dueDate ? formatInvoiceDate(dueDate) : formatInvoiceDate(invoiceDate)}</div>
        </div>
      </div>
    </div>

    <div className="bill-to">
      <div>{customer?.name}</div>
      {customer?.company_name&&<div className="muted">{customer.company_name}</div>}
      {(customer?.street||customer?.city||customer?.state||customer?.zip)&&(
        <div style={{fontWeight:400,lineHeight:1.45}}>
          {customer.street}<br/>
          {customer.city}{customer.city&&customer.state?", ":""}{customer.state} {customer.zip}
          {customer.phone&&<><br/>{customer.phone}</>}
        </div>
      )}
    </div>

    <table className="invoice-table">
      <thead><tr><th style={{width:"6%"}}>#</th><th>Description</th><th style={{width:"12%"}}>Qty</th><th style={{width:"14%"}}>Rate</th><th style={{width:"16%"}}>Amount</th></tr></thead>
      <tbody>
        {lines.map((l:any,i:number)=><tr key={l.id??i}>
          <td>{i+1}</td>
          <td><div className="item-name">{l.name}</div><div className="item-desc">{l.description}</div></td>
          <td className="num">{Number(l.qty).toFixed(2)}</td>
          <td className="num">{money(l.rate)}</td>
          <td className="num">{money(l.amount ?? l.net)}</td>
        </tr>)}
      </tbody>
    </table>

    <div className="invoice-rule" />
    <div className="totals">
      <div className="total-row"><span>Sub Total</span><span>{money(subtotal)}</span></div>
      {discount>0&&<div className="total-row"><span>Discount (-)</span><span>{money(discount)}</span></div>}
      {taxEnabled&&tax>0&&<div className="total-row"><span>Tax</span><span>{money(tax)}</span></div>}
      <div className="total-row strong"><span>Total</span><span>{money(total)}</span></div>
      {paymentMade>0&&<div className="total-row payment"><span>Payment Made (-)</span><span>{money(paymentMade)}</span></div>}
      <div className="total-row strong balance"><span>Balance Due</span><span>{money(balanceDue)}</span></div>
    </div>

    <div className="thanks">Thanks for your business.</div>
    <div className="terms"><h4>Terms &amp; Conditions</h4><div style={{whiteSpace:"pre-line"}}>{terms}</div></div>
  </div>
}
