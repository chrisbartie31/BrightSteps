import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

// Added 'title' and 'children' props to make it reusable
export default function InfoModal({ visible, onClose, title, children, buttonText = "Got it" }) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Standard Header */}
          <View style={styles.headerRow}>
             <Text style={styles.modalTitle}>{title}</Text>
             <TouchableOpacity onPress={onClose} hitSlop={{top:10, bottom:10, left:10, right:10}}>
                <Ionicons name="close-circle" size={24} color={Colors.textSecondary} />
             </TouchableOpacity>
          </View>

          {/* Custom Content goes here */}
          <View style={styles.contentContainer}>
            {children}
          </View>

          {/* Standard Blue Button */}
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: 20,
      alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5
  },
  contentContainer: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    width: '100%',
    borderRadius: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
  },
});