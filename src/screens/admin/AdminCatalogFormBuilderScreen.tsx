import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import {
  CategoryNode,
  AttributeDefinition,
  CategoryAttributeMapping,
  CategoryTemplate,
  AttributeType,
  AttributeOption,
  ConditionalOperator,
} from '../../types/dynamicCatalog';
import {
  getCategoryHierarchy,
  getAllAttributes,
  getCategoryAttributeMappings,
  getCategoryTemplates,
  getCategoryFormSchema,
  saveCategoryNode,
  deleteCategoryNode,
  saveAttribute,
  deleteAttribute,
  mapAttributeToCategory,
  unmapAttributeFromCategory,
  toggleCategoryAttributeRequired,
  toggleCategoryAttributeVariant,
  saveCategoryTemplate,
  applyTemplateToCategory,
  syncFromFirestore,
  subscribeToCatalogSettings,
  pushAllSettingsToFirestore,
  exportCatalogSchemaJSON,
  importCatalogSchemaJSON,
  createDeletionRequest,
  reorderCategoryAttributeMapping,
} from '../../services/dynamicCatalogService';
import { useAuth } from '../../context/AuthContext';
import { DynamicFormEngine } from '../../components/catalog/DynamicFormEngine';
import {
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  X,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react-native';

export const AdminCatalogFormBuilderScreen: React.FC = () => {
  const { activeRole, user } = useAuth();
  const adminInfo = user ? { uid: user.uid, email: user.email || '' } : undefined;
  const [activeTab, setActiveTab] = useState<'categories' | 'attributes' | 'mapper' | 'templates' | 'preview'>('attributes');

  // Categories Tree State
  const [categories, setCategories] = useState<CategoryNode[]>(getCategoryHierarchy());
  const [selectedCatId, setSelectedCatId] = useState<string>('cat-men-tshirts');
  const [newCatName, setNewCatName] = useState<string>('');

  useEffect(() => {
    syncFromFirestore().then(() => {
      setCategories([...getCategoryHierarchy()]);
    });
    const unsub = subscribeToCatalogSettings(() => {
      setCategories([...getCategoryHierarchy()]);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Category Edit / Add Modal State
  const [showCatModal, setShowCatModal] = useState<boolean>(false);
  const [editingCategoryNode, setEditingCategoryNode] = useState<{
    id?: string;
    name: string;
    parentId?: string | null;
    level?: number;
    mode: 'edit' | 'add_child' | 'add_root';
  }>({ name: '', mode: 'add_root' });

  // Attributes State
  const [attributes, setAttributes] = useState<AttributeDefinition[]>(getAllAttributes());
  const [showAttrModal, setShowAttrModal] = useState<boolean>(false);
  const [editingAttr, setEditingAttr] = useState<Partial<AttributeDefinition>>({});
  const [newOptLabel, setNewOptLabel] = useState<string>('');
  const [newOptValue, setNewOptValue] = useState<string>('');
  const [globalAttrSearchQuery, setGlobalAttrSearchQuery] = useState<string>('');

  // Schema JSON Export/Import Modal State
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonInput, setJsonInput] = useState<string>('');

  // Mapped Categories Modal State
  const [showMappedCategoriesModal, setShowMappedCategoriesModal] = useState<boolean>(false);
  const [mappedFilterAdmin, setMappedFilterAdmin] = useState<string>('');
  const [mappedFilterCategory, setMappedFilterCategory] = useState<string>('');
  const [mappedFilterDate, setMappedFilterDate] = useState<string>('');

  // Mapper State
  const [mappings, setMappings] = useState<CategoryAttributeMapping[]>(getCategoryAttributeMappings(selectedCatId));
  const [selectedAttrToMap, setSelectedAttrToMap] = useState<string>('');
  const [mapIsRequired, setMapIsRequired] = useState<boolean>(true);
  const [mapIsVariant, setMapIsVariant] = useState<boolean>(false);
  const [catSearchQuery, setCatSearchQuery] = useState<string>('');
  const [attrSearchQuery, setAttrSearchQuery] = useState<string>('');
  const [copiedFields, setCopiedFields] = useState<{ attributeId: string, isRequired: boolean, isVariant: boolean }[]>([]);

  // Templates State
  const [templates, setTemplates] = useState<CategoryTemplate[]>(getCategoryTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Form Preview Live State
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({});

  // Memoized L4 Categories for the Mapper
  const l4Categories = useMemo(() => {
    const l4Nodes: { id: string; label: string }[] = [];
    const traverse = (node: CategoryNode, path: string[]) => {
      // Consider a node as L4 if it's level 4 or it's a leaf node that is at least level 3
      if (node.level === 4 || (node.level >= 3 && (!node.children || node.children.length === 0))) {
        l4Nodes.push({ id: node.id, label: [...path, node.name].join(' > ') });
      }
      if (node.children) {
        node.children.forEach(child => traverse(child, [...path, node.name]));
      }
    };
    categories.forEach(root => traverse(root, []));
    return l4Nodes;
  }, [categories]);

  // Memoized Mapped Categories Count
  const mappedCategoriesCount = useMemo(() => {
    return l4Categories.filter(cat => getCategoryAttributeMappings(cat.id).length > 0).length;
  }, [l4Categories, mappings]);

  useEffect(() => {
    const refreshData = async () => {
      await syncFromFirestore();
      setCategories([...getCategoryHierarchy()]);
      setAttributes([...getAllAttributes()]);
      setTemplates([...getCategoryTemplates()]);
      setMappings([...getCategoryAttributeMappings(selectedCatId)]);
    };
    refreshData();

    // Real-Time Multi-Admin Live Collaboration Subscription
    const unsubscribe = subscribeToCatalogSettings(() => {
      setCategories([...getCategoryHierarchy()]);
      setAttributes([...getAllAttributes()]);
      setMappings([...getCategoryAttributeMappings(selectedCatId)]);
    });

    return () => unsubscribe();
  }, [activeTab, selectedCatId]);

  // Handlers for Category Tree Editing
  const handleOpenAddRootCat = () => {
    setEditingCategoryNode({
      name: '',
      parentId: null,
      level: 1,
      mode: 'add_root',
    });
    setShowCatModal(true);
  };

  const handleOpenAddChildCat = (parent: CategoryNode) => {
    setEditingCategoryNode({
      name: '',
      parentId: parent.id,
      level: (parent.level || 1) + 1,
      mode: 'add_child',
    });
    setShowCatModal(true);
  };

  const handleOpenEditCat = (node: CategoryNode) => {
    setEditingCategoryNode({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      level: node.level,
      mode: 'edit',
    });
    setShowCatModal(true);
  };

  const handleSaveCategoryModal = () => {
    if (!editingCategoryNode.name.trim()) {
      alert('Category Name is required!');
      return;
    }

    if (editingCategoryNode.mode === 'edit' && editingCategoryNode.id) {
      saveCategoryNode({
        id: editingCategoryNode.id,
        name: editingCategoryNode.name.trim(),
        parentId: editingCategoryNode.parentId,
        level: editingCategoryNode.level,
      });
      alert('Category renamed & saved successfully!');
    } else {
      saveCategoryNode({
        name: editingCategoryNode.name.trim(),
        parentId: editingCategoryNode.parentId || null,
        level: editingCategoryNode.level || 1,
      });
      alert('New Subcategory added successfully!');
    }

    setCategories([...getCategoryHierarchy()]);
    setShowCatModal(false);
  };

  const handleDeleteCat = (catId: string) => {
    if (activeRole !== 'super_admin') {
      alert('Only Super Admins can delete categories.');
      return;
    }
    deleteCategoryNode(catId);
    setCategories([...getCategoryHierarchy()]);
  };

  // Handlers for Attribute Creation & Editing
  const handleSaveAttributeForm = async () => {
    if (!editingAttr.label || !editingAttr.code) {
      alert('Attribute Label and Code Key are required!');
      return;
    }

    const saved = await saveAttribute(editingAttr, adminInfo);

    if (selectedCatId && activeTab === 'mapper') {
      mapAttributeToCategory(selectedCatId, saved.id, editingAttr.isRequired ?? true, editingAttr.isVariantAttribute ?? false, adminInfo);
    }

    setAttributes([...getAllAttributes()]);
    setShowAttrModal(false);
    setEditingAttr({});
    setNewOptLabel('');
    setNewOptValue('');
    alert('Dynamic Field saved & synced successfully across team devices!');
  };

  const handleDeleteAttr = async (attrId: string) => {
    if (activeRole === 'super_admin') {
      await deleteAttribute(attrId);
      setAttributes([...getAllAttributes()]);
    } else {
      const attr = attributes.find(a => a.id === attrId);
      if (attr) {
        createDeletionRequest('global_attribute', attrId, attr.label, user?.name || 'Admin');
        alert('Deletion request submitted to Super Admin for approval.');
      }
    }
  };

  // Handlers for Attribute Options
  const handleAddOption = () => {
    if (!newOptLabel.trim()) return;
    
    const currentOptions: AttributeOption[] = editingAttr.options || [];
    
    // Prevent duplicate options (case-insensitive check)
    const isDuplicate = currentOptions.some(opt => opt.label.toLowerCase() === newOptLabel.trim().toLowerCase());
    if (isDuplicate) {
      alert('This option already exists!');
      return;
    }

    const val = newOptValue.trim() || newOptLabel.trim();
    const newOptions = [...currentOptions, { label: newOptLabel.trim(), value: val }];
    newOptions.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));

    setEditingAttr((prev) => ({
      ...prev,
      options: newOptions,
    }));

    setNewOptLabel('');
    setNewOptValue('');
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = [...(editingAttr.options || [])];
    currentOptions.splice(index, 1);
    setEditingAttr((prev) => ({ ...prev, options: currentOptions }));
  };

  // Handlers for Category Mapping & Required Toggle
  const handleAddMapping = () => {
    if (!selectedAttrToMap) return;

    const isAlreadyMapped = mappings.some(m => m.attributeId === selectedAttrToMap);
    if (isAlreadyMapped) {
      alert('This field is already mapped to the selected category!');
      return;
    }

    mapAttributeToCategory(selectedCatId, selectedAttrToMap, mapIsRequired, mapIsVariant, adminInfo);
    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
    setSelectedAttrToMap('');
  };

  const handleToggleRequired = (attrId: string) => {
    toggleCategoryAttributeRequired(selectedCatId, attrId, adminInfo);
    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
  };

  const handleToggleVariantMapping = (attrId: string) => {
    toggleCategoryAttributeVariant(selectedCatId, attrId, adminInfo);
    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
  };

  const handleRemoveMapping = (attrId: string) => {
    if (activeRole === 'super_admin') {
      unmapAttributeFromCategory(selectedCatId, attrId);
      setMappings([...getCategoryAttributeMappings(selectedCatId)]);
    } else {
      const attr = attributes.find(a => a.id === attrId);
      const cat = categories.find(c => c.id === selectedCatId); // May not find leaf in flat, let's use selectedCatId
      if (attr) {
        createDeletionRequest('category_mapping', attrId, attr.label, user?.name || 'Admin', selectedCatId, schema.categoryName);
        alert('Deletion request submitted to Super Admin for approval.');
      }
    }
  };

  const handleReorderMapping = (attributeId: string, direction: 'up' | 'down') => {
    reorderCategoryAttributeMapping(selectedCatId, attributeId, direction);
    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
  };

  const handleCopyFields = () => {
    const currentMappings = getCategoryAttributeMappings(selectedCatId);
    if (currentMappings.length === 0) {
      alert('No fields to copy in this category!');
      return;
    }
    setCopiedFields(currentMappings.map(m => ({
      attributeId: m.attributeId,
      isRequired: m.isRequired,
      isVariant: m.isVariantAttribute || false,
    })));
    alert('Fields copied! You can now paste them into another category.');
  };

  const handlePasteFields = () => {
    if (copiedFields.length === 0) {
      alert('No fields copied! Please copy from another category first.');
      return;
    }
    copiedFields.forEach(f => {
      mapAttributeToCategory(selectedCatId, f.attributeId, f.isRequired, f.isVariant, adminInfo);
    });
    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
    alert('Fields pasted successfully!');
  };

  // Handlers for Templates
  const handleApplyTemplate = () => {
    if (!selectedTemplateId || !selectedCatId) return;
    applyTemplateToCategory(selectedCatId, selectedTemplateId);
    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
    alert('Category Template applied successfully!');
  };

  const filteredL4Categories = useMemo(() => {
    if (!catSearchQuery.trim()) return l4Categories;
    return l4Categories.filter((item) =>
      item.label.toLowerCase().includes(catSearchQuery.toLowerCase())
    );
  }, [l4Categories, catSearchQuery]);

  const filteredAttributes = useMemo(() => {
    if (!attrSearchQuery.trim()) return attributes;
    return attributes.filter((attr) =>
      attr.label.toLowerCase().includes(attrSearchQuery.toLowerCase()) || 
      attr.code.toLowerCase().includes(attrSearchQuery.toLowerCase())
    );
  }, [attributes, attrSearchQuery]);

  const filteredGlobalAttributes = useMemo(() => {
    if (!globalAttrSearchQuery.trim()) return attributes;
    return attributes.filter((attr) =>
      attr.label.toLowerCase().includes(globalAttrSearchQuery.toLowerCase()) || 
      attr.code.toLowerCase().includes(globalAttrSearchQuery.toLowerCase())
    );
  }, [attributes, globalAttrSearchQuery]);

  const schema = getCategoryFormSchema(selectedCatId);

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Category Form Builder & Team Engine</Text>
          <Text style={styles.headerSub}>
            Real-time multi-admin dynamic attributes repository, category tree manager, and schema engine.
          </Text>
        </View>
      </View>

      {/* Team Collaboration & Cloud Sync Bar */}
      <View style={styles.syncBar}>
        <View style={styles.syncBarLeft}>
          <Text style={styles.syncBarTitle}>⚡ Team Sync & Cloud Repository</Text>
          <Text style={styles.syncBarSub}>
            Active Attributes: {attributes.length} fields | Categories: {categories.length} nodes
          </Text>
        </View>

        <View style={styles.syncBarActions}>
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={async () => {
              const res = await syncFromFirestore();
              setCategories([...getCategoryHierarchy()]);
              setAttributes([...getAllAttributes()]);
              setMappings([...getCategoryAttributeMappings(selectedCatId)]);
              alert(`Synced with Cloud! Loaded ${res.attrCount} attributes from team repository.`);
            }}
          >
            <Text style={styles.syncBtnText}>🔄 Pull Team Attributes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.syncBtnPrimary}
            onPress={async () => {
              const ok = await pushAllSettingsToFirestore();
              if (ok) alert('Successfully published & pushed all attributes & category mappings to Cloud Firestore for team!');
              else alert('Pushed to local storage. Check network for Firestore cloud push.');
            }}
          >
            <Text style={styles.syncBtnPrimaryText}>☁️ Push Attributes & Mappings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.syncBtnOutline}
            onPress={() => {
              setJsonInput(exportCatalogSchemaJSON());
              setShowJsonModal(true);
            }}
          >
            <Text style={styles.syncBtnOutlineText}>📋 Export/Import JSON</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'attributes' && styles.tabItemActive]}
          onPress={() => setActiveTab('attributes')}
        >
          <ShoppingBag size={16} color={activeTab === 'attributes' ? '#4338CA' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'attributes' && styles.tabLabelActive]}>
            Global Attributes Repository ({attributes.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'mapper' && styles.tabItemActive]}
          onPress={() => setActiveTab('mapper')}
        >
          <Sparkles size={16} color={activeTab === 'mapper' ? '#4338CA' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'mapper' && styles.tabLabelActive]}>
            Category Field Mapper ({schema.fields.length} Fields)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'categories' && styles.tabItemActive]}
          onPress={() => setActiveTab('categories')}
        >
          <Sparkles size={16} color={activeTab === 'categories' ? '#4338CA' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'categories' && styles.tabLabelActive]}>
            Category Tree Editor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'templates' && styles.tabItemActive]}
          onPress={() => setActiveTab('templates')}
        >
          <ShoppingBag size={16} color={activeTab === 'templates' ? '#4338CA' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'templates' && styles.tabLabelActive]}>
            Category Templates
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'preview' && styles.tabItemActive]}
          onPress={() => setActiveTab('preview')}
        >
          <Sparkles size={16} color={activeTab === 'preview' ? '#4338CA' : '#64748B'} />
          <Text style={[styles.tabLabel, activeTab === 'preview' && styles.tabLabelActive]}>
            Live Form Previewer
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent}>
        {/* ==================================================== */}
        {/* TAB 1: GLOBAL ATTRIBUTES REPOSITORY */}
        {/* ==================================================== */}
        {activeTab === 'attributes' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Global Dynamic Attribute Repository</Text>
                <Text style={styles.cardDesc}>
                  Manage generic attributes reusable across categories. Click "Pull Team Attributes" to fetch attributes created by junior developers.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, minWidth: 200, maxWidth: 300, marginHorizontal: 10 }}>
                <Search size={16} color="#94A3B8" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, color: '#334155' }}
                  placeholder="Search Global Attributes..."
                  placeholderTextColor="#94A3B8"
                  value={globalAttrSearchQuery}
                  onChangeText={setGlobalAttrSearchQuery}
                />
                {globalAttrSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setGlobalAttrSearchQuery('')}>
                    <X size={14} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={styles.syncBtn}
                  onPress={async () => {
                    const res = await syncFromFirestore();
                    setAttributes([...getAllAttributes()]);
                    alert(`Refreshed! Total Attributes: ${res.attrCount}`);
                  }}
                >
                  <Text style={styles.syncBtnText}>🔄 Refresh List</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    setEditingAttr({
                      code: '',
                      label: '',
                      name: '',
                      type: 'select',
                      isRequired: false,
                      isActive: true,
                      isFilterable: true,
                      options: [],
                    });
                    setShowAttrModal(true);
                  }}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Create New Attribute</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.tableGrid}>
              <View style={styles.gridHeader}>
                <Text style={[styles.gridTh, { flex: 1.5 }]}>Attribute Label</Text>
                <Text style={[styles.gridTh, { flex: 1 }]}>Code Key</Text>
                <Text style={[styles.gridTh, { flex: 1 }]}>Type</Text>
                <Text style={[styles.gridTh, { flex: 1 }]}>Actions</Text>
              </View>

              {filteredGlobalAttributes.length > 0 ? (
                filteredGlobalAttributes.map((attr) => (
                  <View key={attr.id} style={styles.gridRow}>
                    <Text style={[styles.gridTdBold, { flex: 1.5 }]}>{attr.label}</Text>
                    <Text style={[styles.gridTdCode, { flex: 1 }]}>{attr.code}</Text>
                    <View style={{ flex: 1 }}>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{attr.type}</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        style={styles.editFieldBtn}
                        onPress={() => {
                          const sortedAttr = { ...attr };
                          if (sortedAttr.options) {
                            sortedAttr.options = [...sortedAttr.options].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
                          }
                          setEditingAttr(sortedAttr);
                          setShowAttrModal(true);
                        }}
                      >
                        <Sparkles size={15} color="#4338CA" />
                        <Text style={styles.editFieldBtnText}>Edit</Text>
                      </TouchableOpacity>
                      {activeRole === 'super_admin' && (
                        <TouchableOpacity onPress={() => handleDeleteAttr(attr.id)}>
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: '#64748B', fontStyle: 'italic' }}>No attributes found.</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 2: CATEGORY FIELD MAPPER & EDITOR */}
        {/* ==================================================== */}
        {activeTab === 'mapper' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Category Form Schema Mapper & Field Editor</Text>
                <Text style={styles.cardDesc}>
                  Select a category to view, edit labels, add options, delete fields, or toggle required rules.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  setEditingAttr({
                    code: '',
                    label: '',
                    name: '',
                    type: 'select',
                    isRequired: true,
                    isActive: true,
                    options: [],
                  });
                  setShowAttrModal(true);
                }}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>+ Create & Map New Field</Text>
              </TouchableOpacity>
            </View>

            {/* Category Selector Bar */}
            <View style={styles.selectorBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.selectorBarLabel}>Select Target Category:</Text>
                  <TouchableOpacity 
                    style={{ backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#C7D2FE' }}
                    onPress={() => setShowMappedCategoriesModal(true)}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#4338CA' }}>
                      {mappedCategoriesCount} / {l4Categories.length} Mapped
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, minWidth: 200, maxWidth: 300 }}>
                  <Search size={16} color="#94A3B8" />
                  <TextInput
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, color: '#334155' }}
                    placeholder="Search L4 categories..."
                    placeholderTextColor="#94A3B8"
                    value={catSearchQuery}
                    onChangeText={setCatSearchQuery}
                  />
                  {catSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setCatSearchQuery('')}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginVertical: 6, paddingBottom: 8 }}>
                {filteredL4Categories.length > 0 ? (
                  filteredL4Categories.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.catChip, selectedCatId === item.id && styles.catChipActive]}
                    onPress={() => setSelectedCatId(item.id)}
                  >
                    <Text style={[styles.catChipText, selectedCatId === item.id && styles.catChipTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))) : (
                  <Text style={{ color: '#64748B', fontStyle: 'italic', paddingVertical: 8 }}>
                    No L4 Categories found. Please add them first.
                  </Text>
                )}
              </ScrollView>
            </View>

            {/* Assign Attribute to Selected Category */}
            <View style={styles.assignCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                <Text style={styles.assignTitle}>Assign Global Field to {schema.categoryName}</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, minWidth: 200, maxWidth: 300 }}>
                  <Search size={16} color="#94A3B8" />
                  <TextInput
                    style={{ flex: 1, paddingVertical: 8, paddingHorizontal: 10, fontSize: 13, color: '#334155' }}
                    placeholder="Search Global Fields..."
                    placeholderTextColor="#94A3B8"
                    value={attrSearchQuery}
                    onChangeText={setAttrSearchQuery}
                  />
                  {attrSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setAttrSearchQuery('')}>
                      <X size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.assignRow}>
                <View style={{ flex: 2 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ paddingBottom: 8 }}>
                    {filteredAttributes.length > 0 ? (
                      filteredAttributes.map((a) => (
                        <TouchableOpacity
                          key={a.id}
                          style={[
                            styles.miniChip,
                            selectedAttrToMap === a.id && styles.miniChipActive,
                          ]}
                          onPress={() => setSelectedAttrToMap(a.id)}
                        >
                          <Text style={[
                            styles.miniChipText,
                            selectedAttrToMap === a.id && { color: '#4338CA', fontWeight: '800' }
                          ]}>
                            {a.label}
                            {selectedAttrToMap === a.id && (
                              <Text style={{ color: 'red' }}> {`(${a.code})`}</Text>
                            )}
                          </Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={{ color: '#64748B', fontStyle: 'italic', paddingVertical: 8 }}>
                        No attributes found.
                      </Text>
                    )}
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={[styles.toggleBtn, mapIsRequired && styles.toggleBtnActive]}
                  onPress={() => setMapIsRequired(!mapIsRequired)}
                >
                  <Text style={[styles.toggleText, mapIsRequired && styles.toggleTextActive]}>
                    {mapIsRequired ? 'Required' : 'Optional'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleAddMapping}>
                  <Plus size={14} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Map Field</Text>
                </TouchableOpacity>
              </View>

              {selectedAttrToMap && (() => {
                const selectedAttr = attributes.find(a => a.id === selectedAttrToMap);
                if (!selectedAttr) return null;
                return (
                  <View style={{ marginTop: 12, padding: 12, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#C7D2FE' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155' }}>
                        Field Details: {selectedAttr.label}
                      </Text>
                      <View style={styles.typeBadge}>
                        <Text style={styles.typeBadgeText}>{selectedAttr.type}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#475569', marginBottom: 4 }}>
                      <Text style={{ fontWeight: '600' }}>Code Key:</Text> {selectedAttr.code}
                    </Text>
                    {selectedAttr.options && selectedAttr.options.length > 0 && (
                      <Text style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                        <Text style={{ fontWeight: '600' }}>Options ({selectedAttr.options.length}):</Text> {selectedAttr.options.map(o => o.label).join(', ')}
                      </Text>
                    )}
                    {selectedAttr.placeholder ? (
                      <Text style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
                        <Text style={{ fontWeight: '600' }}>Placeholder:</Text> {selectedAttr.placeholder}
                      </Text>
                    ) : null}
                  </View>
                );
              })()}
            </View>

            {/* Active Mapped Attributes List */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }}>
              <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0 }]}>
                Dynamic Fields in {schema.categoryName} ({schema.fields.length} Fields)
              </Text>
              
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.syncBtnOutline} onPress={handleCopyFields}>
                  <Text style={styles.syncBtnOutlineText}>📋 Copy Fields</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.syncBtn, copiedFields.length === 0 && { opacity: 0.5 }]} 
                  onPress={handlePasteFields}
                  disabled={copiedFields.length === 0}
                >
                  <Text style={styles.syncBtnText}>📝 Paste Fields</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.mappedList}>
              {schema.fields.map((f, idx) => (
                <View key={f.attribute.id} style={styles.mappedItem}>
                  <View style={styles.mappedLeft}>
                    <View style={{ alignItems: 'center', marginRight: 8, gap: 4 }}>
                      <TouchableOpacity 
                        onPress={() => handleReorderMapping(f.attribute.id, 'up')}
                        disabled={idx === 0}
                        style={{ opacity: idx === 0 ? 0.3 : 1 }}
                      >
                        <ArrowUp size={16} color="#64748B" />
                      </TouchableOpacity>
                      <Text style={[styles.mappedIndex, { marginRight: 0 }]}>{idx + 1}.</Text>
                      <TouchableOpacity 
                        onPress={() => handleReorderMapping(f.attribute.id, 'down')}
                        disabled={idx === schema.fields.length - 1}
                        style={{ opacity: idx === schema.fields.length - 1 ? 0.3 : 1 }}
                      >
                        <ArrowDown size={16} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={styles.mappedLabel}>{f.attribute.label}</Text>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{f.attribute.type}</Text>
                        </View>
                      </View>

                      <Text style={styles.mappedSub}>
                        Code Key: <Text style={{ fontWeight: '700' }}>{f.attribute.code}</Text>
                        {f.attribute.options && f.attribute.options.length > 0 && (
                          <Text style={{ color: '#4338CA', fontWeight: '600' }}>
                            {' '}• {f.attribute.options.length} Dropdown Choices
                          </Text>
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.mappedRight}>
                    <TouchableOpacity
                      style={f.isRequired ? styles.badgeRequired : styles.badgeOptional}
                      onPress={() => handleToggleRequired(f.attribute.id)}
                    >
                      <Text style={f.isRequired ? styles.badgeRequiredText : styles.badgeOptionalText}>
                        {f.isRequired ? 'REQUIRED *' : 'OPTIONAL'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={f.attribute.isVariantAttribute ? [styles.badgeOptional, {backgroundColor: '#FEF3C7', borderColor: '#F59E0B'}] : styles.badgeOptional}
                      onPress={() => handleToggleVariantMapping(f.attribute.id)}
                    >
                      <Text style={f.attribute.isVariantAttribute ? [styles.badgeOptionalText, {color: '#D97706'}] : styles.badgeOptionalText}>
                        {f.attribute.isVariantAttribute ? 'VARIANT ✓' : 'NORMAL'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.editFieldBtn}
                      onPress={() => {
                        const sortedAttr = { ...f.attribute };
                        if (sortedAttr.options) {
                          sortedAttr.options = [...sortedAttr.options].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: 'base' }));
                        }
                        setEditingAttr(sortedAttr);
                        setShowAttrModal(true);
                      }}
                    >
                      <Sparkles size={15} color="#4338CA" />
                      <Text style={styles.editFieldBtnText}>Edit Field</Text>
                    </TouchableOpacity>

                    {activeRole === 'super_admin' && (
                      <TouchableOpacity onPress={() => handleRemoveMapping(f.attribute.id)}>
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 3: CATEGORY TREE MANAGER */}
        {/* ==================================================== */}
        {activeTab === 'categories' && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Editable Category Hierarchy Tree</Text>
                <Text style={styles.cardDesc}>
                  Rename categories, add subcategories (L1 → L2 → L3 → L4), or delete category nodes.
                </Text>
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleOpenAddRootCat}>
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>+ Add Super Category (L1)</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.treeList}>
              {categories.map((lvl1) => (
                <View key={lvl1.id} style={styles.l1Box}>
                  <View style={styles.nodeRow}>
                    <Text style={styles.l1Name}>📁 {lvl1.name} (L1 Super Category)</Text>
                    <View style={styles.nodeActions}>
                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() => handleOpenEditCat(lvl1)}
                      >
                        <Sparkles size={13} color="#4338CA" />
                        <Text style={styles.actionPillBtnText}>Rename</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionPillBtn}
                        onPress={() => handleOpenAddChildCat(lvl1)}
                      >
                        <Plus size={13} color="#059669" />
                        <Text style={[styles.actionPillBtnText, { color: '#059669' }]}>+ Sub Category (L2)</Text>
                      </TouchableOpacity>

                      {activeRole === 'super_admin' && (
                        <TouchableOpacity onPress={() => handleDeleteCat(lvl1.id)}>
                          <Trash2 size={15} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {lvl1.children?.map((lvl2) => (
                    <View key={lvl2.id} style={styles.l2Box}>
                      <View style={styles.nodeRow}>
                        <Text style={styles.l2Name}>└─ 📂 {lvl2.name} (L2 Category)</Text>
                        <View style={styles.nodeActions}>
                          <TouchableOpacity
                            style={styles.actionPillBtn}
                            onPress={() => handleOpenEditCat(lvl2)}
                          >
                            <Sparkles size={13} color="#4338CA" />
                            <Text style={styles.actionPillBtnText}>Rename</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionPillBtn}
                            onPress={() => handleOpenAddChildCat(lvl2)}
                          >
                            <Plus size={13} color="#059669" />
                            <Text style={[styles.actionPillBtnText, { color: '#059669' }]}>+ Sub Category (L3)</Text>
                          </TouchableOpacity>

                          {activeRole === 'super_admin' && (
                            <TouchableOpacity onPress={() => handleDeleteCat(lvl2.id)}>
                              <Trash2 size={15} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {lvl2.children?.map((lvl3) => (
                        <View key={lvl3.id} style={styles.l3Box}>
                          <View style={styles.nodeRow}>
                            <Text style={styles.l3Name}>└── 🏷️ {lvl3.name} (L3 Sub Category)</Text>
                            <View style={styles.nodeActions}>
                              <TouchableOpacity
                                style={styles.actionPillBtn}
                                onPress={() => handleOpenEditCat(lvl3)}
                              >
                                <Sparkles size={13} color="#4338CA" />
                                <Text style={styles.actionPillBtnText}>Rename</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.actionPillBtn}
                                onPress={() => handleOpenAddChildCat(lvl3)}
                              >
                                <Plus size={13} color="#059669" />
                                <Text style={[styles.actionPillBtnText, { color: '#059669' }]}>+ Product Type (L4)</Text>
                              </TouchableOpacity>

                              {activeRole === 'super_admin' && (
                                <TouchableOpacity onPress={() => handleDeleteCat(lvl3.id)}>
                                  <Trash2 size={14} color="#EF4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>

                          {lvl3.children?.map((lvl4) => (
                            <View key={lvl4.id} style={styles.l4Box}>
                              <Text style={styles.l4Name}>└──── 🔹 {lvl4.name} (Leaf Product Type)</Text>
                              <View style={styles.nodeActions}>
                                <TouchableOpacity
                                  style={styles.actionPillBtn}
                                  onPress={() => handleOpenEditCat(lvl4)}
                                >
                                  <Sparkles size={12} color="#4338CA" />
                                  <Text style={styles.actionPillBtnText}>Rename</Text>
                                </TouchableOpacity>

                                {activeRole === 'super_admin' && (
                                  <TouchableOpacity onPress={() => handleDeleteCat(lvl4.id)}>
                                    <Trash2 size={14} color="#EF4444" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 4: CATEGORY TEMPLATES */}
        {/* ==================================================== */}
        {activeTab === 'templates' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Reusable Category Templates</Text>
            <View style={styles.templatesGrid}>
              {templates.map((tpl) => (
                <View key={tpl.id} style={styles.tplCard}>
                  <View style={styles.tplHeader}>
                    <ShoppingBag size={18} color="#4338CA" />
                    <Text style={styles.tplTitle}>{tpl.name}</Text>
                  </View>
                  <Text style={styles.tplDesc}>{tpl.description}</Text>
                  <TouchableOpacity
                    style={styles.applyTplBtn}
                    onPress={() => {
                      setSelectedTemplateId(tpl.id);
                      handleApplyTemplate();
                    }}
                  >
                    <Plus size={14} color="#FFFFFF" />
                    <Text style={styles.applyTplBtnText}>Apply Template</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* TAB 5: LIVE FORM PREVIEW */}
        {/* ==================================================== */}
        {activeTab === 'preview' && (
          <View style={{ gap: 16 }}>
            <View style={styles.card}>
              <View style={styles.previewHeader}>
                <Sparkles size={20} color="#4338CA" />
                <View>
                  <Text style={styles.cardTitle}>Seller Dynamic Form Engine Live Preview</Text>
                  <Text style={styles.cardDesc}>
                    Schema Path: {schema.categoryPath.join(' → ')}
                  </Text>
                </View>
              </View>
            </View>

            {/* 1. Product Basic Information (Preview) */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>1. Product Basic Information</Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>Product Title / Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Women Printed Cotton Kurti With Dupatta"
                  editable={false}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>Brand Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Royal Handlooms, Custom Brand"
                  editable={false}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>Product Description</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  multiline
                  placeholder="Detailed description of fabric, comfort, and design..."
                  editable={false}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>Search Tags (Type comma to add, max 15)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. red, cotton, summer"
                  editable={false}
                />
              </View>
            </View>

            {/* 2. Dynamic Category Specifications (Preview) */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>2. {schema.categoryName} Dynamic Category Specifications</Text>
              <View style={styles.previewContainer}>
                <DynamicFormEngine
                  fields={schema.fields}
                  formValues={previewValues}
                  onChangeField={(code, val) => {
                    setPreviewValues((prev) => ({ ...prev, [code]: val }));
                  }}
                />
              </View>
            </View>

            {/* 3. Pricing, GST Tax & Settlement Payout (Preview) */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>3. Pricing, GST Tax & Settlement Payout</Text>
              
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>MRP Price (₹) *</Text>
                  <TextInput style={styles.input} placeholder="1499" editable={false} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Supplier Selling Price (₹) *</Text>
                  <TextInput style={styles.input} placeholder="599" editable={false} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>HSN Code *</Text>
                  <TextInput style={styles.input} placeholder="e.g. 6211" editable={false} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>GST Percentage (%) *</Text>
                  <TextInput style={styles.input} placeholder="e.g. 5, 12, 18, 28" editable={false} />
                </View>
              </View>
            </View>

            {/* 4. Package Weight & Shipping Cost Estimate (Preview) */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>4. Package Weight & Shipping Cost Estimate</Text>
              
              <View style={{ marginBottom: 12 }}>
                <Text style={styles.modalLabel}>Applicable Weight (Grams) *</Text>
                <TextInput style={styles.input} placeholder="e.g. 500 for 0.5 kg" editable={false} />
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Length (cm)</Text>
                  <TextInput style={styles.input} placeholder="e.g. 25" editable={false} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Width (cm)</Text>
                  <TextInput style={styles.input} placeholder="e.g. 20" editable={false} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalLabel}>Height (cm)</Text>
                  <TextInput style={styles.input} placeholder="e.g. 5" editable={false} />
                </View>
              </View>
            </View>

            {/* 5. Image Uploads (Preview) */}
            <View style={styles.card}>
              <Text style={styles.sectionHeader}>Image Uploads & Angles</Text>
              
              <Text style={styles.modalLabel}>1. Front View (Main Image) *</Text>
              <View style={{ backgroundColor: '#EEF2FF', padding: 16, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#C7D2FE', borderStyle: 'dashed', marginBottom: 12 }}>
                <ShoppingBag size={24} color="#4F46E5" style={{ marginBottom: 8 }} />
                <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 13 }}>Upload Main Image</Text>
              </View>

              <Text style={styles.modalLabel}>2. Additional Angle Photos</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', alignSelf: 'flex-start', marginTop: 6 }}>
                <Plus size={14} color="#4F46E5" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#4F46E5' }}>Manage Images</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* EXPORT / IMPORT JSON SCHEMA MODAL */}
      <Modal visible={showJsonModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: 640 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Team Schema JSON Export & Import</Text>
              <TouchableOpacity onPress={() => setShowJsonModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              Copy JSON code below to share with junior dev team, or paste JSON here to import:
            </Text>

            <TextInput
              style={[styles.input, { height: 260, textAlignVertical: 'top', fontSize: 11 }]}
              multiline
              value={jsonInput}
              onChangeText={setJsonInput}
              placeholder="Paste JSON schema here..."
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowJsonModal(false)}>
                <Text style={styles.cancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => {
                  const ok = importCatalogSchemaJSON(jsonInput);
                  if (ok) {
                    setCategories([...getCategoryHierarchy()]);
                    setAttributes([...getAllAttributes()]);
                    setMappings([...getCategoryAttributeMappings(selectedCatId)]);
                    setShowJsonModal(false);
                    alert('Successfully imported schema JSON and synced across team!');
                  } else {
                    alert('Invalid JSON format. Please check the JSON syntax.');
                  }
                }}
              >
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Import & Apply JSON</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CATEGORY NODE EDIT / ADD CHILD MODAL */}
      <Modal visible={showCatModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingCategoryNode.mode === 'edit'
                  ? 'Rename Category Node'
                  : editingCategoryNode.mode === 'add_child'
                  ? 'Add Subcategory'
                  : 'Add Super Category (L1)'}
              </Text>
              <TouchableOpacity onPress={() => setShowCatModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Category Name *</Text>
              <TextInput
                style={styles.input}
                value={editingCategoryNode.name}
                onChangeText={(text) =>
                  setEditingCategoryNode((prev) => ({ ...prev, name: text }))
                }
                placeholder="e.g. Activewear, Indian & Ethnic Wear, Smart Accessories"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCatModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveCategoryModal}>
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Save Category Node</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE/EDIT ATTRIBUTE MODAL WITH OPTION & RULES BUILDER */}
      <Modal visible={showAttrModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {editingAttr.id ? `Edit Field: ${editingAttr.label}` : 'Create New Dynamic Field'}
              </Text>
              <TouchableOpacity onPress={() => setShowAttrModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }}>
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Display Label (Seller view) *</Text>
                <TextInput
                  style={styles.input}
                  value={editingAttr.label || ''}
                  onChangeText={(text) =>
                    setEditingAttr((prev) => ({
                      ...prev,
                      label: text,
                      code: prev.code || text.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                      name: text,
                    }))
                  }
                  placeholder="e.g. Fabric Material / Heel Height"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Code Key (Database identifier) *</Text>
                <TextInput
                  style={styles.input}
                  value={editingAttr.code || ''}
                  onChangeText={(text) => setEditingAttr((prev) => ({ ...prev, code: text }))}
                  placeholder="e.g. fabric / heel_height"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Field Input Type *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {[
                    'select',
                    'multiselect',
                    'text',
                    'number',
                    'textarea',
                    'color',
                    'size_selector',
                    'radio',
                    'boolean',
                  ].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.miniChip, editingAttr.type === type && styles.miniChipActive]}
                      onPress={() =>
                        setEditingAttr((prev) => ({ ...prev, type: type as AttributeType }))
                      }
                    >
                      <Text style={styles.miniChipText}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Required / Flags Row */}
              <View style={styles.flagsRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, editingAttr.isRequired && styles.toggleBtnActive]}
                  onPress={() =>
                    setEditingAttr((prev) => ({ ...prev, isRequired: !prev.isRequired }))
                  }
                >
                  <Text style={[styles.toggleText, editingAttr.isRequired && styles.toggleTextActive]}>
                    {editingAttr.isRequired ? '✓ Field Required' : 'Optional Field'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, editingAttr.isVariantAttribute && styles.toggleBtnActive]}
                  onPress={() =>
                    setEditingAttr((prev) => ({
                      ...prev,
                      isVariantAttribute: !prev.isVariantAttribute,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.toggleText,
                      editingAttr.isVariantAttribute && styles.toggleTextActive,
                    ]}
                  >
                    {editingAttr.isVariantAttribute ? '✓ Variant Generator' : 'Normal Spec'}
                  </Text>
                </TouchableOpacity>

                {['select', 'multiselect', 'radio', 'checkbox'].includes(editingAttr.type || '') && (
                  <TouchableOpacity
                    style={[styles.toggleBtn, editingAttr.isSearchable && styles.toggleBtnActive]}
                    onPress={() =>
                      setEditingAttr((prev) => ({
                        ...prev,
                        isSearchable: !prev.isSearchable,
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        editingAttr.isSearchable && styles.toggleTextActive,
                      ]}
                    >
                      {editingAttr.isSearchable ? '✓ Searchable' : 'Enable Search'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* OPTIONS MANAGER FOR SELECT/MULTISELECT/RADIO */}
              {['select', 'multiselect', 'radio', 'color', 'size_selector'].includes(
                editingAttr.type || 'select'
              ) && (
                <View style={styles.optionsBox}>
                  <Text style={styles.modalLabel}>Dropdown / Choice Options</Text>
                  <View style={styles.addOptRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={newOptLabel}
                      onChangeText={setNewOptLabel}
                      placeholder="Search or Create Option (e.g. 100% Pure Cotton)"
                    />
                    {(() => {
                        const exactMatch = (editingAttr.options || []).find(o => o.label.toLowerCase() === newOptLabel.trim().toLowerCase());
                        if (newOptLabel.trim() && exactMatch) {
                            return (
                                <View style={[styles.primaryBtn, { backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' }]}>
                                  <Text style={[styles.primaryBtnText, { color: '#9CA3AF' }]}>Already Exists</Text>
                                </View>
                            )
                        }
                        return (
                            <TouchableOpacity style={styles.primaryBtn} onPress={handleAddOption}>
                              <Plus size={14} color="#FFFFFF" />
                              <Text style={styles.primaryBtnText}>Add Option</Text>
                            </TouchableOpacity>
                        )
                    })()}
                  </View>
                  
                  {newOptLabel.trim().length > 0 && !(editingAttr.options || []).find(o => o.label.toLowerCase() === newOptLabel.trim().toLowerCase()) && (
                      <View style={{ backgroundColor: '#EEF2FF', padding: 8, borderRadius: 6, marginBottom: 12, borderWidth: 1, borderColor: '#C7D2FE' }}>
                          <Text style={{ color: '#4338CA', fontSize: 13 }}>
                              Press "Add Option" to create <Text style={{ fontWeight: 'bold' }}>"{newOptLabel.trim()}"</Text>
                          </Text>
                      </View>
                  )}

                  <View style={styles.optChipGrid}>
                    {(editingAttr.options || [])
                      .map((opt, originalIndex) => ({ opt, originalIndex }))
                      .filter(({ opt }) => opt.label.toLowerCase().includes(newOptLabel.toLowerCase()))
                      .map(({ opt, originalIndex }) => {
                        const isExactMatch = newOptLabel.trim() !== '' && newOptLabel.trim().toLowerCase() === opt.label.toLowerCase();
                        return (
                          <View key={originalIndex} style={[styles.optChip, isExactMatch && { borderColor: '#EF4444', borderWidth: 1, backgroundColor: '#FEF2F2' }]}>
                            <Text style={[styles.optChipText, isExactMatch && { color: '#EF4444', fontWeight: 'bold' }]}>{opt.label}</Text>
                            <TouchableOpacity onPress={() => handleRemoveOption(originalIndex)}>
                              <X size={12} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        );
                    })}
                  </View>
                </View>
              )}

              {/* PLACEHOLDER & HELP TEXT */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Placeholder Text</Text>
                <TextInput
                  style={styles.input}
                  value={editingAttr.placeholder || ''}
                  onChangeText={(text) => setEditingAttr((prev) => ({ ...prev, placeholder: text }))}
                  placeholder="e.g. Select fabric type..."
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAttrModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAttributeForm}>
                <CheckCircle2 size={16} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>Save Dynamic Field</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MAPPED TARGET CATEGORIES MODAL */}
      <Modal visible={showMappedCategoriesModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Mapped Target Categories</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                  Categories that have at least one field mapped to them.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowMappedCategoriesModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, minWidth: 120 }}>
                <Search size={14} color="#94A3B8" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 12 }}
                  placeholder="Filter by Category..."
                  placeholderTextColor="#94A3B8"
                  value={mappedFilterCategory}
                  onChangeText={setMappedFilterCategory}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, minWidth: 120 }}>
                <Search size={14} color="#94A3B8" />
                <TextInput
                  style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 12 }}
                  placeholder="Filter by Admin Email..."
                  placeholderTextColor="#94A3B8"
                  value={mappedFilterAdmin}
                  onChangeText={setMappedFilterAdmin}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 10, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', flex: 1, minWidth: 120 }}>
                <Search size={14} color="#94A3B8" />
                {Platform.OS === 'web' ? (
                  <input
                    type="date"
                    value={mappedFilterDate}
                    onChange={(e) => setMappedFilterDate(e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', fontSize: '12px', border: 'none', outline: 'none', backgroundColor: 'transparent', color: '#334155' }}
                  />
                ) : (
                  <TextInput
                    style={{ flex: 1, paddingVertical: 6, paddingHorizontal: 8, fontSize: 12 }}
                    placeholder="Filter by Date (e.g. Aug 21)..."
                    placeholderTextColor="#94A3B8"
                    value={mappedFilterDate}
                    onChangeText={setMappedFilterDate}
                  />
                )}
              </View>
            </View>

            <ScrollView style={{ marginTop: 10 }}>
              {l4Categories.filter(cat => getCategoryAttributeMappings(cat.id).length > 0)
                .filter(cat => {
                  const mappings = getCategoryAttributeMappings(cat.id);
                  const admins = Array.from(new Set(mappings.map(m => m.updatedByAdminEmail).filter(Boolean)));
                  
                  const adminUpdates = admins.map(admin => {
                    const adminMappings = mappings.filter(m => m.updatedByAdminEmail === admin);
                    const adminTimestamps = adminMappings.map(m => m.updatedAt).filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
                    const latestDate = adminTimestamps.length > 0 ? adminTimestamps[0] : null;
                    return { admin, latestDate };
                  });

                  let matchesCategory = true;
                  let matchesAdmin = true;
                  let matchesDate = true;

                  if (mappedFilterCategory.trim()) {
                    matchesCategory = cat.label.toLowerCase().includes(mappedFilterCategory.toLowerCase());
                  }
                  
                  if (mappedFilterAdmin.trim()) {
                    matchesAdmin = admins.some(admin => admin?.toLowerCase().includes(mappedFilterAdmin.toLowerCase()));
                  }

                  if (mappedFilterDate.trim()) {
                    if (Platform.OS === 'web') {
                      matchesDate = adminUpdates.some(au => {
                        if (!au.latestDate) return false;
                        const d = new Date(au.latestDate);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        const localDateStr = `${y}-${m}-${day}`;
                        return localDateStr === mappedFilterDate;
                      });
                    } else {
                      matchesDate = adminUpdates.some(au => {
                        if (!au.latestDate) return false;
                        const formatted = new Date(au.latestDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
                        return formatted.toLowerCase().includes(mappedFilterDate.toLowerCase());
                      });
                    }
                  }

                  return matchesCategory && matchesAdmin && matchesDate;
                })
                .map((cat) => {
                const mappings = getCategoryAttributeMappings(cat.id);
                const mappedCount = mappings.length;
                const admins = Array.from(new Set(mappings.map(m => m.updatedByAdminEmail).filter(Boolean)));
                
                const adminUpdates = admins.map(admin => {
                  const adminMappings = mappings.filter(m => m.updatedByAdminEmail === admin);
                  const adminTimestamps = adminMappings.map(m => m.updatedAt).filter(Boolean).sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime());
                  const latestDate = adminTimestamps.length > 0 ? adminTimestamps[0] : null;
                  const formatted = latestDate ? new Date(latestDate).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '';
                  return `${admin}${formatted ? ` on ${formatted}` : ''}`;
                });

                return (
                  <View key={cat.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>{cat.label}</Text>
                      {adminUpdates.length > 0 && (
                        <Text style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                          Mapped by: {adminUpdates.join(', ')}
                        </Text>
                      )}
                    </View>
                    <View style={{ backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#0369A1' }}>{mappedCount} Fields</Text>
                    </View>
                  </View>
                );
              })}
              {mappedCategoriesCount === 0 && (
                <Text style={{ textAlign: 'center', color: '#94A3B8', marginTop: 20, fontStyle: 'italic' }}>
                  No categories have been mapped yet.
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowMappedCategoriesModal(false)}>
                <Text style={styles.primaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  syncBar: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  syncBarLeft: {
    flexDirection: 'column',
  },
  syncBarTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  syncBarSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  syncBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  syncBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  syncBtnPrimary: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncBtnPrimaryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  syncBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  syncBtnOutlineText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    flexWrap: 'wrap',
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#4338CA',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginTop: 16,
    marginBottom: 10,
  },
  selectorBar: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 14,
  },
  selectorBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  catChipTextActive: {
    color: '#4338CA',
    fontWeight: '800',
  },
  assignCard: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
  },
  assignTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338CA',
    marginBottom: 8,
  },
  assignRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  toggleBtnActive: {
    backgroundColor: '#4338CA',
    borderColor: '#4338CA',
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  mappedList: {
    gap: 8,
  },
  mappedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexWrap: 'wrap',
    gap: 8,
  },
  mappedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mappedIndex: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  mappedLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  mappedSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  mappedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeRequired: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  badgeRequiredText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: '800',
  },
  badgeOptional: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeOptionalText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  editFieldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  editFieldBtnText: {
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#0369A1',
    fontSize: 10,
    fontWeight: '700',
  },
  miniChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  miniChipActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4338CA',
  },
  miniChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4338CA',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tableGrid: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  gridHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    padding: 10,
  },
  gridTh: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  gridTdBold: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  gridTdCode: {
    fontSize: 12,
    color: '#475569',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  treeList: {
    gap: 10,
    marginTop: 12,
  },
  l1Box: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  nodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  l1Name: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  nodeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  actionPillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  l2Box: {
    marginLeft: 16,
    marginTop: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#CBD5E1',
  },
  l2Name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  l3Box: {
    marginLeft: 16,
    marginTop: 6,
  },
  l3Name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  l4Box: {
    marginLeft: 20,
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  l4Name: {
    fontSize: 12,
    color: '#64748B',
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  tplCard: {
    width: 280,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tplHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tplTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  tplDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
  },
  applyTplBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4338CA',
    paddingVertical: 8,
    borderRadius: 6,
  },
  applyTplBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  previewContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalField: {
    marginBottom: 14,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  flagsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  optionsBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  addOptRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  optChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  optChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
});
