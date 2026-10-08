import {projectBounds,localBounds,pathData,transform,validation} from './engine.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function svgExport(s){const v=validation(s);if(!v.ok)throw Error(v.errors.join('\n'));const b=projectBounds(s),w=b.maxX-b.minX,h=b.maxY-b.minY;let content='';for(const p of s.pieces.filter(p=>p.visible)){const bb=localBounds(p);content+=`<g transform="translate(${p.x} ${p.y}) rotate(${p.rotation}) scale(${p.mirror?-1:1} 1)"><path d="${pathData(p.outline)}" fill="none" stroke="#111" stroke-width="0.035"/>`;for(const d of p.darts)content+=`<path d="M ${d.a.x} ${d.a.y} L ${d.tip.x} ${d.tip.y} L ${d.b.x} ${d.b.y}${d.bottom?` L ${d.bottom.x} ${d.bottom.y} Z`:''}" fill="none" stroke="#555" stroke-width="0.025" stroke-dasharray="0.3 0.2"/>`;const gx=(bb.minX+bb.maxX)/2;content+=`<path d="M ${gx} ${bb.minY+12} V ${bb.maxY-5}" stroke="#555" stroke-width="0.03"/><text x="${bb.minX}" y="${bb.minY-1}" font-size="0.65">${esc(p.name)} · ${p.copies} pieza(s) · experimental</text></g>`;}
 for(const a of s.annotations){content+=`<path d="M ${a.a.x} ${a.a.y} ${a.type==='curve'?`Q ${a.c.x} ${a.c.y}`:'L'} ${a.b.x} ${a.b.y}" fill="none" stroke="#555" stroke-width="0.03"/>`;if(a.type==='dimension')content+=`<text x="${(a.a.x+a.b.x)/2}" y="${(a.a.y+a.b.y)/2-0.5}" font-size="0.6">${Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y).toFixed(2)} cm</text>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w*10}mm" height="${h*10}mm" viewBox="${b.minX} ${b.minY} ${w} ${h}"><title>${esc(s.name)} — Patrona CAD — experimental, no validado para confección</title><desc>Coordenadas en cm. Exportación dimensional 1:1. Imprimir al 100% sin ajuste.</desc>${content}<rect x="${b.minX+1}" y="${b.maxY-6}" width="5" height="5" fill="none" stroke="#111" stroke-width="0.03"/><text x="${b.minX+7}" y="${b.maxY-3}" font-size="0.6">Control 5 × 5 cm · SIN MARGEN · NO VALIDADO PARA CONFECCIÓN</text></svg>`;
}
const ascii=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\x20-\x7E]/g,' ').replace(/[()\\]/g,'\\$&');
// Minimal vector PDF: paths and Béziers retained; centimetres converted to 72/2.54 points.
export function pdfExport(s,format='a4'){
 const v=validation(s);if(!v.ok)throw Error(v.errors.join('\n'));if(!s.scaleChecked)throw Error('Confirma la revisión dimensional antes de exportar el PDF de prueba.');
 const b=projectBounds(s),k=72/2.54,w=b.maxX-b.minX,h=b.maxY-b.minY;
 const tiled=format==='a4',paperW=tiled?21:w+2,paperH=tiled?29.7:h+3,usableW=paperW-2,usableH=paperH-3,stepX=usableW-1,stepY=usableH-1;
 const cols=tiled?Math.max(1,Math.ceil((w-1)/stepX)):1,rows=tiled?Math.max(1,Math.ceil((h-1)/stepY)):1;if(cols*rows>200)throw Error('El proyecto excede 200 páginas. Reorganiza las piezas.');
 const objects=['','<< /Type /Catalog /Pages 2 0 R >>','','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];const kids=[];
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const ox=b.minX+col*stepX,oy=b.minY+row*stepY;const point=a=>`${((a.x-ox+1)*k).toFixed(4)} ${((paperH-2-(a.y-oy))*k).toFixed(4)}`;
  let c=`0.2 w 0.3 G ${k} ${k} ${usableW*k} ${usableH*k} re S\nq ${k} ${k} ${usableW*k} ${usableH*k} re W n\n0 G 0.7 w\n`;
  for(const p of s.pieces.filter(p=>p.visible)){
   for(const n of p.outline){if(n.type==='C')c+=`${point(transform(p,n.c1))} ${point(transform(p,n.c2))} ${point(transform(p,n))} c\n`;else c+=`${point(transform(p,n))} ${n.type==='M'?'m':'l'}\n`;}c+='h S\n[3 2] 0 d 0.4 w\n';
   for(const d of p.darts)c+=`${point(transform(p,d.a))} m ${point(transform(p,d.tip))} l ${point(transform(p,d.b))} l ${d.bottom?`${point(transform(p,d.bottom))} l h`:''} S\n`;
   c+='[] 0 d 0.7 w\n';const bb=localBounds(p),gx=(bb.minX+bb.maxX)/2;c+=`${point(transform(p,{x:gx,y:bb.minY+12}))} m ${point(transform(p,{x:gx,y:bb.maxY-5}))} l S\n`;const label=transform(p,{x:bb.minX,y:bb.minY-1});c+=`BT /F1 8 Tf ${point(label)} Td (${ascii(p.name)} - x${p.copies}) Tj ET\n`;
  }
  for(const a of s.annotations){c+=`${point(a.a)} m `;if(a.type==='curve'){const c1={x:a.a.x+2/3*(a.c.x-a.a.x),y:a.a.y+2/3*(a.c.y-a.a.y)},c2={x:a.b.x+2/3*(a.c.x-a.b.x),y:a.b.y+2/3*(a.c.y-a.b.y)};c+=`${point(c1)} ${point(c2)} ${point(a.b)} c S\n`;}else c+=`${point(a.b)} l S\n`;if(a.type==='dimension')c+=`BT /F1 8 Tf ${point({x:(a.a.x+a.b.x)/2,y:(a.a.y+a.b.y)/2-.5})} Td (${Math.hypot(a.a.x-a.b.x,a.a.y-a.b.y).toFixed(2)} cm) Tj ET\n`;}
  const sq={x:b.minX+1,y:b.maxY-6};c+=`${point({x:sq.x,y:sq.y+5})} ${5*k} ${5*k} re S\nBT /F1 7 Tf ${point({x:sq.x+6,y:sq.y+3})} Td (Control 5 x 5 cm) Tj ET\nQ\n`;
  c+=`BT /F1 8 Tf ${k} ${(paperH-.8)*k} Td (PATRONA CAD | ${ascii(s.name)} | ${row+1},${col+1} / ${rows}x${cols}) Tj ET\nBT /F1 7 Tf ${k} ${.5*k} Td (PRUEBA - SIN MARGEN - NO VALIDADO PARA CONFECCION | 100%, sin ajustar | Solape 1 cm) Tj ET\n`;
  const pageId=objects.length,streamId=pageId+1;kids.push(`${pageId} 0 R`);objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${paperW*k} ${paperH*k}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${streamId} 0 R >>`,`<< /Length ${c.length} >>\nstream\n${c}endstream`);
 }
 objects[2]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.join(' ')}] >>`;let pdf='%PDF-1.4\n',offsets=[0];for(let i=1;i<objects.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}const start=pdf.length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.slice(1).map(x=>String(x).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return new TextEncoder().encode(pdf);
}
