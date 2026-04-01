import React, { useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageTransition } from '@tgt/ui-web';
import { useCRM, CRMStage, CRMItem } from '@portal/hooks/useCRM';
import CRMStageConfigModal from '@portal/components/dashboard/crm/CRMStageConfigModal';
import { 
  LayoutDashboard, 
  Loader2, 
  Plus, 
  GripVertical, 
  Calendar, 
  DollarSign, 
  User as UserIcon,
  Tag,
  Settings2
} from 'lucide-react';

// --- Kanban Card Component ---
interface CardProps {
  item: CRMItem;
  slug: string;
  isOverlay?: boolean;
}

const KanbanCard: React.FC<CardProps> = ({ item, slug, isOverlay }) => {
  const navigate = useNavigate();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.id,
    data: {
      type: 'item',
      item
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing ${isOverlay ? 'shadow-xl border-brand-primary/30 rotate-2' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${item.type === 'order' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              {item.type === 'order' ? 'Pedido' : 'Orçamento'}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">#{item.id.slice(0, 8)}</span>
          </div>
          <h4 className="font-bold text-slate-800 text-sm mb-1 truncate leading-tight">{item.service_title}</h4>
          
          <div className="space-y-1.5 mt-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/dashboard/empresa/${slug}/crm/cliente/${item.customer_id}`);
              }}
              className="flex items-center gap-2 text-slate-500 text-[11px] hover:text-brand-primary transition-colors text-left"
            >
              <UserIcon className="w-3 H-3" />
              <span className="truncate underline decoration-slate-200 underline-offset-2">{item.customer_name}</span>
            </button>
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <DollarSign className="w-3 H-3 text-emerald-500" />
              <span className="font-bold text-slate-700">R$ {item.price?.toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        <div {...attributes} {...listeners} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
          <Calendar className="w-3 h-3" />
          <span>{new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
};

// --- Kanban Column Component ---
interface ColumnProps {
  stage: CRMStage;
  items: CRMItem[];
  slug: string;
}

const KanbanColumn: React.FC<ColumnProps> = ({ stage, items, slug }) => {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: {
      type: 'container',
      stage
    }
  });

  return (
    <div 
      ref={setNodeRef}
      className="flex-shrink-0 w-80 bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col max-h-full"
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: stage.color || '#cbd5e1' }} />
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{stage.name}</h3>
          <span className="text-[11px] font-bold bg-white text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
            {items.length}
          </span>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm text-slate-400 transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 p-3 pt-1 space-y-4 overflow-y-auto custom-scrollbar min-h-[150px]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard key={item.id} item={item} slug={slug} />
          ))}
        </SortableContext>
        
        {items.length === 0 && (
          <div className="h-24 rounded-xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 px-6">
            <Tag className="w-5 h-5 mb-2 opacity-30" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-center opacity-70">Arraste algo aqui</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main Page Component ---
const SalesPipeline: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { 
    stages, 
    items, 
    isLoading, 
    initialize, 
    moveItem,
    addStage,
    deleteStage,
    updateStage,
    reorderStages
  } = useCRM();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter items by stage
  const itemsByStage = useMemo(() => {
    const map: Record<string, CRMItem[]> = {};
    stages?.forEach(s => map[s.id] = []);
    items?.forEach(item => {
      const stageId = item.crm_stage_id || stages?.[0]?.id; // Fallback to first stage if null
      if (stageId && map[stageId]) {
        map[stageId].push(item);
      }
    });
    return map;
  }, [stages, items]);

  const activeItem = useMemo(() => 
    items?.find(i => i.id === activeId), 
  [items, activeId]);

  if (isLoading) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100">
        <Loader2 className="w-10 h-10 text-brand-primary animate-spin mb-4" />
        <p className="text-slate-500 font-medium anim-pulse">Sincronizando seu CRM...</p>
      </div>
    );
  }

  // Handle No Stages Found (Initialization required)
  if (!stages || stages.length === 0) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 p-8 text-center">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <LayoutDashboard className="w-8 h-8 text-brand-primary" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Configure seu CRM</h2>
        <p className="text-slate-500 max-w-sm mb-8">
          Parece que você ainda não tem um funil de vendas configurado. Vamos criar as etapas padrão para você começar.
        </p>
        <button 
          onClick={() => initialize()}
          className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          Inicializar Funil de Vendas
        </button>
      </div>
    );
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Check if dragged onto a different stage
    const overStage = stages.find(s => s.id === overIdStr);
    const overItem = items.find(i => i.id === overIdStr);
    
    // Target stage id logic
    const targetStageId = overStage ? overStage.id : (overItem ? overItem.crm_stage_id : null);

    if (targetStageId && targetStageId !== activeItem?.crm_stage_id) {
      moveItem({ 
        itemId: activeIdStr, 
        type: activeItem?.type || 'order', 
        stageId: targetStageId 
      });
    }
  }

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.4',
        },
      },
    }),
  };

  return (
    <PageTransition>
      <div className="h-[calc(100vh-12rem)] min-h-[600px] flex flex-col space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Funil de Vendas</h1>
            <p className="text-slate-500 text-sm">Acompanhe e mova seus atendimentos entre as etapas clicando e arrastando.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsConfigModalOpen(true)}
              className="text-sm font-bold text-slate-600 px-4 py-2 rounded-lg border border-slate-200 hover:bg-white transition-all shadow-xs flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4 opacity-70" />
              Configurar etapas
            </button>
          </div>
        </div>

        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {stages.map((stage) => (
              <KanbanColumn 
                key={stage.id} 
                stage={stage} 
                items={itemsByStage[stage.id] || []} 
                slug={slug || ''}
              />
            ))}

            <DragOverlay dropAnimation={dropAnimation}>
              {activeId && activeItem ? (
                <KanbanCard item={activeItem} slug={slug || ''} isOverlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <CRMStageConfigModal 
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          stages={stages || []}
          onAdd={(name, color) => addStage({ name, color, order_index: (stages?.length || 0) })}
          onDelete={deleteStage}
          onUpdate={(id, name, color) => updateStage({ id, name, color })}
          onReorder={(reordered) => {
            const updates = reordered.map((s, idx) => ({ id: s.id, order_index: idx }));
            reorderStages(updates);
          }}
        />
      </div>
    </PageTransition>
  );
};

export default SalesPipeline;
