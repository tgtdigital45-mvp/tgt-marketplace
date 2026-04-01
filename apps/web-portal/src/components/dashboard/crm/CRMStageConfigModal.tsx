import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  X, 
  GripVertical, 
  Plus, 
  Trash2, 
  Check,
  LayoutDashboard
} from 'lucide-react';
import { 
  DndContext, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Input } from '@tgt/ui-web';
import { CRMStage } from '@portal/hooks/useCRM';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stages: CRMStage[];
  onAdd: (name: string, color: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, color: string) => void;
  onReorder: (reorderedStages: CRMStage[]) => void;
}

const PREDEFINED_COLORS = [
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

interface SortableItemProps {
  stage: CRMStage;
  onDelete: (id: string) => void;
  onUpdate: (id: string, name: string, color: string) => void;
}

const SortableStageItem: React.FC<SortableItemProps> = ({ stage, onDelete, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm group"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-400 p-1 hover:bg-slate-50 rounded">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div 
        className="w-4 h-4 rounded-full flex-shrink-0" 
        style={{ backgroundColor: stage.color || '#cbd5e1' }} 
      />
      
      <input
        value={stage.name}
        onChange={(e) => onUpdate(stage.id, e.target.value, stage.color || '')}
        className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0"
      />

      <button
        onClick={() => onDelete(stage.id)}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

const CRMStageConfigModal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  stages, 
  onAdd, 
  onDelete, 
  onUpdate,
  onReorder 
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PREDEFINED_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = stages.findIndex((s) => s.id === active.id);
      const newIndex = stages.findIndex((s) => s.id === over?.id);
      onReorder(arrayMove(stages, oldIndex, newIndex));
    }
  };

  const handleAdd = () => {
    if (!newName.trim()) return;
    onAdd(newName, newColor);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                        <Dialog.Title as="h3" className="text-lg font-bold text-slate-900">
                          Configurar Etapas
                        </Dialog.Title>
                        <p className="text-sm text-slate-500">Defina o fluxo do seu funil de vendas.</p>
                      </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCorners}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {stages.map((stage) => (
                            <SortableStageItem 
                              key={stage.id} 
                              stage={stage} 
                              onDelete={onDelete}
                              onUpdate={onUpdate}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    {isAdding ? (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2">
                        <div className="space-y-4">
                          <Input
                            label="Nome da Etapa"
                            placeholder="Ex: Proposta Enviada"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                          />
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cor da Etapa</label>
                            <div className="flex flex-wrap gap-2">
                              {PREDEFINED_COLORS.map(color => (
                                <button
                                  key={color}
                                  onClick={() => setNewColor(color)}
                                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center ${newColor === color ? 'border-brand-primary scale-110' : 'border-transparent'}`}
                                  style={{ backgroundColor: color }}
                                >
                                  {newColor === color && <Check className="w-4 h-4 text-white" />}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Button onClick={handleAdd} className="flex-1 shrink-0">Salvar Etapa</Button>
                            <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancelar</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsAdding(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-brand-primary hover:text-brand-primary transition-all font-bold text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Nova Etapa
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="bg-slate-50 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                  <Button onClick={onClose} className="w-full sm:w-auto">Concluído</Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CRMStageConfigModal;
