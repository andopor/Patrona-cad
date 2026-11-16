import {generateDesign} from './freesewing';
self.onmessage=async(e:MessageEvent)=>{try{self.postMessage({result:await generateDesign(e.data.id,e.data.values,e.data.options)});}catch(error){self.postMessage({error:error instanceof Error?error.message:'No se pudo generar el diseño.'});}};
