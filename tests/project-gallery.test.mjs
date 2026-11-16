import test from 'node:test';
import assert from 'node:assert/strict';
import {projectGallery} from '../src/project-gallery.js';

const item = (id, name, folder, tags, updatedAt, deletedAt = null) =>
  ({id, name, folder, tags, updatedAt, deletedAt});
const projects = [
  item('a', 'Patrón 10', 'Verano', ['algodón'], '2026-03-05'),
  item('b', 'Patrón 2', 'Verano', ['lino'], '2026-03-07'),
  item('c', 'Capa de otoño', 'Abrigos', [], '2026-03-04'),
  item('d', 'Vestido viejo', 'Archivo', ['lino'], '2026-03-08', '2026-03-10'),
];
const filter = (options = {}) => projectGallery(projects, {trash:false, query:'', folder:'', order:'recent', ...options});

test('busca por palabras entre nombre, etiquetas y carpeta sin exigir tildes', () => {
  assert.deepEqual(filter({query:' ALGODON  patron verano '}).projects.map(p=>p.id), ['a']);
  assert.deepEqual(filter({query:'otoño'}).projects.map(p=>p.id), ['c']);
  assert.deepEqual(filter({query:'otono'}).projects, []);
});

test('ordena nombres con números sin modificar el archivo y separa la papelera', () => {
  assert.deepEqual(filter({folder:'Verano',order:'name'}).projects.map(p=>p.id), ['b','a']);
  assert.deepEqual(filter().projects.map(p=>p.id), ['b','a','c']);
  assert.deepEqual(projects.map(p=>p.id), ['a','b','c','d']);
  const trash = filter({trash:true,folder:'Archivo',query:'lino'});
  assert.deepEqual(trash.folders,['Archivo']);
  assert.deepEqual(trash.projects.map(p=>p.id),['d']);
  assert.equal(trash.total,1);
});
