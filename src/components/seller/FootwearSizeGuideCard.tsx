import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Sparkles, Image as ImageIcon } from 'lucide-react-native';

interface FootwearSizeGuideCardProps {
  onSizeChartUpdate?: (sizes: any[]) => void;
}

const FOOTWEAR_DIAGRAM = require('../../assets/footwear_size_guide_diagram.png');

const IND_FOOTWEAR_SIZE_MAP = [
  { size: 'IND-4', cm: '23.5 cm', inches: '9.25"' },
  { size: 'IND-5', cm: '24.3 cm', inches: '9.57"' },
  { size: 'IND-6', cm: '25.1 cm', inches: '9.88"' },
  { size: 'IND-7', cm: '25.8 cm', inches: '10.15"' },
  { size: 'IND-8', cm: '26.5 cm', inches: '10.43"' },
  { size: 'IND-9', cm: '27.2 cm', inches: '10.70"' },
  { size: 'IND-10', cm: '28.0 cm', inches: '11.02"' },
  { size: 'IND-11', cm: '28.7 cm', inches: '11.30"' },
  { size: 'IND-12', cm: '29.5 cm', inches: '11.61"' },
  { size: 'IND-13', cm: '30.2 cm', inches: '11.89"' },
];

export const FootwearSizeGuideCard: React.FC<FootwearSizeGuideCardProps> = ({ onSizeChartUpdate }) => {
  const [showFullChart, setShowFullChart] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customSizes, setCustomSizes] = useState<any[]>(IND_FOOTWEAR_SIZE_MAP);

  useEffect(() => {
    if (onSizeChartUpdate) {
      onSizeChartUpdate(isCustomMode ? customSizes : IND_FOOTWEAR_SIZE_MAP);
    }
  }, [customSizes, isCustomMode, onSizeChartUpdate]);

  const handleUpdateSize = (index: number, field: string, value: string) => {
    const updated = [...customSizes];
    updated[index] = { ...updated[index], [field]: value };
    setCustomSizes(updated);
  };

  return (
    <View style={styles.cardContainer}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleBox}>
          <Sparkles size={18} color="#0284C7" />
          <Text style={styles.headerTitle}>Footwear Size & Measurement Guide</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>IND Standard</Text>
        </View>
      </View>

      {/* Measurement Vector Image Diagram (Foot length & Foot width) */}
      <View style={styles.diagramCard}>
        <Image
          source={FOOTWEAR_DIAGRAM}
          style={styles.diagramImage}
          resizeMode="contain"
        />
      </View>

      {/* Prominent Front Image Requirement Banner (Directly matching screenshot) */}
      <View style={styles.bannerCallout}>
        <ImageIcon size={22} color="#0369A1" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerCalloutTitle}>
            Please provide only front image for each product
          </Text>
          <Text style={styles.bannerCalloutSub}>
            Ensure clean front view product photos to help buyers verify style and fit accurately.
          </Text>
        </View>
      </View>

      {/* Toggle IND Foot Length Reference Table */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.toggleChartBtn}
          onPress={() => setShowFullChart(!showFullChart)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleChartBtnText}>
            {showFullChart ? 'Hide IND Size Reference Chart' : 'View IND Foot Length Reference Chart'}
          </Text>
          <Text style={{ color: '#0284C7', fontSize: 11, fontWeight: '800' }}>{showFullChart ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {showFullChart && (
          <TouchableOpacity
            style={styles.editModeBtn}
            onPress={() => setIsCustomMode(!isCustomMode)}
          >
            <Text style={styles.editModeBtnText}>
              {isCustomMode ? 'Use Default Chart' : 'Edit Custom Chart'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showFullChart && (
        <View style={styles.chartTableCard}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTh, { width: 90 }]}>IND Size</Text>
            <Text style={[styles.chartTh, { width: 120 }]}>Foot Length (cm)</Text>
            <Text style={[styles.chartTh, { width: 100 }]}>Inches</Text>
          </View>
          {customSizes.map((item: any, idx: number) => (
            <View key={item.size} style={styles.chartRow}>
              <Text style={[styles.chartTdBold, { width: 90, paddingTop: isCustomMode ? 8 : 0 }]}>{item.size}</Text>
              
              {isCustomMode ? (
                <>
                  <TextInput
                    style={[styles.chartInput, { width: 110, marginRight: 10 }]}
                    value={item.cm}
                    onChangeText={(val) => handleUpdateSize(idx, 'cm', val)}
                  />
                  <TextInput
                    style={[styles.chartInput, { width: 90 }]}
                    value={item.inches}
                    onChangeText={(val) => handleUpdateSize(idx, 'inches', val)}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.chartTd, { width: 120 }]}>{item.cm}</Text>
                  <Text style={[styles.chartTd, { width: 100 }]}>{item.inches}</Text>
                </>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
  },
  badge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  diagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  diagramImage: {
    width: '100%',
    height: 260,
    maxHeight: 320,
    borderRadius: 8,
  },
  bannerCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  bannerCalloutTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  bannerCalloutSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
    lineHeight: 15,
  },
  toggleChartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  toggleChartBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  chartTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    overflow: 'hidden',
    marginTop: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chartTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
  },
  chartRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F9FF',
  },
  chartTdBold: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  chartTd: {
    fontSize: 12,
    color: '#334155',
  },
  editModeBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#7DD3FC',
  },
  editModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  chartInput: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
  }
});
