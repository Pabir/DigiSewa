import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { WearType } from '../../utils/productSizeUtils';

const MENS_WEAR_DIAGRAM = require('../../assets/mens_wear_size_guide_diagram.png');

interface MensWearSizeGuideCardProps {
  wearType: WearType;
  onSizeChartUpdate?: (sizes: any[]) => void;
}

const MENS_TOPWEAR_SIZE_MAP = [
  { size: 'S', chest: '38"', shoulder: '17"', length: '27"' },
  { size: 'M', chest: '40"', shoulder: '17.5"', length: '28"' },
  { size: 'L', chest: '42"', shoulder: '18"', length: '29"' },
  { size: 'XL', chest: '44"', shoulder: '18.5"', length: '30"' },
  { size: 'XXL', chest: '46"', shoulder: '19"', length: '31"' },
];

const MENS_BOTTOMWEAR_SIZE_MAP = [
  { size: '28', waist: '28"', hip: '36"', length: '40"' },
  { size: '30', waist: '30"', hip: '38"', length: '40"' },
  { size: '32', waist: '32"', hip: '40"', length: '41"' },
  { size: '34', waist: '34"', hip: '42"', length: '41"' },
  { size: '36', waist: '36"', hip: '44"', length: '42"' },
];

export const MensWearSizeGuideCard: React.FC<MensWearSizeGuideCardProps> = ({ wearType, onSizeChartUpdate }) => {
  const [showFullChart, setShowFullChart] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const isLower = wearType === 'lower';

  const defaultSizes = isLower ? MENS_BOTTOMWEAR_SIZE_MAP : MENS_TOPWEAR_SIZE_MAP;
  const [customSizes, setCustomSizes] = useState<any[]>(defaultSizes);

  // When wearType changes, reset the default sizes
  useEffect(() => {
    setCustomSizes(isLower ? MENS_BOTTOMWEAR_SIZE_MAP : MENS_TOPWEAR_SIZE_MAP);
    setIsCustomMode(false);
  }, [isLower]);

  useEffect(() => {
    if (onSizeChartUpdate) {
      onSizeChartUpdate(isCustomMode ? customSizes : defaultSizes);
    }
  }, [customSizes, isCustomMode, onSizeChartUpdate, defaultSizes]);

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
          <Sparkles size={18} color="#4338CA" />
          <Text style={styles.headerTitle}>
            {isLower ? "Men's Lower Wear Size Guide (Waist & Length)" : "Men's Upper Wear Size Guide (Chest & Length)"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Men's Apparel Standard</Text>
        </View>
      </View>

      {/* Body Measurement Vector Diagram (Shoulder, Chest, Waist, Hip, Length) */}
      <View style={styles.diagramCard}>
        <Image
          source={MENS_WEAR_DIAGRAM}
          style={styles.diagramImage}
          resizeMode="contain"
        />
      </View>

      {/* Guide Instructions Banner */}
      <View style={styles.bannerCallout}>
        <Sparkles size={20} color="#4338CA" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerCalloutTitle}>
            {isLower
              ? 'Measure natural waistline and outseam length'
              : 'Measure around fullest part of chest and shoulder width'}
          </Text>
          <Text style={styles.bannerCalloutSub}>
            {isLower
              ? 'Specify accurate Waist (in inches) for all jeans, trousers, shorts, and trackpants.'
              : 'Specify accurate Chest (in inches) for all T-Shirts, Shirts, Kurtas, Hoodies, and Jackets.'}
          </Text>
        </View>
      </View>

      {/* Toggle Reference Chart */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity
          style={styles.toggleChartBtn}
          onPress={() => setShowFullChart(!showFullChart)}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleChartBtnText}>
            {showFullChart
              ? `Hide Men's ${isLower ? 'Bottomwear' : 'Topwear'} Reference Chart`
              : `View Men's ${isLower ? 'Bottomwear' : 'Topwear'} Reference Chart`}
          </Text>
          <Text style={{ color: '#4338CA', fontSize: 11, fontWeight: '800' }}>{showFullChart ? '▲' : '▼'}</Text>
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
            <Text style={[styles.chartTh, { width: 70 }]}>Size</Text>
            <Text style={[styles.chartTh, { width: 110 }]}>{isLower ? 'Waist (Inch)' : 'Chest (Inch)'}</Text>
            <Text style={[styles.chartTh, { width: 110 }]}>{isLower ? 'Hip (Inch)' : 'Shoulder (Inch)'}</Text>
            <Text style={[styles.chartTh, { width: 100 }]}>Length (Inch)</Text>
          </View>
          {customSizes.map((item: any, idx: number) => (
            <View key={item.size} style={styles.chartRow}>
              <Text style={[styles.chartTdBold, { width: 70, paddingTop: isCustomMode ? 8 : 0 }]}>{item.size}</Text>
              
              {isCustomMode ? (
                <>
                  <TextInput
                    style={[styles.chartInput, { width: 100, marginRight: 10 }]}
                    value={isLower ? item.waist : item.chest}
                    onChangeText={(val) => handleUpdateSize(idx, isLower ? 'waist' : 'chest', val)}
                  />
                  <TextInput
                    style={[styles.chartInput, { width: 100, marginRight: 10 }]}
                    value={isLower ? item.hip : item.shoulder}
                    onChangeText={(val) => handleUpdateSize(idx, isLower ? 'hip' : 'shoulder', val)}
                  />
                  <TextInput
                    style={[styles.chartInput, { width: 90 }]}
                    value={item.length}
                    onChangeText={(val) => handleUpdateSize(idx, 'length', val)}
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.chartTd, { width: 110 }]}>{isLower ? item.waist : item.chest}</Text>
                  <Text style={[styles.chartTd, { width: 110 }]}>{isLower ? item.hip : item.shoulder}</Text>
                  <Text style={[styles.chartTd, { width: 100 }]}>{item.length}</Text>
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
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
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
    color: '#3730A3',
  },
  badge: {
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  diagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
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
    borderColor: '#818CF8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  bannerCalloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
    lineHeight: 18,
  },
  bannerCalloutSub: {
    fontSize: 11,
    color: '#4338CA',
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
    color: '#4338CA',
  },
  chartTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    overflow: 'hidden',
    marginTop: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    backgroundColor: '#E0E7FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chartTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3730A3',
  },
  chartRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2FF',
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
    backgroundColor: '#E0E7FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A5B4FC',
  },
  editModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  chartInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
  }
});
