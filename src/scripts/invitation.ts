import {countdown,guestContext} from '../lib/event';
const guest=document.querySelector<HTMLElement>('[data-guest]');
const context=guestContext(location.search);
if(guest && context.name) guest.textContent=context.name+(guest.dataset.suffix || '');
const counter=document.querySelector<HTMLElement>('[data-countdown]');
if(counter){
 const update=()=>{
  const value=countdown(counter.dataset.date || '',Date.now());
  for(const unit of ['days','hours','minutes','seconds'] as const){
   const element=counter.querySelector<HTMLElement>(`[data-unit="${unit}"]`);
   const next=String(value[unit]).padStart(2,'0');
   if(element && element.textContent!==next){element.textContent=next;element.classList.remove('digit-change');requestAnimationFrame(()=>element.classList.add('digit-change'));}
  }
  if(value.status!=='future'){
   const status=counter.querySelector('[data-countdown-status]');
   if(status) status.textContent=counter.dataset[value.status] || '';
  }
 };
 update();setInterval(update,1000);
}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
if('IntersectionObserver' in window){
 const observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting){if(!reduced.matches)entry.target.classList.add('is-revealing');observer.unobserve(entry.target);}
  }
 },{threshold:.12});
 document.querySelectorAll('.reveal').forEach(element=>observer.observe(element));
 const rsvp=document.querySelector('#confirmar');
 if(rsvp)new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('in-view',entry.isIntersecting)),{threshold:0}).observe(rsvp);
}
const dialog=document.querySelector<HTMLDialogElement>('.lightbox');
const photos=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-gallery]'));
let selected=0;let previousFocus:HTMLElement|null=null;
function showPhoto(index:number){
 selected=(index+photos.length)%photos.length;
 const photo=photos[selected];
 const image=dialog?.querySelector<HTMLImageElement>('[data-lightbox-image]');
 if(!image||!photo)return;
 image.src=photo.dataset.src || '';image.alt=photo.dataset.alt || '';
 const caption=dialog?.querySelector('[data-lightbox-caption]');
 if(caption)caption.textContent=photo.dataset.alt || '';
 const count=dialog?.querySelector('[data-photo-count]');
 if(count)count.textContent=`${selected+1} / ${photos.length}`;
}
photos.forEach((photo,index)=>photo.addEventListener('click',()=>{
 if(!dialog)return;
 previousFocus=photo;showPhoto(index);dialog.showModal();dialog.querySelector<HTMLButtonElement>('[data-close]')?.focus();
}));
dialog?.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
dialog?.querySelector('[data-prev]')?.addEventListener('click',()=>showPhoto(selected-1));
dialog?.querySelector('[data-next]')?.addEventListener('click',()=>showPhoto(selected+1));
dialog?.addEventListener('close',()=>previousFocus?.focus({preventScroll:true}));
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
dialog?.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(selected-1);}if(event.key==='ArrowRight'){event.preventDefault();showPhoto(selected+1);}});
