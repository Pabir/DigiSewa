import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { WearType } from '../../utils/productSizeUtils';

const WOMENS_WEAR_DIAGRAM = require('../../assets/womens_wear_size_guide_diagram.png');

interface WomensWearSizeGuideCardProps {
  wearType: WearType;
  onSizeChartUpdate?: (sizes: any[]) => void;
}

const WOMENS_TOPWEAR_SIZE_MAP = [
  { size: 'XS', breast: '32"', shoulder: '14"', length: '25"' },
  { size: 'S', breast: '34"', shoulder: '14.5"', length: '26"' },
  { size: 'M', breast: '36"', shoulder: '15"', length: '27"' },
  { size: 'L', breast: '38"', shoulder: '15.5"', length: '28"' },
  { size: 'XL', breast: '40"', shoulder: '16"', length: '29"' },
  { size: 'XXL', breast: '42"', shoulder: '16.5"', length: '30"' },
];

const WOMENS_BOTTOMWEAR_SIZE_MAP = [
  { size: '26', waist: '26"', hip: '34"', length: '38"' },
  { size: '28', waist: '28"', hip: '36"', length: '39"' },
  { size: '30', waist: '30"', hip: '38"', length: '39"' },
  { size: '32', waist: '32"', hip: '40"', length: '40"' },
  { size: '34', waist: '34"', hip: '42"', length: '40"' },
  { size: '36', waist: '36"', hip: '44"', length: '41"' },
];

export const WomensWearSizeGuideCard: React.FC<WomensWearSizeGuideCardProps> = ({ wearType, onSizeChartUpdate }) => {
  const [showFullChart, setShowFullChart] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const isLower = wearType === 'lower';

  const defaultSizes = isLower ? WOMENS_BOTTOMWEAR_SIZE_MAP : WOMENS_TOPWEAR_SIZE_MAP;
  const [customSizes, setCustomSizes] = useState<any[]>(defaultSizes);

  useEffect(() => {
    setCustomSizes(isLower ? WOMENS_BOTTOMWEAR_SIZE_MAP : WOMENS_TOPWEAR_SIZE_MAP);
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
          <Sparkles size={18} color="#BE185D" />
          <Text style={styles.headerTitle}>
            {isLower ? "Women's Lower Wear Size Guide (Waist & Length)" : "Women's Upper Wear Size Guide (Breast/Bust & Length)"}
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Women's Apparel Standard</Text>
        </View>
      </View>

      {/* Body Measurement Vector Diagram (Shoulder, Bust/Breast, Waist, Hip, Length) */}
      <View style={styles.diagramCard}>
        <Image
          source={WOMENS_WEAR_DIAGRAM}
          style={styles.diagramImage}
          resizeMode="contain"
        />
      </View>

      {/* Guide Instructions Banner */}
      <View style={styles.bannerCallout}>
        <Sparkles size={20} color="#BE185D" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerCalloutTitle}>
            {isLower
              ? 'Measure natural waistline and outseam leg length'
              : 'Measure around fullest part of bust/breast and shoulder width'}
          </Text>
          <Text style={styles.bannerCalloutSub}>
            {isLower
              ? 'Specify accurate Waist (in inches) for all women jeans, trousers, skirts, palazzo, and leggings.'
              : 'Specify accurate Breast (in inches) for all women Kurtis, Tops, Sarees, Dresses, Tunics, and Gowns.'}
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
              ? `Hide Women's ${isLower ? 'Bottomwear' : 'Topwear'} Reference Chart`
              : `View Women's ${isLower ? 'Bottomwear' : 'Topwear'} Reference Chart`}
          </Text>
          <Text style={{ color: '#BE185D', fontSize: 11, fontWeight: '800' }}>{showFullChart ? '▲' : '▼'}</Text>
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
            <Text style={[styles.chartTh, { width: 110 }]}>{isLower ? 'Waist (Inch)' : 'Breast/Bust (Inch)'}</Text>
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
                    value={isLower ? item.waist : item.breast}
                    onChangeText={(val) => handleUpdateSize(idx, isLower ? 'waist' : 'breast', val)}
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
                  <Text style={[styles.chartTd, { width: 110 }]}>{isLower ? item.waist : item.breast}</Text>
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
    backgroundColor: '#FDF2F8',
    borderWidth: 1.5,
    borderColor: '#FBCFE8',
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
    color: '#9D174D',
  },
  badge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE185D',
  },
  diagramCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FBCFE8',
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
    borderColor: '#F472B6',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  bannerCalloutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#831843',
    lineHeight: 18,
  },
  bannerCalloutSub: {
    fontSize: 11,
    color: '#9D174D',
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
    color: '#BE185D',
  },
  chartTableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    overflow: 'hidden',
    marginTop: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    backgroundColor: '#FCE7F3',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chartTh: {
    fontSize: 11,
    fontWeight: '800',
    color: '#9D174D',
  },
  chartRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#FDF2F8',
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
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  editModeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#BE185D',
  },
  chartInput: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    color: '#0F172A',
  }
});
