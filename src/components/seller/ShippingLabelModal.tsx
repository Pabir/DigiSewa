import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Image, Platform } from 'react-native';
import { X, Printer, Download } from 'lucide-react-native';
import { Order, Seller } from '../../types';
import { generateShadowfaxQRCode } from '../../services/shadowfaxService';

interface ShippingLabelModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  seller: Seller | null;
}

export default function ShippingLabelModal({ visible, onClose, order, seller }: ShippingLabelModalProps) {
  const [qrString, setQrString] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && order && order.paymentMode === 'cod' && order.shadowfaxAwb) {
      const fetchQr = async () => {
        setLoading(true);
        // We pass the totalAmount as the COD amount to collect
        const result = await generateShadowfaxQRCode(order.shadowfaxAwb!, order.totalAmount);
        if (result && result.qr_code_string) {
          setQrString(result.qr_code_string);
        }
        setLoading(false);
      };
      fetchQr();
    } else {
      setQrString(null);
    }
  }, [visible, order]);

  if (!order || !seller) return null;

  const handlePrint = () => {
    if (Platform.OS === 'web') {
      window.print();
    } else {
      alert("Printing is currently optimized for Web in this demo.");
    }
  };

  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      try {
        const element = document.getElementById('printable-label');
        if (!element) return;
        
        // Dynamically load html2pdf if not present
        if (!(window as any).html2pdf) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }
        
        const opt = {
          margin:       0.5,
          filename:     `Shipping_Label_${order.shadowfaxAwb || order.id}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true, allowTaint: true },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        (window as any).html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error("Failed to generate PDF", err);
        alert("Failed to download PDF. Please use the Print button and select 'Save as PDF'.");
      }
    } else {
      alert("Downloading is currently optimized for Web in this demo.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Print Shipping Label</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleDownload} style={[styles.printBtn, { backgroundColor: '#10b981' }]}>
                <Download size={20} color="#fff" />
                <Text style={styles.printBtnText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePrint} style={styles.printBtn}>
                <Printer size={20} color="#fff" />
                <Text style={styles.printBtnText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Printable Label Area */}
          <ScrollView style={styles.scrollArea}>
            <View style={styles.labelContainer} id="printable-label">
              <View style={styles.labelHeader}>
                <Text style={styles.labelTitle}>SHIPPING LABEL</Text>
                <Text style={styles.courierName}>Courier: SHADOWFAX</Text>
              </View>

              <View style={styles.barcodeSection}>
                {order.shadowfaxAwb ? (
                  <>
                    <Image 
                      source={{ uri: `https://barcodeapi.org/api/128/${order.shadowfaxAwb}` }} 
                      style={styles.barcodeImage}
                      resizeMode="contain"
                    />
                    <Text style={styles.awbText}>AWB: {order.shadowfaxAwb}</Text>
                  </>
                ) : (
                  <Text style={styles.awbText}>No AWB Assigned</Text>
                )}
              </View>

              <View style={styles.addressesRow}>
                <View style={styles.addressBox}>
                  <Text style={styles.boxTitle}>FROM (SELLER):</Text>
                  <Text style={styles.boldText}>{seller.storeName}</Text>
                  <Text style={styles.addressText}>{seller.businessAddress}</Text>
                  {seller.pickupAddress?.city && (
                    <Text style={styles.addressText}>
                      {seller.pickupAddress.city}, {seller.pickupAddress.state} - {seller.pickupAddress.pincode}
                    </Text>
                  )}
                  <Text style={styles.addressText}>Phone: **********</Text>
                </View>

                <View style={[styles.addressBox, styles.borderLeft]}>
                  <Text style={styles.boxTitle}>TO (CUSTOMER):</Text>
                  <Text style={styles.boldText}>{order.buyerName}</Text>
                  <Text style={styles.addressText}>
                    {order.deliveryAddress 
                      ? order.deliveryAddress.replace(/Phone:.*?(\n|$)/g, 'Phone: **********$1') 
                      : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.orderInfoSection}>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Order ID:</Text>
                  <Text style={styles.infoValue}>{order.id}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{new Date(order.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Payment Mode:</Text>
                  <Text style={styles.infoValue}>{order.paymentMode.toUpperCase()}</Text>
                </View>
                <View style={styles.infoCol}>
                  <Text style={styles.infoLabel}>Amount:</Text>
                  <Text style={styles.infoValue}>₹{order.totalAmount}</Text>
                </View>
              </View>

              {order.paymentMode === 'cod' && (
                <View style={styles.qrSection}>
                  <Text style={styles.qrTitle}>Collect on Delivery: ₹{order.totalAmount}</Text>
                  <Text style={styles.qrSubtitle}>Scan QR to Pay via UPI</Text>
                  {loading ? (
                    <Text style={styles.loadingText}>Generating QR...</Text>
                  ) : qrString ? (
                    <Image 
                      source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrString)}` }}
                      style={styles.qrImage}
                    />
                  ) : (
                    <Text style={styles.errorText}>Failed to load QR code</Text>
                  )}
                </View>
              )}

              <View style={styles.footer}>
                <Text style={styles.footerText}>Powered by TafDeal</Text>
              </View>
            </View>

            {Platform.OS === 'web' && (
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-label, #printable-label * {
                    visibility: visible;
                  }
                  #printable-label {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    border: none !important;
                    box-shadow: none !important;
                  }
                }
              `}} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  printBtnText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
  },
  closeBtn: {
    padding: 4,
  },
  scrollArea: {
    padding: 20,
  },
  labelContainer: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    padding: 16,
  },
  labelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
    marginBottom: 16,
  },
  labelTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1,
  },
  courierName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  barcodeSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  barcodeImage: {
    width: 200,
    height: 60,
    marginBottom: 8,
  },
  awbText: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  addressesRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  addressBox: {
    flex: 1,
    padding: 12,
  },
  borderLeft: {
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  orderInfoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  infoCol: {
    width: '50%',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  qrSection: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  qrImage: {
    width: 150,
    height: 150,
  },
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 40,
  },
  errorText: {
    color: '#ef4444',
    marginVertical: 40,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  footerText: {
    fontSize: 10,
    color: '#999',
  }
});
