"use client";
export default function ConfirmActionForm({action,fields={},message,label,className="button danger"}) {
  return <form action={action} onSubmit={(event)=>{if(!window.confirm(message))event.preventDefault();}}>{Object.entries(fields).map(([name,value])=><input type="hidden" name={name} value={value} key={name}/>)}<button className={className} type="submit">{label}</button></form>;
}
