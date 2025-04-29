import React from 'react';
import { Pencil, Trash2, Power } from 'lucide-react';
import { GrupoCategoria } from '../../types/database';

interface CategoryGroupHeaderProps {
  group: GrupoCategoria | null;
  onEdit?: (group: GrupoCategoria) => void;
  onDelete?: (group: GrupoCategoria) => void;
  onToggleActive?: (group: GrupoCategoria) => void;
}

const CategoryGroupHeader: React.FC<CategoryGroupHeaderProps> = ({
  group,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  if (!group) {
    return (
      <div className="bg-gray-800 rounded-lg px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">
          Sem Grupo
        </h3>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg px-4 py-3 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-medium text-white">{group.nome}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          group.ativo 
            ? 'bg-green-500/20 text-green-300'
            : 'bg-red-500/20 text-red-300'
        }`}>
          {group.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit?.(group)}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Editar grupo"
        >
          <Pencil size={18} />
        </button>
        <button
          onClick={() => onToggleActive?.(group)}
          className={`p-2 rounded-lg transition-colors ${
            group.ativo 
              ? 'text-green-500 hover:text-green-400'
              : 'text-gray-400 hover:text-white'
          } hover:bg-gray-700`}
          title={group.ativo ? 'Desativar' : 'Ativar'}
        >
          <Power size={18} />
        </button>
        <button
          onClick={() => onDelete?.(group)}
          className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
          title="Excluir grupo"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

export default CategoryGroupHeader;