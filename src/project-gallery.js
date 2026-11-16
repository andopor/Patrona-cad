const names = new Intl.Collator('es', {sensitivity: 'base', numeric: true});

function searchable(value) {
  return value.toLocaleLowerCase('es').normalize('NFD')
    .replace(/n\u0303/g, 'ñ')
    .replace(/\p{M}/gu, '');
}

export function projectGallery(items, {trash, query, folder, order}) {
  const candidates = items.filter(project => Boolean(project.deletedAt) === trash);
  const folders = [...new Set(candidates.map(project => project.folder).filter(Boolean))].sort(names.compare);
  const selectedFolder = folders.includes(folder) ? folder : '';
  const words = searchable(query).trim().split(/\s+/u).filter(Boolean);
  const filtered = candidates.filter(project => {
    if (selectedFolder && project.folder !== selectedFolder) return false;
    const text = searchable([project.name, project.folder, ...project.tags].join(' '));
    return words.every(word => text.includes(word));
  });
  const byDate = (a, b) => {
    const first = trash ? a.deletedAt : a.updatedAt;
    const second = trash ? b.deletedAt : b.updatedAt;
    return second.localeCompare(first) || a.id.localeCompare(b.id);
  };
  filtered.sort((a, b) => (order === 'name' ? names.compare(a.name, b.name) : 0) || byDate(a, b));
  return {folders, projects: filtered, total: candidates.length};
}
