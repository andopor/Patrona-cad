export type DesignCategory='Faldas'|'Tops y camisas'|'Vestidos'|'Pantalones'|'Abrigos y chaquetas'|'Interior y baño'|'Accesorios';
export type Design={id:string;name:string;category:DesignCategory;description:string;fabric:string;difficulty:'Inicial'|'Intermedia'|'Avanzada';silhouette:string;integrated:boolean;source:string;showcase:string;author:string};
const rows:[string,string,DesignCategory,string,string,Design['difficulty'],string][]=[
 ['sandy','Sandy · falda circular','Faldas','Vuelo circular con cinturilla y opciones de amplitud.','Tejido plano con caída','Inicial','circle-skirt'],
 ['penelope','Penelope · falda lápiz','Faldas','Silueta recta ajustada para desarrollar conjuntos.','Tejido plano','Intermedia','pencil-skirt'],
 ['sunny','Sunny · falda abierta','Faldas','Falda con apertura lateral y movimiento.','Tejido ligero','Intermedia','wrap-skirt'],
 ['teagan','Teagan · camiseta','Tops y camisas','Camiseta con delantero, espalda y manga parametrizados.','Punto elástico','Inicial','tshirt'],
 ['simon','Simon · camisa','Tops y camisas','Camisa abotonada con cuello y piezas de confección.','Popelín o tejido de camisería','Avanzada','shirt'],
 ['simone','Simone · camisa entallada','Tops y camisas','Camisa para explorar una silueta más entallada.','Tejido de camisería','Avanzada','shirt'],
 ['hugo','Hugo · sudadera con capucha','Tops y camisas','Sudadera con capucha para una colección informal.','Felpa de punto','Intermedia','hoodie'],
 ['sven','Sven · sudadera','Tops y camisas','Sudadera de cuello redondo para diseños cotidianos.','Felpa de punto','Inicial','sweatshirt'],
 ['tamiko','Tamiko · top','Tops y camisas','Top de enfoque zero-waste para explorar el aprovechamiento.','Tejido ligero','Intermedia','top'],
 ['sophie','Sophie · vestido de tirantes','Vestidos','Vestido de tirantes con silueta fluida.','Tejido con caída','Intermedia','slipdress'],
 ['sasha','Sasha · vestido skater','Vestidos','Vestido con falda de vuelo y cintura marcada.','Consultar opciones de la fuente','Intermedia','dress'],
 ['paco','Paco · pantalón de verano','Pantalones','Pantalón informal con cinturilla y opciones de bolsillos.','Tejido ligero','Intermedia','pants'],
 ['charlie','Charlie · pantalón chino','Pantalones','Pantalón chino con detalles de sastrería.','Sarga o tejido de pantalón','Avanzada','pants'],
 ['ashley','Ashley · short evasé','Pantalones','Pantalón corto con amplitud en el bajo.','Tejido plano','Intermedia','shorts'],
 ['waralee','Waralee · pantalón envolvente','Pantalones','Pantalón cruzado con posibilidades de anudado.','Tejido con caída','Intermedia','wrap-pants'],
 ['jaeger','Jaeger · chaqueta','Abrigos y chaquetas','Chaqueta para explorar conjuntos de sastrería.','Tejido de chaqueta','Avanzada','jacket'],
 ['devon','Devon · chaqueta denim','Abrigos y chaquetas','Chaqueta de estética vaquera con detalles de construcción.','Denim','Avanzada','denim'],
 ['carlita','Carlita · abrigo','Abrigos y chaquetas','Abrigo como referencia de prendas exteriores estructuradas.','Tejido de abrigo','Avanzada','coat'],
 ['sabrina','Sabrina · top deportivo','Interior y baño','Top deportivo para explorar prendas ajustadas.','Punto deportivo elástico','Intermedia','sportstop'],
 ['bee','Bee · bikini','Interior y baño','Parte superior de bikini con ajustes específicos.','Tejido de baño elástico','Intermedia','bikini'],
 ['albert','Albert · delantal','Accesorios','Delantal con cuerpo, bolsillo y tira independientes.','Lona o tejido resistente','Inicial','apron'],
 ['benjamin','Benjamin · pajarita','Accesorios','Pajarita con variantes de forma y banda.','Tejido plano y entretela','Inicial','bowtie'],
 ['bob','Bob · babero','Accesorios','Babero con tamaño adaptable al contorno de cabeza.','Algodón o tejido absorbente','Inicial','bib'],
 ['hortensia','Hortensia · bolso','Accesorios','Bolso como referencia de accesorios confeccionados.','Tejido resistente','Intermedia','bag'],
];
export const integratedIds=['sandy','albert','benjamin','bob','teagan','paco','penelope','sven','hugo','simon','simone','sophie','sasha','hortensia'] as const;
export const catalog:Design[]=rows.map(([id,name,category,description,fabric,difficulty,silhouette])=>({id,name,category,description,fabric,difficulty,silhouette,integrated:(integratedIds as readonly string[]).includes(id),source:`https://freesewing.eu/designs/${id}/`,showcase:['ashley','sasha','sunny'].includes(id)?'https://freesewing.eu/showcase/':`https://freesewing.eu/showcase/tags/${id}/`,author:id==='sandy'?'Erica Alcusa Sáez · Joost De Cock':id==='penelope'||id==='albert'||id==='benjamin'?'Wouter Van Wageningen':id==='sasha'?'Anna Puk':id==='sophie'?'JenBarb_':id==='hortensia'?'Stoffsuchti · Wouter Van Wageningen':id==='bob'||id==='teagan'||id==='paco'||id==='sven'||id==='hugo'||id==='simon'||id==='simone'?'Joost De Cock':'FreeSewing · autoría en la ficha original'}));
export const categories=[...new Set(catalog.map(d=>d.category))];
