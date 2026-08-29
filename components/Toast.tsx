"use client";

import { useEffect, useState } from "react";

export default function Toast({message,onDismiss}:{message:string;onDismiss?:()=>void}) {
  const [visible,setVisible]=useState(true);

  useEffect(()=>{
    const timer=window.setTimeout(()=>{setVisible(false);onDismiss?.();},4500);
    return()=>window.clearTimeout(timer);
  },[message]);

  if(!visible)return null;

  return <div className="toast-success" role="status" aria-live="polite">
    <span className="toast-icon">✓</span>
    <span>{message}</span>
    <button type="button" aria-label="Dismiss notification" onClick={()=>{setVisible(false);onDismiss?.();}}>×</button>
  </div>;
}
