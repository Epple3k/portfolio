import {create} from 'zustand';
import type {Config,Mode,View} from './types';
const params=new URLSearchParams(location.search);
const cid=location.pathname.split('/')[2]||params.get('case')||'relay';
const num=(key:string,d:number,min:number,max:number)=>{const v=Number(params.get(key)??d);return Number.isFinite(v)?Math.max(min,Math.min(max,v)):d};
const view=params.get('view');
export const initial:Config={case_id:['relay','hub','loop'].includes(cid)?cid:'relay',day:num('day',68,0,90),window:[7,14,30].includes(num('window',14,7,30))?num('window',14,7,30) as 7|14|30:14,threshold:num('threshold',97,80,100),detector:['combined','rules','model'].includes(params.get('detector')||'')?params.get('detector') as Config['detector']:'combined',injection:params.get('injection')!=='false'};
type State={config:Config;mode:Mode;view:View;selected:number|null;tx:string|null;playing:boolean;speed:number;reduced:boolean;hops:number;isolated:boolean;cameraReset:number;camera:number[]|null;set:(patch:Partial<State>)=>void;configure:(patch:Partial<Config>)=>void};
const selected=params.has('account')?num('account',0,0,4999):null;
const cam=params.get('camera')?.split(',').map(Number);
export const useStore=create<State>((set)=>({config:initial,mode:selected!==null?'Investigate':'Observe',view:view==='2D'||view==='Table'?view:innerWidth<700?'2D':'3D',selected,tx:null,playing:false,speed:1,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,hops:1,isolated:false,cameraReset:0,camera:cam?.length===6&&cam.every(Number.isFinite)?cam:null,set,configure:patch=>set(s=>({config:{...s.config,...patch}}))}));
export function sharedUrl(){const s=useStore.getState();const p=new URLSearchParams();Object.entries(s.config).forEach(([k,v])=>{if(k!=='case_id')p.set(k,String(v))});p.set('view',s.view);p.set('version','signal-synth-1.0');if(s.selected!==null)p.set('account',String(s.selected));if(s.camera)p.set('camera',s.camera.map(x=>x.toFixed(2)).join(','));return `${location.origin}/case/${s.config.case_id}?${p}`}
