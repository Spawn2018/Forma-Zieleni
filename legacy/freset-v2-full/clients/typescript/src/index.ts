// Canonical lightweight typed client. Web and mobile import this package; do not duplicate API models.
export type Role = 'admin'|'designer'|'client'|'partner'|'service';
export type ApiError = { code:string; message:string; request_id:string; details?:Record<string,unknown> };
export type User = { id:string; email:string; name?:string|null; role:Role; created_at:string };
export type LeadStatus='new'|'contacted'|'qualified'|'consultation'|'offer'|'won'|'lost';
export type Lead={id:string;source:string;status:LeadStatus;name:string;phone:string;email?:string|null;location?:string|null;project_type:string;budget_min_pln?:number|null;budget_max_pln?:number|null;next_action_at?:string|null;created_at:string};
export type Project={id:string;client_user_id:string;lead_id?:string|null;name:string;slug:string;status:'planned'|'active'|'waiting_client'|'on_hold'|'completed'|'cancelled';location?:string|null;created_at:string};
export type Offer={id:string;lead_id:string;project_id?:string|null;status:'draft'|'sent'|'viewed'|'accepted'|'rejected'|'expired';currency:string;total_gross:number;valid_until?:string|null;accepted_at?:string|null;created_at:string};
export type Payment={id:string;offer_id?:string|null;project_id?:string|null;provider:string;provider_ref?:string|null;status:'pending'|'paid'|'failed'|'refunded'|'cancelled';amount:number;currency:string;paid_at?:string|null;created_at:string};
export type Page<T>={items:T[];meta:{limit:number;next_cursor?:string|null}};
export class FormaZieleniApi {
 constructor(public baseUrl:string, private getToken:()=>string|undefined=()=>undefined){}
 private async req<T>(path:string, init:RequestInit={}):Promise<T>{ const token=this.getToken(); const h=new Headers(init.headers); h.set('Accept','application/json'); if(init.body)h.set('Content-Type','application/json'); if(token)h.set('Authorization',`Bearer ${token}`); const r=await fetch(this.baseUrl+path,{...init,headers:h}); if(!r.ok) throw await r.json().catch(()=>({code:'http_error',message:r.statusText,request_id:r.headers.get('x-request-id')||'unknown'})) as ApiError; if(r.status===204)return undefined as T; return r.json() as Promise<T>; }
 me(){return this.req<User>('/auth/me')}
 listLeads(cursor?:string){return this.req<Page<Lead>>('/crm/leads'+(cursor?`?cursor=${encodeURIComponent(cursor)}`:''))}
 getProject(id:string){return this.req<Project>(`/projects/${encodeURIComponent(id)}`)}
 getOffer(id:string){return this.req<Offer>(`/offers/${encodeURIComponent(id)}`)}
 acceptOffer(id:string,key: string){return this.req<Offer>(`/offers/${encodeURIComponent(id)}/accept`,{method:'POST',headers:{'Idempotency-Key':key}})}
}
