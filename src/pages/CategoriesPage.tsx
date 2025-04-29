import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Categoria, Empresa, GrupoCategoria } from '../types/database';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';
import { ErrorAlert } from '../components/shared/ErrorAlert';
import { EmptyState } from '../components/shared/EmptyState';
import { Button } from '../components/shared/Button';
import CategoryModal from '../components/categories/CategoryModal';
import CategoryFilters from '../components/categories/CategoryFilters';
import CategoryGroupHeader from '../components/categories/CategoryGroupHeader';
import GroupModal from '../components/categories/GroupModal';

const CategoriesPage: React.FC = () => {
  const [selectedType, setSelectedType] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [selectedEmpresa, setSelectedEmpresa] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Categoria | undefined>();
  const [selectedGroup, setSelectedGroup] = useState<GrupoCategoria | undefined>();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const { data: empresas } = useSupabaseQuery<Empresa>({
    query: () => supabase
      .from('empresas')
      .select('id, razao_social')
      .eq('ativa', true)
      .order('razao_social'),
  });

  const { data: grupos, refetch: refetchGrupos } = useSupabaseQuery<GrupoCategoria>({
    query: () => supabase
      .from('grupo_categorias')
      .select('*')
      .order('nome'),
  });

  const { data: categories, loading, error, refetch } = useSupabaseQuery<Categoria>({
    query: () => {
      let query = supabase
        .from('categorias')
        .select(`
          *,
          grupo:grupo_categorias (
            id,
            nome,
            descricao
          )
        `);

      if (selectedType !== 'todos') {
        query = query.eq('tipo', selectedType);
      }

      if (selectedEmpresa) {
        const { data: empresaCategorias } = supabase
          .from('empresa_categorias')
          .select('categoria_id')
          .eq('empresa_id', selectedEmpresa);

        if (empresaCategorias && empresaCategorias.length > 0) {
          const categoriaIds = empresaCategorias.map(ec => ec.categoria_id);
          query = query.in('id', categoriaIds);
        }
      }

      return query.order('codigo');
    },
    dependencies: [selectedType, selectedEmpresa],
  });

  const categoriesByGroup = React.useMemo(() => {
    const groups: { [key: string]: Categoria[] } = {
      'sem-grupo': []
    };

    grupos?.forEach(grupo => {
      groups[grupo.id] = [];
    });

    categories?.forEach(category => {
      if (category.grupo) {
        if (!groups[category.grupo.id]) {
          groups[category.grupo.id] = [];
        }
        groups[category.grupo.id].push(category);
      } else {
        groups['sem-grupo'].push(category);
      }
    });

    return groups;
  }, [categories, grupos]);

  const handleToggleActive = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ ativo: !categoria.ativo })
        .eq('id', categoria.id);

      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Erro ao atualizar categoria:', err);
      alert('Não foi possível atualizar a categoria');
    }
  };

  const handleDelete = async (categoria: Categoria) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', categoria.id);

      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Erro ao excluir categoria:', err);
      alert('Não foi possível excluir a categoria');
    }
  };

  const handleDeleteGroup = async (group: GrupoCategoria) => {
    if (!window.confirm('Tem certeza que deseja excluir este grupo?')) return;

    try {
      const { error } = await supabase
        .from('grupo_categorias')
        .delete()
        .eq('id', group.id);

      if (error) throw error;
      refetchGrupos();
      refetch();
    } catch (err) {
      console.error('Erro ao excluir grupo:', err);
      alert('Não foi possível excluir o grupo');
    }
  };

  const handleToggleGroupActive = async (group: GrupoCategoria) => {
    try {
      const { error } = await supabase
        .from('grupo_categorias')
        .update({ ativo: !group.ativo })
        .eq('id', group.id);

      if (error) throw error;
      refetchGrupos();
    } catch (err) {
      console.error('Erro ao atualizar grupo:', err);
      alert('Não foi possível atualizar o grupo');
    }
  };

  const renderCategoryTable = (categories: Categoria[]) => (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left p-4 text-gray-400">Código</th>
          <th className="text-left p-4 text-gray-400">Nome</th>
          <th className="text-left p-4 text-gray-400">Status</th>
          <th className="text-right p-4 text-gray-400">Ações</th>
        </tr>
      </thead>
      <tbody>
        {categories.map((categoria) => (
          <tr key={categoria.id} className="border-b border-gray-700">
            <td className="p-4 text-white font-mono">{categoria.codigo}</td>
            <td className="p-4 text-white">{categoria.nome}</td>
            <td className="p-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                categoria.ativo 
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {categoria.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </td>
            <td className="p-4">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedCategory(categoria);
                    setIsCategoryModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => handleToggleActive(categoria)}
                  className={`p-2 rounded-lg ${
                    categoria.ativo 
                      ? 'text-green-500 hover:text-green-400'
                      : 'text-gray-400 hover:text-white'
                  } hover:bg-gray-700`}
                  title={categoria.ativo ? 'Desativar' : 'Ativar'}
                >
                  <Power size={18} />
                </button>
                <button
                  onClick={() => handleDelete(categoria)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-white">Categorias</h2>
          <p className="text-gray-400 mt-1">Gerencie as categorias de receitas e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setSelectedCategory(undefined);
              setIsCategoryModalOpen(true);
            }}
            icon={Plus}
          >
            Nova Categoria
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedGroup(undefined);
              setIsGroupModalOpen(true);
            }}
            icon={Plus}
          >
            Novo Grupo
          </Button>
        </div>
      </div>

      <CategoryFilters
        selectedType={selectedType}
        selectedEmpresa={selectedEmpresa}
        empresas={empresas}
        onTypeChange={setSelectedType}
        onEmpresaChange={setSelectedEmpresa}
      />

      {categories.length === 0 ? (
        <div className="bg-black rounded-xl p-6">
          <EmptyState message={`Nenhuma categoria ${selectedType !== 'todos' ? `de ${selectedType}` : ''} encontrada.`} />
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(categoriesByGroup).map(([groupId, cats]) => {
            if (cats.length === 0) return null;
            
            const group = groupId === 'sem-grupo' ? null : grupos?.find(g => g.id === groupId);
            
            return (
              <div key={groupId}>
                <CategoryGroupHeader
                  group={group}
                  onEdit={group ? (group) => {
                    setSelectedGroup(group);
                    setIsGroupModalOpen(true);
                  } : undefined}
                  onDelete={group ? () => handleDeleteGroup(group) : undefined}
                  onToggleActive={group ? () => handleToggleGroupActive(group) : undefined}
                />
                <div className="mt-2">
                  {renderCategoryTable(cats)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isCategoryModalOpen && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => {
            setSelectedCategory(undefined);
            setIsCategoryModalOpen(false);
          }}
          onSave={refetch}
        />
      )}

      {isGroupModalOpen && (
        <GroupModal
          group={selectedGroup}
          onClose={() => {
            setSelectedGroup(undefined);
            setIsGroupModalOpen(false);
          }}
          onSave={() => {
            refetchGrupos();
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default CategoriesPage;